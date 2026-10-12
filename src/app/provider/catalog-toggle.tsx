"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { PackageDTO, ProductDTO } from "@/lib/types";
import { savePackage, saveProduct } from "@/server/actions/provider";
import { StatusSwitch } from "./status-switch";

type Target =
  | { kind: "product"; product: ProductDTO }
  | { kind: "package"; pkg: PackageDTO };

/** สวิตช์เปิด/ปิดขายในรายการสินค้า บันทึกทันทีด้วย action เดิม (ส่งข้อมูลเดิมครบ เปลี่ยนเฉพาะสถานะ) */
export function CatalogToggle(props: Target) {
  const initial = props.kind === "product" ? props.product.active : props.pkg.active;
  const name = props.kind === "product" ? props.product.name : props.pkg.name;
  const [active, setActive] = useState(initial);
  const [pending, startTransition] = useTransition();

  function change(next: boolean) {
    setActive(next);
    startTransition(async () => {
      const res =
        props.kind === "product"
          ? await saveProduct({
              id: props.product.id,
              name: props.product.name,
              description: props.product.description,
              kind: props.product.kind,
              price: props.product.price,
              imageUrl: props.product.imageUrl,
              active: next,
            })
          : await savePackage({
              id: props.pkg.id,
              type: props.pkg.type,
              name: props.pkg.name,
              description: props.pkg.description,
              price: props.pkg.price,
              active: next,
            });
      if (!res.ok) {
        setActive(!next);
        toast.error(res.error);
        return;
      }
      toast.success(next ? "เปิดขายแล้ว" : "ปิดขายแล้ว");
    });
  }

  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">{active ? "เปิดขาย" : "ปิดขาย"}</span>
      <StatusSwitch
        checked={active}
        onChange={change}
        disabled={pending}
        label={`เปิดขาย ${name}`}
      />
    </span>
  );
}
