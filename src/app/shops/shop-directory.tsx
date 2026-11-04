"use client";

import "leaflet/dist/leaflet.css";
import "@/components/map/map.css";
import "./shop-directory.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/brand";
import { ArrowLeft, ChevronDown, ChevronUp, X } from "lucide-react";
import { createBaseMap, loadLeaflet, pinIcon } from "@/components/map/map-core";
import { DEFAULT_CENTER } from "@/lib/geo";
import { AREAS, AREA_CODES, PROVIDER_KINDS, PROVIDER_KIND_CODES } from "@/lib/constants";
import type { DirectoryShop } from "@/lib/shop-directory";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { BottomSheet, BottomSheetClose } from "@/components/bottom-sheet";
import { Chip, ChipRow } from "@/components/chip";
import { LinkButton } from "@/components/link-button";
import { EmptyState } from "@/components/visuals";

type ViewBounds = { north: number; south: number; east: number; west: number };

export function ShopDirectory({ shops, testMode }: { shops: DirectoryShop[]; testMode: boolean }) {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [kind, setKind] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const resultContent = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewBounds | null>(null);
  const [searchBounds, setSearchBounds] = useState<ViewBounds | null>(null);
  const startY = useRef<number | null>(null);
  const dragged = useRef(false);
  const selectedTitle = useRef<HTMLHeadingElement>(null);
  const choose = useCallback((id: string) => { setSelected(id); setExpanded(true); setFocusRequest(value => value + 1); }, []);
  useEffect(() => { if (selected) { if (resultContent.current) resultContent.current.scrollTop = 0; selectedTitle.current?.focus({ preventScroll: true }); } }, [selected, focusRequest]);
  const filtered = useMemo(() => shops.filter(shop => (!area || shop.areas.some(code => code === area)) &&
    (!kind || shop.kind === kind) && (!q.trim() || `${shop.name} ${shop.address}`.toLocaleLowerCase("th").includes(q.trim().toLocaleLowerCase("th")))), [shops, area, kind, q]);
  const visible = filtered.filter(shop => !searchBounds || (shop.location && shop.location.lat >= searchBounds.south && shop.location.lat <= searchBounds.north && shop.location.lng >= searchBounds.west && shop.location.lng <= searchBounds.east));
  const active = visible.find(shop => shop.id === selected);
  function reset() { setQ(""); setArea(""); setKind(""); setSearchBounds(null); setSelected(null); }
  return <div className="shop-explorer" data-expanded={expanded}>
    <div className="shop-explorer-map">
      <div className="shop-map-brand"><LinkButton href="/" variant="outline" size="xl" className="bg-background"><Wordmark size="sm" /></LinkButton><ThemeToggle variant="button" className="size-11" /></div>
      {testMode ? <p className="shop-test-label">พื้นที่ทดสอบ · ไม่มีร้านหรือการซื้อขายจริง</p> : null}
      <DirectoryMap shops={filtered} selected={active?.id ?? null} onSelect={choose} onBounds={setViewport} focusRequest={focusRequest} />
      <div className="shop-map-actions">
        <Button variant="outline" size="xl" className="bg-background" onClick={() => { setSearchBounds(viewport); setSelected(null); }} loading={!viewport}>ค้นหาในบริเวณนี้</Button>
        {searchBounds ? <Button variant="outline" size="xl" className="bg-background" onClick={() => setSearchBounds(null)}>ดูทุกบริเวณ</Button> : null}
      </div>
    </div>
    <aside className="shop-explorer-panel" aria-label="ค้นหาและเลือกร้าน">
      <div className="shop-explorer-search">
        <div className="mb-3 flex items-center gap-3">
          <LinkButton href="/browse" variant="outline" size="icon-xl"><ArrowLeft aria-hidden="true"/><span className="sr-only">กลับไปเลือกดูศาล</span></LinkButton>
          <div><h1 className="font-display text-xl font-normal">สำรวจร้านศาล</h1><p className="text-sm text-muted-foreground">ร้านและผู้ให้บริการที่ผ่านการตรวจสอบ</p></div>
        </div>
        <label htmlFor="shop-search" className="sr-only">ค้นหาร้านหรือที่อยู่</label>
        <Input id="shop-search" value={q} maxLength={100} onChange={event => { setQ(event.target.value); setSearchBounds(null); }} placeholder="ค้นหาชื่อร้านหรือที่อยู่" />
        <BottomSheet title="ตัวกรองร้าน" description="พื้นที่รับงานคือพื้นที่ที่ร้านให้บริการ ไม่ใช่ตำแหน่งหน้าร้าน"
          trigger={<>ตัวกรอง{area || kind ? " · กำลังใช้งาน" : ""}</>}
          triggerClassName={buttonVariants({ variant: "outline", size: "xl", className: "mt-3 w-full" })}>
          <p className="text-base font-medium">พื้นที่รับงาน</p>
          <ChipRow label="พื้นที่รับงาน"><Chip active={!area} onClick={() => { setArea(""); setSearchBounds(null); }}>ทุกพื้นที่</Chip>{AREA_CODES.map(code => <Chip key={code} active={area === code} onClick={() => { setArea(code); setSearchBounds(null); }}>{AREAS[code]}</Chip>)}</ChipRow>
          <p className="text-base font-medium">ประเภทผู้ให้บริการ</p>
          <ChipRow label="ประเภทผู้ให้บริการ"><Chip active={!kind} onClick={() => { setKind(""); setSearchBounds(null); }}>ทุกประเภท</Chip>{PROVIDER_KIND_CODES.map(code => <Chip key={code} active={kind === code} onClick={() => { setKind(code); setSearchBounds(null); }}>{PROVIDER_KINDS[code]}</Chip>)}</ChipRow>
          <Button variant="ghost" size="xl" onClick={reset}>ล้างตัวกรองทั้งหมด</Button>
          <BottomSheetClose className={buttonVariants({ size: "xl" })}>ดูร้าน {visible.length} แห่ง</BottomSheetClose>
        </BottomSheet>
      </div>
      <div className="shop-explorer-results" id="shop-results">
        <button type="button" className="shop-sheet-handle" aria-expanded={expanded} aria-controls="shop-result-content" onClick={() => { if (!dragged.current) setExpanded(value => !value); dragged.current = false; }}
          onPointerDown={event => { dragged.current = false; startY.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerUp={event => { const delta = startY.current === null ? 0 : event.clientY - startY.current; startY.current = null; if (Math.abs(delta) > 24) { dragged.current = true; setExpanded(delta < 0); } }}
>
          <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-border" aria-hidden="true" />
          <span className="flex items-center justify-between"><span>{active ? "ข้อมูลร้าน" : "ร้านที่พบ"} · {visible.length}</span>{expanded ? <ChevronDown className="size-5"/> : <ChevronUp className="size-5"/>}</span>
        </button>
        <div ref={resultContent} id="shop-result-content" className="shop-result-content">
          <p role="status" className="mb-3 text-sm text-muted-foreground">พบ {visible.length} ร้าน · มีหมุด {visible.filter(shop => shop.location).length} ร้าน{searchBounds ? " · ในบริเวณที่เลือก" : ""}</p>
          {active ? <section aria-label="ร้านที่เลือก" className="shop-detail">
            <div className="shop-detail-art"><Image src="/images/shop-concept-ai.png" alt="ภาพประกอบ AI โชว์รูมศาลสมมติ ไม่ใช่ภาพร้านจริง" width={1536} height={1024} sizes="(min-width: 768px) 360px, (min-width: 600px) and (max-height: 500px) 320px, 90vw" className="h-full w-full object-cover" /><span>ภาพประกอบ AI · ไม่ใช่ภาพร้านจริง</span></div>
            <div className="flex items-start justify-between gap-3"><h2 ref={selectedTitle} tabIndex={-1} className="font-display text-xl font-medium outline-none">{active.name}</h2><Button size="icon-xl" variant="ghost" aria-label="กลับไปรายการร้าน" onClick={() => setSelected(null)}><X /></Button></div>
            <p className="mt-2 text-sm text-muted-foreground">{PROVIDER_KINDS[active.kind]}</p>
            <p className="mt-3 whitespace-pre-line text-base">{active.address || "ร้านยังไม่ระบุที่อยู่สาธารณะ"}</p>
            <p className="mt-2 text-sm text-muted-foreground">พื้นที่รับงาน: {active.areas.map(code => AREAS[code]).join(" · ") || "ยังไม่ระบุ"}</p>
            <LinkButton href={`/shops/${active.id}`} variant="gold" size="xl" className="mt-4">ดูหน้าร้านและติดต่อ</LinkButton>
          </section> : null}
          {!active && visible.length ? <ul aria-label="ร้านที่พบ" className="divide-y divide-border">{visible.map(shop => <li key={shop.id}><button type="button" aria-pressed={false} onClick={() => choose(shop.id)} className="flex w-full items-start gap-4 py-5 text-left transition-colors hover:bg-muted aria-pressed:bg-muted">
            <span className="shop-row-art"><Image src="/images/shop-concept-ai.png" alt="" width={160} height={160} sizes="88px" className="h-full w-full object-cover" /><span>ภาพ AI</span></span>
            <span className="min-w-0"><span className="block text-base font-medium">{shop.name}</span><span className="mt-1 block text-sm text-muted-foreground">{PROVIDER_KINDS[shop.kind]}</span><span className="mt-2 block text-sm text-muted-foreground">{shop.address || "ยังไม่ระบุที่อยู่สาธารณะ"}</span><span className="mt-2 block text-sm">{shop.location ? "ดูตำแหน่งบนแผนที่" : "ยังไม่มีหมุด"}</span></span>
          </button></li>)}</ul> : !active ? <EmptyState art="search" title={shops.length ? "ไม่พบร้านตามเงื่อนไข" : "ยังไม่มีร้านที่ผ่านการตรวจสอบ"} description="ลองเปลี่ยนคำค้น ตัวกรอง หรือบริเวณแผนที่" action={<Button variant="outline" size="xl" onClick={reset}>ล้างตัวกรอง</Button>} /> : null}
          <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">หมุดโดยประมาณ · โทรยืนยันก่อนเดินทาง{!active ? " ร้านไม่มีหมุดดูได้เมื่อเลือกทุกบริเวณ" : ""}</p>
        </div>
      </div>
    </aside>
  </div>;
}

function centerShop(instance: Leaflet.Map, marker: Leaflet.Marker) {
  const zoom = instance.getZoom();
  let center = instance.project(marker.getLatLng(), zoom);
  if (window.matchMedia("(min-width: 768px), (min-width: 600px) and (max-height: 500px)").matches) {
    const panel = instance.getContainer().closest(".shop-explorer")?.querySelector(".shop-explorer-panel");
    center = center.subtract([(panel?.getBoundingClientRect().right ?? 0) / 2, 0]);
  }
  instance.panTo(instance.unproject(center, zoom), { animate: false });
}

function DirectoryMap({ shops, selected, onSelect, onBounds, focusRequest }: { focusRequest: number; shops: DirectoryShop[]; selected: string | null; onSelect: (id: string) => void; onBounds: (bounds: ViewBounds) => void }) {
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
      const reportBounds = () => { if (!instance) return; const b = instance.getBounds(); onBounds({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() }); };
      instance.on("moveend", reportBounds);
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
        marker.getElement()?.classList.toggle("is-selected", shop.id === currentSelection.current);
        marker.getElement()?.setAttribute("aria-pressed", String(shop.id === currentSelection.current));
        markers.current.set(shop.id, marker);
        bounds.extend([shop.location.lat, shop.location.lng]);
      }
      if (bounds.isValid()) instance.fitBounds(bounds.pad(0.15), { maxZoom: 13, animate: false });
      reportBounds();
      const activeMarker = currentSelection.current ? markers.current.get(currentSelection.current) : null;
      if (activeMarker) { centerShop(instance, activeMarker); activeMarker.openTooltip(); }
    }).catch(() => setError(true));
    const currentMarkers = markers.current;
    return () => { cancelled = true; observer.disconnect(); instance?.remove(); map.current = null; currentMarkers.clear(); };
  }, [shops, onSelect, onBounds]);
  useEffect(() => {
    for (const [id, item] of markers.current) {
      if (id !== selected) item.closeTooltip();
      item.getElement()?.classList.toggle("is-selected", id === selected);
      item.getElement()?.setAttribute("aria-pressed", String(id === selected));
    }
    if (!selected) return;
    const marker = markers.current.get(selected);
    if (marker) { if (map.current) centerShop(map.current, marker); marker.openTooltip(); }
  }, [selected, focusRequest]);
  return <><div ref={el} role="region" aria-label="แผนที่รวมตำแหน่งร้านโดยประมาณ" className="saan-map absolute inset-0 z-0 h-full w-full" />
    {error ? <p role="alert" className="absolute bottom-4 left-4 z-10 max-w-sm rounded-lg border border-border bg-background p-3 text-sm">โหลดแผนที่ไม่สำเร็จ ยังเลือกร้านจากรายการด้านล่างได้</p> : null}</>;
}
