"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InlineConfirm } from "@/app/request/inline-confirm";
import { logoutEverywhere } from "@/server/actions/settings";

export function LogoutEverywhere() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOutAll() {
    startTransition(async () => {
      const res = await logoutEverywhere();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.replace("/");
    });
  }

  return (
    <InlineConfirm
      triggerLabel="ออกจากระบบทุกอุปกรณ์"
      question="ทุกอุปกรณ์รวมถึงเครื่องนี้จะต้องเข้าสู่ระบบใหม่"
      confirmLabel="ออกจากระบบทุกอุปกรณ์"
      confirmVariant="default"
      pending={pending}
      onConfirm={signOutAll}
    />
  );
}
