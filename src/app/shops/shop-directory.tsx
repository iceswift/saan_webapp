"use client";

import "leaflet/dist/leaflet.css";
import "@/components/map/map.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { createBaseMap, loadLeaflet, pinIcon } from "@/components/map/map-core";
import { DEFAULT_CENTER } from "@/lib/geo";
import { AREAS, AREA_CODES, PROVIDER_KINDS, PROVIDER_KIND_CODES } from "@/lib/constants";
import type { DirectoryShop } from "@/lib/shop-directory";
import { Input } from "@/components/ui/input";
import { Chip, ChipRow } from "@/components/chip";
import { LinkButton } from "@/components/link-button";
import { ListGroup, ListRow } from "@/components/list-group";
import { EmptyState } from "@/components/visuals";

export function ShopDirectory({ shops }: { shops: DirectoryShop[] }) {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [kind, setKind] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const selectedTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (selected) selectedTitle.current?.focus(); }, [selected]);
  const visible = useMemo(() => shops.filter(shop => (!area || shop.areas.some(code => code === area)) &&
    (!kind || shop.kind === kind) && (!q.trim() || `${shop.name} ${shop.address}`.toLocaleLowerCase("th").includes(q.trim().toLocaleLowerCase("th")))), [shops, area, kind, q]);
  const active = visible.find(shop => shop.id === selected);
  return <>
    <label htmlFor="shop-search" className="mb-2 block text-base font-medium">ค้นหาร้านหรือที่อยู่</label>
    <Input id="shop-search" value={q} maxLength={100} onChange={event => setQ(event.target.value)} placeholder="ชื่อร้าน ถนน หรือจังหวัดในที่อยู่" />
    <details className="my-5 border-y border-border py-3">
      <summary className="min-h-11 cursor-pointer py-2 text-base font-medium">กรองพื้นที่รับงานและประเภทผู้ให้บริการ</summary>
      <ChipRow label="พื้นที่รับงาน" className="my-3"><Chip active={!area} onClick={() => setArea("")}>ทุกพื้นที่</Chip>{AREA_CODES.map(code => <Chip key={code} active={area === code} onClick={() => setArea(code)}>{AREAS[code]}</Chip>)}</ChipRow>
      <ChipRow label="ประเภทผู้ให้บริการ"><Chip active={!kind} onClick={() => setKind("")}>ทุกประเภท</Chip>{PROVIDER_KIND_CODES.map(code => <Chip key={code} active={kind === code} onClick={() => setKind(code)}>{PROVIDER_KINDS[code]}</Chip>)}</ChipRow>
    </details>
    <p role="status" className="mb-3 text-sm text-muted-foreground">พบ {visible.length} ร้าน · มีหมุด {visible.filter(shop => shop.location).length} ร้าน</p>
    <p className="mb-4 text-sm text-muted-foreground">หมุดเป็นตำแหน่งโดยประมาณ ไม่ใช่เขตพื้นที่รับงาน โทรยืนยันที่อยู่กับร้านก่อนเดินทาง ร้านที่ยังไม่มีหมุดอยู่ในรายการด้านล่าง</p>
    {visible.length ? <>
      {visible.some(shop => shop.location) ? <DirectoryMap shops={visible} selected={active?.id ?? null} onSelect={setSelected} /> : <p className="border-y border-border py-5 text-base">ร้านที่พบยังไม่ได้ปักหมุด ดูข้อมูลจากรายการร้านได้</p>}
      {active ? <section aria-label="ร้านที่เลือก" className="my-5 border-y border-border py-5">
        <h2 ref={selectedTitle} tabIndex={-1} className="font-display text-xl font-medium outline-none">{active.name}</h2>
        <p className="mt-2 whitespace-pre-line text-base">{active.address || "ร้านยังไม่ระบุที่อยู่สาธารณะ"}</p>
        <p className="mt-2 text-sm text-muted-foreground">พื้นที่รับงาน: {active.areas.map(code => AREAS[code]).join(" · ") || "ยังไม่ระบุ"}</p>
        <LinkButton href={`/shops/${active.id}`} variant="gold" size="xl" className="mt-4">ดูหน้าร้านและติดต่อ</LinkButton>
      </section> : <p className="my-4 text-sm text-muted-foreground">แตะหมุดหรือเลือกร้านจากรายการเพื่อดูรายละเอียด</p>}
      <ListGroup label="ร้านที่พบ">{visible.map(shop => <ListRow key={shop.id} onClick={() => setSelected(shop.id)}
        title={shop.name} meta={`${PROVIDER_KINDS[shop.kind]} · ${shop.address || "ยังไม่ระบุที่อยู่สาธารณะ"}`}
        trailing={<span className="text-sm text-muted-foreground">{active?.id === shop.id ? "เลือกอยู่" : shop.location ? "มีหมุด" : "ไม่มีหมุด"}</span>} />)}</ListGroup>
    </> : <EmptyState art="search" title="ไม่พบร้านตามเงื่อนไข" description="ลองเปลี่ยนคำค้นหรือพื้นที่รับงาน" action={<button type="button" onClick={() => { setQ(""); setArea(""); setKind(""); }} className="min-h-12 rounded-full border border-border px-6 text-base font-medium">ล้างตัวกรอง</button>} />}
  </>;
}

