import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cn } from "../../lib/utils"

/**
 * 段控（互斥单选）。
 *
 * 替代原 ui/toggle-group.tsx —— 那份手写实现没有 `disabled` 这个 prop，
 * 页面传下来的 `disabled={isTranslating}` 被静默丢弃，导致「翻译中仍可切模式」
 * （审查 §P0-3）。Radix 的 ToggleGroup 原生支持 disabled，并自带
 * roving focus / 方向键 / radiogroup 语义。
 */
export interface SegmentedProps {
  value: string
  onValueChange: (value: string) => void
  /** 禁用整组（审查 §P0-3 的正解：Radix 会把 disabled 下发给每个 item） */
  disabled?: boolean
  'aria-label': string
  id?: string
  className?: string
  children: React.ReactNode
}

export const Segmented = React.forwardRef<HTMLDivElement, SegmentedProps>(
  ({ className, value, onValueChange, ...props }, ref) => (
    <ToggleGroupPrimitive.Root
      ref={ref}
      type="single"
      value={value}
      /** Radix 在取消选中时回传空串；段控语义上不允许空值，直接忽略 */
      onValueChange={(next) => next && onValueChange(next)}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-[10px] border border-border bg-surface p-1",
        className
      )}
      {...props}
    />
  )
)
Segmented.displayName = "Segmented"

export interface SegmentedItemProps
  extends React.ComponentProps<typeof ToggleGroupPrimitive.Item> {
  /** 右侧等宽小标签，如耗时 */
  meta?: React.ReactNode
  /** 该分支已有结果时显示圆点 */
  hasResult?: boolean
}

export const SegmentedItem = React.forwardRef<HTMLButtonElement, SegmentedItemProps>(
  ({ className, children, meta, hasResult, ...props }, ref) => (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        "inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-md px-3 text-[13.5px] font-semibold",
        "whitespace-nowrap text-muted transition-colors",
        "hover:bg-surface-1 hover:text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
        "data-[state=on]:bg-accent-strong data-[state=on]:text-white data-[state=on]:hover:bg-accent-hover data-[state=on]:hover:text-white",
        "disabled:pointer-events-none disabled:opacity-45",
        className
      )}
      {...props}
    >
      {children}
      {meta && (
        <span className="font-mono text-[10.5px] font-medium opacity-75">{meta}</span>
      )}
      {hasResult && (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-current opacity-90"
        />
      )}
    </ToggleGroupPrimitive.Item>
  )
)
SegmentedItem.displayName = "SegmentedItem"
