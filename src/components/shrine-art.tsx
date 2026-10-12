import { cn } from "@/lib/utils";
import type { ShrineKind } from "@/lib/constants";
import { ShrineShapes } from "./illustrations";

/*
 * ภาพศาลแยกตามประเภท และภาพประกอบบริการ (v6: ภาพศาลเป็นชุดใหม่ มีทั้งเส้นและพื้นทึบแบน ใช้ token --art-* เท่านั้น เหมือน illustrations.tsx)
 * ทุกภาพ viewBox 200x200 ออกแบบให้คมที่ 96-200px
 * ShrineScene รวมภาพศาล + ฉากหลังที่เปลี่ยนตามรหัสสินค้า เพื่อให้การ์ดแต่ละใบไม่หน้าตาซ้ำกัน
 */

type ArtProps = { className?: string };

const LINE = "stroke-(--art-line)";
const SOFT = cn(LINE, "fill-(--art-soft)");
const PAPER = cn(LINE, "fill-(--art-paper)");
const ACCENT = "fill-(--art-accent) stroke-(--art-accent)";
const MID = "stroke-(--art-mid)";
const SW = 3;

function Frame({ className, children }: ArtProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
      fill="none"
      strokeWidth={SW}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}


/* ---------------- ศาลแต่ละประเภท (v6: ภาพชุดใหม่ มีทั้งเส้นและพื้นทึบแบน ไม่มีไล่สี/เงา) ----------------
   - เส้นหมึกคงความหนาเท่ากันทุกขนาด (non-scaling-stroke) ภาพขนาด 56px และ 600px จึงหนักเบาใกล้เคียงกัน
   - พื้นทึบใช้เฉพาะ token: paper (ขาว/ดำอุ่น) soft (เบจ) deep (เบจเข้ม) accent (ชาด) leaf (เขียวหม่นอุ่น)
   - แต่ละประเภทมีทรง สัดส่วน และคู่สีของตัวเอง และมีของประกอบ (พวงมาลัย ช้าง ธูป ต้นไม้) ในภาพเลย */

const INK = "stroke-(--art-line)";
const P = cn(INK, "fill-(--art-paper)");
const B = cn(INK, "fill-(--art-soft)");
const D = cn(INK, "fill-(--art-deep)");
const A = cn(INK, "fill-(--art-accent)");
const L = cn(INK, "fill-(--art-leaf)");
const FLAT_A = "fill-(--art-accent) stroke-none";
const FLAT_P = "fill-(--art-paper) stroke-none";
const FLAT_D = "fill-(--art-deep) stroke-none";
const FLAT_L = "fill-(--art-leaf) stroke-none";
const KW = 1.75;

/** กรอบของภาพศาล: เส้นหนาคงที่ (non-scaling) viewBox 200x200 พื้นดินอยู่ที่ y=186 */
function KFrame({ className, children }: ArtProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("[&_*]:[vector-effect:non-scaling-stroke]", className)}
      aria-hidden="true"
      fill="none"
      strokeWidth={KW}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** พวงมาลัย: โค้งห้อยจาก (x1,y1) ถึง (x2,y2) มีดอกสลับขาว/ชาด และพู่ปลาย */
function Phuang({
  x1,
  y1,
  x2,
  y2,
  sag = 14,
  n = 7,
  tassel = true,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sag?: number;
  n?: number;
  tassel?: boolean;
}) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + sag * 2;
  const pts = Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const u = 1 - t;
    return {
      x: u * u * x1 + 2 * u * t * cx + t * t * x2,
      y: u * u * y1 + 2 * u * t * cy + t * t * y2,
    };
  });
  return (
    <g>
      <path d={`M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`} className="stroke-(--art-mid)" strokeWidth="1.25" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" className={i % 2 === 0 ? FLAT_A : P} />
      ))}
      {tassel ? (
        <path d={`M${x2} ${y2}V${y2 + 9}`} className="stroke-(--art-accent)" strokeWidth="2" />
      ) : null}
    </g>
  );
}

