import * as React from "react"
import { cn } from "../../lib/utils"

interface ToggleGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

const ToggleGroup = ({ value, onValueChange, children, className }: ToggleGroupProps) => {
  return (
    <div className={cn("flex bg-surface border border-border rounded-lg overflow-hidden", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            isActive: child.props.value === value,
            onClick: () => onValueChange(child.props.value),
          } as any)
        }
        return child
      })}
    </div>
  )
}

interface ToggleGroupItemProps {
  value: string
  isActive?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

const ToggleGroupItem = ({ isActive, onClick, children, className }: ToggleGroupItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 px-4 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-accent text-white"
          : "text-muted hover:bg-accent-tint hover:text-accent-hover",
        className
      )}
    >
      {children}
    </button>
  )
}

export { ToggleGroup, ToggleGroupItem }
