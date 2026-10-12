"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { chipClass } from "@/components/chip";
import { isInThailand } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * ปุ่ม "ใกล้ฉัน" ของหน้าเลือกดูศาล: ขอตำแหน่งจากเบราว์เซอร์เมื่อกดเท่านั้น แล้วเก็บ ?near=lat,lng (ปัดเหลือ 2 ตำแหน่ง ≈ 1 กม. เพื่อความเป็นส่วนตัว)
 * กดอีกครั้งเมื่อเปิดอยู่ = ล้างตำแหน่ง (และเลิกเรียง "ใกล้สุด")
 * variant "chip" = ชิปในแผ่นตัวกรองบนมือถือ | "row" = แถวแนวตั้งในแผงซ้ายของเดสก์ท็อป
 */
export function NearMe({ variant = "chip", active }: { variant?: "chip" | "row"; active: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [locating, setLocating] = useState(false);

  function go(mutate: (sp: URLSearchParams) => void) {
    const sp = new URLSearchParams(params.toString());
    mutate(sp);
    const query = sp.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function toggle() {
    if (active) {
      go((sp) => {
        sp.delete("near");
        if (sp.get("sort") === "nearest") sp.delete("sort");
      });
      return;
    }
    if (!navigator.geolocation) {
      toast.error("เครื่องนี้ไม่รองรับการหาตำแหน่ง");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Math.round(pos.coords.latitude * 100) / 100;
        const lng = Math.round(pos.coords.longitude * 100) / 100;
        if (!isInThailand({ lat, lng })) {
          toast.error("ตำแหน่งของคุณอยู่นอกประเทศไทย");
          return;
        }
        go((sp) => {
          sp.set("near", `${lat.toFixed(2)},${lng.toFixed(2)}`);
          if (!sp.get("sort")) sp.set("sort", "nearest");
        });
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === 1
            ? "ยังไม่ได้อนุญาตให้ใช้ตำแหน่ง เปิดสิทธิ์ในเบราว์เซอร์แล้วลองอีกครั้ง"
            : "หาตำแหน่งของเครื่องไม่ได้ ลองอีกครั้ง",
        );
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={active}
        disabled={locating}
        className={cn(
          "flex min-h-10 w-full items-center gap-3 rounded-full px-3 py-1.5 text-left text-base transition-colors",
          active
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <LocateFixed className="size-5 shrink-0" strokeWidth={1.6} aria-hidden="true" />
        <span className="min-w-0 flex-1">{locating ? "กำลังหาตำแหน่ง" : "ใกล้ฉัน"}</span>
        {active ? <Check className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" /> : null}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      disabled={locating}
      className={cn(chipClass(active), "lg:min-h-10")}
    >
      <LocateFixed className="size-4" aria-hidden="true" />
      {locating ? "กำลังหาตำแหน่ง" : "ใกล้ฉัน"}
    </button>
  );
}
