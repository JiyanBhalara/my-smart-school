import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // A field is a ruled line you write on: square, flat, ink on focus.
          "flex h-10 w-full rounded-[4px] border border-rule bg-sheet px-3 py-1 text-[15px] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-graphite/70 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-45",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
