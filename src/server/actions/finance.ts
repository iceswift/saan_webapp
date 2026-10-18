"use server";

import { z } from "zod";
import { getCurrentUser } from "../auth";
import { idSchema, NOT_ALLOWED, NOT_LOGGED_IN, parseInput, refreshAll } from "../action-utils";
import { db } from "../db";
import { payoutOrderFunds, reconcileSettlement, refundOrderFunds } from "../settlement-service";
import { reconcileCustomerPaymentOperation } from "../payment-service";
import { fail, type ActionResult } from "@/lib/result";
import { changeRefundCase, type RefundCaseInput } from "../refund-case-service";
import { startTestPayout, reconcileTestPayout } from "../omise-payout-service";

export async function sendOmiseTestPayout(input:{orderId:string;policy:string}):Promise<ActionResult>{
  const user=await getCurrentUser();if(!user)return NOT_LOGGED_IN;if(user.role!=="ADMIN")return NOT_ALLOWED;
  const parsed=parseInput(z.object({orderId:idSchema,policy:z.string().max(100)}),input);if(!parsed.ok)return parsed;
  const result=await startTestPayout(parsed.data.orderId,user.id,parsed.data.policy);refreshAll();return result;
}

export async function updateRefundCase(input: RefundCaseInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  if (user.role !== "ADMIN") return NOT_ALLOWED;
  const result = await changeRefundCase(user.id, input);
  refreshAll();
  return result;
}

async function adminOperation(input: unknown, operation: "refund" | "payout"): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  if (user.role !== "ADMIN") return NOT_ALLOWED;
  const parsed = parseInput(z.object({orderId:idSchema}),input);
  if (!parsed.ok) return parsed;
  try {
    const result = operation === "refund"
      ? await refundOrderFunds(parsed.data.orderId,user.id)
      : await payoutOrderFunds(parsed.data.orderId,user.id);
    refreshAll();
    return result;
  } catch {
    refreshAll();
    return fail("ยังยืนยันผลรายการไม่ได้ กรุณาตรวจสอบรายการเดิมก่อนทำซ้ำ");
  }
}

export async function refundOrder(input: {orderId:string}): Promise<ActionResult> {
  return adminOperation(input,"refund");
}

export async function payoutOrder(input: {orderId:string}): Promise<ActionResult> {
  return adminOperation(input,"payout");
}

export async function reconcileMoneyOperation(input: {operationId:string}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NOT_LOGGED_IN;
  if (user.role !== "ADMIN") return NOT_ALLOWED;
  const parsed = parseInput(z.object({operationId:idSchema}),input);
  if (!parsed.ok) return parsed;
  try {
    const op = await db.moneyOperation.findUnique({where:{id:parsed.data.operationId}});
    if (!op) return fail("ไม่พบรายการเงิน");
    const attempt = op.kind === "PAYOUT" ? await db.payoutAttempt.findUnique({where:{operationId:op.id}}) : null;
    const result = attempt ? await reconcileTestPayout(op.id) : op.kind === "REFUND" || op.kind === "PAYOUT"
      ? await reconcileSettlement(op.id) : await reconcileCustomerPaymentOperation(op.id);
    refreshAll();
    return result;
  } catch {
    return fail("ตรวจสอบผลยังไม่สำเร็จ กรุณาลองตรวจสอบอีกครั้งภายหลัง");
  }
}
