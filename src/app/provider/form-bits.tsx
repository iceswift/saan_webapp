import { parseWholeBaht } from "@/lib/baht-input";
import { FieldHint } from "@/components/field-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEPOSIT_RATE } from "@/lib/constants";
import { formatBaht } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * กลุ่มช่องกรอกที่เกี่ยวข้องกัน (v6): ไม่มีกล่อง ช่องวางบนหน้าตรง ๆ คั่นกลุ่มด้วยเส้นบางและหัวข้อสั้น
 * (กลุ่มแรกไม่มีเส้นนำ)
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-5 border-t border-border pt-6 first:border-t-0 first:pt-0",
        className,
      )}
    >
      <div>
        <h2 className="text-base font-medium">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * ป้ายชื่อ ช่องกรอก และข้อความใต้ช่อง (v6)
 * ช่องกรอกที่อยู่ข้างในควรใส่ aria-invalid={Boolean(error)} และ aria-describedby={`${id}-hint`} เอง
 * error = ข้อความผิดพลาดหลังกดปุ่ม (สีแดงใต้ช่อง) | hint = คำอธิบายปกติ
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <Label htmlFor={id} className="mb-2 text-base font-medium">
        {label}
      </Label>
      {children}
      <FieldHint id={`${id}-hint`} error={error}>
        {hint}
      </FieldHint>
    </div>
  );
}

/** ช่องกรอกราคา มีเครื่องหมายบาทนำหน้า และบอกยอดมัดจำที่ลูกค้าจะจ่าย */
export function PriceField({
  id,
  label = "ราคา (บาท)",
  value,
  onChange,
  placeholder,
  error,
  showDeposit = true,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  showDeposit?: boolean;
}) {
  const amount = parseWholeBaht(value);
  const valid = amount !== null && amount >= 1;
  return (
    <Field
      id={id}
      label={label}
      error={error}
      hint={
        showDeposit && valid
          ? `ลูกค้าจะจ่ายมัดจำ ${formatBaht(Math.round(amount * DEPOSIT_RATE))} (${Math.round(DEPOSIT_RATE * 100)}%) และจ่ายส่วนที่เหลือเมื่อตรวจรับงาน`
          : undefined
      }
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-display text-lg font-normal text-muted-foreground"
        >
          ฿
        </span>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          maxLength={20}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-hint`}
          className="numeric pl-10"
        />
      </div>
    </Field>
  );
}

/** ตรวจราคาเป็นจำนวนเต็มมากกว่า 0 ใช้ตอนกดบันทึก */
export function priceError(value: string): string | undefined {
  const n = parseWholeBaht(value);
  if (n === null || n < 1) return "กรอกราคาเต็มบาทตั้งแต่ 1 ถึง 10,000,000 เช่น 1,500";
  return undefined;
}
