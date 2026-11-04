"use client";

import { parseWholeBaht } from "@/lib/baht-input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FieldHint } from "@/components/field-hint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BudgetForm({ query, current, id }: { query: string; current?: number; id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  return <form noValidate onSubmit={event => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("budget") as HTMLInputElement;
    const value = input.value.trim();
    const amount = parseWholeBaht(value, Number.MAX_SAFE_INTEGER);
    if (value && (amount === null || amount <= 0)) {
      setError("กรอกงบเป็นจำนวนเต็มมากกว่า 0 บาท หรือเว้นว่างเพื่อดูทุกราคา");
      input.focus();
      return;
    }
    setError(undefined);
    const params = new URLSearchParams(query);
    if (value) params.set("max", String(amount)); else params.delete("max");
    router.push(params.size ? `/browse?${params}` : "/browse", { scroll: false });
  }} className="mt-3">
    <label htmlFor={id} className="mb-2 block text-sm text-muted-foreground">กำหนดงบสูงสุดเอง (บาท)</label>
    <div className="flex gap-2">
      <Input key={current ?? "all"} id={id} name="budget" inputMode="numeric" defaultValue={current ?? ""}
        placeholder="เช่น 15000" aria-invalid={Boolean(error)} aria-describedby={`${id}-hint`}
        onChange={() => setError(undefined)} className="px-3" />
      <Button type="submit" variant="outline" size="xl">ใช้</Button>
    </div>
    <FieldHint id={`${id}-hint`} error={error} />
  </form>;
}
