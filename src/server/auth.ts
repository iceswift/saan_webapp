import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { Role } from "@/lib/constants";
import { canUseTestLogin } from "./runtime-policy";
import { labLoginConfig } from "./lab-login";

const SESSION_COOKIE = "saan_session";
const SESSION_DAYS = 30;

export type CurrentUser = {
  id: string;
  phone: string;
  name: string;
  role: Role;
};

export async function createSession(userId: string, expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)) {
  const token = randomBytes(32).toString("hex");
  await db.session.create({ data: { token, userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { token } });
  store.delete(SESSION_COOKIE);
}

/** ผู้ใช้ที่ล็อกอินอยู่ หรือ null */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || session.user.deletedAt) return null;
  const lab = labLoginConfig();
  const isLabCustomer = lab?.userId === session.userId && session.user.role === "CUSTOMER" &&
    session.expiresAt.getTime() <= lab.expiresAt.getTime();
  if (!canUseTestLogin(session.user.phone) && !isLabCustomer) return null;
  const { id, phone, name, role } = session.user;
  return { id, phone, name, role: role as Role };
}

/** ใช้ในหน้า (server component) ที่ต้องล็อกอิน ถ้ายังไม่ล็อกอินจะพาไปหน้า /login */
export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  return user;
}

/** ใช้ในหน้าที่จำกัดสิทธิ์ ถ้าสิทธิ์ไม่ตรงจะพากลับหน้าแรก */
export async function requireRole(role: Role, nextPath?: string): Promise<CurrentUser> {
  const user = await requireUser(nextPath);
  if (user.role !== role) redirect("/");
  return user;
}
