const assert = require("node:assert/strict");
const fs = require("node:fs");
const { e, w, visuals, director, progression } = require("./engine-loader.cjs");
let count = 0;
const test = (name, run) => {
  run();
  console.log("PASS " + name);
  count++;
};
const fresh = () =>
  e.reducer(e.initialGame(), {
    type: "CREATE",
    race: "human",
    name: "Shopper",
    seed: 42,
    roll: 0.5,
  });
const reload = (s) => e.normalizeSave(JSON.parse(JSON.stringify(s)));
const goods = w.ITEMS.filter((i) => i.id.startsWith("market-"));
const newcomers = e.RECRUITS.filter((r) => r.portrait >= 24);

test("The shop has five times its former stock, with six full equipment tiers and unique identities", () => {
  assert.equal(
    w.ITEMS.filter((i) => i.kind !== "loot" && i.price > 0).length,
    225,
  );
  assert.equal(goods.length, 180);
  assert.equal(new Set(w.ITEMS.map((i) => i.id)).size, w.ITEMS.length);
  for (const tier of [
    "copper",
    "steel",
    "moon",
    "dragon",
    "sovereign",
    "starfall",
  ]) {
    const stock = goods.filter((i) => i.id.startsWith(`market-${tier}-`));
    assert.equal(stock.length, 30);
    assert.equal(new Set(stock.map((i) => i.kind)).size, 5);
    for (const item of stock) {
      assert.ok(["provisioner", "alchemist", "emporium"].includes(item.vendor));
      assert.ok(item.sell > 0 && item.sell < item.price);
      assert.ok(item.description.length > 15);
    }
  }
  assert.ok(goods.some((i) => i.price < 100));
  assert.ok(goods.some((i) => i.price >= 2500000 && i.atk >= 200));
  assert.ok(goods.some((i) => i.speed >= 100));
  assert.ok(goods.some((i) => i.mp >= 800));
});

test("Every new item can be bought, equipped, swapped, saved and sold without stacking or free healing", () => {
  for (const item of goods) {
    let s = { ...fresh(), gold: 10000000 };
    const price = e.buyPrice(item, s.day, s),
      base = s.party[0];
    s = e.reducer(s, { type: "BUY_ITEM", id: item.id });
    assert.equal(s.gold, 10000000 - price, item.id);
    assert.equal(s.inventory[item.id], 1, item.id);
    s = e.reducer(s, { type: "EQUIP", character: "hero", item: item.id });
    assert.ok(s.party[0].equipment.includes(item.id), item.id);
    assert.equal(s.party[0].atk, base.atk + (item.atk || 0), item.id);
    assert.equal(s.party[0].def, base.def + (item.def || 0), item.id);
    assert.equal(s.party[0].hp, base.hp, item.id);
    s = reload(s);
    assert.ok(s.party[0].equipment.includes(item.id), item.id);
    const stats = JSON.stringify(s.party[0]);
    const noStack = e.reducer(s, {
      type: "EQUIP",
      character: "hero",
      item: item.id,
    });
    assert.equal(JSON.stringify(noStack.party[0]), stats, item.id);
    const alternate = goods.find(
      (i) => i.kind === item.kind && i.id !== item.id,
    );
    s = e.reducer(s, { type: "BUY_ITEM", id: alternate.id });
    s = e.reducer(s, { type: "EQUIP", character: "hero", item: alternate.id });
    assert.equal(s.inventory[item.id], 1, item.id);
    assert.equal(s.party[0].atk, base.atk + (alternate.atk || 0), item.id);
    const gold = s.gold,
      sale = e.sellPrice(item, item.vendor);
    s = e.reducer(s, {
      type: "SELL",
      id: item.id,
      vendor: item.vendor,
      quantity: 1,
    });
    assert.equal(s.gold, gold + sale, item.id);
    assert.equal(s.inventory[item.id], 0, item.id);
  }
});

