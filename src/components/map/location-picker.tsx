"use client";

import "leaflet/dist/leaflet.css";
import "./map.css";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { CircleCheck, LocateFixed, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/notice";
import { DEFAULT_CENTER, distanceKm, isInThailand, type LatLng } from "@/lib/geo";
import { cn } from "@/lib/utils";
import {
  createBaseMap,
  loadLeaflet,
  pinIcon,
  radiusBounds,
  type LeafletNS,
} from "./map-core";

type GeoHit = { label: string; lat: number; lng: number };

const round6 = (p: LatLng): LatLng => ({
  lat: Math.round(p.lat * 1e6) / 1e6,
  lng: Math.round(p.lng * 1e6) / 1e6,
});

/**
 * ตัวเลือกตำแหน่งบนแผนที่ (ควบคุมจากภายนอก): แตะแผนที่เพื่อปักหรือย้ายหมุด ลากหมุดได้
 * - value / onChange(value | null): ตำแหน่ง {lat,lng} หรือ null เมื่อยังไม่ปัก (หมุดเป็นตัวเลือกเสริมเสมอ ที่อยู่ตัวอักษรคือข้อมูลหลัก)
 * - provider: { location, serviceRadiusKm } ของร้าน ใส่แล้วจะวาดวงรัศมีและบอกสดว่าอยู่ในหรือนอกพื้นที่ให้บริการ
 *   (ตำแหน่งนอกรัศมียังปักได้ แต่ฝั่งเซิร์ฟเวอร์จะปฏิเสธตอนสั่งงาน ผู้เรียกควรแสดงข้อความของเซิร์ฟเวอร์ใต้ช่อง)
 * - circleKm: วาดวงรัศมีรอบหมุดของตัวเอง (ใช้ตอนร้านตั้งที่ตั้งและรัศมีบริการ) แทน provider วงขยับตามหมุดและซูมให้เห็นทั้งวงเมื่อค่ารัศมีเปลี่ยน
 * - ปุ่ม "ใช้ตำแหน่งปัจจุบัน" ขอสิทธิ์เฉพาะตอนกด | ช่องค้นหาสถานที่ใช้ /api/geocode | "ล้างหมุด" ตั้งค่าเป็น null
 * - แป้นพิมพ์: โฟกัสที่แผนที่แล้ว ลูกศร = เลื่อนแผนที่, Enter = ปักหมุดกลางแผนที่, Shift+ลูกศร = ขยับหมุดทีละนิด
 * - ตำแหน่งนอกประเทศไทยจะเตือนและไม่ตั้งค่า
 * ความเป็นส่วนตัว: นี่คือที่ตั้งบ้านลูกค้า แสดงให้ร้านที่รับงานนั้นเท่านั้น ห้ามอยู่บนหน้าสาธารณะ
 */
export function LocationPicker({
  value,
  onChange,
  provider,
  circleKm,
  height = "18rem",
  className,
  id,
}: {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
  provider?: { location: LatLng | null; serviceRadiusKm: number | null } | null;
  circleKm?: number | null;
  height?: string;
  className?: string;
  id?: string;
}) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const helpId = `${baseId}-help`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<LeafletNS | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const circleRef = useRef<Leaflet.Circle | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<GeoHit[] | null>(null);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  const place = useCallback((p: LatLng) => {
    if (!isInThailand(p)) {
      setWarn("ตำแหน่งนี้อยู่นอกประเทศไทย ลองเลือกตำแหน่งใหม่");
      return false;
    }
    setWarn(null);
    onChangeRef.current(round6(p));
    return true;
  }, []);

  // สร้างแผนที่ครั้งเดียว
  useEffect(() => {
    let cancelled = false;
    const el = mapElRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize());
    observer.observe(el);
    void loadLeaflet().then((L) => {
      if (cancelled) return;
      LRef.current = L;
      const start = valueRef.current ?? provider?.location ?? DEFAULT_CENTER;
      const map = createBaseMap(L, el, {
        center: [start.lat, start.lng],
        zoom: valueRef.current ? 15 : provider?.location ? 11 : 12,
        keyboard: true,
      });
      map.on("click", (e: Leaflet.LeafletMouseEvent) => {
        place({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      mapRef.current = map;
      // กล่อง details ที่กำลังขยายอาจยังไม่ได้ขนาดสุดท้าย
      window.setTimeout(() => map.invalidateSize(), 350);
      setReady(true);
    });
    return () => {
      cancelled = true;
      observer.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      setReady(false);
    };
    // สร้างครั้งเดียว ค่าอื่นอ่านผ่าน ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ซิงก์หมุดกับ value
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const marker = L.marker([value.lat, value.lng], {
        icon: pinIcon(L, "customer"),
        draggable: true,
        keyboard: true,
        title: "หมุดที่ตั้ง ลากเพื่อย้าย",
        alt: "หมุดที่ตั้ง",
      }).addTo(map);
      marker.on("dragend", () => {
        const ll = marker.getLatLng();
        if (!place({ lat: ll.lat, lng: ll.lng })) {
          const back = valueRef.current;
          if (back) marker.setLatLng([back.lat, back.lng]);
        }
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
    if (!map.getBounds().contains([value.lat, value.lng])) {
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 14));
    }
  }, [value, ready, place]);

  // วงรัศมีของร้าน
  const ownCircle = Boolean(circleKm);
  const pLat = ownCircle ? value?.lat : provider?.location?.lat;
  const pLng = ownCircle ? value?.lng : provider?.location?.lng;
  const pRadius = circleKm || (provider?.serviceRadiusKm ?? null);
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    circleRef.current?.remove();
    circleRef.current = null;
    if (pLat === undefined || pLng === undefined || !pRadius) return;
    circleRef.current = L.circle([pLat, pLng], {
      radius: pRadius * 1000,
      className: "saan-radius",
      interactive: false,
    }).addTo(map);
    if (!valueRef.current) map.fitBounds(radiusBounds(L, { lat: pLat, lng: pLng }, pRadius), { padding: [16, 16] });
  }, [ready, pLat, pLng, pRadius]);

  // วงรัศมีของหมุดตัวเอง: ซูมให้เห็นทั้งวงเมื่อผู้ใช้เปลี่ยนค่ารัศมี (ไม่ซูมซ้ำตอนลากหมุด)
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const v = valueRef.current;
    if (!ready || !L || !map || !circleKm || !v) return;
    map.fitBounds(radiusBounds(L, v, circleKm), { padding: [16, 16] });
  }, [ready, circleKm]);

  // แป้นพิมพ์: Enter = ปักกลางแผนที่, Shift+ลูกศร = ขยับหมุด (ดักก่อน Leaflet จะเลื่อนแผนที่)
  useEffect(() => {
    const wrap = mapElRef.current?.parentElement;
    if (!wrap) return;
    function onKey(e: KeyboardEvent) {
      const map = mapRef.current;
      if (!map) return;
      const target = e.target as HTMLElement;
      const isMapEl = target === mapElRef.current;
      if (e.key === "Enter" && isMapEl) {
        e.preventDefault();
        const c = map.getCenter();
        place({ lat: c.lat, lng: c.lng });
        return;
      }
      const dir: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      const d = dir[e.key];
      const cur = valueRef.current;
      if (e.shiftKey && d && cur) {
        e.preventDefault();
        e.stopPropagation();
        const pt = map.project([cur.lat, cur.lng]);
        const next = map.unproject([pt.x + d[0] * 20, pt.y + d[1] * 20]);
        place({ lat: next.lat, lng: next.lng });
      }
    }
    wrap.addEventListener("keydown", onKey, true);
    return () => wrap.removeEventListener("keydown", onKey, true);
  }, [place]);

  function useMyLocation() {
    setHits(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setWarn("เครื่องนี้ไม่รองรับการหาตำแหน่ง แตะบนแผนที่เพื่อปักหมุดเอง");
      return;
    }
    setLocating(true);
    setWarn(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (place(p)) mapRef.current?.setView([p.lat, p.lng], 16);
      },
      (err) => {
        setLocating(false);
        setWarn(
          err.code === 1
            ? "ยังไม่ได้อนุญาตให้ใช้ตำแหน่ง เปิดสิทธิ์ในเบราว์เซอร์ หรือแตะบนแผนที่เพื่อปักหมุดเอง"
            : err.code === 3
              ? "หาตำแหน่งนานเกินไป ลองอีกครั้ง หรือแตะบนแผนที่เพื่อปักหมุดเอง"
              : "หาตำแหน่งของเครื่องไม่ได้ แตะบนแผนที่เพื่อปักหมุดเอง",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  async function search() {
    const q = query.trim();
    if (q.length < 3) {
      setHits(null);
      setWarn("พิมพ์ชื่อสถานที่อย่างน้อย 3 ตัวอักษร");
      return;
    }
    setWarn(null);
    setSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as GeoHit[];
      setHits(Array.isArray(data) ? data : []);
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }

  function pickHit(h: GeoHit) {
    setHits(null);
    if (place({ lat: h.lat, lng: h.lng })) mapRef.current?.setView([h.lat, h.lng], 16);
  }

  // ข้อความสถานะรัศมีบริการ
  let radiusMsg: { inside: boolean; text: string } | null = null;
  if (!ownCircle && value && pLat !== undefined && pLng !== undefined && pRadius) {
    const km = distanceKm(value, { lat: pLat, lng: pLng });
    const shown = km < 1 ? "ไม่ถึง 1" : `ประมาณ ${Math.round(km)}`;
    radiusMsg =
      km <= pRadius
        ? { inside: true, text: `อยู่ในพื้นที่ให้บริการ (ห่างร้าน${shown} กม.)` }
        : {
            inside: false,
            text: `อยู่นอกรัศมีบริการของร้าน (ห่างร้าน${shown} กม. ร้านรับในรัศมี ${pRadius} กม.)`,
          };
  }

  return (
    <div ref={wrapRef} className={cn("flex flex-col gap-3", className)}>
      <div
        role="search"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void search();
          }
        }}
        className="flex gap-2"
      >
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อสถานที่ ย่าน หรือถนน"
          aria-label="ค้นหาสถานที่"
          autoComplete="off"
          className="min-w-0 flex-1"
        />
        <Button type="button" variant="outline" size="xl" loading={searching} onClick={() => void search()}>
          <Search aria-hidden="true" />
          ค้นหา
        </Button>
      </div>

      {hits ? (
        <ul className="surface divide-y divide-border overflow-hidden" aria-label="ผลการค้นหา">
          {hits.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">ไม่พบสถานที่ ลองพิมพ์ชื่อย่านหรือถนนแทน</li>
          ) : (
            hits.map((h, i) => (
              <li key={`${h.lat},${h.lng},${i}`}>
                <button
                  type="button"
                  onClick={() => pickHit(h)}
                  className="flex min-h-11 w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0">{h.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      <div className="saan-map" style={{ height }}>
        <div
          ref={mapElRef}
          id={baseId}
          role="application"
          aria-label="แผนที่ปักหมุดที่ตั้ง"
          aria-describedby={helpId}
          className="size-full"
        />
      </div>
      <p id={helpId} className="px-1 text-sm text-muted-foreground">
        {value ? "ลากหมุดหรือแตะแผนที่เพื่อย้ายตำแหน่ง" : "แตะบนแผนที่เพื่อปักหมุด"}
        <span className="sr-only">
          {" "}
          ใช้แป้นพิมพ์: ลูกศรเลื่อนแผนที่ Enter ปักหมุดกลางแผนที่ Shift กับลูกศรขยับหมุด
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="xl" loading={locating} onClick={useMyLocation}>
          <LocateFixed aria-hidden="true" />
          ใช้ตำแหน่งปัจจุบัน
        </Button>
        {value ? (
          <button
            type="button"
            onClick={() => {
              setWarn(null);
              onChange(null);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-base font-medium transition-colors hover:bg-muted"
          >
            <X className="size-4" aria-hidden="true" />
            ล้างหมุด
          </button>
        ) : null}
      </div>

      <div aria-live="polite" className="flex flex-col gap-2">
        {warn ? <Notice tone="amber">{warn}</Notice> : null}
        {radiusMsg ? (
          radiusMsg.inside ? (
            <p className="flex items-start gap-2 px-1 text-sm text-muted-foreground">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-tint-mint-ink" aria-hidden="true" />
              {radiusMsg.text}
            </p>
          ) : (
            <Notice tone="amber">{radiusMsg.text}</Notice>
          )
        ) : null}
      </div>
    </div>
  );
}
