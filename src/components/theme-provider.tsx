"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { THEME_STORAGE_KEY } from "@/lib/prefs";

/**
 * ตัวจัดการธีมสว่าง/มืด/ตามระบบ ใช้ next-themes ใส่คลาส "dark" ที่ <html>
 * สคริปต์ของ next-themes รันก่อนวาดหน้า จึงไม่มีแสงวาบผิดธีมตอนโหลด
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
    >
      {children}
    </NextThemesProvider>
  );
}