/** ช้างปั้นถวาย (หันซ้าย) ตัวสูงประมาณ 24 หน่วย ใช้กับศาลเจ้าที่และชุดคู่ */
function Elephant({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <rect x="2" y="8" width="26" height="15" rx="7" className={B} />
      <rect x="5" y="20" width="5" height="8" rx="1.5" className={B} />
      <rect x="20" y="20" width="5" height="8" rx="1.5" className={B} />
      <circle cx="4" cy="13" r="7" className={B} />
      <path d="M-1 17Q-6 25 -3 29" className={INK} strokeWidth="2.5" />
      <ellipse cx="9" cy="12" rx="3" ry="5" className={D} />
      <rect x="12" y="8" width="11" height="6" rx="1.5" className={A} />
      <circle cx="2" cy="11" r="1" className="fill-(--art-line) stroke-none" />
    </g>
  );
}

/** ธูปสามดอกปักกระถาง */
function Incense({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-4 0V-14M0 0V-17M4 0V-14" className="stroke-(--art-accent)" strokeWidth="1.5" />
      <path d="M-7 0H7L5 7H-5Z" className={D} />
    </g>
  );
}

/** ต้นไม้ในกระถาง */
function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 0H9L7 13H-7Z" className={D} />
      <path d="M0 0C-12-4-14-16-8-24C0-18 2-8 0 0Z" className={L} />
      <path d="M0 0C12-4 14-16 8-24C0-18-2-8 0 0Z" className={L} />
      <path d="M0 0C-3-9-3-20 0-30C3-20 3-9 0 0Z" className={L} />
    </g>
  );
}

/** ศาลพระภูมิบนเสา: ทรงสูงแคบ หลังคาสองชั้น ประตูโค้งสีชาด มีพวงมาลัยห้อยสองข้างและกระถางธูปที่ฐาน */
function PoleShapes() {
  return (
    <>
      <path d="M26 186H174" className="stroke-(--art-mid)" />
      {/* เสาและฐาน */}
      <rect x="94" y="152" width="12" height="28" className={D} />
      <rect x="76" y="178" width="48" height="8" rx="3" className={B} />
      <path d="M84 178L92 152M116 178L108 152" className="stroke-(--art-mid)" />
      {/* พื้นระเบียง */}
      <rect x="46" y="142" width="108" height="11" rx="3" className={B} />
      <path d="M52 147.500H148" className="stroke-(--art-accent)" strokeWidth="1.5" />
      {/* ตัวศาล */}
      <rect x="62" y="102" width="76" height="40" className={P} />
      <rect x="62" y="102" width="6" height="40" className={D} />
      <rect x="132" y="102" width="6" height="40" className={D} />
      <path d="M85 142V124a15 15 0 0 1 30 0V142Z" className={A} />
      <path d="M92 142V127a8 8 0 0 1 16 0V142Z" className="fill-(--art-paper) stroke-none opacity-90" />
      <rect x="52" y="93" width="96" height="9" rx="2" className={B} />
      {/* หลังคาล่าง */}
      <path
        d="M100 54C97 73 78 85 48 91C39 93 32 90 27 75C31 96 42 100 57 100L143 100C158 100 169 96 173 75C168 90 161 93 152 91C122 85 103 73 100 54Z"
        className={D}
      />
      <path d="M62 93L68 99M82 90L86 97M100 88V96M118 90L114 97M138 93L132 99" className="stroke-(--art-line)" strokeWidth="1.25" opacity="0.55" />
      {/* หลังคาบน */}
      <path
        d="M100 20C98 36 86 48 67 54C58 57 53 54 49 42C52 60 61 66 74 66L126 66C139 66 148 60 151 42C147 54 142 57 133 54C114 48 102 36 100 20Z"
        className={B}
      />
      <path d="M100 6V20" className="stroke-(--art-accent)" strokeWidth="2" />
      <circle cx="100" cy="5" r="3" className={FLAT_A} />
      {/* พวงมาลัย */}
      <Phuang x1={30} y1={80} x2={62} y2={106} sag={8} n={5} />
      <Phuang x1={170} y1={80} x2={138} y2={106} sag={8} n={5} />
      <Incense x={158} y={186} />
      <Plant x={36} y={186} s={0.8} />
    </>
  );
}

