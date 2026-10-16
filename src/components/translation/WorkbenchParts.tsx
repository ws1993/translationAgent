import * as React from "react"
import { TranslationMode } from "../../types"
import { Segmented, SegmentedItem } from "../ui/segmented"
import { Tooltip, TooltipContent, TooltipProvider } from "../ui/tooltip"
import { Button } from "../ui/button"
import { Check, Circle, Copy, Info, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "../../lib/utils"

/* ==========================================================================
   模式说明（审查 §附录 B.2）
   链路 / 场景 / 描述默认隐藏，hover 或 focus 时披露；
   但「当前选了谁、要等多久、走几步」必须常驻——那是本页最关键的一次取舍。
   ========================================================================== */
export interface ModeMeta {
  label: string
  time: string
  calls: number
  chain: string[]
  desc: string
  scene: string
}

export const MODE_META: Record<TranslationMode, ModeMeta> = {
  [TranslationMode.QUICK]: {
    label: "极速直译",
    time: "≈1–2s",
    calls: 1,
    chain: ["单次直译"],
    desc: "一次模型调用直接产出译文，不做二次审校，也不生成中间过程。",
    scene: "日常沟通、即时查词、单句短段落",
  },
  [TranslationMode.PROFESSIONAL]: {
    label: "专业三步",
    time: "≈5–8s",
    calls: 3,
    chain: ["直译打底", "批评审校", "意译定稿"],
    desc: "先直译保住信息完整，再让模型自我批评定位硬伤，最后按目标语语序重写。",
    scene: "学术论文、商务邮件、对外发布文案",
  },
  [TranslationMode.DOMAIN_ADAPTIVE]: {
    label: "领域自适应",
    time: "≈10–15s",
    calls: 5,
    chain: ["识别领域", "锁定术语", "直译打底", "批评审校", "术语精修"],
    desc: "在专业三步前后各加一道：先识别领域并抽取术语表锁定译法，最后做术语一致性校验。",
    scene: "医学、IT、法律、金融等长文与术语密集文本",
  },
}

export const MODE_ORDER: TranslationMode[] = [
  TranslationMode.QUICK,
  TranslationMode.PROFESSIONAL,
  TranslationMode.DOMAIN_ADAPTIVE,
]

function ModeDetail({ mode }: { mode: TranslationMode }) {
  const m = MODE_META[mode]
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[13.5px] font-bold text-ink">{m.label}</span>
        <span className="font-mono text-[11px] text-accent-strong">{m.time}</span>
        <span className="ml-auto text-[11px] text-muted">{m.calls} 次模型调用</span>
      </div>
      <div className="mb-1.5 flex flex-wrap items-center gap-1">
        {m.chain.map((c, i) => (
          <React.Fragment key={c}>
            {i > 0 && <span className="text-accent">→</span>}
            <span className="rounded-md border border-border bg-paper px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
              {c}
            </span>
          </React.Fragment>
        ))}
      </div>
      <p className="m-0">{m.desc}</p>
      <p className="mt-1.5 border-t border-dashed border-border pt-1.5">
        <b className="font-semibold text-ink">何时选它：</b>
        {m.scene}
      </p>
    </div>
  )
}

export interface ModePickerProps {
  value: TranslationMode
  onChange: (mode: TranslationMode) => void
  disabled?: boolean
  /** 各分支是否已有结果（审查 §P0-4：切换模式会让译文「凭空换脸」） */
  hasResult?: Partial<Record<TranslationMode, boolean>>
}

