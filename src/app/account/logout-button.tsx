"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/server/actions/auth";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await logout();
      router.replace("/");
    });
  }

  return (
    <Button type="button" size="xl" variant="outline" className="w-full" loading={pending} onClick={signOut}>
      ออกจากระบบ
    </Button>
  );
}
