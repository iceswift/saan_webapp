import { KindArt, Phuang, Plant } from "./shrine-art";
import { HeroStage } from "./hero-stage";
import { cn } from "@/lib/utils";

/*
 * ภาพเด่นหน้าแรก (v6.1): ฉากศาลในกรอบซุ้มโค้ง ซ้อนเป็นห้าชั้น (ฟ้า/ดวงอาทิตย์ · หลังคาไกล+เนินเขา · พื้น · ศาล+ควันธูป · พวงมาลัย+ต้นไม้หน้าสุด)
 * ทุกชั้นใช้พิกัดเดียวกัน (viewBox 280x320 และกรอบสัดส่วน 7:8) จึงเรียงทับกันตรงเสมอทุกขนาดจอ
 * สีใช้ token --art-* เท่านั้น เหมือนภาพศาลอื่น ๆ (มืด/สว่างตามธีมเอง)
 *
 * การเคลื่อนไหว (CSS ใน globals.css หัวข้อ "hero"; ปิดทั้งหมดเมื่อผู้ใช้ปิดการเคลื่อนไหว):
 * - ตอนเข้า: ซุ้มโผล่จากล่างขึ้นบน ตามด้วยแต่ละชั้น (class hero-pop, หน่วงด้วย --h)
 * - ขนานตามเมาส์ (เดสก์ท็อปที่มีเมาส์เท่านั้น): HeroStage ตั้ง --px/--py แต่ละชั้นขยับสวนทิศ 4-10px (hero-l1..l5)
 * - วนเบา ๆ เฉพาะรายละเอียดเล็ก: ควันธูป (hero-wisp) และพวงมาลัยแกว่ง (hero-sway) หยุดเมื่อพ้นจอ (HeroStage ตั้ง data-paused)
 * - ตอนเลื่อน (เฉพาะเบราว์เซอร์ที่รองรับ animation-timeline): กรอบทั้งชุดตกช้ากว่าหน้าไม่เกิน 24px (hero-depth) และขอบซุ้มรอบนอกขยายเล็กน้อย (hero-echo)
 */

const SVG = "absolute inset-0 size-full overflow-visible [&_*]:[vector-effect:non-scaling-stroke]";

export function HeroArt({ className }: { className?: string }) {
  return (
    <div className={cn("hero-depth relative", className)}>
      {/* ขอบซุ้มรอบนอก (เส้นบาง) ซ้อนเป็นวงที่สองของประตูโค้ง */}
      <span
        aria-hidden="true"
        style={{ "--arch-r": "7.75rem", "--h": 300 } as React.CSSProperties}
        className="hero-pop pointer-events-none absolute -inset-3"
      >
        <span className="hero-echo block size-full arch-top border border-foreground/15" />
      </span>
      <HeroStage
        role="img"
        aria-label="ภาพประกอบศาลพระภูมิหน้าซุ้มโค้ง"
        className="hero-stage hero-arch-in relative aspect-[7/8] size-full overflow-hidden arch-top bg-[color-mix(in_oklch,var(--gold-soft)_65%,var(--card))] [--arch-r:7rem]"
      >
        {/* 1 ฟ้า: ดวงอาทิตย์ยามเช้าและก้อนเมฆ */}
        <div className="hero-layer hero-l1 absolute inset-0">
          <svg viewBox="0 0 280 320" className={cn(SVG, "hero-pop")} style={{ "--h": 360 } as React.CSSProperties} aria-hidden="true" fill="none">
            <circle cx="204" cy="112" r="42" className="fill-(--art-accent) stroke-none" opacity="0.92" />
            <path d="M24 98C24 86 42 86 45 94C50 84 70 86 68 98Z" className="fill-(--art-paper) stroke-none" />
            <path d="M176 44C176 36 188 36 190 41C194 35 206 36 205 44Z" className="fill-(--art-paper) stroke-none" />
          </svg>
        </div>

        {/* 2 หลังคาวัดที่ไกลออกไปและเนินเขา */}
        <div className="hero-layer hero-l2 absolute inset-0">
          <svg viewBox="0 0 280 320" className={cn(SVG, "hero-pop")} style={{ "--h": 400 } as React.CSSProperties} aria-hidden="true" fill="none">
            <path d="M-30 252C10 214 66 222 108 252C150 226 214 206 310 246V330H-30Z" className="fill-(--art-leaf) stroke-none" opacity="0.7" />
            <path d="M18 250C34 250 52 238 62 218C65 212 68 212 71 218C82 238 98 250 114 250Z" className="fill-(--art-deep) stroke-none" />
            <path d="M66 204V190" className="stroke-(--art-mid)" strokeWidth="1.5" />
            <path d="M200 250C212 250 226 242 234 226C236 222 238 222 240 226C248 242 262 250 274 250Z" className="fill-(--art-deep) stroke-none" />
            <path d="M239 216V206" className="stroke-(--art-mid)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* 3 พื้น */}
        <div className="hero-layer hero-l3 absolute inset-0">
          <svg viewBox="0 0 280 320" className={cn(SVG, "hero-pop")} style={{ "--h": 420 } as React.CSSProperties} aria-hidden="true" fill="none">
            <rect x="-30" y="262" width="340" height="90" className="fill-(--art-ground) stroke-none" />
            <path d="M-30 262H310" className="stroke-(--art-mid)" strokeWidth="1.25" />
            <path d="M-30 288H310M70 262L40 330M140 262V330M210 262L240 330" className="stroke-(--art-mid)" strokeWidth="1" />
          </svg>
        </div>

        {/* 4 ศาลพระภูมิและควันธูป (ควันลอยขึ้นจากกระถางธูปในภาพศาลจริง) */}
        <div className="hero-layer hero-l4 absolute inset-0">
          <div
            className="hero-pop absolute bottom-[11.6%] left-[17%] aspect-square w-[66%]"
            style={{ "--h": 440 } as React.CSSProperties}
          >
            <KindArt kind="PHRA_PHUM" className="size-full" />
          </div>
          <svg viewBox="0 0 280 320" className={SVG} aria-hidden="true" fill="none" strokeLinecap="round">
            <g transform="translate(194 250)">
              {[0, 1, 2].map((w) => (
                <path
                  key={w}
                  d="M0 0C-6-8 6-16 0-24S-6-40 0-50"
                  className="hero-wisp stroke-(--art-line)"
                  strokeWidth="1.5"
                  style={{ "--w": w, transform: `translateX(${(w - 1) * 5}px)` } as React.CSSProperties}
                />
              ))}
            </g>
          </svg>
        </div>

        {/* 5 หน้าสุด: ต้นไม้ในกระถางสองข้าง และพวงมาลัยแกว่งเบา ๆ ใต้ยอดซุ้ม */}
        <div className="hero-layer hero-l5 absolute inset-0">
          <svg viewBox="0 0 280 320" className={cn(SVG, "hero-pop")} style={{ "--h": 470 } as React.CSSProperties} aria-hidden="true" fill="none">
            <Plant x={26} y={294} s={1.9} />
            <Plant x={256} y={300} s={1.45} />
          </svg>
          <svg
            viewBox="0 0 280 320"
            className={cn(SVG, "hero-sway hero-drop")}
            style={{ "--h": 500 } as React.CSSProperties}
            aria-hidden="true"
            fill="none"
          >
            <Phuang x1={20} y1={60} x2={260} y2={60} sag={20} n={11} tassel={false} />
          </svg>
        </div>
      </HeroStage>
    </div>
  );
}