function DirectoryMap({ shops, selected, onSelect }: { shops: DirectoryShop[]; selected: string | null; onSelect: (id: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>());
  const currentSelection = useRef(selected);
  useEffect(() => { currentSelection.current = selected; }, [selected]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let instance: Leaflet.Map | null = null;
    const observer = new ResizeObserver(() => instance?.invalidateSize());
    if (el.current) observer.observe(el.current);
    void loadLeaflet().then(L => {
      if (cancelled || !el.current) return;
      instance = createBaseMap(L, el.current, { center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], zoom: 6 });
      map.current = instance;
      const bounds = L.latLngBounds([]);
      for (const shop of shops) {
        if (!shop.location) continue;
        const marker = L.marker([shop.location.lat, shop.location.lng], { icon: pinIcon(L, "shop"), keyboard: true, title: shop.name, alt: shop.name }).addTo(instance);
        const label = document.createElement("span"); label.textContent = shop.name;
        marker.bindTooltip(label).on("click", () => onSelect(shop.id));
        // Explicit key handling also supports divIcon markers across browser engines.
        marker.getElement()?.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault(); event.stopPropagation(); onSelect(shop.id);
          }
        });
        markers.current.set(shop.id, marker);
        bounds.extend([shop.location.lat, shop.location.lng]);
      }
      if (bounds.isValid()) instance.fitBounds(bounds.pad(0.15), { maxZoom: 13, animate: false });
      const activeMarker = currentSelection.current ? markers.current.get(currentSelection.current) : null;
      if (activeMarker) { instance.panTo(activeMarker.getLatLng(), { animate: false }); activeMarker.openTooltip(); }
    }).catch(() => setError(true));
    const currentMarkers = markers.current;
    return () => { cancelled = true; observer.disconnect(); instance?.remove(); map.current = null; currentMarkers.clear(); };
  }, [shops, onSelect]);
  useEffect(() => {
    if (!selected) return;
    const marker = markers.current.get(selected);
    if (marker) { map.current?.panTo(marker.getLatLng(), { animate: false }); marker.openTooltip(); }
  }, [selected]);
  return <><div ref={el} role="region" aria-label="แผนที่รวมตำแหน่งร้านโดยประมาณ" className="saan-map relative z-0 h-80 w-full overflow-hidden rounded-lg border border-border sm:h-96" />
    {error ? <p role="alert" className="mt-2 text-sm text-muted-foreground">โหลดแผนที่ไม่สำเร็จ ยังเลือกร้านจากรายการด้านล่างได้</p> : null}</>;
}
