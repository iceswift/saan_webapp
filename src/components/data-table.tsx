import Link from "next/link";
import { cn } from "@/lib/utils";

export type DataColumn<T> = {
  key: string;
  header: string;
  /** เนื้อหาของเซลล์ */
  cell: (row: T) => React.ReactNode;
  /** "right" สำหรับราคาและตัวเลข */
  align?: "left" | "right";
  /** ปรับความกว้างหรือการตัดข้อความ เช่น "w-32" */
  className?: string;
};

/**
 * ตารางสำหรับข้อมูลหนาแน่นบนเดสก์ท็อป (รายการงาน ตารางผู้ดูแล) ซ่อนบนมือถือโดยอัตโนมัติ (hidden lg:block)
 * ต้องวางคู่กับรายการแบบการ์ดสำหรับมือถือเสมอ:
 *   <div className="lg:hidden">…การ์ด…</div>
 *   <DataTable columns={…} rows={…} rowKey={…} rowHref={…} caption="รายการงาน" />
 *
 * - rowHref: ทั้งแถวกดไปหน้ารายละเอียดได้ (ลิงก์อยู่ในเซลล์แรก ขยายคลุมทั้งแถว)
 * - caption: ชื่อตารางสำหรับโปรแกรมอ่านหน้าจอ (ไม่แสดงบนหน้าจอ)
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  caption,
  className,
  from = "lg",
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  caption: string;
  className?: string;
  /** ความกว้างจอที่เริ่มแสดงตาราง (ใช้ "xl" เมื่อตารางอยู่ในคอลัมน์ที่แคบ คู่กับการ์ด xl:hidden) */
  from?: "lg" | "xl";
}) {
  return (
    <div className={cn("surface hidden overflow-hidden", from === "xl" ? "xl:block" : "lg:block", className)}>
      <table className="w-full border-collapse text-left text-base">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border bg-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "px-4 py-3 text-sm font-medium whitespace-nowrap text-muted-foreground",
                  col.align === "right" && "text-right",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={cn(
                "relative border-b border-border last:border-b-0",
                rowHref && "transition-colors hover:bg-muted/60 focus-within:bg-muted/60",
              )}
            >
              {columns.map((col, ci) => {
                const content = col.cell(row);
                return (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3.5 align-middle",
                      col.align === "right" && "numeric text-right",
                      col.className,
                    )}
                  >
                    {rowHref && ci === 0 ? (
                      <Link
                        href={rowHref(row)}
                        className="font-medium outline-none after:absolute after:inset-0 focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring"
                      >
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