function PoleArt({ className }: ArtProps) {
  return (
    <KFrame className={className}>
      <PoleShapes />
    </KFrame>
  );
}

/** ศาลเจ้าที่ (ตายาย): เตี้ย กว้าง หลังคาชั้นเดียวปลายงอน มีรูปตายายในช่อง ช้างปั้นสองข้าง ธูปหน้าศาล */
function ChaoThiShapes() {
  return (
    <>
      <path d="M14 186H186" className="stroke-(--art-mid)" />
      <rect x="44" y="172" width="112" height="14" rx="3" className={D} />
      <rect x="52" y="164" width="96" height="9" rx="3" className={B} />
      <rect x="60" y="116" width="80" height="48" className={P} />
      <rect x="60" y="116" width="80" height="6" className={A} />
      {/* ตา: ศีรษะกลมสีเบจ ยาย: สีชาด */}
      <circle cx="85" cy="138" r="6.500" className={B} />
      <path d="M76 164V154a9 9 0 0 1 18 0V164" className={B} />
      <circle cx="115" cy="138" r="6.500" className={A} />
      <path d="M106 164V154a9 9 0 0 1 18 0V164" className={A} />
      <path d="M100 124V164" className="stroke-(--art-mid)" />
      {/* หลังคา */}
      <path
        d="M100 60C98 85 76 99 42 105C34 107 28 104 22 90C27 111 38 118 56 118L144 118C162 118 173 111 178 90C172 104 166 107 158 105C124 99 102 85 100 60Z"
        className={D}
      />
      <path d="M44 109C70 105 90 95 100 76C110 95 130 105 156 109" className="stroke-(--art-accent)" strokeWidth="1.75" />
      <path d="M100 44V60" className={INK} />
      <circle cx="100" cy="42" r="3" className={P} />
      <Elephant x={12} y={158} s={0.9} />
      <Elephant x={188} y={158} s={0.9} flip />
      <Incense x={100} y={186} />
    </>
  );
}

export function ChaoThiArt({ className }: ArtProps) {
  return (
    <KFrame className={className}>
      <ChaoThiShapes />
    </KFrame>
  );
}

/** ชุดคู่: ศาลพระภูมิเสาสูงซ้าย ศาลเจ้าที่เตี้ยขวา มีรั้วไม้เตี้ยด้านหลัง พวงมาลัยโยงสองหลังคา */
export function PairArt({ className }: ArtProps) {
  return (
    <KFrame className={className}>
      <path d="M8 186H192" className="stroke-(--art-mid)" />
      {/* รั้วหลัง */}
      <path d="M8 146H192M8 160H192" className="stroke-(--art-mid)" />
      {Array.from({ length: 18 }, (_, i) => (
        <path
          key={i}
          d={`M${14 + i * 10.5} 186V140L${17.5 + i * 10.5} 134L${21 + i * 10.5} 140V186`}
          className={cn(INK, "fill-(--art-paper)")}
          opacity="0.9"
        />
      ))}
      <g transform="translate(-22 52) scale(0.72)">
        <PoleShapes />
      </g>
      <g transform="translate(86 78) scale(0.62)">
        <ChaoThiShapes />
      </g>
      <Phuang x1={62} y1={86} x2={132} y2={118} sag={12} n={8} />
    </KFrame>
  );
}

