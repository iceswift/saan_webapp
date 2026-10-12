import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth";
import { countUnreadNotifications, getMyProvider } from "@/server/queries";
import { ArchMark } from "./brand";
import { HeaderIsland, NavProgress } from "./header-island";
import { HeaderSearch } from "./header-search";
import { LinkButton } from "./link-button";
import { BellLink } from "./notification-bell";
import { HeaderAccountMenu, HeaderNav, HeaderPill } from "./site-header-parts";
import { ThemeToggle } from "./theme-toggle";

/** ส่วนขวาของส่วนหัว ที่ต้องอ่านผู้ใช้และฐานข้อมูล (สตรีมแยก ไม่ขวางส่วนอื่นของหน้า) */
async function HeaderActions() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <LinkButton href="/login" variant="default" size="lg" className="h-10 px-5 text-base">
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
      <BellLink
        unread={unread}
        className="size-10 shrink-0 border-transparent bg-transparent hover:bg-muted"
      />
      {/* มีปุ่มร้านหรือปุ่มผู้ดูแล: ที่ไม่พอสำหรับชื่อ จึงเหลือแค่อักษรย่อ (ชื่ออยู่ในเมนูบัญชี) */}
      <HeaderAccountMenu
        name={user.name}
        phone={user.phone}
        showName={!provider && user.role !== "ADMIN"}
        isShop={Boolean(provider)}
        isAdmin={user.role === "ADMIN"}
      />
    </>
  );
}

/**
 * ส่วนหัวเว็บบนเดสก์ท็อป (lg ขึ้นไป) วางใน root layout ครั้งเดียว ไม่ต้องใส่ในหน้า (v7 "เกาะลอย")
 * แบรนด์ | เมนูหลัก (แคปซูลเลื่อน) | ค้นหา (command palette) | สลับธีม | ร้านของฉัน/ผู้ดูแล | กระดิ่ง | เมนูบัญชี (หรือ เข้าสู่ระบบ)
 * แคปซูลลอยห่างขอบบน 0.75rem เลื่อนแล้วหดจาก 4.5rem เป็น 3.75rem ชั้นนอกจองที่ไว้เท่า --site-header-h (5.25rem) เสมอ
 * มือถือซ่อนทั้งแถบ ใช้ BottomNav แทน (เส้นความคืบหน้าเปลี่ยนหน้าที่ขอบบนใช้ทุกขนาดจอ)
 */
export function SiteHeader() {
  return (
    <>
      <NavProgress />
      <HeaderIsland>
        <Link
          href="/"
          aria-label="Saan หน้าแรก"
          className="mr-1 flex shrink-0 items-center gap-2 rounded-full py-1 pr-2 pl-2 transition-colors hover:bg-muted"
        >
          <ArchMark className="size-7" />
          <span className="font-display text-2xl leading-none font-normal">
            <span className="sr-only">Saan </span>
            <span aria-hidden="true">ศาล</span>
          </span>
          <span
            aria-hidden="true"
            className="max-w-12 overflow-hidden text-base text-muted-foreground transition-[max-width,opacity] duration-(--dur-base) ease-soft group-data-scrolled/island:max-w-0 group-data-scrolled/island:opacity-0 max-xl:[.text-large_&]:hidden"
          >
            Saan
          </span>
        </Link>
        <HeaderNav />
        {/* ช่องค้นหาเป็นส่วนเดียวที่ยืดหดได้ เพื่อให้แถบไม่ล้นเมื่อมีปุ่มร้านหรือผู้ดูแลเพิ่มเข้ามา */}
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end">
          <HeaderSearchSlot />
        </div>
        <ThemeToggle variant="button" />
        <Suspense fallback={<div className="h-10 w-28" aria-hidden="true" />}>
          <HeaderActions />
        </Suspense>
      </HeaderIsland>
    </>
  );
}

function HeaderSearchSlot() {
  return (
    <Suspense fallback={<div className="h-10 w-44 xl:w-72" aria-hidden="true" />}>
      <HeaderSearch className="w-44 shrink xl:w-72" />
    </Suspense>
  );
}
