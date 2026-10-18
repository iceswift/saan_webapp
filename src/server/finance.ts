import "server-only";
import { db } from "./db";
export type RefundCaseView = {
  id: string; amountMinor: number; status: string; version: number; destination: string;
  transferReference: string | null; evidence: string; verification: string;
  events: { id: string; actorId: string; action: string; fromStatus: string; toStatus: string; note: string; createdAt: string }[];
};

export type FinanceOrder = {
  id: string; code: string; status: string; total: number; paid: number; refunded: number;
  payable: number; payoutStatus: string; refundStatus: string;
  refundDue: number; settlementGateway: string;
  operations: { id: string; kind: string; status: string; amountMinor: number;
    gatewayRef: string; gateway: string; error: string; createdAt: string; refundCase: RefundCaseView | null }[];
};

export async function listFinanceOrders(viewer: {id: string; role: string}, providerId?: string): Promise<FinanceOrder[]> {
  // Re-check ownership here as well as in the page. Never accept a provider ID as authorization.
  if (viewer.role !== "ADMIN") {
    const provider = await db.provider.findUnique({where:{userId:viewer.id},select:{id:true}});
    if (!provider || (providerId && providerId !== provider.id)) return [];
    providerId = provider.id;
  }
  const orders = await db.order.findMany({
    where: { ...(providerId ? {providerId} : {}), OR: [
      {status:{in:["COMPLETED","CANCELLED"]}}, {moneyOperations:{some:{}}},
    ]},
    include:{payments:true,moneyOperations:{orderBy:{createdAt:"desc"},include:{refundCase:{include:{events:{orderBy:{createdAt:"asc"}}}}}}},
    orderBy:{updatedAt:"desc"}, take:100,
  });
  return orders.map(order => {
    const paid = order.payments.filter(p=>p.status === "PAID").reduce((s,p)=>s+p.amount,0);
    const refunded = order.payments.filter(p=>p.status === "REFUNDED").reduce((s,p)=>s+p.amount,0);
    const payout = order.moneyOperations.find(op=>op.kind === "PAYOUT");
    const refunds = order.moneyOperations.filter(op=>op.kind === "REFUND");
    return {
      id:order.id,code:order.code,status:order.status,total:order.total,paid,refunded,
      refundDue: order.status === "CANCELLED" ? paid : 0,
      settlementGateway: order.payments.filter(p => p.status === "PAID").every(p => p.gateway === "mock") ? "mock" : "other",
      payable:order.status === "COMPLETED" && paid === order.total && payout?.status !== "SUCCEEDED" ? paid : 0,
      payoutStatus:payout?.status ?? "NOT_REQUESTED",
      refundStatus:refunds.find(op=>op.status !== "SUCCEEDED")?.status ?? (refunded > 0 ? "SUCCEEDED" : "NOT_REQUESTED"),
      operations:order.moneyOperations.map(op=>({id:op.id,kind:op.kind,status:op.status,amountMinor:op.amountMinor,
        gatewayRef:op.gatewayRef,gateway:op.gateway,error:op.error,createdAt:op.createdAt.toISOString(),
        refundCase: viewer.role === "ADMIN" && op.refundCase ? { ...op.refundCase,
          events: op.refundCase.events.map(event => ({...event,createdAt:event.createdAt.toISOString()})) } : null,
      })),
    };
  });
}
