import type { Metadata } from "next";
import type { RequestType } from "@/lib/constants";
import { requireUser } from "@/server/auth";
import { listAddresses, listMyShrines } from "@/server/queries";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "ขอใบเสนอราคา" };

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { type: rawType } = await searchParams;
  const type: RequestType = rawType === "REMOVE" ? "REMOVE" : "REPAIR";
  const user = await requireUser(`/request/new?type=${type}`);
  const [shrines, addresses] = await Promise.all([
    listMyShrines(user.id),
    listAddresses(user.id),
  ]);

  return <RequestForm type={type} shrines={shrines} addresses={addresses} />;
}