/** ศาลพระพรหม: ฐานเป็นขั้น ตัวศาลสี่เหลี่ยมมีซุ้ม หลังคาซ้อนสามชั้นสีชาด ยอดแหลม มีเสาเทียนสองข้างและพวงมาลัย */
export function PhraPhromArt({ className }: ArtProps) {
  return (
    <KFrame className={className}>
      <path d="M22 186H178" className="stroke-(--art-mid)" />
      <rect x="40" y="172" width="120" height="14" rx="3" className={D} />
      <rect x="50" y="160" width="100" height="12" rx="3" className={B} />
      <rect x="60" y="150" width="80" height="10" rx="3" className={D} />
      <rect x="68" y="104" width="64" height="46" className={P} />
      <path d="M86 150V132a14 14 0 0 1 28 0V150Z" className={A} />
      <path d="M68 104V150M132 104V150" className="stroke-(--art-mid)" />
      <path d="M52 104L66 86H134L148 104Z" className={D} />
      <path d="M70 86L82 70H118L130 86Z" className={A} />
      <path d="M84 70L93 56H107L116 70Z" className={B} />
      <path d="M100 56V26" className={INK} />
      <path d="M93 46H107M96 37H104" className={INK} />
      <circle cx="100" cy="23" r="3.500" className={FLAT_A} />
      {/* เสาเทียน */}
      <rect x="22" y="130" width="10" height="42" rx="2" className={B} />
      <rect x="168" y="130" width="10" height="42" rx="2" className={B} />
      <path d="M27 128C21 121 27 114 27 108C31 115 33 122 27 128Z" className={FLAT_A} />
      <path d="M173 128C167 121 173 114 173 108C177 115 179 122 173 128Z" className={FLAT_A} />
      <Phuang x1={36} y1={100} x2={72} y2={118} sag={8} n={5} />
      <Phuang x1={164} y1={100} x2={128} y2={118} sag={8} n={5} />
    </KFrame>
  );
}

/** ศาลโมเดิร์น: เส้นตรงล้วน หลังคาแบนยื่น ผนังกระจก แผงไม้สีชาดบาง ๆ ตั้งบนแท่นเดียว มีกระถางต้นไม้ */
export function ModernArt({ className }: ArtProps) {
  return (
    <KFrame className={className}>
      <path d="M20 186H180" className="stroke-(--art-mid)" />
      <rect x="62" y="162" width="88" height="24" className={D} />
      <rect x="72" y="150" width="68" height="12" className={B} />
      <rect x="76" y="94" width="60" height="56" className={P} />
      <rect x="84" y="102" width="30" height="48" className={B} />
      <path d="M99 102V150M84 126H114" className="stroke-(--art-mid)" />
      <rect x="120" y="102" width="9" height="48" className={A} />
      <rect x="62" y="78" width="88" height="16" rx="1" className={D} />
      <path d="M56 78H156" className={INK} strokeWidth="2.5" />
      <path d="M106 78V62" className={INK} />
      <circle cx="106" cy="58" r="4" className={A} />
      {/* ลวดลายแถบบนกำแพงเตี้ย */}
      <path d="M62 174H150M62 180H150" className="stroke-(--art-mid)" />
      <Plant x={34} y={186} s={0.95} />
      <Plant x={172} y={186} s={0.7} />
    </KFrame>
  );
}

const KIND_ART: Record<ShrineKind, React.ComponentType<ArtProps>> = {
  PHRA_PHUM: PoleArt,
  CHAO_THI: ChaoThiArt,
  PAIR: PairArt,
  PHRA_PHROM: PhraPhromArt,
  MODERN: ModernArt,
};

/** ภาพศาลตามประเภท (ไม่มีฉากหลัง) */
export function KindArt({ kind, className }: { kind: ShrineKind; className?: string }) {
  const Component = KIND_ART[kind];
  return <Component className={className} />;
}


/* ---------------- ภาพประกอบบริการ ---------------- */

function InstallArt({ className }: ArtProps) {
  return (
    <Frame className={className}>
      <path d="M100 6V50" className={LINE} />
      <circle cx="100" cy="56" r="6" className={PAPER} />
      <path d="M96 61L72 100M104 61L128 100" className={LINE} strokeWidth="2" />
      <g transform="translate(38 70) scale(0.62)" strokeWidth={SW / 0.62}>
        <ShrineShapes />
      </g>
    </Frame>
  );
}

function MoveArt({ className }: ArtProps) {
  return (
    <Frame className={className}>
      <path d="M10 178H190" className={MID} />
      <rect x="22" y="110" width="104" height="54" rx="4" className={SOFT} />
      <path d="M126 124H156L174 144V164H126Z" className={PAPER} />
      <path d="M136 130H152L162 144H136Z" className={SOFT} />
      <circle cx="54" cy="166" r="13" className={PAPER} />
      <circle cx="54" cy="166" r="4" className={LINE} />
      <circle cx="150" cy="166" r="13" className={PAPER} />
      <circle cx="150" cy="166" r="4" className={LINE} />
      <g transform="translate(34 22) scale(0.46)" strokeWidth={SW / 0.46}>
        <ShrineShapes />
      </g>
    </Frame>
  );
}

