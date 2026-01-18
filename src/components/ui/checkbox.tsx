"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Design system: 24px visual, 44px touch target (accessibility), 4px border radius
        "peer border-input bg-background data-[state=checked]:bg-success data-[state=checked]:text-success-foreground data-[state=checked]:border-success size-6 shrink-0 rounded border transition-quick outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        // Scale animation on check (playful bounce: 1.0 → 1.1 → 1.0)
        "data-[state=checked]:animate-in data-[state=checked]:zoom-in-90",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        // Check mark draws in: 150ms animation
        className="grid place-content-center text-current animate-in fade-in zoom-in duration-150"
      >
        <CheckIcon className="size-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
