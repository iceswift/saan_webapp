"use client";

import type { ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";

/** Keep panels mounted so navigating the order never discards a message draft. */
export function OrderWorkspace({ overview, messages, details, messageCount }: {
  overview: ReactNode;
  messages: ReactNode;
  details: ReactNode;
  messageCount: number;
}) {
  return (
    <Tabs.Root defaultValue="overview" className="mt-8 min-w-0">
      <Tabs.List aria-label="รายละเอียดงาน" className="flex gap-1 border-b border-border">
        {[
          ["overview", "ภาพรวม"],
          ["messages", messageCount ? `ข้อความ (${messageCount})` : "ข้อความ"],
          ["details", "ข้อมูลหน้างาน"],
        ].map(([value, label]) => (
          <Tabs.Tab key={value} value={value} className="relative min-h-12 flex-1 rounded-t-lg px-2 py-3 text-sm font-medium text-muted-foreground transition-colors duration-(--dur-fast) hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground data-[active]:text-foreground data-[active]:after:absolute data-[active]:after:inset-x-3 data-[active]:after:bottom-0 data-[active]:after:h-0.5 data-[active]:after:rounded-t-full data-[active]:after:bg-gold sm:flex-none sm:px-6 sm:text-base motion-reduce:transition-none">
            {label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <Tabs.Panel value="overview" keepMounted className="space-y-8 pt-6">{overview}</Tabs.Panel>
      <Tabs.Panel value="messages" keepMounted className="pt-6">{messages}</Tabs.Panel>
      <Tabs.Panel value="details" keepMounted className="space-y-8 pt-6">{details}</Tabs.Panel>
    </Tabs.Root>
  );
}
