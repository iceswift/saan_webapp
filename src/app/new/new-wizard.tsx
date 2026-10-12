"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/progress-bar";
import { StepSlide } from "@/components/step-slide";
import { KindArt } from "@/components/visuals";
import {
  AREAS,
  AREA_CODES,
  PLACE_TYPES,
  PLACE_TYPE_CODES,
  SHRINE_KINDS,
  SHRINE_KIND_CODES,
  type AreaCode,
  type PlaceType,
  type ShrineKind,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BUDGET_OPTIONS } from "./options";
import { ChoiceCard } from "./choice-card";

const STEP_LABELS = ["สถานที่", "ประเภทศาล", "งบ", "พื้นที่"];
const TOTAL_STEPS = STEP_LABELS.length;
const UNSURE = "UNSURE";

type Answers = {
  place?: PlaceType;
  /** null หมายถึงยังไม่แน่ใจ ไม่กรองตามประเภท */
  kind?: ShrineKind | null;
  /** null หมายถึงไม่จำกัดงบ */
  budget?: number | null;
  area?: AreaCode;
};

type Choice = {
  key: string;
  label: string;
  /** ถ้าเป็นตัวเลือกประเภทศาล ให้แสดงภาพศาลนำหน้า */
  kind?: ShrineKind;
  selected: boolean;
  onSelect: () => void;
};

const BACK_CLASS =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-[transform,background-color] hover:bg-muted active:scale-95 lg:hidden";

const DESKTOP_BACK_CLASS =
  "hidden min-h-9 items-center gap-0.5 rounded-full pr-3 pl-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex";

export function NewWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});

  function goToProducts(final: Answers & { area: AreaCode }) {
    if (!final.place) {
      setStep(1);
      return;
    }
    const params = new URLSearchParams({ place: final.place, area: final.area });
    if (final.kind) params.set("kind", final.kind);
    if (final.budget) params.set("max", String(final.budget));
    router.push(`/new/products?${params.toString()}`);
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  let title: string;
  let helper: string | undefined;
  let choices: Choice[];

  if (step === 1) {
    title = "จะตั้งศาลที่ไหน";
    choices = PLACE_TYPE_CODES.map((code) => ({
      key: code,
      label: PLACE_TYPES[code],
      selected: answers.place === code,
      onSelect: () => {
        setAnswers((a) => ({ ...a, place: code }));
        setStep(2);
      },
    }));
  } else if (step === 2) {
    title = "ต้องการศาลแบบไหน";
    helper = "ถ้ายังไม่แน่ใจ ร้านจะช่วยแนะนำก่อนยืนยัน";
    choices = [
      ...SHRINE_KIND_CODES.map((code) => ({
        key: code,
        label: SHRINE_KINDS[code],
        kind: code,
        selected: answers.kind === code,
        onSelect: () => {
          setAnswers((a) => ({ ...a, kind: code }));
          setStep(3);
        },
      })),
      {
        key: UNSURE,
        label: "ยังไม่แน่ใจ ขอดูทั้งหมด",
        selected: answers.kind === null,
        onSelect: () => {
          setAnswers((a) => ({ ...a, kind: null }));
          setStep(3);
        },
      },
    ];
  } else if (step === 3) {
    title = "งบสำหรับตัวศาลประมาณเท่าไร";
    helper = "ยังไม่รวมค่าพิธีและเครื่องสังเวย";
    choices = BUDGET_OPTIONS.map((o) => ({
      key: o.value === null ? UNSURE : String(o.value),
      label: o.label,
      selected: answers.budget === o.value,
      onSelect: () => {
        setAnswers((a) => ({ ...a, budget: o.value }));
        setStep(4);
      },
    }));
  } else {
    title = "ศาลจะตั้งอยู่ในพื้นที่ใด";
    choices = AREA_CODES.map((code) => ({
      key: code,
      label: AREAS[code],
      selected: answers.area === code,
      onSelect: () => {
        setAnswers((a) => ({ ...a, area: code }));
        goToProducts({ ...answers, area: code });
      },
    }));
  }

  return (
    <AppShell width="narrow">
      <div className="flex items-center gap-3 lg:-ml-2 lg:flex-col lg:items-stretch lg:gap-4">
        {step === 1 ? (
          <Link href="/" aria-label="ย้อนกลับ" className={BACK_CLASS}>
            <ChevronLeft className="size-6" aria-hidden="true" />
          </Link>
        ) : (
          <button type="button" aria-label="ย้อนกลับ" onClick={back} className={BACK_CLASS}>
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
        )}
        {step === 1 ? (
          <Link href="/" className={cn(DESKTOP_BACK_CLASS, "w-fit")}>
            <ChevronLeft className="size-5" aria-hidden="true" />
            หน้าแรก
          </Link>
        ) : (
          <button type="button" onClick={back} className={cn(DESKTOP_BACK_CLASS, "w-fit")}>
            <ChevronLeft className="size-5" aria-hidden="true" />
            ย้อนกลับ
          </button>
        )}
        <ProgressBar
          value={step}
          max={TOTAL_STEPS}
          label={STEP_LABELS[step - 1]}
          className="min-w-0 flex-1 lg:flex-none"
        />
      </div>

      <StepSlide step={step} className="mt-8 lg:mt-10">
        <h1 className="font-display text-[1.75rem] leading-[1.35] font-normal text-balance lg:text-[2.25rem] lg:leading-[1.3]">
          {title}
        </h1>
        {helper ? <p className="mt-2 text-base text-muted-foreground">{helper}</p> : null}

        <div className="mt-6 flex flex-col gap-3 lg:mt-8">
          {choices.map((choice) => (
            <ChoiceCard
              key={choice.key}
              selected={choice.selected}
              onSelect={choice.onSelect}
              title={choice.label}
              leading={
                choice.kind ? (
                  <span
                    aria-hidden="true"
                    className="flex size-16 shrink-0 items-end justify-center overflow-hidden rounded-lg bg-muted"
                  >
                    <KindArt kind={choice.kind} className="size-full p-0.5" />
                  </span>
                ) : undefined
              }
              className={choice.kind ? "min-h-20" : "min-h-16"}
            />
          ))}
        </div>

        {step === 1 ? (
          <p className="mt-6 text-sm text-muted-foreground">ขั้นตอนนี้ยังไม่มีการจ่ายเงิน</p>
        ) : null}
      </StepSlide>
    </AppShell>
  );
}
