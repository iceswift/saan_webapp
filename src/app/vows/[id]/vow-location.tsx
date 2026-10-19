"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Pencil, Navigation } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ExpandableMap } from "@/components/map/expandable-map";
import { LocationPicker } from "@/components/map/location-picker";
import { MapView } from "@/components/map/map-view";
import { mapsLink, type LatLng } from "@/lib/geo";
import { setVowLocation } from "@/server/actions/customer";

export function VowLocation({ vowId, location }: { vowId: string; location: LatLng | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LatLng | null>(location);
  const [pending, startTransition] = useTransition();
  function edit() { setDraft(location); setEditing(true); }
  function save() {
    startTransition(async () => {
      const result = await setVowLocation({ vowId, location: draft });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(draft ? "บันทึกหมุดแล้ว" : "เอาหมุดออกแล้ว");
      setEditing(false); router.refresh();
    });
  }
  return <section className="mt-8 border-t border-border pt-6" aria-label="ตำแหน่งสถานที่บน">
    <h2 className="mb-4 font-display text-xl font-medium">สถานที่บน</h2>
    {editing ? <>
      <LocationPicker value={draft} onChange={setDraft} />
      <div className="mt-4 flex flex-wrap gap-3">
        <Button size="xl" loading={pending} onClick={save}>บันทึกหมุด</Button>
        <Button size="xl" variant="outline" disabled={pending} onClick={() => setEditing(false)}>ยกเลิก</Button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">ใช้ปุ่มล้างหมุดในแผนที่แล้วบันทึกเพื่อเอาพิกัดออก ชื่อสถานที่และข้อความในสมุดยังคงเดิม</p>
    </> : location ? <>
      <ExpandableMap hasPin title="ดูหมุดสถานที่บน" hint="แผนที่ส่วนตัว">
        <MapView markers={[{ ...location, label: "สถานที่บน" }]} ariaLabel="แผนที่สถานที่บนของคุณ" description="ตำแหน่งที่คุณบันทึกไว้ในสมุดบน" />
      </ExpandableMap>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={mapsLink(location)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "xl" })}><Navigation aria-hidden="true" />เปิดเส้นทางใน Google Maps</a>
        <Button size="xl" variant="outline" onClick={edit}><Pencil aria-hidden="true" />แก้ไขหมุด</Button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">เมื่อเปิดเส้นทาง Google Maps จะได้รับพิกัดปลายทาง ข้อความที่ขอและสิ่งที่สัญญาไว้ไม่ถูกส่งไปด้วย</p>
    </> : <Button size="xl" variant="outline" onClick={edit}><MapPin aria-hidden="true" />เพิ่มหมุดสถานที่บน</Button>}
  </section>;
}
