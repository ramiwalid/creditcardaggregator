import type { Card } from "@/lib/types";
import { formatCents, formatPercent, relativeDays, utilizationTone } from "@/lib/format";
import { CARD_THEMES, NETWORK_LABELS, UTILIZATION_STATUS } from "./cardStyles";

export type CardPreview = Pick<Card, "name" | "issuer" | "network" | "last_four" | "color" | "current_balance_cents" | "credit_limit_cents"> &
	Partial<Pick<Card, "utilization" | "days_until_due">>;

interface Props {
	card: CardPreview;
	className?: string;
	/** Hide the "due soon" pill (e.g. on marketing mockups). */
	compact?: boolean;
	/** "sm" tightens type and padding for small renderings. */
	size?: "sm" | "md";
}

function Chip() {
	return (
		<svg width="38" height="28" viewBox="0 0 38 28" aria-hidden="true" className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
			<defs>
				<linearGradient id="chip-g" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#f5e6b8" />
					<stop offset="0.5" stopColor="#c9a95c" />
					<stop offset="1" stopColor="#f1dc9f" />
				</linearGradient>
			</defs>
			<rect x="0.5" y="0.5" width="37" height="27" rx="5" fill="url(#chip-g)" stroke="#8a7339" strokeOpacity="0.5" />
			<path d="M0.5 9.5h11M0.5 18.5h11M26.5 9.5h11M26.5 18.5h11M11.5 0.5v27M26.5 0.5v27M11.5 14h15" stroke="#7a6530" strokeOpacity="0.55" fill="none" />
		</svg>
	);
}

function Contactless() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="opacity-70">
			<path d="M8.5 7.5a6 6 0 0 1 0 9" />
			<path d="M12 5a9.5 9.5 0 0 1 0 14" />
			<path d="M15.5 2.5a13 13 0 0 1 0 19" />
		</svg>
	);
}

function NetworkMark({ network }: { network: Card["network"] }) {
	if (network === "mastercard") {
		return (
			<span className="flex items-center" aria-label="Mastercard">
				<span className="h-6 w-6 rounded-full bg-[#eb001b]/90" />
				<span className="-ml-2.5 h-6 w-6 rounded-full bg-[#f79e1b]/85 mix-blend-screen" />
			</span>
		);
	}
	return (
		<span className={`font-semibold tracking-wide text-white/90 ${network === "visa" ? "text-lg italic font-bold" : "text-xs uppercase tracking-[0.16em]"}`}>
			{NETWORK_LABELS[network]}
		</span>
	);
}

export default function CreditCardVisual({ card, className = "", compact, size = "md" }: Props) {
	const sm = size === "sm";
	const utilization =
		card.utilization !== undefined
			? card.utilization
			: card.credit_limit_cents > 0
				? Math.max(card.current_balance_cents, 0) / card.credit_limit_cents
				: null;
	const status = UTILIZATION_STATUS[utilizationTone(utilization)];
	const dueSoon = !compact && card.days_until_due != null && card.days_until_due <= 5;

	return (
		<div
			className={`relative isolate flex aspect-[1.586] w-full flex-col justify-between overflow-hidden ${sm ? "rounded-2xl p-3.5" : "rounded-[20px] p-5"} text-white shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset,0_30px_60px_-20px_rgb(0_0_0/0.7)] ring-1 ring-white/10 ${className}`}
			style={{ background: CARD_THEMES[card.color].background }}
		>
			{/* sheen + grain */}
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(115deg,transparent_30%,rgb(255_255_255/0.12)_45%,transparent_60%)]" />
			<div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15] mix-blend-overlay bg-dots" />

			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-white/65">{card.issuer || "Issuer"}</p>
					<p className={`mt-0.5 truncate font-semibold tracking-tight ${sm ? "text-[13px]" : "text-[15px]"}`}>{card.name || "Card name"}</p>
				</div>
				{dueSoon ? (
					<span className="flex-none rounded-full bg-black/35 px-2.5 py-1 font-mono text-[10px] font-medium text-white ring-1 ring-white/15 backdrop-blur">
						{relativeDays(card.days_until_due)}
					</span>
				) : (
					<Contactless />
				)}
			</div>

			<div className="flex items-end justify-between gap-4">
				<div className={`min-w-0 ${sm ? "origin-bottom-left scale-75" : ""}`}>
					<Chip />
				</div>
				<div className="text-right">
					<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">Balance</p>
					<p className={`font-semibold leading-tight tracking-tight ${sm ? "text-base" : "text-[22px] sm:text-2xl"}`}>{formatCents(card.current_balance_cents)}</p>
				</div>
			</div>

			<div>
				{card.credit_limit_cents > 0 ? (
					<div className={sm ? "mb-1.5" : "mb-2.5"}>
						<div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
							<div className="h-full rounded-full" style={{ width: `${Math.min((utilization ?? 0) * 100, 100)}%`, background: status.color }} />
						</div>
						<div className="mt-1 flex justify-between font-mono text-[10px] text-white/70">
							<span>
								{formatPercent(utilization)} used · {status.label}
							</span>
							<span>{formatCents(card.credit_limit_cents, { whole: true })} limit</span>
						</div>
					</div>
				) : (
					<p className="mb-2.5 font-mono text-[10px] text-white/60">No preset spending limit</p>
				)}
				<div className="flex items-center justify-between">
					<span className="font-mono text-[13px] tracking-[0.2em] text-white/85">•••• {card.last_four || "····"}</span>
					<NetworkMark network={card.network} />
				</div>
			</div>
		</div>
	);
}
