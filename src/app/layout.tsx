import type { Metadata, Viewport } from "next";
import { Anuphan, DM_Sans, Prompt } from "next/font/google";
import { cookies } from "next/headers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TEXT_SIZE_COOKIE, THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/prefs";
import "./globals.css";

// ตัวอักษรละติน/ตัวเลข (DM Sans) วางหน้าสุด ตัวอักษรไทยจะตกไปใช้ Anuphan (เนื้อหา) หรือ Prompt (หัวเรื่อง)
const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
});

// ตัวอักษรไทยของเนื้อหา ปุ่ม ฟอร์ม (loopless)
const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
});

// ตัวอักษรไทยของหัวเรื่อง (class font-display) แบบเรขาคณิต ใช้น้ำหนักปกติ
const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai"],
  weight: ["400", "500"],
});

// ที่อยู่เว็บจริงใช้ทำลิงก์เต็มของรูปและหน้าที่แชร์ (Open Graph) ตั้งค่าได้ด้วย NEXT_PUBLIC_SITE_URL ดู .env.example
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Saan ดูแลเรื่องศาลครบในที่เดียว", template: "%s | Saan" },
  description: "ตั้งศาลใหม่ ถอนย้าย ซ่อม และสมุดบน กับร้านที่ตรวจสอบแล้ว ราคาชัดเจน",
  applicationName: "Saan",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR_DARK },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const largeText = (await cookies()).get(TEXT_SIZE_COOKIE)?.value === "large";
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${dmSans.variable} ${anuphan.variable} ${prompt.variable} h-full antialiased ${largeText ? "text-large" : ""}`}
    >
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          {/* ส่วนหัวและส่วนท้ายของเดสก์ท็อป (lg ขึ้นไป) มือถือซ่อนทั้งคู่ */}
          <SiteHeader />
          {children}
          <SiteFooter />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
