"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Clock,
  Compass,
  Landmark,
  MapPin,
  Plus,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SHRINE_KINDS, type ShrineKind } from "@/lib/constants";
import { formatBaht } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./bottom-sheet";
import { ThumbArt } from "./thumb-art";

/**
 * ช่องค้นหาแบบ command palette
 * - เดสก์ท็อป (HeaderSearch): ปุ่มหน้าตาเหมือนช่องค้นหา "ค้นหาศาล  Ctrl K" กดแล้วเปิดหน้าต่างกลางจอ (หรือกด / หรือ Ctrl/⌘+K ทุกที่ ยกเว้นขณะพิมพ์ในช่องอื่น)
 * - ว่าง: ค้นหาล่าสุด (localStorage ในเครื่องนี้ สูงสุด 5) และทางลัดไปหน้าหลัก
 * - พิมพ์: ค้นหาทั้งหมดใน /browse (คงตัวกรอง near/kind/area/max/sort ถ้าอยู่หน้าเลือกดูศาล) + ศาลที่ตรงกัน 6 รายการจาก /api/search
 * - คีย์บอร์ด: ลูกศรขึ้นลง Enter Esc (ไม่รับ Enter ระหว่างพิมพ์ไทยยังไม่ยืนยันตัวอักษร)
 *
 * v6.2: เนื้อในของหน้าต่าง (SearchPalette) ใช้ซ้ำได้: เดสก์ท็อปห่อด้วย Dialog กลางจอ (HeaderSearch)
 * มือถือห่อด้วยแผ่นสูงจากด้านล่าง (MobileSearch: ปุ่มไอคอนหรือช่องค้นหาที่แตะแล้วเปิดแผ่น ไม่มีทางลัดคีย์บอร์ด)
 * เนื้อในถูกสร้างเมื่อเปิดเท่านั้น จึงเริ่มสะอาดทุกครั้ง (รายการล่าสุดอ่านใหม่ ไม่มีคำค้นค้าง)
 */

const RECENT_KEY = "saan:recent-searches";
const RECENT_MAX = 5;

function readRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // ไม่มีที่เก็บ (โหมดส่วนตัว) ก็ข้ามไป
  }
}

const subscribe = () => () => {};
function useIsMac() {
  return useSyncExternalStore(
    subscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );
}

/** ความสูงของพื้นที่ที่มองเห็นจริง (ลดลงเมื่อแป้นพิมพ์บนมือถือเปิด) ใช้จำกัดความสูงรายการให้เลื่อนเองได้เหนือแป้นพิมพ์ */
function subscribeViewport(callback: () => void) {
  const vv = window.visualViewport;
  vv?.addEventListener("resize", callback);
  return () => vv?.removeEventListener("resize", callback);
}
function useVisualViewportHeight(): number {
  return useSyncExternalStore(
    subscribeViewport,
    () => Math.round(window.visualViewport?.height ?? window.innerHeight),
    () => 0,
  );
}

type Suggestion = { id: string; name: string; kind: ShrineKind; price: number; shop: string };

type Entry = {
  key: string;
  label: string;
  sub?: string;
  icon?: LucideIcon;
  kind?: ShrineKind;
  price?: number;
  trailing?: "arrow";
  run: () => void;
};

type Section = { title: string; action?: { label: string; run: () => void }; entries: Entry[] };

const QUICK: { href?: string; label: string; icon: LucideIcon; near?: true }[] = [
  { href: "/browse", label: "เลือกดูศาล", icon: Compass },
  { label: "ใกล้ฉัน", icon: MapPin, near: true },
  { href: "/shrines", label: "ศาลของฉัน", icon: Landmark },
  { href: "/vows", label: "สมุดบน", icon: BookOpen },
  { href: "/orders", label: "งานของฉัน", icon: ClipboardList },
  { href: "/new", label: "ตั้งศาลใหม่", icon: Plus },
];

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "numeric inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-background px-1.5 font-sans text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/**
 * เนื้อในของช่องค้นหา: ช่องพิมพ์ + รายการ (ค้นหาล่าสุด / คำแนะนำสด / ทางลัด)
 * - variant "dialog" = หน้าต่างกลางจอบนเดสก์ท็อป (มีปุ่ม Esc และแถบคีย์ลัดท้าย)
 * - variant "sheet" = แผ่นสูงบนมือถือ (ช่องพิมพ์ทรงเม็ดยา ปุ่มล้างคำ แถวสูง 56px รายการเลื่อนเองเหนือแป้นพิมพ์)
 * - onClose: ปิดหน้าต่าง/แผ่นของผู้เรียก | inputRef: ให้ผู้เรียกบอกตัวโฟกัสแรกของแผ่น
 */
