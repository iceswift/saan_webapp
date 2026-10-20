import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { db } from "../src/server/db";
import { listDirectoryShops } from "../src/server/shop-directory";

const url = process.env.DATABASE_URL ?? "";
if (/^postgres/.test(url)) assert.equal(new URL(url).pathname, "/saan_test");
else assert.match(url, /money-test\.db$/);
after(() => db.$disconnect());

test("public directory contains only verified businesses, rounds pins, and never exposes owner or customer locations", async () => {
  const prefix = `directory-${randomUUID()}`;
  const owners: string[] = [];
  const create = async (name: string, extra: Record<string, unknown> = {}) => {
    const user = await db.user.create({ data: { phone: `${prefix}-${name}` } });
    owners.push(user.id);
    return db.provider.create({ data: { userId: user.id, name: `${prefix}-${name}`, kind: "SHOP", phone: "0800000000", areas: '["BKK","invalid"]', status: "VERIFIED", ...extra } });
  };
  try {
    const pinned = await create("pinned", { publicAddress: "สถานที่สมมติ <script>ไม่ใช่ HTML</script>", baseLat: 13.756393, baseLng: 100.501934 });
    const legacy = await create("legacy");
    const partial = await create("partial", { baseLat: 13.75 });
    const outside = await create("outside", { baseLat: 0, baseLng: 0, areas: "invalid-json" });
    const pending = await create("pending", { status: "PENDING" });
    const rejected = await create("rejected", { status: "REJECTED" });
    await db.vow.create({ data: { userId: owners[0], place: "private", promise: "private", lat: 14.123456, lng: 101.123456 } });
    const rows = (await listDirectoryShops()).filter(row => row.name.startsWith(prefix));
    assert.equal(rows.length, 4);
    assert.equal(rows.some(row => [pending.id, rejected.id].includes(row.id)), false);
    const publicPin = rows.find(row => row.id === pinned.id)!;
    assert.deepEqual(publicPin.location, { lat: 13.756, lng: 100.502 });
    assert.deepEqual(publicPin.areas, ["BKK"]);
    assert.equal(publicPin.address, pinned.publicAddress);
    assert.deepEqual(Object.keys(publicPin).sort(), ["address", "areas", "id", "kind", "location", "name"]);
    assert.equal(rows.find(row => row.id === legacy.id)?.address, "");
    for (const id of [legacy.id, partial.id, outside.id]) assert.equal(rows.find(row => row.id === id)?.location, null);
    assert.deepEqual(rows.find(row => row.id === outside.id)?.areas, []);
    assert.equal(JSON.stringify(rows).includes("14.123456"), false);
  } finally {
    await db.user.deleteMany({ where: { id: { in: owners } } });
  }
});
