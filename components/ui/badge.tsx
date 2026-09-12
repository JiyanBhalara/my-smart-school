import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Annotations, not pills: squared, quiet, no fill unless it carries a mark.
  "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[11px] font-medium tracking-[0.02em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
  {
    variants: {
      variant: {
        default:
          "border-rule bg-transparent text-graphite",
        secondary:
          "border-transparent bg-[#edf2f5] text-ink",
        destructive:
          "border-transparent bg-mark text-white",
        outline: "border-ink bg-transparent text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
