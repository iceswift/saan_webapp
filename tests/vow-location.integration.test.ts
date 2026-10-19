import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { db } from "../src/server/db";
import { saveOwnedVowLocation } from "../src/server/vow-location";
import { getMyVow } from "../src/server/queries";

const url = process.env.DATABASE_URL ?? "";
if (/^postgres/.test(url)) assert.equal(new URL(url).pathname, "/saan_test");
else assert.match(url, /money-test\.db$/);
after(() => db.$disconnect());
async function fixture() {
  const suffix = randomUUID();
  const owner = await db.user.create({ data: { phone: `vow-owner-${suffix}` } });
  const other = await db.user.create({ data: { phone: `vow-other-${suffix}` } });
  const vow = await db.vow.create({ data: { userId: owner.id, place: "สถานที่สมมติ", promise: "พวงมาลัยทดสอบ" } });
  return { owner, other, vow };
}
test("legacy vows stay valid without coordinates; only the owner can read or update a pin", async () => {
  const { owner, other, vow } = await fixture();
  assert.equal((await getMyVow(vow.id, owner.id))?.location, null);
  assert.equal(await getMyVow(vow.id, other.id), null);
  assert.equal((await saveOwnedVowLocation(other.id, { vowId: vow.id, location: { lat: 13.75, lng: 100.5 } })).ok, false);
  assert.equal((await db.vow.findUniqueOrThrow({ where: { id: vow.id } })).lat, null);
  assert.equal((await saveOwnedVowLocation(owner.id, { vowId: vow.id, location: { lat: 13.75612345, lng: 100.50123456 } })).ok, true);
  assert.deepEqual((await getMyVow(vow.id, owner.id))?.location, { lat: 13.756123, lng: 100.501235 });
  assert.equal((await saveOwnedVowLocation(owner.id, { vowId: vow.id, location: null })).ok, true);
  const cleared = await db.vow.findUniqueOrThrow({ where: { id: vow.id } });
  assert.equal(cleared.lat, null); assert.equal(cleared.lng, null); assert.equal(cleared.place, vow.place); assert.equal(cleared.promise, vow.promise);
});
test("invalid, partial and out-of-bounds coordinates never change a stored pin", async () => {
  const { owner, vow } = await fixture();
  const pin = { lat: 13.75, lng: 100.5 };
  await saveOwnedVowLocation(owner.id, { vowId: vow.id, location: pin });
  for (const location of [{ lat: 13.75 }, { lat: "13.75", lng: 100.5 }, { lat: NaN, lng: 100.5 }, { lat: Infinity, lng: 100.5 }, { lat: 0, lng: 0 }]) {
    assert.equal((await saveOwnedVowLocation(owner.id, { vowId: vow.id, location })).ok, false);
  }
  assert.deepEqual((await getMyVow(vow.id, owner.id))?.location, pin);
});
