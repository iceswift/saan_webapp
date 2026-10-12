"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount } from "@/server/actions/settings";

/** ลบบัญชีต้องพิมพ์เบอร์โทรยืนยันก่อน เมื่อสำเร็จจะพากลับหน้าแรก */
export function DeleteAccountForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (phone.trim() === "") {
      setError("กรุณาพิมพ์เบอร์โทรของคุณ");
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    startTransition(async () => {
      const res = await deleteAccount({ confirmPhone: phone });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.replace("/");
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="destructive" size="xl" className="w-full lg:w-auto" onClick={() => setOpen(true)}>
        ลบบัญชี
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        remove();
      }}
    >
      <Label htmlFor="confirm-phone" className="mb-2 text-base">
        พิมพ์เบอร์โทรของคุณเพื่อยืนยัน
      </Label>
      <Input
        id="confirm-phone"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        placeholder="เช่น 081-234-5678"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          setError(undefined);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby="confirm-phone-hint"
      />
      <FieldHint id="confirm-phone-hint" error={error} />
      <div className="mt-4 flex flex-col gap-2">
        <Button type="submit" variant="destructive" size="xl" className="w-full" loading={pending}>
          ลบบัญชีถาวร
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xl"
          className="w-full"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}
