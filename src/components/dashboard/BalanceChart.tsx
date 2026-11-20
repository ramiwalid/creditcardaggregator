"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatCents, formatCompactCents, formatDate, parseISODate } from "@/lib/format";

export interface BalancePoint {
	date: string; // YYYY-MM-DD
	value: number; // cents
	note?: string;
}

const M = { top: 16, right: 20, bottom: 28, left: 60 };
const HEIGHT = 240;
const DAY = 86_400_000;
const LINE = "#8b7bff"; // validated against the panel surface (dark mode)

function niceStep(range: number) {
	const raw = range / 4;
	const mag = 10 ** Math.floor(Math.log10(raw));
	const n = raw / mag;
	return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

/** Single-series step chart of balance over time. Balance changes in discrete
 * jumps, so a step line is the honest shape. */
export default function BalanceChart({ points }: { points: BalancePoint[] }) {
	const wrapRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(0);
	const [active, setActive] = useState<number | null>(null);

	useEffect(() => {
		const el = wrapRef.current;
		if (!el) return;
		const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const geo = useMemo(() => {
		if (width === 0 || points.length === 0) return null;
		const ts = points.map((p) => parseISODate(p.date).getTime());
		let t0 = ts[0];
		let t1 = ts[ts.length - 1];
		if (t0 === t1) {
			t0 -= DAY;
			t1 += DAY;
		}
		const vals = points.map((p) => p.value);
		const lo = Math.min(0, ...vals);
		const hiRaw = Math.max(...vals, 0);
		const step = niceStep(Math.max(hiRaw - lo, 10_000));
		const yMin = Math.floor(lo / step) * step;
		const yMax = Math.max(Math.ceil(hiRaw / step) * step, yMin + step);
		const ticks: number[] = [];
		for (let v = yMin; v <= yMax + 1; v += step) ticks.push(v);

		const iw = width - M.left - M.right;
		const ih = HEIGHT - M.top - M.bottom;
		const x = (t: number) => M.left + ((t - t0) / (t1 - t0)) * iw;
		const y = (v: number) => M.top + (1 - (v - yMin) / (yMax - yMin)) * ih;

		const xs = ts.map(x);
		const ys = vals.map(y);
		let line = `M${xs[0]},${ys[0]}`;
		for (let i = 1; i < xs.length; i++) line += ` H${xs[i]} V${ys[i]}`;
		const endX = points.length === 1 ? x(t1) : xs[xs.length - 1];
		if (points.length === 1) line += ` H${endX}`;
		const baseY = y(Math.max(yMin, 0));
		const area = `${line} V${baseY} H${xs[0]} Z`;

		const xLabels = width > 480 && points.length > 2 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : [0, points.length - 1];
		return { xs, ys, line, area, ticks, y, xLabels: [...new Set(xLabels)], baseY };
	}, [points, width]);

	function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
		if (!geo) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const px = e.clientX - rect.left;
		let best = 0;
		for (let i = 1; i < geo.xs.length; i++) if (Math.abs(geo.xs[i] - px) < Math.abs(geo.xs[best] - px)) best = i;
		setActive(best);
	}

	function onKeyDown(e: React.KeyboardEvent) {
		if (!points.length) return;
		if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? points.length - 1) - 1));
		else if (e.key === "ArrowRight") setActive((a) => Math.min(points.length - 1, (a ?? points.length - 1) + 1));
		else return;
		e.preventDefault();
	}

	const last = points.length - 1;
	const shown = active ?? null;

	return (
		<div ref={wrapRef} className="relative w-full" style={{ height: HEIGHT }}>
			{geo ? (
				<svg
					width={width}
					height={HEIGHT}
					className="block touch-none outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-accent/60"
					role="img"
					tabIndex={0}
					aria-label={`Balance history, ${points.length} points, from ${formatCents(points[0].value)} on ${formatDate(points[0].date)} to ${formatCents(points[last].value)} on ${formatDate(points[last].date)}. Use arrow keys to inspect values.`}
					onPointerMove={onPointerMove}
					onPointerLeave={() => setActive(null)}
					onKeyDown={onKeyDown}
					onFocus={() => setActive(last)}
					onBlur={() => setActive(null)}
				>
					<defs>
						<linearGradient id="bal-area" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor={LINE} stopOpacity="0.16" />
							<stop offset="1" stopColor={LINE} stopOpacity="0.02" />
						</linearGradient>
					</defs>
					{geo.ticks.map((t) => (
						<g key={t}>
							<line x1={M.left} x2={width - M.right} y1={geo.y(t)} y2={geo.y(t)} stroke={t === 0 ? "rgb(255 255 255 / 0.16)" : "rgb(255 255 255 / 0.06)"} strokeWidth={1} shapeRendering="crispEdges" />
							<text x={M.left - 10} y={geo.y(t)} dy="0.32em" textAnchor="end" className="fill-subtle font-mono text-[10px] [font-variant-numeric:tabular-nums]">
								{formatCompactCents(t)}
							</text>
						</g>
					))}
					{geo.xLabels.map((i) => (
						<text key={i} x={geo.xs[i]} y={HEIGHT - 8} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="fill-subtle font-mono text-[10px]">
							{formatDate(points[i].date, { month: "short", day: "numeric" })}
						</text>
					))}
					<path d={geo.area} fill="url(#bal-area)" />
					<path d={geo.line} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

					{shown !== null ? (
						<line x1={geo.xs[shown]} x2={geo.xs[shown]} y1={M.top} y2={HEIGHT - M.bottom} stroke="rgb(255 255 255 / 0.25)" strokeWidth={1} shapeRendering="crispEdges" />
					) : null}
					{/* endpoint marker (always) + active marker; 2px surface ring */}
					<circle cx={geo.xs[last]} cy={geo.ys[last]} r={4} fill={LINE} stroke="#0a0c12" strokeWidth={2} />
					{shown !== null && shown !== last ? <circle cx={geo.xs[shown]} cy={geo.ys[shown]} r={4} fill={LINE} stroke="#0a0c12" strokeWidth={2} /> : null}
				</svg>
			) : null}

			{geo && shown !== null ? (
				<div
					className="pointer-events-none absolute z-10 min-w-36 rounded-xl border border-line-strong bg-elev/95 px-3 py-2 shadow-xl backdrop-blur"
					style={{
						left: Math.min(Math.max(geo.xs[shown] + 12, 8), width - 160),
						top: Math.max(geo.ys[shown] - 64, 0),
					}}
				>
					<p className="text-[15px] font-semibold text-fg">{formatCents(points[shown].value)}</p>
					<p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
						<span className="h-0.5 w-3 rounded-full" style={{ background: LINE }} />
						{formatDate(points[shown].date, { month: "short", day: "numeric", year: "numeric" })}
					</p>
					{points[shown].note ? <p className="mt-1 text-[11px] text-subtle">{points[shown].note}</p> : null}
				</div>
			) : null}
		</div>
	);
}
