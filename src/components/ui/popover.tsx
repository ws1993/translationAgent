import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "../../lib/utils"

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor
export const PopoverClose = PopoverPrimitive.Close

export interface PopoverContentProps
  extends React.ComponentProps<typeof PopoverPrimitive.Content> {}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "start", sideOffset = 8, collisionPadding = 12, children, ...props }, ref) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 w-[min(460px,92vw)] rounded-xl border border-border bg-surface p-4 shadow-xl",
          "text-[13px] leading-[1.6] text-ink anim-pop outline-none",
          "origin-[var(--radix-popover-content-transform-origin)]",
          className
        )}
        {...props}
      >
        {children}
        <PopoverPrimitive.Arrow
          width={12}
          height={6}
          className="fill-[var(--color-surface)]"
        />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
)
PopoverContent.displayName = "PopoverContent"
