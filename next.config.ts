import type { NextConfig } from "next";

// ไม่เปิด cacheComponents เพราะทุกหน้าขึ้นกับผู้ใช้ที่ล็อกอินและอ่านฐานข้อมูลสดทุกครั้ง
const nextConfig: NextConfig = {
  // ให้เปิดเซิร์ฟเวอร์พัฒนาผ่าน 127.0.0.1 ได้ด้วย (คุกกี้แยกจาก localhost ใช้ทดสอบสองบัญชีพร้อมกัน)
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