function RepairArt({ className }: ArtProps) {
  return (
    <Frame className={className}>
      <g transform="translate(-4 40) scale(0.78)" strokeWidth={SW / 0.78}>
        <ShrineShapes />
      </g>
      <g transform="rotate(32 156 70)">
        <rect x="150" y="22" width="12" height="46" rx="6" className={PAPER} />
        <rect x="147" y="68" width="18" height="12" rx="2" className={SOFT} />
        <path d="M147 80H165L161 104Q156 112 151 104Z" className={ACCENT} />
      </g>
      <path d="M118 40L126 48M106 56L114 60M128 26L130 34" className={LINE} strokeWidth="2.5" />
    </Frame>
  );
}

function VowArt({ className }: ArtProps) {
  return (
    <Frame className={className}>
      <ellipse cx="100" cy="172" rx="62" ry="6" className={MID} />
      <path d="M100 66C80 54 52 54 32 62V148C52 140 80 140 100 152Z" className={PAPER} />
      <path d="M100 66C120 54 148 54 168 62V148C148 140 120 140 100 152Z" className={SOFT} />
      <path d="M100 66V152" className={LINE} />
      <path
        d="M46 80C58 76 72 76 86 82M46 96C58 92 72 92 86 98M46 112C58 108 72 108 86 114"
        className={MID}
        strokeWidth="2.5"
      />
      <path d="M114 82C128 76 142 76 154 80M114 98C128 92 142 92 154 96" className={MID} strokeWidth="2.5" />
      <path d="M140 58V104L133 97L126 104V56" className={ACCENT} />
    </Frame>
  );
}

function CeremonyArt({ className }: ArtProps) {
  return (
    <Frame className={className}>
      <path d="M26 182H174" className={MID} />
      <path d="M60 138H140C140 160 124 172 100 172C76 172 60 160 60 138Z" className={SOFT} />
      <ellipse cx="100" cy="138" rx="40" ry="6" className={PAPER} />
      <path d="M88 136V94M100 136V84M112 136V94" className={LINE} />
      <path
        d="M100 76C92 64 108 56 100 42M88 86C82 78 94 72 88 62M112 86C118 78 106 72 112 62"
        className={MID}
        strokeWidth="2.5"
      />
      <rect x="28" y="130" width="14" height="42" rx="2" className={PAPER} />
      <path d="M35 128C30 122 35 116 35 112C38 118 40 124 35 128Z" className={ACCENT} />
      <rect x="158" y="130" width="14" height="42" rx="2" className={PAPER} />
      <path d="M165 128C160 122 165 116 165 112C168 118 170 124 165 128Z" className={ACCENT} />
    </Frame>
  );
}

function OfferingArt({ className }: ArtProps) {
  const dots = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    return { x: 46 + t * 108, y: 62 + Math.sin(t * Math.PI) * 26 };
  });
  return (
    <Frame className={className}>
      <path d="M32 188H168" className={MID} />
      <path d="M44 146H156L146 172H54Z" className={SOFT} />
      <rect x="84" y="172" width="32" height="14" rx="2" className={PAPER} />
      <circle cx="78" cy="130" r="17" className={PAPER} />
      <circle cx="122" cy="132" r="15" className={SOFT} />
      <circle cx="100" cy="116" r="16" className={ACCENT} />
      <path d="M100 100C102 94 108 92 112 94" className={LINE} />
      <path d="M46 62Q100 92 154 62" className={MID} strokeWidth="2" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="5.5" className={i === 3 ? ACCENT : SOFT} />
      ))}
    </Frame>
  );
}

const SERVICE_ART = {
  install: InstallArt,
  move: MoveArt,
  repair: RepairArt,
  vow: VowArt,
  ceremony: CeremonyArt,
  offering: OfferingArt,
} as const;
export type ServiceArtName = keyof typeof SERVICE_ART;

/** ภาพประกอบบริการ: ติดตั้ง ถอนย้าย ซ่อม สมุดบน พิธี ของไหว้ */
export function ServiceArt({ name, className }: { name: ServiceArtName; className?: string }) {
  const Component = SERVICE_ART[name];
  return <Component className={className} />;
}


