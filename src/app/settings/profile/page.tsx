import type { Metadata } from "next";
import { requireUser } from "@/server/auth";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "โปรไฟล์" };

export default async function ProfilePage() {
  const user = await requireUser("/settings/profile");
  return <ProfileForm currentName={user.name} phone={user.phone} />;
}
