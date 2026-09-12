import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Buttons are pressed ink, not floating cards: no shadow, 4px corners, and a
// 2px ink focus ring. `destructive` is the one place mark-red appears on a
// control -- mark otherwise means assessment, not danger.
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[4px] text-[14px] font-medium tracking-[-0.005em] transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-white hover:bg-[#01243a]",
        destructive:
          "bg-mark text-white hover:bg-[#8f1e18]",
        outline:
          "border border-ink text-ink bg-transparent hover:bg-ink hover:text-white",
        secondary:
          "border border-rule bg-sheet text-ink hover:border-ink",
        ghost:
          "text-ink hover:bg-[#edf2f5]",
        link:
          "text-ink underline underline-offset-[3px] decoration-rule hover:decoration-ink",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-11 px-6 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
