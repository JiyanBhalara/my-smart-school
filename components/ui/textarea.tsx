import * as React from "react"

import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Matches Input: a ruled field, ink on focus.
          "flex min-h-[96px] w-full rounded-[4px] border border-field bg-sheet px-3 py-2 text-[15px] placeholder:text-graphite/70 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-45",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea };

