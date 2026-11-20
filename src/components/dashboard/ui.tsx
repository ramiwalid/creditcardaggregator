import { FiAlertTriangle, FiCheckCircle, FiMinusCircle, FiAlertOctagon } from "react-icons/fi";
import { UTILIZATION_STATUS } from "./cardStyles";

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return <div className={`rounded-3xl border border-line bg-panel/70 p-6 backdrop-blur ${className}`}>{children}</div>;
}

export function PanelHeader({ title, action, className = "" }: { title: string; action?: React.ReactNode; className?: string }) {
	return (
		<div className={`flex items-center justify-between gap-3 ${className}`}>
			<h2 className="text-[15px] font-semibold text-fg">{title}</h2>
			{action}
		</div>
	);
}

type Tone = keyof typeof UTILIZATION_STATUS;

const ICONS: Record<Tone, React.ReactNode> = {
	good: <FiCheckCircle size={12} />,
	warning: <FiAlertTriangle size={12} />,
	critical: <FiAlertOctagon size={12} />,
	none: <FiMinusCircle size={12} />,
};

/** Status is never color alone: icon + label + color. */
export function StatusLabel({ tone }: { tone: Tone }) {
	const s = UTILIZATION_STATUS[tone];
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[12px] text-fg">
			<span style={{ color: s.color }}>{ICONS[tone]}</span>
			{s.label}
		</span>
	);
}

/** Meter: fill carries severity; optional ticks mark the 30% / 50% thresholds. */
export function UtilizationMeter({ value, className = "", showThresholds }: { value: number; className?: string; showThresholds?: boolean }) {
	const pct = Math.min(Math.max(value, 0), 1) * 100;
	const tone: Tone = value < 0.3 ? "good" : value < 0.5 ? "warning" : "critical";
	return (
		<div className={className}>
			<div
				className="relative h-2 w-full rounded-full bg-white/[0.07]"
				role="meter"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(pct)}
				aria-label={`Utilization ${Math.round(pct)}%, ${UTILIZATION_STATUS[tone].label}`}
			>
				<div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: UTILIZATION_STATUS[tone].color }} />
				{showThresholds
					? [30, 50].map((t) => <span key={t} className="absolute -top-1 h-4 w-px bg-white/30" style={{ left: `${t}%` }} />)
					: null}
			</div>
			{showThresholds ? (
				<div className="relative mt-1.5 h-4 font-mono text-[10px] text-subtle">
					<span className="absolute left-0">0%</span>
					<span className="absolute -translate-x-1/2" style={{ left: "30%" }}>30%</span>
					<span className="absolute -translate-x-1/2" style={{ left: "50%" }}>50%</span>
					<span className="absolute right-0">100%</span>
				</div>
			) : null}
		</div>
	);
}
