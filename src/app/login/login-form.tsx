"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
import { ProgressBar } from "@/components/progress-bar";
import { StepSlide } from "@/components/step-slide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestOtp, updateProfile, verifyOtp } from "@/server/actions/auth";

type Step = "phone" | "code" | "name";

const STEP_INDEX: Record<Step, number> = { phone: 1, code: 2, name: 3 };
const STEP_LABEL: Record<Step, string> = { phone: "เบอร์โทร", code: "รหัสยืนยัน", name: "ชื่อของคุณ" };

export function LoginForm({ next, needsNameOnly }: { next: string; needsNameOnly: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<Step>(needsNameOnly ? "name" : "phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  /** แจ้งข้อผิดพลาดใต้ช่องแล้วโฟกัสช่องนั้น */
  function fail(message: string) {
    setError(message);
    requestAnimationFrame(() => focusFirstInvalid(formRef.current));
  }

  function sendCode() {
    if (phone.replace(/\D/g, "").length !== 10) {
      fail("กรุณากรอกเบอร์โทร 10 หลัก");
      return;
    }
    startTransition(async () => {
      const res = await requestOtp({ phone });
      if (!res.ok) {
        fail(res.error);
        return;
      }
      setDevCode(res.data.devCode);
      setCode("");
      setError(undefined);
      setStep("code");
    });
  }

  function confirmCode() {
    if (code.length !== 6) {
      fail("กรุณากรอกรหัส 6 หลัก");
      return;
    }
    startTransition(async () => {
      const res = await verifyOtp({ phone, code });
      if (!res.ok) {
        fail(res.error);
        return;
      }
      setError(undefined);
      if (res.data.needsName) setStep("name");
      else router.replace(next);
    });
  }

  function saveName() {
    if (!name.trim()) {
      fail("กรุณากรอกชื่อ");
      return;
    }
    startTransition(async () => {
      const res = await updateProfile({ name });
      if (!res.ok) {
        fail(res.error);
        return;
      }
      router.replace(next);
    });
  }

  const onSubmit: Record<Step, () => void> = { phone: sendCode, code: confirmCode, name: saveName };

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit[step]();
      }}
    >
      <ProgressBar value={STEP_INDEX[step]} max={3} label={STEP_LABEL[step]} className="mb-7" />

      <StepSlide step={STEP_INDEX[step]}>
        {step === "phone" ? (
          <div>
            <Label htmlFor="phone" className="mb-2 text-base">
              เบอร์โทรศัพท์
            </Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="08x-xxx-xxxx"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(undefined);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby="login-hint"
              className="h-14 text-lg"
            />
            <FieldHint id="login-hint" error={error}>
              เราจะส่งรหัสยืนยันให้เบอร์นี้
            </FieldHint>
          </div>
        ) : null}

        {step === "code" ? (
          <div>
            <Label htmlFor="code" className="mb-2 text-base">
              รหัส 6 หลักสำหรับ <span className="numeric">{phone}</span>
            </Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="h-16 text-center font-display text-3xl tracking-[0.4em]"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                setError(undefined);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby="login-hint"
            />
            <FieldHint id="login-hint" error={error} />
            {devCode ? (
              <p className="mt-4 rounded-lg border border-dashed border-gold-line px-4 py-3 text-base">
                <span className="text-muted-foreground">โหมดทดสอบ ยังไม่ได้ต่อระบบ SMS รหัสของคุณคือ </span>
                <strong className="numeric font-display text-lg font-normal tracking-widest">{devCode}</strong>
              </p>
            ) : null}
          </div>
        ) : null}

        {step === "name" ? (
          <div>
            <Label htmlFor="name" className="mb-2 text-base">
              ชื่อที่ให้ร้านเรียก
            </Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="เช่น คุณสมชาย"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(undefined);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby="login-hint"
              className="h-14 text-lg"
            />
            <FieldHint id="login-hint" error={error} />
          </div>
        ) : null}
      </StepSlide>

      <Button type="submit" size="xl" variant="gold" className="mt-6 w-full" loading={pending}>
        {step === "phone" ? "รับรหัสยืนยัน" : step === "code" ? "ยืนยัน" : "เริ่มใช้งาน"}
      </Button>
      {step === "code" ? (
        <Button
          type="button"
          variant="ghost"
          size="xl"
          className="mt-2 w-full text-muted-foreground"
          onClick={() => {
            setError(undefined);
            setStep("phone");
          }}
        >
          เปลี่ยนเบอร์โทร
        </Button>
      ) : null}
    </form>
  );
}
