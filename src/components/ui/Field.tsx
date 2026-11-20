"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export const inputClass =
	"h-11 w-full rounded-xl border border-line-strong bg-white/[0.03] px-3.5 text-[15px] text-fg placeholder:text-subtle outline-none transition-[border-color,box-shadow,background-color] hover:border-white/20 focus:border-accent/70 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgb(139_123_255/0.15)] aria-[invalid=true]:border-critical/70 aria-[invalid=true]:focus:shadow-[0_0_0_4px_rgb(208_59_59/0.18)] disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-muted disabled:hover:border-line";

interface FieldProps extends Omit<ComponentProps<"input">, "id"> {
	label: string;
	hint?: ReactNode;
	error?: string;
	trailing?: ReactNode;
	labelAction?: ReactNode;
}

export default function Field({ label, hint, error, trailing, labelAction, className = "", type, ...props }: FieldProps) {
	const id = useId();
	const [reveal, setReveal] = useState(false);
	const isPassword = type === "password";

	return (
		<div className={className}>
			<div className="mb-1.5 flex items-center justify-between">
				<label htmlFor={id} className="text-[13px] font-medium text-muted">
					{label}
				</label>
				{labelAction}
			</div>
			<div className="relative">
				<input
					id={id}
					type={isPassword && reveal ? "text" : type}
					aria-invalid={error ? true : undefined}
					aria-describedby={error || hint ? `${id}-desc` : undefined}
					className={`${inputClass} ${isPassword || trailing ? "pr-11" : ""}`}
					{...props}
				/>
				{isPassword ? (
					<button
						type="button"
						onClick={() => setReveal((r) => !r)}
						aria-label={reveal ? "Hide password" : "Show password"}
						className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-subtle hover:text-fg"
					>
						{reveal ? <FiEyeOff size={16} /> : <FiEye size={16} />}
					</button>
				) : (
					trailing
				)}
			</div>
			{error ? (
				<p id={`${id}-desc`} role="alert" className="mt-1.5 text-[13px] text-critical-text">
					{error}
				</p>
			) : hint ? (
				<div id={`${id}-desc`} className="mt-1.5 text-[12px] text-subtle">
					{hint}
				</div>
			) : null}
		</div>
	);
}

export function FormAlert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" }) {
	return (
		<div
			role={tone === "error" ? "alert" : "status"}
			className={`rounded-xl border px-3.5 py-2.5 text-[13px] ${tone === "error" ? "border-critical/40 bg-critical/10 text-critical-text" : "border-good/40 bg-good/10 text-good-text"}`}
		>
			{children}
		</div>
	);
}
