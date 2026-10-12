import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AppShell, PageHeader, SectionTitle } from "@/components/app-shell";
import { Rise } from "@/components/rise";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/server/auth";
import { TEXT_SIZE_COOKIE } from "@/lib/prefs";
import { AccountNav } from "../account-nav";
import { TextSizeOptions } from "./text-size-options";

export const metadata: Metadata = { title: "การแสดงผล" };

export default async function DisplayPage() {
  await requireUser("/settings/display");
  const large = (await cookies()).get(TEXT_SIZE_COOKIE)?.value === "large";

  return (
    <AppShell side={<AccountNav />}>
      <PageHeader title="การแสดงผล" backHref="/settings" />

      <Rise>
        <SectionTitle className="mt-0">ธีมสี</SectionTitle>
        <ThemeToggle />
      </Rise>

      <Rise i={1}>
        <SectionTitle>ขนาดตัวอักษร</SectionTitle>
        <TextSizeOptions initialLarge={large} />
      </Rise>
    </AppShell>
  );
}