test("A starter cannot buy mythic gear, and an unaffordable mixed cart makes no partial purchases", () => {
  const s = fresh(),
    expensive = goods.find((i) => i.price > 1000000),
    cheap = goods[0];
  const blocked = e.reducer(s, { type: "BUY_ITEM", id: expensive.id });
  assert.equal(blocked.gold, s.gold);
  assert.equal(blocked.inventory[expensive.id], undefined);
  const cart = e.reducer(s, {
    type: "BUY_BATCH",
    items: [
      { id: cheap.id, quantity: 1 },
      { id: expensive.id, quantity: 1 },
    ],
  });
  assert.equal(cart.gold, s.gold);
  assert.equal(cart.inventory[cheap.id], undefined);
});

test("Premium shop gear cannot leak into the ordinary rare-chest reward pool", () => {
  for (let seed = 1; seed <= 12; seed++) {
    let s = fresh();
    s = director.establishExpedition({ ...s, journey: { ...s.journey, seed } });
    for (const slots of Object.values(s.expedition.director.encounters))
      for (const encounter of Object.values(slots))
        assert.ok(!encounter.rewardItem?.startsWith("market-"));
  }
});

test("Twenty recruits include ten new roles spanning level 1–25, with distinct valid skills and art identities", () => {
  assert.equal(e.RECRUITS.length, 20);
  assert.equal(newcomers.length, 10);
  assert.equal(new Set(newcomers.map((r) => r.portrait)).size, 10);
  assert.equal(Math.min(...newcomers.map((r) => r.level)), 1);
  assert.equal(Math.max(...newcomers.map((r) => r.level)), 25);
  for (const r of newcomers) {
    const c = e.makeCharacter(r.race, r.id, r.name);
    assert.equal(c.level, r.level, r.id);
    assert.ok(
      c.skills.length && c.skills.length <= progression.skillSlots(c.level),
      r.id,
    );
    assert.ok(
      c.skills.every((skill) => e.SKILLS.some((s) => s.name === skill)),
      r.id,
    );
    assert.equal(visuals.characterVisual(c).key, r.id, r.id);
    assert.ok(r.accept && r.decline && r.quote && r.traitDetail);
  }
  const astra = e.makeCharacter("barbarian", "astra", "Astra");
  assert.ok(astra.atk > 200 && astra.maxHp > 700);
});

test("Recruits refuse mismatched experience regardless of wealth and never charge a hiring fee", () => {
  for (const r of newcomers) {
    const level = r.level || 1;
    for (const offset of [-4, -3, 0, 3, 4]) {
      const heroLevel = level + offset;
      if (heroLevel < 1) continue;
      let s = { ...fresh(), gold: offset % 2 ? 0 : 10000000 };
      s.party = s.party.map((c) =>
        e.gainXp(c, (70 * heroLevel * (heroLevel - 1)) / 2),
      );
      const next = e.reducer(s, { type: "RECRUIT", id: r.id, offer: 50 });
      assert.equal(next.gold, s.gold, r.id);
      if (Math.abs(offset) > 3) {
        assert.equal(next.party.length, 1, r.id + " must refuse");
        assert.equal(next.recruitReply.outcome, "blocked", r.id);
        assert.doesNotMatch(
          next.recruitReply.line,
          /(?:\+\/-|±|three levels|3 levels|hiring fee)/i,
        );
      } else {
        assert.equal(next.party[1].id, r.id);
        assert.equal(next.party[1].level, level);
        assert.equal(next.recruitReply.outcome, "accepted");
        const gear = next.party[1].equipment.join();
        let back = reload(e.reducer(next, { type: "BENCH", id: r.id }));
        back = e.reducer(back, { type: "RECRUIT", id: r.id });
        assert.equal(back.gold, s.gold);
        assert.equal(back.party[1].equipment.join(), gear);
        assert.equal(back.reserve.length, 0);
      }
    }
    let s = fresh();
    s.party = s.party.map((c) => e.gainXp(c, (70 * level * (level - 1)) / 2));
    const offer = e.recruitShare(s, r);
    const declined = e.reducer(s, {
      type: "RECRUIT",
      id: r.id,
      offer: offer - 1,
    });
    assert.equal(declined.party.length, 1);
    assert.equal(declined.recruitReply.outcome, "declined");
    const accepted = e.reducer(declined, { type: "RECRUIT", id: r.id, offer });
    assert.equal(accepted.recruitReply.outcome, "accepted");
    assert.equal(accepted.party.length, 2);
    const repeated = e.reducer(accepted, { type: "RECRUIT", id: r.id, offer });
    assert.equal(repeated.party.length, 2);
    assert.equal(repeated.gold, s.gold);
  }
});

