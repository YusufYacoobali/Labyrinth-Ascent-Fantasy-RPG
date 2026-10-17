const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function harness(file, dependencies = {}) {
  const values = [],
    effects = [],
    timers = new Map();
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = initial;
      return [
        values[index],
        (value) => {
          values[index] =
            typeof value === "function" ? value(values[index]) : value;
        },
      ];
    },
    useEffect: (effect) => effects.push(effect),
    useCallback: (fn) => fn,
  };
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      exports,
      require: (id) => (id === "react" ? react : dependencies[id]),
      setTimeout: (fn, ms) => {
        timers.set(ms, fn);
        return ms;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  );
  return {
    exports,
    values,
    effects,
    timers,
    render: (fn) => {
      cursor = 0;
      return fn();
    },
  };
}
let count = 0;
async function test(name, fn) {
  await fn();
  count++;
  console.log("PASS " + name);
}
const tick = () => new Promise(setImmediate);
async function main() {
  await test("An arena with stalled artwork becomes playable within six seconds and also allows immediate readiness", () => {
    const h = harness("src/components/use-battle-readiness.ts");
    let result = h.render(h.exports.useBattleReadiness);
    assert.equal(result.ready, false);
    const cleanup = h.effects[0]();
    assert.equal(h.timers.size, 1);
    assert.ok(h.exports.ARENA_LOAD_LIMIT_MS <= 6000);
    h.timers.get(h.exports.ARENA_LOAD_LIMIT_MS)();
    assert.equal(h.render(h.exports.useBattleReadiness).ready, true);
    cleanup();
    assert.equal(h.timers.size, 0);
    const other = harness("src/components/use-battle-readiness.ts");
    other.render(other.exports.useBattleReadiness).markReady();
    assert.equal(other.render(other.exports.useBattleReadiness).ready, true);
  });
  function images(read, decode = (data) => data) {
    return harness("src/components/use-battle-image.ts", {
      "expo-asset": {
        Asset: {
          loadAsync: async () => [
            { uri: "remote-image", localUri: "cached-image" },
          ],
        },
      },
      "@shopify/react-native-skia": {
        Skia: {
          Data: { fromURI: read },
          Image: { MakeImageFromEncoded: decode },
        },
      },
    });
  }
  await test("Battle pictures use bundled local assets, retry failed reads and catch permanent failures", async () => {
    let calls = 0;
    const h = images(async (uri) => {
      assert.equal(uri, "cached-image");
      if (++calls === 1) throw Error("transient");
      return "decoded";
    });
    h.render(() => h.exports.useBattleImage(7));
    h.effects[0]();
    await tick();
    assert.equal(calls, 2);
    assert.equal(h.render(() => h.exports.useBattleImage(7)).image, "decoded");
    const bad = images(async () => {
      throw Error("missing");
    });
    bad.render(() => bad.exports.useBattleImage(8));
    bad.effects[0]();
    await tick();
    assert.equal(bad.render(() => bad.exports.useBattleImage(8)).failed, true);
    const corrupt = images(
      async () => "bytes",
      () => null,
    );
    corrupt.render(() => corrupt.exports.useBattleImage(9));
    corrupt.effects[0]();
    await tick();
    assert.equal(
      corrupt.render(() => corrupt.exports.useBattleImage(9)).failed,
      true,
    );
  });
  await test("Late image loads cannot update an unmounted arena or reuse the wrong floor's pixels", async () => {
    let resolve;
    const h = images(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    h.render(() => h.exports.useBattleImage(7));
    const cleanup = h.effects[0]();
    await tick();
    cleanup();
    resolve("late");
    await tick();
    assert.equal(h.values[0].image, null);
    const loaded = images(async () => "old-floor");
    loaded.render(() => loaded.exports.useBattleImage(7));
    loaded.effects[0]();
    await tick();
    assert.equal(
      loaded.render(() => loaded.exports.useBattleImage(8)).image,
      null,
    );
  });
  await test("The battle entrance can be skipped even when arena images are still loading", () => {
    const jsx = (type, props) => ({ type, props });
    const h = harness("src/components/combat-intro.tsx", {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": {
        Pressable: "button",
        View: "view",
        StyleSheet: { create: (s) => s, absoluteFill: {} },
        useWindowDimensions: () => ({ width: 390 }),
      },
      "expo-image": { Image: "image" },
      "expo-linear-gradient": { LinearGradient: "gradient" },
      "react-native-reanimated": {
        default: { View: "animated" },
        cubicBezier: () => "ease",
        useReducedMotion: () => false,
      },
      "react-native-safe-area-context": {
        useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
      },
      "@/game/combat-visuals": {},
      "@/game/world": { FLOORS: [{ name: "Candle Hollows" }] },
      "./game-ui": { Copy: "copy", Atlas: "atlas" },
      "./combat-sheets": {},
      "@/theme": { theme: { color: {}, font: {} } },
    });
    let begun = 0;
    const root = h.exports.default({
      state: { floor: 1, party: [] },
      ready: false,
      onComplete: () => begun++,
    });
    assert.notEqual(root.props.disabled, true);
    root.props.onPress();
    assert.equal(begun, 1);
  });
  console.log(`${count} battle loading checks passed.`);
}
main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
