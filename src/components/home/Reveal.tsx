"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades content up the first time it scrolls into view. */
export default function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					io.disconnect();
				}
			},
			{ rootMargin: "0px 0px -10% 0px" },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			style={{ transitionDelay: `${delay}ms` }}
			className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} ${className}`}
		>
			{children}
		</div>
	);
}

export function SectionHeader({ eyebrow, title, description, align = "center" }: { eyebrow: string; title: ReactNode; description?: ReactNode; align?: "center" | "left" }) {
	return (
		<Reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
			<p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
				<span className="h-px w-5 bg-accent/60" />
				{eyebrow}
			</p>
			<h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-[42px] sm:leading-[1.1]">{title}</h2>
			{description ? <p className="mt-4 text-[17px] leading-relaxed text-muted text-pretty">{description}</p> : null}
		</Reveal>
	);
}
