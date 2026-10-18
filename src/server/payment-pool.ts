import "server-only";
import type { Prisma } from "@prisma/client";
export async function lockPaymentPool(tx: Prisma.TransactionClient) {
  return tx.paymentPool.upsert({where:{id:"omise_test"},update:{revision:{increment:1}},create:{id:"omise_test",revision:1}});
}
