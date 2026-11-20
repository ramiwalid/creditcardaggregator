import { FiActivity, FiCalendar, FiCreditCard, FiEyeOff, FiGrid, FiPieChart } from "react-icons/fi";
import type { ReactNode } from "react";
import Reveal, { SectionHeader } from "../Reveal";

function Panel({ icon, title, children, className = "", visual }: { icon: ReactNode; title: string; children: ReactNode; className?: string; visual?: ReactNode }) {
	return (
		<div className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 transition-colors hover:border-line-strong sm:p-7 ${className}`}>
			<div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
			<div className="flex h-9 w-9 items-center justify-center rounded-xl border border-line-strong bg-white/[0.04] text-accent">{icon}</div>
			<h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
			<p className="mt-2 text-[15px] leading-relaxed text-muted">{children}</p>
			{visual ? <div className="mt-6 flex-1">{visual}</div> : null}
		</div>
	);
}

const bars = [
	{ name: "Sapphire", pct: 23, tone: "bg-good", label: "Healthy" },
	{ name: "Venture X", pct: 48, tone: "bg-warning", label: "Elevated" },
	{ name: "Freedom", pct: 61, tone: "bg-critical", label: "High" },
];

export default function Features() {
	return (
		<section id="features" className="relative py-28">
			<div className="mx-auto max-w-6xl px-5 sm:px-6">
				<SectionHeader
					eyebrow="Features"
					title={<>Everything you need to stay ahead of your cards</>}
					description="Five banking apps, five logins, five due dates. Quanta replaces all of that with a single view that tells you what matters today."
				/>

				<div className="mt-16 grid gap-4 md:grid-cols-6">
					<Reveal className="md:col-span-4">
						<Panel
							icon={<FiGrid size={17} />}
							title="Every balance, one glance"
							visual={
								<div className="grid grid-cols-3 gap-3 rounded-2xl border border-line bg-bg/60 p-4">
									{[
										["Total balance", "$8,750.50"],
										["Available credit", "$18,500"],
										["Minimums due", "$200.00"],
									].map(([k, v]) => (
										<div key={k}>
											<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">{k}</p>
											<p className="mt-1 text-lg font-semibold tracking-tight sm:text-2xl">{v}</p>
										</div>
									))}
								</div>
							}
						>
							Total balance, available credit, statement balances, and minimum payments roll up automatically across all of your cards.
						</Panel>
					</Reveal>

					<Reveal className="md:col-span-2" delay={80}>
						<Panel
							icon={<FiEyeOff size={17} />}
							title="Private by design"
							visual={
								<div className="space-y-2 rounded-2xl border border-line bg-bg/60 p-4 font-mono text-[13px]">
									<div className="flex items-center justify-between">
										<span className="text-subtle">card number</span>
										<span className="tracking-[0.15em] text-fg">•••• •••• •••• 1029</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-subtle">cvv · expiry</span>
										<span className="text-muted">never collected</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-subtle">bank password</span>
										<span className="text-muted">never seen</span>
									</div>
								</div>
							}
						>
							Bank sign-in happens on Plaid&apos;s screen, never ours. No full card numbers, no CVVs. Just the last four digits.
						</Panel>
					</Reveal>

					<Reveal className="md:col-span-3">
						<Panel
							icon={<FiPieChart size={17} />}
							title="Utilization, decoded"
							visual={
								<ul className="space-y-3">
									{bars.map((b) => (
										<li key={b.name}>
											<div className="flex justify-between text-[13px]">
												<span className="text-fg">{b.name}</span>
												<span className="font-mono text-muted">
													{b.pct}% · {b.label}
												</span>
											</div>
											<div className="mt-1.5 h-1.5 rounded-full bg-white/[0.07]">
												<div className={`h-full rounded-full ${b.tone}`} style={{ width: `${b.pct}%` }} />
											</div>
										</li>
									))}
								</ul>
							}
						>
							See per-card and overall utilization with clear thresholds, so you know which balance to pay down first.
						</Panel>
					</Reveal>

					<Reveal className="md:col-span-3" delay={80}>
						<Panel
							icon={<FiCalendar size={17} />}
							title="Due-date radar"
							visual={
								<ul className="divide-y divide-line rounded-2xl border border-line bg-bg/60">
									{[
										["Today", "Sapphire Preferred", "$40.00", "text-warning"],
										["In 14 days", "Gold Card", "$125.00", "text-muted"],
										["In 22 days", "Venture X", "$35.00", "text-muted"],
									].map(([when, name, amt, tone]) => (
										<li key={name} className="flex items-center gap-3 px-4 py-3 text-[13px]">
											<span className={`w-20 font-mono text-[11px] ${tone}`}>{when}</span>
											<span className="flex-1 truncate">{name}</span>
											<span className="font-mono text-muted">{amt}</span>
										</li>
									))}
								</ul>
							}
						>
							Upcoming payments sorted by urgency, with short months handled for you (a due date on the 31st still lands correctly in February).
						</Panel>
					</Reveal>

					<Reveal className="md:col-span-2">
						<Panel
							icon={<FiCreditCard size={17} />}
							title="Any issuer, any network"
							visual={
								<div className="grid grid-cols-2 gap-2">
									<span className="flex h-12 items-center justify-center rounded-xl border border-line bg-bg/60 text-lg font-bold italic tracking-wide">VISA</span>
									<span className="flex h-12 items-center justify-center rounded-xl border border-line bg-bg/60">
										<span className="h-6 w-6 rounded-full bg-[#eb001b]/90" />
										<span className="-ml-2.5 h-6 w-6 rounded-full bg-[#f79e1b]/85 mix-blend-screen" />
									</span>
									<span className="flex h-12 items-center justify-center rounded-xl border border-line bg-bg/60 font-mono text-[12px] font-semibold tracking-[0.2em]">AMEX</span>
									<span className="flex h-12 items-center justify-center rounded-xl border border-line bg-bg/60 font-mono text-[12px] font-semibold tracking-[0.1em]">DISCOVER</span>
								</div>
							}
						>
							Visa, Mastercard, Amex, and Discover, including charge cards with no preset limit.
						</Panel>
					</Reveal>

					<Reveal className="md:col-span-4" delay={80}>
						<Panel
							icon={<FiActivity size={17} />}
							title="A ledger for every card"
							visual={
								<div className="rounded-2xl border border-line bg-bg/60 p-1 font-mono text-[12px]">
									{[
										["Nov 20", "Autopay", "−$600.00", "text-good-text"],
										["Nov 18", "Flight to SFO", "+$412.30", "text-fg"],
										["Nov 15", "Groceries", "+$82.15", "text-fg"],
									].map(([d, desc, amt, tone]) => (
										<div key={desc} className="flex items-center gap-4 rounded-xl px-3 py-2.5 hover:bg-white/[0.03]">
											<span className="w-14 text-subtle">{d}</span>
											<span className="flex-1 truncate font-sans text-[13px] text-fg">{desc}</span>
											<span className={tone}>{amt}</span>
										</div>
									))}
								</div>
							}
						>
							Log payments and charges between statements. Balances update instantly, and your balance history charts itself.
						</Panel>
					</Reveal>
				</div>
			</div>
		</section>
	);
}
