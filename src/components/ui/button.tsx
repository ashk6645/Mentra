import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: Interaction rules following design system (200ms quick transition)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-quick disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98] active:transition-snappy cursor-pointer",
  {
    variants: {
      variant: {
        // Primary: Calm blue for trust, subtle hover darkening
        default: "bg-primary text-primary-foreground hover:bg-[#1D4ED8] active:bg-[#1E40AF] shadow-sm",
        // Destructive: Red reserved for danger only
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        // Outline: Minimal, subtle hover
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-border-strong",
        // Secondary: De-emphasized actions
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Ghost: Invisible until hover (progressive disclosure)
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground",
        // Link: Simple, distraction-free
        link: "text-primary underline-offset-4 hover:underline",
        // Success: Completion dopamine trigger
        success: "bg-success text-success-foreground hover:bg-success/90 active:bg-success/80",
      },
      size: {
        // 48px min height for touch targets (accessibility)
        default: "h-12 px-4 py-3 has-[>svg]:px-3",
        sm: "h-10 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-14 rounded-md px-6 has-[>svg]:px-4 text-base",
        // Icon buttons maintain 48px touch target
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
