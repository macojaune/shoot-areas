"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center text-sm text-l/support font-medium transition-colors hover:bg-l/bg/20" +
    " focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" +
    " disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-l/primary",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-l/support bg-l/bg shadow-sm hover:bg-l/primary/90",
      },
      size: {
        default: "h-9 px-6 py-3",
        sm: "h-8 px-2",
        lg: "px-6 py-3 text-xl",
      },
      pill: {
        true: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      pill: false,
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
