import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const base =
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]";

const variants: Record<Variant, string> = {
	primary: "bg-fg text-bg hover:bg-white shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_8px_30px_-8px_rgb(139_123_255/0.6)]",
	accent: "bg-gradient-to-r from-accent to-accent-2 text-bg hover:brightness-110 shadow-[0_8px_30px_-8px_rgb(56_211_242/0.55)]",
	secondary: "border border-line-strong bg-white/[0.04] text-fg hover:bg-white/[0.08] hover:border-white/25",
	ghost: "text-muted hover:text-fg hover:bg-white/[0.06]",
	danger: "border border-critical/40 bg-critical/10 text-critical-text hover:bg-critical/20",
};

const sizes: Record<Size, string> = {
	sm: "h-8 px-3 text-[13px]",
	md: "h-10 px-4 text-sm",
	lg: "h-12 px-6 text-[15px]",
};

interface StyleProps {
	variant?: Variant;
	size?: Size;
	className?: string;
}

export function buttonClass({ variant = "primary", size = "md", className = "" }: StyleProps = {}) {
	return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

export function Button({ variant, size, className, ...props }: StyleProps & ComponentProps<"button">) {
	return <button className={buttonClass({ variant, size, className })} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: StyleProps & ComponentProps<typeof Link>) {
	return <Link className={buttonClass({ variant, size, className })} {...props} />;
}
