"use client";

import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

interface ModalProps {
	title: string;
	description?: string;
	onClose: () => void;
	children: React.ReactNode;
	wide?: boolean;
}

export default function Modal({ title, description, onClose, children, wide }: ModalProps) {
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		panelRef.current?.focus();
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-md animate-[fade-up_0.25s_ease-out_both] sm:items-center sm:p-6"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-label={title}
				tabIndex={-1}
				className={`border-gradient max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-panel shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)] outline-none sm:rounded-3xl ${wide ? "sm:max-w-4xl" : "sm:max-w-lg"}`}
			>
				<div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-panel/90 px-6 py-5 backdrop-blur">
					<div>
						<h2 className="text-[17px] font-semibold tracking-tight text-fg">{title}</h2>
						{description ? <p className="mt-0.5 text-[13px] text-subtle">{description}</p> : null}
					</div>
					<button onClick={onClose} aria-label="Close" className="-mr-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-white/[0.06] hover:text-fg">
						<FiX size={18} />
					</button>
				</div>
				<div className="p-6">{children}</div>
			</div>
		</div>
	);
}