/* ---------------- ฉากสำหรับการ์ดและรูปหลัก ---------------- */

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** โทนฟ้า/พื้นหลังสามแบบ (ล้วนมาจาก token ที่มีอยู่) */
const TONES = [
  "bg-muted",
  "bg-[color-mix(in_oklch,var(--gold-soft)_65%,var(--card))]",
  "bg-[color-mix(in_oklch,var(--art-mid)_55%,var(--card))]",
] as const;

const SCENE_COUNT = 6;
const SCENE_STROKE = "stroke-(--art-line)";

/** แถบพื้นดินด้านล่างของฉาก (y 120-150) */
function GroundBand({ fill = "fill-(--art-ground)" }: { fill?: string }) {
  return (
    <>
      <rect x="-10" y="120" width="220" height="40" className={cn(fill, "stroke-none")} />
      <path d="M-10 120H210" className="stroke-(--art-mid)" strokeWidth="1.25" />
    </>
  );
}

/** ฉากหลังหกแบบที่ต่างกันจริง: กำแพง สวน รั้ว ซุ้ม ลานบ้าน เนินเขายามเช้า (viewBox 200x150) */
function Backdrop({ variant }: { variant: number }) {
  switch (variant) {
    case 0:
      // กำแพงปูนและดวงอาทิตย์ยามเย็น
      return (
        <g>
          <circle cx="146" cy="52" r="26" className="fill-(--art-accent) stroke-none" opacity="0.9" />
          <rect x="-10" y="84" width="220" height="40" className={cn(FLAT_D)} />
          <path d="M-10 84H210" className={SCENE_STROKE} strokeWidth="1.5" />
          <path d="M-10 90H210" className="stroke-(--art-mid)" strokeWidth="1" />
          {Array.from({ length: 11 }, (_, i) => (
            <path key={i} d={`M${i * 22 - 4} 90V124`} className="stroke-(--art-mid)" strokeWidth="1" />
          ))}
          <GroundBand />
        </g>
      );
    case 1:
      // สวนมีพุ่มไม้และพระจันทร์
      return (
        <g>
          <circle cx="156" cy="36" r="17" className="fill-(--art-paper) stroke-none" />
          <ellipse cx="28" cy="106" rx="34" ry="20" className={FLAT_L} />
          <ellipse cx="60" cy="116" rx="26" ry="14" className={FLAT_L} opacity="0.8" />
          <ellipse cx="176" cy="104" rx="36" ry="22" className={FLAT_L} />
          <ellipse cx="142" cy="116" rx="22" ry="12" className={FLAT_L} opacity="0.8" />
          <path d="M14 98C20 90 26 88 34 90M164 94C170 86 180 86 188 90" className={SCENE_STROKE} strokeWidth="1" opacity="0.5" />
          <GroundBand fill="fill-(--art-leaf)" />
        </g>
      );
    case 2:
      // รั้วไม้และดวงอาทิตย์ต่ำ
      return (
        <g>
          <circle cx="40" cy="48" r="16" className="fill-(--art-accent) stroke-none" opacity="0.9" />
          <path d="M-10 92H210M-10 112H210" className={SCENE_STROKE} strokeWidth="1.5" />
          {Array.from({ length: 14 }, (_, i) => (
            <path
              key={i}
              d={`M${i * 16 - 6} 124V82L${i * 16 + 2} 74L${i * 16 + 10} 82V124Z`}
              className={cn(SCENE_STROKE, "fill-(--art-paper)")}
              strokeWidth="1.25"
            />
          ))}
          <GroundBand />
        </g>
      );
    case 3:
      // ซุ้มโค้งพร้อมพวงมาลัย (ซ้ำรูปทรงซุ้มประตูศาล)
      return (
        <g>
          <path d="M40 130V70a60 60 0 0 1 120 0V130Z" className="fill-(--art-paper) stroke-none" />
          <path d="M52 130V72a48 48 0 0 1 96 0V130Z" className={cn("fill-(--art-soft)", SCENE_STROKE)} strokeWidth="1.25" />
          <path d="M18 18Q100 70 182 18" className="stroke-(--art-mid)" strokeWidth="1.25" />
          {Array.from({ length: 9 }, (_, i) => {
            const t = (i + 0.5) / 9;
            const u = 1 - t;
            const x = u * u * 18 + 2 * u * t * 100 + t * t * 182;
            const y = u * u * 18 + 2 * u * t * 70 + t * t * 18;
            return <circle key={i} cx={x} cy={y} r="3.2" className={i % 2 === 0 ? FLAT_A : FLAT_P} />;
          })}
          <GroundBand />
          <path d="M-10 134H210M30 120L14 150M70 120L58 150M110 120V150M150 120L162 150M190 120L206 150" className="stroke-(--art-mid)" strokeWidth="1" />
        </g>
      );
    case 4:
      // ลานบ้าน: กระถางต้นไม้สองข้างและก้อนเมฆ
      return (
        <g>
          <path d="M20 40C20 30 36 30 38 36C42 28 58 30 56 40Z" className={FLAT_P} />
          <path d="M138 26C138 16 154 16 156 22C160 14 176 16 174 26Z" className={FLAT_P} />
          <rect x="-10" y="84" width="220" height="6" className="fill-(--art-mid) stroke-none" />
          <rect x="-10" y="90" width="220" height="30" className={FLAT_D} opacity="0.55" />
          <GroundBand />
          <path d="M-10 134H210M50 120L30 150M100 120V150M150 120L170 150" className="stroke-(--art-mid)" strokeWidth="1" />
          <g transform="translate(24 120)">
            <Plant x={0} y={0} s={1.15} />
          </g>
          <g transform="translate(176 120)">
            <Plant x={0} y={0} s={1.15} />
          </g>
        </g>
      );
    default:
      // เนินเขายามเช้า มีพระอาทิตย์ครึ่งดวง
      return (
        <g>
          <circle cx="100" cy="92" r="30" className="fill-(--art-accent) stroke-none" opacity="0.85" />
          <path d="M-10 100C20 70 60 84 90 100C120 80 160 70 210 98V130H-10Z" className={FLAT_L} opacity="0.7" />
          <path d="M-10 116C30 96 70 108 110 116C140 104 170 100 210 112V130H-10Z" className={FLAT_D} />
          <path d="M138 62l5-3 5 3M154 52l4-2.500 4 2.500" className={SCENE_STROKE} strokeWidth="1.25" />
          <GroundBand />
        </g>
      );
  }
}