export function ModePicker({ value, onChange, disabled, hasResult }: ModePickerProps) {
  const [pinned, setPinned] = React.useState(false)
  const meta = MODE_META[value]

  return (
    <div className="space-y-2.5">
      <TooltipProvider delayDuration={120}>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            aria-label="翻译模式"
            disabled={disabled}
            value={value}
            onValueChange={(v) => onChange(v as TranslationMode)}
          >
            {MODE_ORDER.map((k) => (
              <Tooltip key={k}>
                <SegmentedItem value={k} meta={MODE_META[k].time} hasResult={hasResult?.[k]}>
                  {MODE_META[k].label}
                  {hasResult?.[k] && <span className="sr-only">（该模式已有结果）</span>}
                </SegmentedItem>
                <TooltipContent side="bottom" align="start">
                  <ModeDetail mode={k} />
                </TooltipContent>
              </Tooltip>
            ))}
          </Segmented>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={pinned}
            onClick={() => setPinned((p) => !p)}
            className="gap-1.5 border border-border"
          >
            <Info className="size-3.5" />
            固定详情
          </Button>
          <span className="hidden text-xs text-muted lg:inline">或悬停任一模式查看完整链路</span>
        </div>
      </TooltipProvider>

      {pinned && (
        <div className="rounded-panel border border-border bg-paper px-3.5 py-3">
          <ModeDetail mode={value} />
        </div>
      )}

      {/* 常驻摘要：身份与代价不可隐藏 */}
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-[1.6] text-muted">
        <span>
          已选 <b className="font-semibold text-ink">{meta.label}</b>
        </span>
        <span className="font-mono text-accent-strong">{meta.time}</span>
        <span aria-hidden className="text-border">·</span>
        <span className="font-mono text-[11px]">{meta.chain.join(" → ")}</span>
        <span aria-hidden className="text-border">·</span>
        <span>适用于{meta.scene}</span>
      </p>
    </div>
  )
}

/* ==========================================================================
   页面常驻进度轨道（审查 §P1-1：进度此前只活在弹窗里）
   ========================================================================== */
export interface ProgressStripProps {
  steps: { key: string; label: string }[]
  stage: string
  percent: number
  active: boolean
  onViewProcess?: () => void
}

export function ProgressStrip({
  steps,
  stage,
  percent,
  active,
  onViewProcess,
}: ProgressStripProps) {
  if (!active && percent === 0) return null
  const currentIdx = steps.findIndex((s) => s.key === stage)

  return (
    <div className="border-t border-border bg-surface-1 px-4 py-3.5">
      <div className="mb-2.5 flex items-center gap-3">
        <span className="text-[13px] font-semibold text-ink">推理链路</span>
        <div className="h-[5px] max-w-[260px] flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-linear-to-r from-accent to-accent-strong transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </div>
        <span className="font-mono text-[11.5px] text-muted">{percent}%</span>
        {onViewProcess && (
          <Button type="button" variant="ghost" size="sm" onClick={onViewProcess} className="ml-auto">
            展开过程
          </Button>
        )}
      </div>

      <ol className="flex flex-wrap gap-1.5">
        {steps.map((s, i) => {
          const done = !active || percent >= 100 || (currentIdx >= 0 && i < currentIdx)
          const running = active && percent < 100 && i === currentIdx
          return (
            <li
              key={s.key}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium",
                done
                  ? "border-success/35 bg-success/5 text-success"
                  : running
                    ? "border-accent bg-accent-tint text-ink"
                    : "border-border bg-surface text-muted"
              )}
            >
              {done ? (
                <Check className="size-3.5" />
              ) : running ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Circle className="size-3.5" />
              )}
              <span className="font-mono">{i + 1}</span>
              {s.label}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ==========================================================================
   复制按钮（审查 §P1-3：全仓此前 0 处剪贴板调用）
   ========================================================================== */
export function CopyButton({
  text,
  label = "复制译文",
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [ok, setOk] = React.useState(false)
  if (!text) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setOk(true)
          window.setTimeout(() => setOk(false), 1600)
          toast.success("译文已复制")
        } catch {
          toast.error("复制失败：请检查浏览器剪贴板权限")
        }
      }}
    >
      {ok ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      {ok ? "已复制" : label}
    </Button>
  )
}
