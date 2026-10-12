import type { MetadataRoute } from "next";
import { THEME_COLOR_LIGHT } from "@/lib/prefs";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Saan ดูแลเรื่องศาลครบในที่เดียว",
    short_name: "Saan",
    description: "ตั้งศาลใหม่ ถอนย้าย ซ่อม และสมุดบน กับร้านที่ตรวจสอบแล้ว",
    start_url: "/",
    display: "standalone",
    // ไอคอนเป็นซุ้มประตูศาลสีชาดบนพื้นดำอุ่น จึงใช้สีพื้นสว่างของแอปเป็นพื้นหลังหน้าเปิด
    background_color: THEME_COLOR_LIGHT,
    theme_color: THEME_COLOR_LIGHT,
    lang: "th",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