test("All companions bring role-appropriate equipment; empty legacy slots are filled only once", () => {
  assert.equal(fresh().party[0].equipment.length, 0);
  for (const r of e.RECRUITS) {
    const c = e.makeCharacter(r.race, r.id, r.name);
    const gear = c.equipment.map((id) => w.ITEMS.find((i) => i.id === id));
    assert.ok(gear.length >= 2, r.id);
    assert.equal(new Set(gear.map((i) => i.kind)).size, gear.length);
    assert.ok(gear.some((i) => i.kind === "weapon"));
    assert.equal(c.hp, c.maxHp);
    assert.equal(c.mp, c.maxMp);
    let s = { ...fresh(), party: [fresh().party[0], c] };
    assert.equal(JSON.stringify(reload(s).party[1]), JSON.stringify(c), r.id);
    // Simulate a pre-kit save. Already owned slots and their bonuses remain intact.
    const old = { ...c, starterGearIssued: undefined, equipment: [gear[0].id] };
    for (const item of gear.slice(1)) {
      old.atk -= item.atk || 0;
      old.def -= item.def || 0;
      old.speed -= item.speed || 0;
      old.maxHp -= item.hp || 0;
      old.uninjuredHp -= item.hp || 0;
      old.maxMp -= item.mp || 0;
    }
    old.hp = Math.min(20, old.maxHp);
    old.mp = 0;
    s.party[1] = old;
    const migrated = reload(s);
    assert.equal(migrated.party[1].equipment.join(), c.equipment.join());
    assert.equal(migrated.party[1].atk, c.atk);
    assert.equal(migrated.party[1].maxHp, c.maxHp);
    assert.equal(migrated.party[1].hp, old.hp);
    assert.equal(migrated.party[1].mp, 0);
    const once = JSON.stringify(migrated.party[1]);
    assert.equal(JSON.stringify(reload(migrated).party[1]), once);
    // A later sale/replacement must not issue another starter item.
    migrated.party[1].equipment = [];
    assert.equal(reload(migrated).party[1].equipment.length, 0);
  }
});

test("Expansion art bindings cover all 180 item cells, ten portraits, and ten genuine animation sheets", () => {
  const bindings = fs.readFileSync(
    "src/components/market-art-sources.ts",
    "utf8",
  );
  const manifest = JSON.parse(
    fs.readFileSync("assets/expansion/generation-manifest.json", "utf8"),
  );
  for (const r of newcomers) {
    const file = manifest.characters.find((c) => c.id === r.id).file;
    assert.ok(bindings.includes("../../" + file));
    const png = fs.readFileSync(file);
    assert.equal(png[25], 6, r.id + " RGBA");
    assert.ok(
      Math.abs(png.readUInt32BE(16) / 8 / (png.readUInt32BE(20) / 6) - 1) <
        0.02,
      r.id + " square frame bounds",
    );
  }
  for (const tier of [
    "copper",
    "steel",
    "moon",
    "dragon",
    "sovereign",
    "starfall",
  ]) {
    const png = fs.readFileSync(`assets/expansion/items-${tier}-v1.png`);
    assert.equal(png[25], 6, tier + " transparent");
    assert.ok(
      Math.abs((png.readUInt32BE(16) * 6) / (png.readUInt32BE(20) * 5) - 1) <
        0.02,
    );
  }
});
console.log(`${count} market expansion checks passed.`);
