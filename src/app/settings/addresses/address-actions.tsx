"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InlineConfirm } from "@/app/request/inline-confirm";
import type { AddressDTO } from "@/lib/types";
import { deleteAddress } from "@/server/actions/settings";

/** ลบที่อยู่ด้วยการยืนยันสองขั้น แล้วกลับไปรายการที่อยู่ */
export function DeleteAddressButton({ address }: { address: AddressDTO }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const res = await deleteAddress({ addressId: address.id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("ลบที่อยู่แล้ว");
      router.push("/settings/addresses");
    });
  }

  return (
    <InlineConfirm
      triggerLabel="ลบที่อยู่นี้"
      question={`ลบ "${address.label}" ใช่ไหม`}
      confirmLabel="ลบที่อยู่"
      pending={pending}
      onConfirm={remove}
    />
  );
}
