import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base: 48px min height (touch target), 16px padding, border radius 8px
        "file:text-foreground placeholder:text-tertiary selection:bg-primary selection:text-primary-foreground border-input h-12 w-full min-w-0 rounded-md border bg-background px-4 py-3 text-base transition-quick outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Focus: 2px outline with offset (accessibility standard)
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 focus-visible:border-ring",
        // Invalid state: destructive color for errors
        "aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
