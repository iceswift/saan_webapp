import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { countUnreadNotifications, getMyProvider } from "@/server/queries";
import { Wordmark } from "./brand";
import { LinkButton } from "./link-button";
import { BellLink } from "./notification-bell";
import { HeaderAccountLink, HeaderNav, HeaderPill, HeaderSearch } from "./site-header-parts";
import { ThemeToggle } from "./theme-toggle";

/** ส่วนขวาของส่วนหัว ที่ต้องอ่านผู้ใช้และฐานข้อมูล (สตรีมแยก ไม่ขวางส่วนอื่นของหน้า) */
async function HeaderActions() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <LinkButton href="/login" variant="outline" size="lg" className="h-10 px-5 text-base">
        เข้าสู่ระบบ
      </LinkButton>
    );
  }
  const [unread, provider] = await Promise.all([
    countUnreadNotifications(user.id),
    getMyProvider(user.id),
  ]);
  return (
    <>
      {provider ? (
        <HeaderPill
          href="/provider"
          label="ร้านของฉัน"
          icon="store"
          bases={["/provider"]}
          backLabel="กลับไปหน้าลูกค้า"
        />
      ) : null}
      {user.role === "ADMIN" ? (
        <HeaderPill
          href="/admin"
          label="ผู้ดูแลระบบ"
          icon="shield"
          bases={["/admin"]}
          backLabel="กลับไปหน้าลูกค้า"
        />
      ) : null}
      <BellLink unread={unread} className="size-10 shrink-0" />
      {/* มีทั้งปุ่มร้านและปุ่มผู้ดูแล: ที่ไม่พอสำหรับชื่อ จึงเหลือแค่อักษรย่อ */}
      <HeaderAccountLink name={user.name} showName={!(provider && user.role === "ADMIN")} />
    </>
  );
}

/**
 * ส่วนหัวเว็บบนเดสก์ท็อป (lg ขึ้นไป) วางใน root layout ครั้งเดียว ไม่ต้องใส่ในหน้า
 * แบรนด์ | เมนูหลัก | ช่องค้นหา | สลับธีม | ร้านของฉัน/ผู้ดูแล | กระดิ่ง | บัญชี (หรือ เข้าสู่ระบบ)
 * ติดขอบบนขณะเลื่อน สูง 4.5rem (ตรงกับตัวแปร --site-header-h ที่แผง sticky ใช้เว้นระยะ)
 * มือถือซ่อนทั้งแถบ ใช้ BottomNav แทน
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 hidden h-18 border-b border-border bg-background lg:block">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-10 xl:gap-4">
        <Link
          href="/"
          aria-label="Saan หน้าแรก"
          className="mr-3 flex shrink-0 items-center"
        >
          <Wordmark size="md" className="max-xl:[.text-large_&]:[&>span:last-child]:hidden" />
        </Link>
        <HeaderNav />
        {/* ช่องค้นหาเป็นส่วนเดียวที่ยืดหดได้ เพื่อให้แถบไม่ล้นเมื่อมีปุ่มร้านหรือผู้ดูแลเพิ่มเข้ามา */}
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end">
          <Suspense fallback={<div className="w-44 min-w-28 shrink xl:w-72" aria-hidden="true" />}>
            <HeaderSearch className="w-44 min-w-28 shrink xl:w-72 max-xl:[.text-large_&]:hidden" />
          </Suspense>
          {/* ตัวอักษรใหญ่บนจอ 1024-1279: ช่องค้นหาไม่พอที่ จึงเหลือปุ่มไอคอนไปหน้าเลือกดูศาล */}
          <Link
            href="/browse"
            aria-label="ค้นหาศาล"
            className="hidden size-10 items-center justify-center rounded-full border border-foreground/20 transition-colors hover:bg-muted max-xl:[.text-large_&]:flex"
          >
            <Search className="size-5" aria-hidden="true" />
          </Link>
        </div>
        <ThemeToggle variant="button" />
        <Suspense fallback={<div className="h-10 w-28" aria-hidden="true" />}>
          <HeaderActions />
        </Suspense>
      </div>
    </header>
  );
}
