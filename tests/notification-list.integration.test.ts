import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { db } from "../src/server/db";
import { countUnreadNotifications, listNotifications } from "../src/server/queries";

const url = process.env.DATABASE_URL ?? "";
if (/^postgres/.test(url)) assert.equal(new URL(url).pathname, "/saan_test");
else assert.match(url, /money-test\.db$/);
after(() => db.$disconnect());

test("unread view finds older items beyond the recent fifty and remains owner scoped", async t => {
  const suffix = randomUUID();
  const owner = await db.user.create({ data: { phone: `notification-owner-${suffix}` } });
  const other = await db.user.create({ data: { phone: `notification-other-${suffix}` } });
  t.after(async () => {
    await db.notification.deleteMany({ where: { userId: { in: [owner.id, other.id] } } });
    await db.user.deleteMany({ where: { id: { in: [owner.id, other.id] } } });
  });
  await db.notification.createMany({ data: Array.from({ length: 51 }, (_, index) => ({
    userId: owner.id, kind: "SYSTEM", title: `Read ${index}`,
    createdAt: new Date("2026-10-20T00:00:00Z"), readAt: new Date("2026-10-20T00:00:00Z"),
  })) });
  const older = await db.notification.create({ data: {
    userId: owner.id, kind: "SYSTEM", title: "Older unread", createdAt: new Date("2026-10-01T00:00:00Z"),
  } });
  await db.notification.create({ data: { userId: other.id, kind: "SYSTEM", title: "Private other account" } });
  const recent = await listNotifications(owner.id);
  assert.equal(recent.length, 50);
  assert.ok(recent.every(item => item.read));
  assert.deepEqual((await listNotifications(owner.id, true)).map(item => item.id), [older.id]);
  assert.equal(await countUnreadNotifications(owner.id), 1);
  assert.equal((await db.notification.findUniqueOrThrow({ where: { id: older.id } })).readAt, null);
});
