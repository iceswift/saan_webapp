/** คุกกี้เก็บขนาดตัวอักษรที่ผู้ใช้เลือก ค่า "large" หรือ "normal" */
export const TEXT_SIZE_COOKIE = "saan_text";

/** ธีมที่ผู้ใช้เลือก (เก็บใน localStorage โดย next-themes ด้วยคีย์ saan_theme) */
export const THEME_STORAGE_KEY = "saan_theme";
export const THEME_OPTIONS = ["light", "dark", "system"] as const;
export type ThemeChoice = (typeof THEME_OPTIONS)[number];

/** สีแถบเบราว์เซอร์ (viewport.themeColor) ต้องตรงกับ --background ของแต่ละธีม */
export const THEME_COLOR_LIGHT = "#ffffff";
export const THEME_COLOR_DARK = "#0c0a08";
