"use client";

import "leaflet/dist/leaflet.css";
import "./map.css";
import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import { DEFAULT_CENTER, type LatLng } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { createBaseMap, loadLeaflet, pinIcon, radiusBounds, type MarkerTone } from "./map-core";

export type MapMarker = LatLng & { label?: string; tone?: MarkerTone };

/**
 * แผนที่อ่านอย่างเดียว (Leaflet + OpenStreetMap โหลดเมื่อต้องใช้)
 * - markers: หมุดทั้งหมด tone "customer" = หมุดสีชาด (งานของลูกค้า) | "shop" = หมุดสีหมึก (ที่ตั้งร้าน)
 * - radiusKm: วงรัศมีบริการรอบหมุด "shop" อันแรก (ถ้าไม่มีหมุดร้านใช้หมุดแรก)
 * - fitToMarkers (ค่าเริ่มต้น true): ซูมให้เห็นหมุดทั้งหมดและวงรัศมี | center + zoom ใช้เมื่อปิด
 * - interactive: false = ล็อกแผนที่ (ไม่ลาก ไม่ซูม) | ล้อเมาส์ไม่ซูมเสมอ เพื่อไม่แย่งการเลื่อนหน้า
 * - ariaLabel + description: คำอธิบายสำหรับโปรแกรมอ่านหน้าจอ (ที่อยู่เป็นข้อมูลหลัก แผนที่เป็นส่วนเสริม)
 * - ปุ่ม "นำทาง" ให้ผู้เรียกวางเองด้วย <LinkButton href={mapsLink(p)}>
 * ความเป็นส่วนตัว: หมุดบ้านลูกค้าแสดงให้ร้านที่รับงานนั้นเท่านั้น ห้ามใช้ในหน้าสาธารณะ
 */
export function MapView({
  markers,
  center,
  zoom = 13,
  radiusKm,
  height = "14rem",
  fitToMarkers = true,
  interactive = true,
  ariaLabel = "แผนที่",
  description,
  className,
}: {
  markers: MapMarker[];
  center?: LatLng;
  zoom?: number;
  radiusKm?: number | null;
  height?: string;
  fitToMarkers?: boolean;
  interactive?: boolean;
  ariaLabel?: string;
  description?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify([markers, center, zoom, radiusKm, fitToMarkers, interactive]);

  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    const el = ref.current;
    if (!el) return;
    // กล่องเปลี่ยนขนาด (หมุนจอ ขยายแผง) ต้องบอก Leaflet ให้โหลดแผ่นภาพใหม่
    const observer = new ResizeObserver(() => map?.invalidateSize());
    observer.observe(el);
    void loadLeaflet().then((L) => {
      if (cancelled) return;
      const start = center ?? markers[0] ?? DEFAULT_CENTER;
      map = createBaseMap(L, el, {
        center: [start.lat, start.lng],
        zoom,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: false,
        keyboard: interactive,
        zoomControl: interactive,
      });
      const bounds = L.latLngBounds([]);
      for (const m of markers) {
        const marker = L.marker([m.lat, m.lng], {
          icon: pinIcon(L, m.tone ?? "customer"),
          keyboard: false,
          interactive: Boolean(m.label),
        }).addTo(map);
        if (m.label) marker.bindTooltip(m.label, { direction: "top" });
        bounds.extend([m.lat, m.lng]);
      }
      const anchor = markers.find((m) => m.tone === "shop") ?? markers[0];
      if (radiusKm && anchor) {
        L.circle([anchor.lat, anchor.lng], {
          radius: radiusKm * 1000,
          className: "saan-radius",
          interactive: false,
        }).addTo(map);
        bounds.extend(radiusBounds(L, anchor, radiusKm));
      }
      if (fitToMarkers && bounds.isValid()) {
        if (markers.length === 1 && !radiusKm) map.setView([markers[0].lat, markers[0].lng], zoom);
        else map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      }
    });
    return () => {
      cancelled = true;
      observer.disconnect();
      map?.remove();
    };
    // key รวมทุก prop ที่มีผลกับแผนที่
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div className={cn("saan-map", className)} style={{ height }}>
      <div ref={ref} role="img" aria-label={ariaLabel} className="size-full" />
      {description ? <p className="sr-only">{description}</p> : null}
    </div>
  );
}
