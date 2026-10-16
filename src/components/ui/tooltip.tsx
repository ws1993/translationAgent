import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "../../lib/utils"

/**
 * 悬停/聚焦披露层。
 *
 * Radix Tooltip 自带三件手写实现最容易做错的事（对应审查 §附录 B.2）：
 *  - 延迟与开合竞态（进入/离开的定时器互相取消）
 *  - 键盘可达：focus 与 hover 走同一条路径，不只是鼠标
 *  - Esc 可关闭 + aria-describedby 关联，读屏能拿到同样的文本
 */
export const TooltipProvider = TooltipPrimitive.Provider

export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export interface TooltipContentProps
  extends React.ComponentProps<typeof TooltipPrimitive.Content> {}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, sideOffset = 9, children, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "z-50 w-[min(440px,90vw)] rounded-xl border border-border bg-surface p-3.5 shadow-lg",
          "text-[12.5px] leading-[1.65] text-muted anim-pop",
          "origin-[var(--radix-tooltip-content-transform-origin)]",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          width={12}
          height={6}
          className="fill-[var(--color-surface)]"
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
)
TooltipContent.displayName = "TooltipContent"
