import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSession } from "@/server/auth";
import { db } from "@/server/db";
import { labLoginConfig, matchesLabLoginToken } from "@/server/lab-login";

async function signIn(formData: FormData) {
  "use server";

  const lab = labLoginConfig();
  if (!lab) notFound();
  if (!matchesLabLoginToken(formData.get("token"), lab.tokenHash)) redirect("/login/lab?error=1");

  const user = await db.user.findFirst({
    where: { id: lab.userId, role: "CUSTOMER", deletedAt: null },
    select: { id: true },
  });
  if (!user) redirect("/login/lab?error=1");

  await createSession(user.id, lab.expiresAt);
  redirect("/shrines");
}

export default async function LabLoginPage({ searchParams }: PageProps<"/login/lab">) {
  if (!labLoginConfig()) notFound();
  const showError = (await searchParams).error === "1";

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-5 py-8">
        <h1 className="font-display text-[1.75rem] leading-[1.3] font-normal">เข้าสู่ระบบสำหรับการทดสอบ</h1>
        <form action={signIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lab-token">รหัสเข้าบัญชีทดสอบ</Label>
            <Input id="lab-token" name="token" type="password" maxLength={64} autoComplete="off" aria-invalid={showError} />
            {showError && <p role="alert" className="text-sm text-destructive">เข้าสู่ระบบไม่ได้ กรุณาตรวจสอบรหัสและเวลาที่ใช้ได้</p>}
          </div>
          <Button type="submit" size="xl">เข้าสู่ระบบ</Button>
        </form>
      </div>
    </AppShell>
  );
}
