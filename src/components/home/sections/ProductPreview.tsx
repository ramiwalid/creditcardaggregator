import CreditCardVisual, { type CardPreview } from "@/components/dashboard/CreditCardVisual";

const cards: CardPreview[] = [
	{ name: "Sapphire Preferred", issuer: "Chase", network: "visa", last_four: "1029", color: "ocean", current_balance_cents: 460000, credit_limit_cents: 2000000 },
	{ name: "Gold Card", issuer: "American Express", network: "amex", last_four: "3948", color: "sunset", current_balance_cents: 125050, credit_limit_cents: 0 },
	{ name: "Venture X", issuer: "Capital One", network: "mastercard", last_four: "7781", color: "violet", current_balance_cents: 290000, credit_limit_cents: 600000 },
];

const stats = [
	{ label: "Total balance", value: "$8,750.50", sub: "Across 3 cards" },
	{ label: "Utilization", value: "29%", sub: "Healthy", meter: 0.29 },
	{ label: "Due this month", value: "$200.00", sub: "3 minimum payments" },
];

const upcoming = [
	{ m: "NOV", d: "22", name: "Sapphire Preferred", amt: "$40.00", hot: true },
	{ m: "DEC", d: "04", name: "Gold Card", amt: "$125.00" },
	{ m: "DEC", d: "12", name: "Venture X", amt: "$35.00" },
];

/** Static, decorative mockup of the dashboard for the landing page. */
export default function ProductPreview() {
	return (
		<div aria-hidden="true" className="relative mx-auto w-full max-w-5xl select-none text-left [perspective:2000px]">
			<div className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[40px] bg-[radial-gradient(60%_50%_at_50%_30%,rgb(139_123_255/0.35),transparent_70%)] blur-2xl" />
			<div className="border-gradient overflow-hidden rounded-2xl bg-panel/90 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] [transform:rotateX(8deg)] origin-top">
				{/* window chrome */}
				<div className="flex items-center gap-3 border-b border-line px-4 py-3">
					<div className="flex gap-1.5">
						<span className="h-2.5 w-2.5 rounded-full bg-white/15" />
						<span className="h-2.5 w-2.5 rounded-full bg-white/15" />
						<span className="h-2.5 w-2.5 rounded-full bg-white/15" />
					</div>
					<div className="mx-auto flex items-center gap-2 rounded-md border border-line bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-subtle">
						<span className="h-1.5 w-1.5 rounded-full bg-good-text" /> quanta.app/dashboard
					</div>
					<div className="w-12" />
				</div>

				<div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1fr_260px]">
					<div className="space-y-4">
						<div className="grid grid-cols-3 gap-3">
							{stats.map((s) => (
								<div key={s.label} className="rounded-xl border border-line bg-white/[0.02] p-3 sm:p-4">
									<p className="font-mono text-[9px] uppercase tracking-[0.18em] text-subtle sm:text-[10px]">{s.label}</p>
									<p className="mt-1.5 text-base font-semibold tracking-tight sm:text-xl">{s.value}</p>
									{s.meter ? (
										<div className="mt-2 h-1 rounded-full bg-white/10">
											<div className="h-full rounded-full bg-good" style={{ width: `${s.meter * 100}%` }} />
										</div>
									) : null}
									<p className="mt-1.5 text-[10px] text-subtle sm:text-[11px]">{s.sub}</p>
								</div>
							))}
						</div>
						<div className="grid grid-cols-2 gap-3 sm:gap-4">
							{cards.slice(0, 2).map((c) => (
								<CreditCardVisual key={c.name} card={c} compact size="sm" />
							))}
						</div>
					</div>

					<div className="hidden space-y-3 md:block">
						<div className="rounded-xl border border-line bg-white/[0.02] p-4">
							<p className="text-[12px] font-medium text-fg">Upcoming payments</p>
							<ul className="mt-3 space-y-3">
								{upcoming.map((u) => (
									<li key={u.name} className="flex items-center gap-3">
										<div className={`flex h-9 w-9 flex-col items-center justify-center rounded-lg border font-mono leading-none ${u.hot ? "border-warning/40 bg-warning/10 text-warning" : "border-line bg-white/[0.03] text-muted"}`}>
											<span className="text-[7px]">{u.m}</span>
											<span className="text-[13px] font-semibold">{u.d}</span>
										</div>
										<span className="flex-1 truncate text-[12px] text-fg">{u.name}</span>
										<span className="font-mono text-[11px] text-muted">{u.amt}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="rounded-xl border border-line bg-white/[0.02] p-4">
							<p className="text-[12px] font-medium text-fg">Balance · 30 days</p>
							<svg viewBox="0 0 200 70" className="mt-3 h-20 w-full" preserveAspectRatio="none">
								<defs>
									<linearGradient id="pp-area" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0" stopColor="#8b7bff" stopOpacity="0.25" />
										<stop offset="1" stopColor="#8b7bff" stopOpacity="0" />
									</linearGradient>
								</defs>
								{[17.5, 35, 52.5].map((y) => <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="rgb(255 255 255 / 0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
								<path d="M0 50 L25 46 L50 48 L75 36 L100 40 L125 28 L150 31 L175 20 L200 24 L200 70 L0 70Z" fill="url(#pp-area)" />
								<path d="M0 50 L25 46 L50 48 L75 36 L100 40 L125 28 L150 31 L175 20 L200 24" fill="none" stroke="#8b7bff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
							</svg>
						</div>
					</div>
				</div>
			</div>
			{/* floating third card */}
			<div className="absolute -right-6 -bottom-10 hidden w-64 rotate-[8deg] animate-float lg:block xl:-right-16">
				<CreditCardVisual card={cards[2]} compact size="sm" />
			</div>
		</div>
	);
}
