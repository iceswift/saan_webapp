import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { after, test } from "node:test";
import { db } from "../src/server/db";
import { updateOwnedProviderProfile } from "../src/server/provider-profile-service";
import { saveImage } from "../src/server/storage";
import { listDirectoryShops } from "../src/server/shop-directory";

const url = process.env.DATABASE_URL ?? "";
assert.ok(/^postgres/.test(url) ? new URL(url).pathname === "/saan_test" : /money-test\.db$/.test(url), "Use an isolated test database");
after(() => db.$disconnect());

test("public profile updates are owner scoped, preserve omitted fields, and publish only explicit shop content", async () => {
  const seed = randomUUID();
  const owner = await db.user.create({ data: { phone: `profile-owner-${seed}` } });
  const stranger = await db.user.create({ data: { phone: `profile-stranger-${seed}` } });
  let photo: string | undefined;
  try {
    const provider = await db.provider.create({ data: { userId: owner.id, name: "ร้านทดสอบข้อมูลสาธารณะ", kind: "SHOP", phone: "0800000000", areas: '["BKK"]', status: "VERIFIED", publicAddress: "ที่อยู่สมมติ", baseLat: 13.75, baseLng: 100.5, serviceRadiusKm: 20 } });
    const input = { name: provider.name, kind: "SHOP", phone: "๐๘๐-๐๐๐-๐๐๐๐", areas: ["BKK"], contactHours: " จันทร์–เสาร์ 09:00–17:00 น. โทรนัดก่อน ", providerId: provider.id };
    assert.equal((await updateOwnedProviderProfile(stranger.id, input)).ok, false);
    assert.equal((await db.provider.findUniqueOrThrow({ where: { id: provider.id } })).contactHours, "");
    const image = await saveImage(new File([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=", "base64")], "test.png"));
    assert.ok("url" in image);
    photo = image.url;
    assert.equal((await updateOwnedProviderProfile(owner.id, { ...input, coverUrl: photo })).ok, true);
    const published = (await listDirectoryShops()).find(row => row.id === provider.id)!;
    assert.equal(published.coverUrl, photo);
    assert.equal(published.contactHours, input.contactHours.trim());
    assert.equal(published.address, "ที่อยู่สมมติ");
    assert.equal("userId" in published, false);
    assert.equal((await updateOwnedProviderProfile(owner.id, { name: provider.name, kind: "SHOP", phone: "0800000000", areas: ["BKK"] })).ok, true);
    const preserved = await db.provider.findUniqueOrThrow({ where: { id: provider.id } });
    assert.equal(preserved.coverUrl, photo);
    assert.equal(preserved.contactHours, input.contactHours.trim());
    assert.equal(preserved.serviceRadiusKm, 20);
    assert.equal((await updateOwnedProviderProfile(owner.id, { ...input, contactHours: "", coverUrl: null, base: null })).ok, true);
    const cleared = await db.provider.findUniqueOrThrow({ where: { id: provider.id } });
    assert.equal(cleared.coverUrl, null);
    assert.equal(cleared.contactHours, "");
    assert.equal(cleared.baseLat, null);
    assert.equal(cleared.serviceRadiusKm, null);
    for (const invalid of [{ contactHours: "x".repeat(301) }, { coverUrl: "https://other.invalid/photo.png" }, { coverUrl: "/api/files/../../private" }, { coverUrl: `/api/files/${"0".repeat(32)}.png` }, { serviceRadiusKm: 20 }]) {
      assert.equal((await updateOwnedProviderProfile(owner.id, { ...input, ...invalid })).ok, false);
      assert.equal((await db.provider.findUniqueOrThrow({ where: { id: provider.id } })).contactHours, "");
    }
  } finally {
    await db.user.deleteMany({ where: { id: { in: [owner.id, stranger.id] } } });
    if (photo) await unlink(path.join(process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads"), path.basename(photo)));
  }
});