export function SearchPalette({
  variant,
  onClose,
  initialQuery = "",
  inputRef,
}: {
  variant: "dialog" | "sheet";
  onClose: () => void;
  initialQuery?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [results, setResults] = useState<Suggestion[]>([]);
  // คำค้นที่ผลใน results ตอบมาครบแล้ว (ใช้แยก "กำลังค้นหา" ออกจาก "ไม่พบ" ไม่ให้ข้อความไม่พบวาบก่อนคำขอจะเริ่ม)
  const [settled, setSettled] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const sheet = variant === "sheet";
  const vvh = useVisualViewportHeight();

  const trimmed = q.trim();

  // คำแนะนำสด: หน่วง 180 มิลลิวินาที ยกเลิกคำขอเก่าเมื่อพิมพ์ต่อ
  useEffect(() => {
    if (!trimmed) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed.slice(0, 60))}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as Suggestion[];
        setResults(Array.isArray(data) ? data : []);
        if (!controller.signal.aborted) setSettled(trimmed);
      } catch {
        // ถูกยกเลิกหรือเครือข่ายล้มเหลว: คงรายการเดิม
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  function remember(term: string) {
    const next = [term, ...readRecent().filter((v) => v !== term)].slice(0, RECENT_MAX);
    writeRecent(next);
  }

  function go(href: string) {
    onClose();
    router.push(href);
  }

  /** ค้นหาทั้งหมดใน /browse: ถ้าอยู่หน้านั้นอยู่แล้วคงตัวกรองอื่นไว้ (อ่านจาก URL ตอนกด จึงไม่ต้องใช้ hook ที่บังคับ Suspense) */
  function submit(term: string) {
    const value = term.trim().slice(0, 60);
    if (!value) return go("/browse");
    remember(value);
    const sp = new URLSearchParams();
    if (window.location.pathname === "/browse") {
      const current = new URLSearchParams(window.location.search);
      for (const name of ["kind", "area", "max", "sort", "near"] as const) {
        const v = current.get(name);
        if (v) sp.set(name, v);
      }
    }
    sp.set("q", value);
    go(`/browse?${sp.toString()}`);
  }

  function nearMe() {
    if (!navigator.geolocation) {
      toast.error("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    onClose();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const near = `${pos.coords.latitude.toFixed(2)},${pos.coords.longitude.toFixed(2)}`;
        router.push(`/browse?near=${near}&sort=nearest`);
      },
      () => toast.error("ยังไม่ได้รับตำแหน่ง ลองอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์"),
      { timeout: 8000, maximumAge: 300000 },
    );
  }

  // รายการในหน้าต่าง: จัดเป็นหมวด แล้วเรียงเป็นลำดับเดียวสำหรับลูกศรขึ้นลง
  const quick: Entry[] = QUICK.filter((item) => !trimmed || item.label.includes(trimmed)).map((item) => ({
    key: `quick-${item.label}`,
    label: item.label,
    icon: item.icon,
    trailing: "arrow",
    run: item.near ? nearMe : () => go(item.href as string),
  }));

  const sections: Section[] = [];
  if (trimmed) {
    sections.push({
      title: "ค้นหา",
      entries: [
        {
          key: "all",
          label: `ค้นหา “${trimmed}” ทั้งหมด`,
          sub: "ดูผลทั้งหมดในหน้าเลือกดูศาล",
          icon: Search,
          trailing: "arrow",
          run: () => submit(trimmed),
        },
      ],
    });
    if (results.length > 0) {
      sections.push({
        title: "ศาลและบริการ",
        entries: results.map((p) => ({
          key: `p-${p.id}`,
          label: p.name,
          sub: `${p.shop} · ${SHRINE_KINDS[p.kind]}`,
          kind: p.kind,
          price: p.price,
          run: () => {
            remember(trimmed);
            go(`/products/${p.id}`);
          },
        })),
      });
    }
    if (quick.length > 0) sections.push({ title: "ไปที่", entries: quick });
  } else {
    if (recent.length > 0) {
      sections.push({
        title: "ค้นหาล่าสุด",
        action: {
          label: "ล้าง",
          run: () => {
            writeRecent([]);
            setRecent([]);
          },
        },
        entries: recent.map((term) => ({
          key: `r-${term}`,
          label: term,
          icon: Clock,
          trailing: "arrow",
          run: () => submit(term),
        })),
      });
    }
    sections.push({ title: "ไปที่", entries: quick });
  }
  const flat = sections.flatMap((s) => s.entries);
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0));
  const activeId = flat[activeIndex] ? `${listId}-${activeIndex}` : undefined;

  useEffect(() => {
    if (!activeId) return;
    listRef.current?.querySelector(`[id="${activeId}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (flat.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + flat.length) % flat.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      // มือถือ: Enter บนคำที่พิมพ์ = ค้นหาทั้งหมดเสมอ (ไม่มีลูกศรให้เลือกรายการอื่น) เดสก์ท็อป: รายการที่เลือกอยู่
      if (sheet && trimmed && activeIndex === 0) submit(trimmed);
      else flat[activeIndex]?.run();
    }
  }

  let counter = -1;
  return (
    <>
      <div
        style={{ "--i": 0 } as React.CSSProperties}
        className={cn(
          "flex shrink-0 items-center gap-3",
          sheet
            ? "h-14 rounded-full border border-input px-4 focus-within:border-foreground"
            : "border-b border-border px-5",
        )}
      >
        <Search className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.9} aria-hidden="true" />
        <input
          ref={inputRef}
          autoFocus={!sheet}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label="คำค้นหา"
          maxLength={60}
          placeholder="ค้นหาศาลหรือบริการ"
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground",
            sheet ? "h-full" : "h-16",
          )}
        />
        {sheet ? (
          q ? (
            <button
              type="button"
              aria-label="ล้างคำค้นหา"
              onClick={() => {
                setQ("");
                setActive(0);
                inputRef?.current?.focus();
              }}
              className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[transform,background-color] hover:bg-muted hover:text-foreground active:scale-90"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          ) : null
        ) : (
          <Kbd>Esc</Kbd>
        )}
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="ผลการค้นหา"
        style={
          {
            "--i": 1,
            ...(sheet && vvh ? { maxHeight: `calc(${vvh}px - 14rem)` } : {}),
          } as React.CSSProperties
        }
        className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", sheet ? "-mx-2 pt-1 pb-2" : "p-2")}
      >
        {sections.map((section) => (
          <div key={section.title} role="presentation" className="pb-1">
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <p className="text-sm text-muted-foreground">{section.title}</p>
              {section.action ? (
                <button
                  type="button"
                  onClick={section.action.run}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:min-h-9"
                >
                  {section.action.label}
                </button>
              ) : null}
            </div>
            {section.entries.map((entry) => {
              counter += 1;
              const index = counter;
              const on = index === activeIndex;
              const Icon = entry.icon;
              return (
                <div
                  key={entry.key}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={on}
                  onPointerMove={() => on || setActive(index)}
                  onClick={entry.run}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition-colors duration-(--dur-fast)",
                    sheet ? "min-h-14 active:bg-muted" : "min-h-12",
                    on && !sheet && "bg-muted",
                  )}
                >
                  {entry.kind ? (
                    <ThumbArt kind={entry.kind} className="size-10" />
                  ) : Icon ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground">
                      <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">{entry.label}</span>
                    {entry.sub ? (
                      <span className="block truncate text-sm text-muted-foreground">{entry.sub}</span>
                    ) : null}
                  </span>
                  {entry.price != null ? (
                    <span className="numeric shrink-0 font-display text-base text-gold-ink">
                      {formatBaht(entry.price)}
                    </span>
                  ) : null}
                  {entry.trailing === "arrow" ? (
                    <ArrowRight
                      className={cn(
                        "size-4.5 shrink-0 text-muted-foreground transition-[transform,opacity] duration-(--dur-fast) ease-soft",
                        on || sheet ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0",
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
        {trimmed && settled === trimmed && results.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            ยังไม่พบศาลที่ตรงกับ “{trimmed}” ลองคำอื่น หรือดูทั้งหมดในหน้าเลือกดูศาล
          </p>
        ) : null}
        {trimmed && settled !== trimmed ? (
          <p className="px-3 py-3 text-sm text-muted-foreground" role="status">
            กำลังค้นหา
          </p>
        ) : null}
      </div>
      {sheet ? null : (
        <div className="flex shrink-0 items-center gap-4 border-t border-border px-5 py-2.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> เลือก
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>Enter</Kbd> เปิด
          </span>
        </div>
      )}
    </>
  );
}

/** ตัวเปิดช่องค้นหาในส่วนหัวเดสก์ท็อป: ปุ่มหน้าตาเหมือนช่องค้นหา + หน้าต่างกลางจอ + ทางลัด / และ Ctrl/⌘+K */
export function HeaderSearch({ className }: { className?: string }) {
  const mac = useIsMac();
  const [open, setOpen] = useState(false);

  const show = useCallback(() => setOpen(true), []);

  // ทางลัดทั้งเว็บ: / และ Ctrl/⌘+K (ส่วนหัวนี้ซ่อนบนมือถือ จึงไม่เปิดด้วยแป้นพิมพ์ที่ความกว้างต่ำกว่า lg)
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const isK = (event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey);
      const isSlash = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey;
      if (!isK && !isSlash) return;
      if (isSlash) {
        const el = event.target as HTMLElement | null;
        if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      }
      if (!window.matchMedia("(min-width: 64rem)").matches) return;
      event.preventDefault();
      show();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="ค้นหาศาลและบริการ"
        aria-keyshortcuts="Control+K Meta+K /"
        className={cn(
          "group flex h-10 min-w-0 items-center gap-2.5 rounded-full border border-border bg-transparent pr-2 pl-3.5 text-left text-base text-muted-foreground transition-[background-color,border-color,transform] duration-(--dur-fast) ease-soft hover:border-input hover:bg-muted active:scale-[0.98] max-xl:[.text-large_&]:w-10 max-xl:[.text-large_&]:justify-center max-xl:[.text-large_&]:p-0",
          className,
        )}
      >
        <Search className="size-4.5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate max-xl:[.text-large_&]:hidden">ค้นหาศาล</span>
        <Kbd className="max-xl:hidden">{mac ? "⌘ K" : "Ctrl K"}</Kbd>
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-(--dur-base) ease-soft data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup
            aria-label="ค้นหา"
            className="fixed top-[12vh] left-1/2 z-50 flex max-h-[min(36rem,76dvh)] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-popover text-popover-foreground outline-none transition-[opacity,transform] duration-(--dur-base) ease-soft data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:-translate-y-2 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0"
          >
            <Dialog.Title className="sr-only">ค้นหาศาลและบริการ</Dialog.Title>
            <SearchPalette variant="dialog" onClose={() => setOpen(false)} />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/**
 * ทางเข้าค้นหาบนมือถือ: แตะแล้วเปิดแผ่นสูงจากด้านล่าง (ช่องพิมพ์ได้โฟกัสทันทีเพราะเปิดจากการแตะ)
 * - variant "icon": ปุ่มวงกลม 44px ไว้ในหัวหน้าจอ | "field": ช่องหน้าตาเหมือนช่องค้นหา (placeholder หรือคำค้นปัจจุบัน)
 * - defaultQuery: คำค้นที่ใส่ในช่องพิมพ์ตอนเปิด (หน้าเลือกดูส่งคำค้นปัจจุบัน)
 * ไม่มีทางลัดแป้นพิมพ์ และ Enter ไป /browse?q= โดยคงตัวกรองเดิมเมื่ออยู่หน้านั้น
 */
export function MobileSearch({
  variant = "icon",
  placeholder = "ค้นหาศาลและบริการ",
  defaultQuery = "",
  className,
}: {
  variant?: "icon" | "field";
  placeholder?: string;
  defaultQuery?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="ค้นหาศาลและบริการ"
          aria-haspopup="dialog"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-[transform,background-color] duration-(--dur-fast) hover:bg-muted active:scale-90",
            className,
          )}
        >
          <Search className="size-5" strokeWidth={1.9} aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={defaultQuery ? `ค้นหาศาล คำค้นปัจจุบัน ${defaultQuery}` : "ค้นหาศาลและบริการ"}
          aria-haspopup="dialog"
          className={cn(
            "flex h-14 w-full min-w-0 items-center gap-3 rounded-full border border-input bg-transparent px-5 text-left text-base transition-[transform,background-color] duration-(--dur-fast) hover:bg-muted active:scale-[0.99]",
            defaultQuery ? "text-foreground" : "text-muted-foreground",
            className,
          )}
        >
          <Search className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.9} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{defaultQuery || placeholder}</span>
        </button>
      )}
      <BottomSheet title="ค้นหา" open={open} onOpenChange={setOpen} tall stagger initialFocus={inputRef}>
        <SearchPalette
          variant="sheet"
          initialQuery={defaultQuery}
          inputRef={inputRef}
          onClose={() => setOpen(false)}
        />
      </BottomSheet>
    </>
  );
}
