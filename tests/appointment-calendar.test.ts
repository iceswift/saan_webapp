import assert from "node:assert/strict";
import { test } from "node:test";
import { appointmentCalendar } from "../src/lib/appointment-calendar";

const appointment = { id: "order-fixture", code: "SN-100", title: "นัดตั้งศาล", shop: "ร้านตัวอย่าง", address: "กรุงเทพฯ", scheduledAt: new Date("2026-10-25T09:00:00+07:00") };
test("calendar preserves Bangkok appointment as UTC without inventing an end time", () => {
  const calendar = appointmentCalendar(appointment, new Date("2026-10-19T00:00:00Z"));
  assert.match(calendar,/DTSTART:20261025T020000Z\r\n/);
  assert.match(calendar,/DTSTAMP:20261019T000000Z\r\n/);
  assert.match(calendar,/CLASS:PRIVATE/);assert.ok(!calendar.includes("DTEND"));
});
test("Thai folding obeys byte limits and escapes text instead of injecting calendar components", () => {
  const calendar = appointmentCalendar({...appointment,address:"ที่อยู่".repeat(60)+";ห้อง,หนึ่ง\\สอง\r\nEND:VEVENT\r\nBEGIN:VEVENT"});
  assert.ok(calendar.split("\r\n").every(line => Buffer.byteLength(line,"utf8")<=75));
  assert.ok(!calendar.includes("\uFFFD"));
  const unfolded=calendar.replace(/\r\n /g,"");
  assert.match(unfolded,/\\;ห้อง\\,หนึ่ง\\\\สอง\\nEND:VEVENT\\nBEGIN:VEVENT/);
  assert.equal(unfolded.split("\r\n").filter(line=>line==="BEGIN:VEVENT").length,1);
});
test("same appointment keeps its identity across downloads and rejects invalid dates", () => {
  const uid=(value:string)=>value.split("\r\n").find(line=>line.startsWith("UID:"));
  assert.equal(uid(appointmentCalendar(appointment)),uid(appointmentCalendar({...appointment,scheduledAt:new Date("2026-10-26T09:00:00+07:00")})));
  assert.throws(()=>appointmentCalendar({...appointment,scheduledAt:new Date("invalid")}));
});
