import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

/**
 * 模态框（Radix Dialog）。
 *
 * 语义与替换前的手写版本保持一致：`<Dialog open onOpenChange>` 自身负责
 * Portal + 遮罩 + 面板 + 关闭按钮，因此既有调用点（Settings.tsx）无需改动。
 * 换到手写版本缺失的 4 项能力：
 *   1. Portal —— 不再就地渲染，摆脱父级 z-index / overflow 限制
 *   2. 焦点陷阱 + 关闭后焦点归还触发元素
 *   3. role="dialog" + aria-modal + Esc 关闭 + 背景滚动锁定
 *   4. 遮罩点击关闭由 Radix 处理，不再手写 onClick
 */
export const DialogRoot = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** 宽度类，如 max-w-2xl */
  size?: string
  hideClose?: boolean
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, size, hideClose, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-charcoal/45 backdrop-blur-sm" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg",
          "-translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-panel",
          "border border-border bg-surface p-6 shadow-lg outline-none anim-pop",
          size,
          className
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1.5 text-muted transition-colors hover:bg-surface-1 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <X className="size-4" />
            <span className="sr-only">关闭</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
)
DialogContent.displayName = "DialogContent"

export interface DialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  size?: string
  className?: string
  hideClose?: boolean
}

export function Dialog({ open, onOpenChange, children, size, className, hideClose }: DialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size} className={className} hideClose={hideClose}>
        {children}
      </DialogContent>
    </DialogRoot>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col space-y-1.5 pr-8", className)} {...props} />
}

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold tracking-tight text-ink", className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-relaxed text-muted", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}
