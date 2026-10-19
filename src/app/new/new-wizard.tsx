"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/progress-bar";
import { StepSlide } from "@/components/step-slide";
import { Button } from "@/components/ui/button";
import { FieldHint, focusFirstInvalid } from "@/components/field-hint";
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
  "hidden min-h-11 items-center gap-0.5 rounded-full pr-3 pl-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex";

export function NewWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const choicesRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (previousStep.current !== step) {
      headingRef.current?.focus({ preventScroll: true });
      previousStep.current = step;
    }
  }, [step]);

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
    setError(undefined);
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
        setError(undefined);
      },
    }));
  } else if (step === 2) {
    title = "ต้องการศาลแบบไหน";
    choices = [
      ...SHRINE_KIND_CODES.map((code) => ({
        key: code,
        label: SHRINE_KINDS[code],
        kind: code,
        selected: answers.kind === code,
        onSelect: () => {
          setAnswers((a) => ({ ...a, kind: code }));
          setError(undefined);
        },
      })),
      {
        key: UNSURE,
        label: "ยังไม่แน่ใจ ขอดูทั้งหมด",
        selected: answers.kind === null,
        onSelect: () => {
          setAnswers((a) => ({ ...a, kind: null }));
          setError(undefined);
        },
      },
    ];
  } else if (step === 3) {
    title = "ตั้งงบสำหรับตัวศาลเท่าไร";
    helper = "ยังไม่รวมค่าพิธีและเครื่องสังเวย";
    choices = BUDGET_OPTIONS.map((o) => ({
      key: o.value === null ? UNSURE : String(o.value),
      label: o.label,
      selected: answers.budget === o.value,
      onSelect: () => {
        setAnswers((a) => ({ ...a, budget: o.value }));
        setError(undefined);
      },
    }));
  } else {
    title = "ศาลจะตั้งอยู่ในพื้นที่ใด";
    helper = "เลือกพื้นที่เพื่อดูศาลที่ให้บริการ";
    choices = AREA_CODES.map((code) => ({
      key: code,
      label: AREAS[code],
      selected: answers.area === code,
      onSelect: () => {
        setAnswers((a) => ({ ...a, area: code }));
        setError(undefined);
      },
    }));
  }

  function next() {
    const selected = [answers.place, answers.kind, answers.budget, answers.area][step - 1];
    if (selected === undefined) {
      setError("กรุณาเลือกคำตอบก่อนดำเนินการต่อ");
      requestAnimationFrame(() => focusFirstInvalid(choicesRef.current));
      return;
    }
    setError(undefined);
    if (step === TOTAL_STEPS && answers.area) goToProducts({ ...answers, area: answers.area });
    else setStep(current => current + 1);
  }

  const nextButton = <Button variant="gold" size="xl" className="w-full" onClick={next}>
    {step === TOTAL_STEPS ? "ดูศาลที่ตรงกับคุณ" : "ถัดไป"}
  </Button>;

  return (
    <AppShell width="narrow" desktopFooter="hide" footer={nextButton}>
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
        <h1
          ref={headingRef}
          id="wizard-question"
          tabIndex={-1}
          className="font-display text-[1.75rem] leading-[1.35] font-normal text-balance outline-none lg:text-[2.25rem] lg:leading-[1.3]"
        >
          {title}
        </h1>
        {helper ? <p className="mt-2 text-base text-muted-foreground">{helper}</p> : null}

        <div ref={choicesRef}><fieldset aria-labelledby="wizard-question" aria-invalid={Boolean(error)} aria-describedby="wizard-hint" tabIndex={-1} className="mt-6 flex flex-col gap-3 lg:mt-8">
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
        </fieldset>

        <FieldHint id="wizard-hint" error={error}>เลือกคำตอบแล้วกด{step === TOTAL_STEPS ? "ดูศาลที่ตรงกับคุณ" : "ถัดไป"} ยังไม่มีการจ่ายเงิน</FieldHint>
        </div>
        <div className="mt-6 hidden lg:block">{nextButton}</div>
      </StepSlide>
    </AppShell>
  );
}
