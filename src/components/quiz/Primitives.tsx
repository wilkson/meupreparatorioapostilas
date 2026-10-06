import logoAsset from "@/assets/uploads/3862.png";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <img
      src={logoAsset}
      alt="Meu Preparatório"
      width={839}
      height={297}
      className={cn("w-auto", size === "sm" ? "h-9" : "h-14 sm:h-16")}
    />
  );
}

type CTAButtonProps = ComponentProps<"button"> & { href?: string; target?: string; rel?: string };

export function CTAButton({ className, href, target, rel, ...props }: CTAButtonProps) {
  const classes = cn(
    "flex w-full items-center justify-center text-center cursor-pointer rounded-full bg-cta px-8 py-5 font-display text-lg font-extrabold tracking-wide text-cta-foreground shadow-cta transition-all hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cta/40",
    className,
  );
  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={classes} onClick={props.onClick}>
        {props.children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={classes}
      {...props}
    />
  );
}

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function AnswerCard({
  label,
  selected,
  onSelect,
  disabled,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border-2 bg-card p-5 text-left text-base font-semibold text-foreground shadow-soft transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:text-lg",
        selected ? "scale-[1.01] border-primary bg-primary/5" : "border-border hover:border-primary/50",
      )}
    >
      <span
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
          selected ? "border-primary bg-primary" : "border-muted-foreground/40",
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
      </span>
      <span className="min-w-0">{label}</span>
    </button>
  );
}
