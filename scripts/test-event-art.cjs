const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  e,
  w,
  story,
  stories,
  genericData,
  storyIllustrations,
  townLife,
  sceneIllustrations: art,
  illustrationBounds: { illustrationBounds },
  illustrationLayouts: { ILLUSTRATION_LAYOUTS: layouts },
} = require("./engine-loader.cjs");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
const stamp = (scene) => `${scene.sheet}:${scene.panel}`;
const all = [
  ...Object.values(art.ARRIVAL_ILLUSTRATIONS),
  ...Object.values(art.EVENT_ILLUSTRATIONS),
  ...Object.values(art.GENERIC_ILLUSTRATIONS).flat(),
  ...Object.values(art.NPC_ILLUSTRATIONS),
  ...Object.values(art.ROOM_ILLUSTRATIONS),
  ...art.PASSAGE_ILLUSTRATIONS,
  ...Object.values(art.PATROL_ILLUSTRATIONS),
  ...Object.values(art.TOWN_ILLUSTRATIONS),
  ...Object.values(storyIllustrations.STORY_ILLUSTRATIONS),
];
function checked(scene, name) {
  assert.ok(scene, `Missing art for ${name}`);
  const layout = layouts[scene.sheet];
  assert.ok(layout, `Missing sheet ${scene.sheet} for ${name}`);
  assert.ok(
    Number.isInteger(scene.panel) &&
      scene.panel >= 0 &&
      scene.panel < layout.rows * layout.columns,
    `Invalid cell for ${name}`,
  );
  assert.ok(scene.label?.trim(), `Missing image description for ${name}`);
}
test("All twelve defender encounters select their own named illustration", () => {
  assert.equal(story.ARRIVALS.length, 12);
  assert.equal(new Set(story.ARRIVALS.map((s) => s.id)).size, 12);
  for (const scene of story.ARRIVALS)
    checked(art.ARRIVAL_ILLUSTRATIONS[scene.id], scene.title);
  assert.equal(
    new Set(story.ARRIVALS.map((s) => stamp(art.ARRIVAL_ILLUSTRATIONS[s.id])))
      .size,
    12,
  );
});
test("Every principal event uses the same character and scene in its legacy and story paths", () => {
  for (const floor of w.FLOORS) {
    const scene = art.EVENT_ILLUSTRATIONS[floor.event];
    checked(scene, w.EVENTS[floor.event].title);
    assert.equal(
      stamp(scene),
      stamp(
        storyIllustrations.STORY_ILLUSTRATIONS[`floor.${floor.id}.arrival`],
      ),
    );
  }
  assert.deepEqual(
    Object.keys(art.EVENT_ILLUSTRATIONS).sort(),
    Object.keys(w.EVENTS).sort(),
  );
});
test("Every one of the 78 authored story stages has exact art with no floor-image fallback", () => {
  const stages = stories.STORY_CHAINS.flatMap((c) => c.stages);
  assert.equal(stages.length, 78);
  for (const stage of stages) {
    const scene = storyIllustrations.STORY_ILLUSTRATIONS[stage.id];
    checked(scene, stage.id);
    assert.equal(scene.label, stage.title);
  }
});
test("All 48 generic encounter variants have distinct dedicated images", () => {
  const scenes = [];
  for (const encounter of genericData.GENERIC_ENCOUNTERS)
    encounter.variants.forEach((_, variant) => {
      const scene = art.genericIllustration(encounter.id, variant);
      checked(scene, `${encounter.id}:${variant}`);
      assert.match(scene.sheet, /^generic-/);
      scenes.push(stamp(scene));
    });
  assert.equal(scenes.length, 48);
  assert.equal(new Set(scenes).size, 48);
});
test("Mud and hanging boots, water and pendulum clocks, and echo variants cannot share the wrong image", () => {
  assert.match(art.genericIllustration("generic.boot", 0).label, /mud/);
  assert.match(art.genericIllustration("generic.boot", 1).label, /nail/);
  assert.match(
    art.genericIllustration("generic.clock", 0).label,
    /water clock/,
  );
  assert.match(art.genericIllustration("generic.clock", 1).label, /pendulum/);
  assert.match(art.genericIllustration("generic.echo", 0).label, /sleeping/);
  assert.match(art.genericIllustration("generic.echo", 1).label, /reassuring/);
});
test("The flooded entrance and roadkeeper retain their water artwork", () => {
  assert.equal(art.entryIllustration(2).sheet, "floor.2");
  assert.equal(art.ARRIVAL_ILLUSTRATIONS.roadkeeper.sheet, "floodedRoad");
  assert.match(art.entryIllustration(2).label, /Water ripples.*wagon/);
});

