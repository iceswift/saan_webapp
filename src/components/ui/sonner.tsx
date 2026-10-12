"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/** ป๊อปอัปแจ้งผล สีและธีมตามโหมดสว่าง/มืดของแอป ใช้สีจาก token ทั้งหมด */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  const theme: ToasterProps["theme"] = resolvedTheme === "dark" ? "dark" : "light"

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5 text-tint-mint-ink" />,
        info: <InfoIcon className="size-5 text-tint-sky-ink" />,
        warning: <TriangleAlertIcon className="size-5 text-tint-amber-ink" />,
        error: <OctagonXIcon className="size-5 text-destructive" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !shadow-none !text-base !gap-3 !p-4",
          title: "!font-medium",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
