import { cn } from "@/lib/utils";

/*
 * ภาพประกอบของ Saan: เส้นบางแบน ๆ พื้นเบจ และสีชาดจุดเดียวต่อภาพ
 * ใช้สีจาก token --art-* ใน globals.css ทุกภาพจึงเปลี่ยนตามธีมสว่าง/มืดเอง ห้ามใส่ค่าสี hex
 * ออกแบบให้คมที่ขนาด 96-200px (viewBox 200x200)
 */

type ArtProps = { className?: string };

const LINE = "stroke-(--art-line)";
const SW = 3;

/** ส่วนประกอบของศาลพระภูมิ (ไม่มีกรอบ svg) ใช้ซ้ำในภาพชุดคู่และภาพบริการ ต้องวางใน <svg> ที่ตั้ง stroke ไว้แล้ว */
export function ShrineShapes() {
  return (
    <>
      <path d="M44 190H156" className="stroke-(--art-mid)" />

      {/* เสาและฐาน */}
      <rect x="95" y="162" width="10" height="16" className={cn(LINE, "fill-(--art-paper)")} />
      <rect x="74" y="178" width="52" height="8" rx="4" className={cn(LINE, "fill-(--art-soft)")} />

      {/* พื้นระเบียง */}
      <rect x="48" y="152" width="104" height="10" rx="3" className={cn(LINE, "fill-(--art-soft)")} />

      {/* ตัวศาล */}
      <rect x="64" y="112" width="72" height="40" className={cn(LINE, "fill-(--art-paper)")} />
      <path d="M86 152V134a14 14 0 0 1 28 0V152Z" className="fill-(--art-accent) stroke-(--art-accent)" />
      {/* ชายคา */}
      <rect x="54" y="104" width="92" height="8" rx="2" className={cn(LINE, "fill-(--art-soft)")} />

      {/* หลังคาชั้นล่าง */}
      <path
        d="M100 62C97 80 78 92 50 97C42 99 35 96 30 82C34 101 44 105 58 105L142 105C156 105 166 101 170 82C165 96 158 99 150 97C122 92 103 80 100 62Z"
        className={cn(LINE, "fill-(--art-soft)")}
      />
      {/* หลังคาชั้นบน */}
      <path
        d="M100 26C98 41 86 53 68 59C60 62 55 59 51 48C54 65 62 71 74 71L126 71C138 71 146 65 149 48C145 59 140 62 132 59C114 53 102 41 100 26Z"
        className={cn(LINE, "fill-(--art-paper)")}
      />

      {/* ยอด */}
      <path d="M100 10V26" className="stroke-(--art-accent)" />
      <circle cx="100" cy="9" r="2.5" className="fill-(--art-accent) stroke-(--art-accent)" />
    </>
  );
}

/** ศาลพระภูมิ: หลังคาสองชั้นปลายงอน ตัวศาลเปิดโล่ง ยืนบนเสากลม ประตูสีชาด */
export function ShrineArt({ className }: ArtProps) {
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
      <ShrineShapes />
    </svg>
  );
}

/** พวงมาลัย: วงดอกไม้เรียงเป็นโค้งห้อยพู่ สีชาดที่ดอกกลางและพู่ */
const GARLAND_POINTS: [number, number][] = [
  [42, 60],
  [44, 75],
  [49.8, 89],
  [59, 101],
  [71, 110.2],
  [85, 116],
  [100, 118],
  [115, 116],
  [129, 110.2],
  [141, 101],
  [150.2, 89],
  [156, 75],
  [158, 60],
];

export function GarlandArt({ className }: ArtProps) {
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
      <path d="M52 190H148" className="stroke-(--art-mid)" />
      <path d="M42 60Q70 40 100 30Q130 40 158 60" className={LINE} />
      <circle cx="100" cy="30" r="5" className={cn(LINE, "fill-(--art-paper)")} />

      {GARLAND_POINTS.map(([x, y], i) => (
        <circle
          key={x}
          cx={x}
          cy={y}
          r="8"
          className={
            i === 6 ? "fill-(--art-accent) stroke-(--art-accent)" : cn(LINE, "fill-(--art-soft)")
          }
        />
      ))}

      <path d="M100 128V146" className={LINE} />
      <path d="M100 146L90 180H110Z" className="fill-(--art-paper) stroke-(--art-accent)" />
      <path d="M95 164H105" className="stroke-(--art-accent)" />
    </svg>
  );
}

/** ดอกบัว: ใช้กับหน้าที่สงบ เช่น ข้อผิดพลาด */
export function LotusArt({ className }: ArtProps) {
  const petal = "M100 60C121 90 121 122 100 144C79 122 79 90 100 60Z";
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
      <path d="M40 160C70 172 130 172 160 160" className="stroke-(--art-mid)" />
      <g className={cn(LINE, "fill-(--art-soft)")}>
        <path d={petal} transform="rotate(-62 100 148)" />
        <path d={petal} transform="rotate(62 100 148)" />
        <path d={petal} transform="rotate(-32 100 148)" />
        <path d={petal} transform="rotate(32 100 148)" />
      </g>
      <path d={petal} className={cn(LINE, "fill-(--art-paper)")} />
      <circle cx="100" cy="118" r="5" className="fill-(--art-accent) stroke-(--art-accent)" />
    </svg>
  );
}

/** ระฆัง: ใช้กับการแจ้งเตือนที่ยังไม่มี */
export function BellArt({ className }: ArtProps) {
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
      <path d="M56 188H144" className="stroke-(--art-mid)" />
      <path d="M100 22V42" className={LINE} />
      <circle cx="100" cy="20" r="5" className="fill-(--art-accent) stroke-(--art-accent)" />
      <path
        d="M100 42C76 42 66 62 66 92C66 120 58 130 50 142H150C142 130 134 120 134 92C134 62 124 42 100 42Z"
        className={cn(LINE, "fill-(--art-soft)")}
      />
      <rect x="46" y="142" width="108" height="12" rx="6" className={cn(LINE, "fill-(--art-paper)")} />
      <circle cx="100" cy="170" r="9" className={cn(LINE, "fill-(--art-paper)")} />
      <path d="M84 62C76 70 74 84 74 98" className="stroke-(--art-mid)" />
    </svg>
  );
}

/** แว่นขยายส่องศาล: ใช้กับผลค้นหาที่ไม่พบ */
export function SearchArt({ className }: ArtProps) {
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
      <path d="M120 122L156 158" className="stroke-(--art-accent)" strokeWidth="9" />
      <circle cx="92" cy="92" r="48" className={cn(LINE, "fill-(--art-paper)")} />
      <path
        d="M92 60C91 68 85 74 77 77C73 79 70 77 68 72C70 81 74 84 80 84H104C110 84 114 81 116 72C114 77 111 79 107 77C99 74 93 68 92 60Z"
        className={cn(LINE, "fill-(--art-soft)")}
      />
      <rect x="74" y="86" width="36" height="22" className={cn(LINE, "fill-(--art-paper)")} />
      <path d="M85 108V100a7 7 0 0 1 14 0V108Z" className="fill-(--art-line) stroke-none" />
    </svg>
  );
}

export const ART = {
  shrine: ShrineArt,
  garland: GarlandArt,
  lotus: LotusArt,
  bell: BellArt,
  search: SearchArt,
} as const;
export type ArtName = keyof typeof ART;

/** เลือกภาพประกอบตามชื่อ ใช้กับ EmptyState และหน้าที่รับชื่อภาพมาเป็นค่า */
export function Art({ name, className }: { name: ArtName; className?: string }) {
  const Component = ART[name];
  return <Component className={cn(className)} />;
}