test("All eight visible passage layouts select matching art, including mirrored right-hand views", () => {
  const cases = [
    [[], 0, false],
    [["left"], 1, false],
    [["right"], 1, true],
    [["straight"], 2, false],
    [["left", "straight"], 3, false],
    [["right", "straight"], 3, true],
    [["left", "right"], 4, false],
    [["left", "straight", "right"], 5, false],
  ];
  for (const [directions, panel, mirrored] of cases) {
    const scene = art.passageIllustration(directions);
    checked(scene, directions.join(",") || "dead end");
    assert.equal(scene.sheet, "passages");
    assert.equal(scene.panel, panel);
    assert.equal(scene.mirrored, mirrored);
    assert.equal(art.entryIllustration(1, null, directions).panel, panel);
    assert.deepEqual(art.passageIllustration([...directions, "back"]), scene);
  }
  assert.equal(art.entryIllustration(2, null, ["right"]).sheet, "floor.2");
});
test("Named NPCs, closed chests, springs and safe versus wild camps have separate subjects", () => {
  assert.equal(
    new Set(Object.values(art.NPC_ILLUSTRATIONS).map(stamp)).size,
    3,
  );
  for (const id of Object.keys(require("./engine-loader.cjs").npcs.WORLD_NPCS))
    checked(art.NPC_ILLUSTRATIONS[id], id);
  assert.match(art.ROOM_ILLUSTRATIONS.cache.label, /closed.*chest/);
  assert.match(art.ROOM_ILLUSTRATIONS.spring.label, /spring/);
  assert.match(art.ROOM_ILLUSTRATIONS.sanctuary.label, /closed.*door/);
  assert.match(art.ROOM_ILLUSTRATIONS.wildCamp.label, /open passage/);
  assert.notEqual(
    stamp(art.ROOM_ILLUSTRATIONS.wildCamp),
    stamp(art.ROOM_ILLUSTRATIONS.sanctuary),
  );
  for (const variant of ["patrol", "ambush", "elite"])
    checked(art.PATROL_ILLUSTRATIONS[variant], variant);
});
test("Every town moment produced by the game has activity-specific artwork", () => {
  let state = e.reducer(e.initialGame(), {
    type: "CREATE",
    race: "human",
    name: "Artist",
    roll: 1,
    seed: 42,
  });
  state = {
    ...state,
    party: [...state.party, e.makeCharacter("human", "kael", "Kael")],
    townLife: { ...townLife.newTownLife(), introSeen: true },
  };
  const seen = new Set();
  for (let day = 1; day <= 18; day++)
    for (const moment of townLife.townMoments({
      ...state,
      day,
      expedition: { ...state.expedition, number: day },
    })) {
      checked(art.TOWN_ILLUSTRATIONS[moment.id], moment.title);
      seen.add(moment.id);
    }
  assert.deepEqual([...seen].sort(), ["repair", "spar", "supper"]);
});
test("All bundled sheets match their measured PNG dimensions and source bindings", () => {
  const bindings = {};
  for (const file of [
    "src/components/story-illustration-sheets.ts",
    "src/components/scene-art-sources.ts",
  ])
    for (const [, quoted, plain, asset] of fs
      .readFileSync(file, "utf8")
      .matchAll(/(?:"([^"]+)"|(\w+)):\s*require\("([^"]+)"\)/g))
      bindings[quoted || plain] = path.resolve(path.dirname(file), asset);
  assert.deepEqual(Object.keys(bindings).sort(), Object.keys(layouts).sort());
  for (const [key, layout] of Object.entries(layouts)) {
    const png = fs.readFileSync(bindings[key]);
    assert.equal(path.basename(bindings[key]), layout.file);
    assert.equal(
      png.readUInt32BE(16),
      layout.width,
      `Run sync-illustration-layouts after changing ${key}`,
    );
    assert.equal(png.readUInt32BE(20), layout.height, key);
  }
});
test("All image crops cover only their selected panel without stretching, at mobile and tablet sizes", () => {
  for (const scene of all) {
    checked(scene, stamp(scene));
    const layout = layouts[scene.sheet],
      bounds = illustrationBounds(scene);
    const cellWidth = bounds.width / layout.columns,
      cellHeight = bounds.height / layout.rows;
    const left = bounds.left + (scene.panel % layout.columns) * cellWidth;
    const top =
      bounds.top + Math.floor(scene.panel / layout.columns) * cellHeight;
    assert.ok(left <= 0.0001 && left + cellWidth >= 99.9999, stamp(scene));
    assert.ok(top <= 0.0001 && top + cellHeight >= 99.9999, stamp(scene));
    for (const width of [320, 390, 430, 768]) {
      const height = width / bounds.aspectRatio;
      const scaleX = ((bounds.width / 100) * width) / layout.width;
      const scaleY = ((bounds.height / 100) * height) / layout.height;
      assert.ok(
        Math.abs(scaleX - scaleY) < 0.000001,
        `Stretched ${stamp(scene)}`,
      );
    }
  }
});
test("Quiet floor entries and route variants remain valid and frame landmarks above the paving", () => {
  for (let floor = 1; floor <= 12; floor++)
    for (const route of [null, "roots", "frost", "forge", "crypt"]) {
      checked(art.entryIllustration(floor, route), `entry ${floor}:${route}`);
      const scene = art.environmentIllustration(floor, route);
      checked(scene, `environment ${floor}:${route}`);
      assert.ok(scene.focus < 0.1);
    }
});
test("Unknown encounters and invalid cells never select an unrelated fallback picture", () => {
  assert.equal(art.genericIllustration("generic.unknown", 0), undefined);
  assert.equal(art.genericIllustration("generic.boot", 20), undefined);
  assert.equal(
    illustrationBounds({ sheet: "unknown", panel: 0, label: "Unknown" }),
    undefined,
  );
  assert.equal(
    illustrationBounds({ sheet: "generic-a", panel: 6, label: "Invalid" }),
    undefined,
  );
});
console.log(`${count} event artwork checks passed.`);
