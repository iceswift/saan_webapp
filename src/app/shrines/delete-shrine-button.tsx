"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { InlineConfirm } from "@/app/request/inline-confirm";
import { deleteShrine } from "@/server/actions/customer";

/** ลบศาลแล้วกลับไปหน้ารายการศาล ใช้ในหน้ารายละเอียดศาล */
export function DeleteShrineButton({ shrineId, name }: { shrineId: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const res = await deleteShrine({ shrineId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("ลบศาลแล้ว");
      router.push("/shrines");
    });
  }

  return (
    <InlineConfirm
      triggerLabel={
        <>
          <Trash2 className="size-5" />
          ลบศาลนี้
        </>
      }
      question={`ลบ ${name} ออกจากรายการใช่ไหม`}
      confirmLabel="ลบศาล"
      pending={pending}
      onConfirm={remove}
    />
  );
}