/**
 * ฉากศาล: ภาพศาลตามประเภท วางบนฉากหลังหกแบบที่ต่างกันจริง (กำแพง สวน รั้ว ซุ้ม ลานบ้าน เนินเขา)
 * โทนฟ้า ทิศของศาล ขนาด และฉาก เลือกจาก seed (รหัสสินค้า) แบบคงที่ ใช้เป็นรูปแทนเมื่อสินค้ายังไม่มีรูปถ่าย
 * ขยายเต็มกรอบของพ่อแม่ (กรอบต้องกำหนดขนาดเอง) ฉากหลังยึดขอบล่างไว้ พื้นดินจึงอยู่ที่เท้าศาลเสมอทุกสัดส่วนภาพ
 */
export function ShrineScene({
  kind,
  seed = "",
  className,
}: {
  kind: ShrineKind;
  seed?: string;
  className?: string;
}) {
  const h = hash(`${seed}:${kind}`);
  const tone = TONES[h % TONES.length];
  const scene = (h >>> 3) % SCENE_COUNT;
  const flip = ((h >>> 7) & 1) === 1;
  const heightPct = [92, 86, 89][(h >>> 9) % 3];
  return (
    <div className={cn("relative size-full overflow-hidden", tone, className)}>
      <svg
        viewBox="0 0 200 150"
        className="absolute inset-0 size-full [&_*]:[vector-effect:non-scaling-stroke]"
        aria-hidden="true"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <Backdrop variant={scene} />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-[3%]">
        <div className="aspect-square" style={{ height: `${heightPct}%` }}>
          <KindArt kind={kind} className={cn("size-full", flip && "-scale-x-100")} />
        </div>
      </div>
    </div>
  );
}
