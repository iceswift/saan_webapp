"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ListGroup, ListRow } from "@/components/list-group";
import { Rise } from "@/components/rise";
import { Monogram } from "@/components/visuals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/format";
import { updateProfile } from "@/server/actions/auth";
import { AccountNav } from "../account-nav";

const FORM_ID = "profile-form";

export function ProfileForm({ currentName, phone }: { currentName: string; phone: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | undefined>();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรุณากรอกชื่อ");
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    if (name.trim() === currentName.trim()) {
      toast.info("ยังไม่มีการเปลี่ยนแปลง");
      return;
    }
    startTransition(async () => {
      const res = await updateProfile({ name });
      if (res.ok) toast.success("บันทึกแล้ว");
      else toast.error(res.error);
    });
  }

  return (
    <AppShell
      side={<AccountNav />}
      footer={
        <Button type="submit" form={FORM_ID} size="xl" className="w-full" loading={pending}>
          บันทึก
        </Button>
      }
    >
      <PageHeader title="โปรไฟล์" backHref="/settings" />

      <Rise>
        <div className="flex justify-center py-2 lg:justify-start">
          <Monogram name={name || currentName} size="lg" />
        </div>
      </Rise>

      <form id={FORM_ID} ref={formRef} onSubmit={submit} noValidate className="mt-6 max-w-xl">
        <Label htmlFor="name" className="mb-2 text-base">
          ชื่อที่ให้ร้านเรียก
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          maxLength={80}
          autoComplete="name"
          aria-invalid={Boolean(error)}
          aria-describedby="name-hint"
        />
        <FieldHint id="name-hint" error={error} />
      </form>

      <div className="mt-8 max-w-xl">
        <ListGroup label="เบอร์โทรศัพท์">
          <ListRow title="เบอร์โทรศัพท์" trailing={<span className="numeric text-base">{formatPhone(phone)}</span>} />
        </ListGroup>
        <p className="mt-3 px-1 text-sm text-muted-foreground">
          ใช้เข้าสู่ระบบ หากต้องการเปลี่ยนกรุณาติดต่อทีมงาน
        </p>
      </div>
    </AppShell>
  );
}
