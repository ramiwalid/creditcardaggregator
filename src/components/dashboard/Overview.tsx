"use client";

import Link from "next/link";
import { FiAlertTriangle, FiArrowUpRight, FiCalendar, FiClock, FiLink, FiPlus, FiRefreshCw, FiUser } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { formatCents, formatDate, formatPercent, utilizationTone } from "@/lib/format";
import { displayName, type Card, type CardSummary, type UpcomingPayment } from "@/lib/types";
import CreditCardVisual from "./CreditCardVisual";
import { useCards } from "./CardsProvider";
import { useBanks } from "./BanksProvider";
import { CARD_THEMES, UTILIZATION_STATUS } from "./cardStyles";
import { Panel, PanelHeader, StatusLabel, UtilizationMeter } from "./ui";

function greeting() {
	const h = new Date().getHours();
	return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Overview() {
	const { user } = useAuth();
	const { cards, summary, error, refresh, openAddCard, openProfile } = useCards();
	const banks = useBanks();
	const needsSignIn = banks.items.filter((i) => i.status === "login_required");
	const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

	return (
		<div className="space-y-8">
			<header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">{today}</p>
					<h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[34px]">
						{greeting()}, {displayName(user)}
					</h1>
					<p className="mt-1 text-[15px] text-muted">Here&apos;s where every card stands right now.</p>
				</div>
				{banks.enabled ? (
					<div className="flex gap-2 self-start sm:self-auto">
						<Button variant="secondary" onClick={openAddCard}>
							<FiPlus size={16} /> Add manually
						</Button>
						<Button onClick={banks.connectBank} disabled={banks.connecting}>
							<FiLink size={15} /> {banks.connecting ? "Connecting…" : "Connect bank"}
						</Button>
					</div>
				) : (
					<Button onClick={openAddCard} className="self-start sm:self-auto">
						<FiPlus size={16} /> Add card
					</Button>
				)}
			</header>

			{needsSignIn.map((item) => (
				<div key={item.id} role="alert" className="flex flex-col justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/[0.07] px-4 py-3 sm:flex-row sm:items-center">
					<p className="flex items-center gap-2.5 text-[14px] text-fg">
						<FiAlertTriangle className="flex-none text-warning" />
						{item.institution_name ?? "Your bank"} needs you to sign in again. Until then, its cards show the last synced data.
					</p>
					<Button size="sm" variant="secondary" onClick={() => banks.reconnect(item.id)} className="self-start sm:self-auto">Reconnect</Button>
				</div>
			))}

			{user && !user.first_name ? (
				<div className="flex flex-col justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/[0.07] px-4 py-3 sm:flex-row sm:items-center">
					<p className="flex items-center gap-2.5 text-[14px] text-fg">
						<FiUser className="text-accent" /> Add your name so Quanta knows what to call you.
					</p>
					<Button size="sm" variant="secondary" onClick={openProfile} className="self-start sm:self-auto">Add your name</Button>
				</div>
			) : null}

			{error ? (
				<div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-critical/40 bg-critical/10 px-4 py-3 text-[14px] text-critical-text">
					<span className="flex items-center gap-2"><FiAlertTriangle /> {error}</span>
					<Button size="sm" variant="secondary" onClick={refresh}><FiRefreshCw size={13} /> Retry</Button>
				</div>
			) : null}

			{cards === null || summary === null ? (
				!error && <LoadingSkeleton />
			) : cards.length === 0 ? (
				<EmptyState onAdd={openAddCard} onConnect={banks.enabled ? banks.connectBank : undefined} connecting={banks.connecting} />
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
						<BalanceHero summary={summary} />
						<UtilizationPanel summary={summary} />
					</div>
					<KpiRow summary={summary} />
					<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
						<section>
							<div className="mb-4 flex items-center justify-between">
								<h2 className="text-[15px] font-semibold">
									Your cards <span className="ml-1 font-mono text-[12px] font-normal text-subtle">{cards.length}</span>
								</h2>
							</div>
							<div className="grid gap-5 sm:grid-cols-2">
								{cards.map((card) => (
									<Link key={card.id} href={`/dashboard/cards/${card.id}`} className="group rounded-[22px] outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg">
										<CreditCardVisual card={card} className="transition-shadow duration-300 group-hover:shadow-[0_40px_70px_-25px_rgb(139_123_255/0.55)]" />
									</Link>
								))}
								<button
									onClick={openAddCard}
									className="flex aspect-[1.586] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-line-strong text-muted transition-colors hover:border-accent/60 hover:bg-accent/[0.04] hover:text-fg"
								>
									<span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-strong"><FiPlus size={18} /></span>
									<span className="text-[14px]">Add another card</span>
								</button>
							</div>
						</section>
						<aside className="space-y-4">
							<UpcomingPayments payments={summary.upcoming_payments} cards={cards} />
							<UtilizationBreakdown cards={cards} />
						</aside>
					</div>
				</>
			)}
		</div>
	);
}

function BalanceHero({ summary }: { summary: CardSummary }) {
	const stats = [
		["Available credit", formatCents(summary.total_available_cents, { whole: true })],
		["Total limit", formatCents(summary.total_limit_cents, { whole: true })],
		["Statement balances", formatCents(summary.total_statement_balance_cents)],
	];
	return (
		<Panel className="relative overflow-hidden lg:col-span-2">
			<div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
			<p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Total balance</p>
			<p className="mt-3 text-5xl font-semibold tracking-[-0.03em] sm:text-[56px]">{formatCents(summary.total_balance_cents)}</p>
			<p className="mt-2 text-[14px] text-muted">
				Across {summary.card_count} card{summary.card_count === 1 ? "" : "s"}
			</p>
			<dl className="mt-7 grid grid-cols-3 gap-4 border-t border-line pt-5">
				{stats.map(([k, v]) => (
					<div key={k}>
						<dt className="text-[12px] text-subtle">{k}</dt>
						<dd className="mt-1 text-[17px] font-semibold tracking-tight sm:text-lg">{v}</dd>
					</div>
				))}
			</dl>
		</Panel>
	);
}

function UtilizationPanel({ summary }: { summary: CardSummary }) {
	const u = summary.overall_utilization;
	const tone = utilizationTone(u);
	return (
		<Panel>
			<div className="flex items-start justify-between">
				<p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Overall utilization</p>
				<StatusLabel tone={tone} />
			</div>
			<p className="mt-3 text-5xl font-semibold tracking-[-0.03em]">{formatPercent(u)}</p>
			{u !== null ? (
				<>
					<UtilizationMeter value={u} className="mt-6" showThresholds />
					<p className="mt-4 text-[13px] leading-relaxed text-muted">
						{tone === "good"
							? "Nice. Keeping utilization under 30% is good for your credit score."
							: tone === "warning"
								? "A bit high. Paying balances below 30% of your limits can help your score."
								: "High utilization can weigh on your score. Prioritise paying down the fullest cards."}
					</p>
				</>
			) : (
				<p className="mt-4 text-[13px] text-muted">Add a credit limit to a card to track utilization.</p>
			)}
		</Panel>
	);
}

function KpiRow({ summary }: { summary: CardSummary }) {
	const next = summary.upcoming_payments[0];
	const tiles = [
		{
			icon: <FiCalendar size={15} />,
			label: "Minimum payments",
			value: formatCents(summary.total_minimum_due_cents),
			sub: `${summary.upcoming_payments.length} upcoming due date${summary.upcoming_payments.length === 1 ? "" : "s"}`,
		},
		{
			icon: <FiClock size={15} />,
			label: "Next payment",
			value: next ? formatDate(next.due_date, { month: "short", day: "numeric" }) : "None",
			sub: next ? `${next.card_name} · ${next.days_until_due === 0 ? "due today" : `in ${next.days_until_due} day${next.days_until_due === 1 ? "" : "s"}`}` : "Set a due day on a card",
		},
		{
			icon: <FiArrowUpRight size={15} />,
			label: "Annual fees",
			value: formatCents(summary.total_annual_fees_cents, { whole: true }),
			sub: "Per year, across all cards",
		},
	];
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{tiles.map((t) => (
				<Panel key={t.label} className="!p-5">
					<div className="flex items-center gap-2 text-[13px] text-muted">
						<span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-accent">{t.icon}</span>
						{t.label}
					</div>
					<p className="mt-3 text-2xl font-semibold tracking-tight">{t.value}</p>
					<p className="mt-1 truncate text-[12px] text-subtle">{t.sub}</p>
				</Panel>
			))}
		</div>
	);
}

function UpcomingPayments({ payments, cards }: { payments: UpcomingPayment[]; cards: Card[] }) {
	const colorOf = (id: number) => CARD_THEMES[cards.find((c) => c.id === id)?.color ?? "graphite"].dot;
	return (
		<Panel className="!p-0">
			<PanelHeader title="Upcoming payments" className="px-5 pt-5" />
			{payments.length === 0 ? (
				<p className="px-5 pb-5 pt-2 text-[13px] text-subtle">Set a payment due day on your cards to see them here.</p>
			) : (
				<ul className="mt-2 pb-2">
					{payments.map((p) => {
						const soon = p.days_until_due <= 3;
						return (
							<li key={p.card_id}>
								<Link href={`/dashboard/cards/${p.card_id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.03]">
									<div className={`flex h-11 w-11 flex-none flex-col items-center justify-center rounded-xl border font-mono leading-none ${soon ? "border-warning/40 bg-warning/10" : "border-line bg-white/[0.02]"}`}>
										<span className="text-[9px] uppercase text-subtle">{formatDate(p.due_date, { month: "short" })}</span>
										<span className="mt-0.5 text-[15px] font-semibold text-fg">{formatDate(p.due_date, { day: "numeric" })}</span>
									</div>
									<div className="min-w-0 flex-1">
										<p className="flex items-center gap-2 truncate text-[14px] font-medium text-fg">
											<span className="h-2 w-2 flex-none rounded-full" style={{ background: colorOf(p.card_id) }} />
											<span className="truncate">{p.card_name}</span>
										</p>
										<p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-subtle">
											{soon ? <FiAlertTriangle size={11} className="text-warning" /> : null}
											{p.days_until_due === 0 ? "Due today" : `Due in ${p.days_until_due} day${p.days_until_due === 1 ? "" : "s"}`}
										</p>
									</div>
									<div className="text-right">
										<p className="font-mono text-[13px] text-fg">{formatCents(p.minimum_payment_cents)}</p>
										<p className="text-[11px] text-subtle">minimum</p>
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</Panel>
	);
}

function UtilizationBreakdown({ cards }: { cards: Card[] }) {
	const withLimits = cards.filter((c) => c.utilization !== null).sort((a, b) => (b.utilization ?? 0) - (a.utilization ?? 0));
	if (withLimits.length === 0) return null;
	return (
		<Panel>
			<PanelHeader title="Utilization by card" />
			<ul className="mt-4 space-y-4">
				{withLimits.map((c) => {
					const tone = utilizationTone(c.utilization);
					return (
						<li key={c.id}>
							<div className="flex items-center justify-between gap-3 text-[13px]">
								<span className="truncate text-fg">{c.name}</span>
								<span className="flex-none font-mono text-[12px] text-muted">
									{formatPercent(c.utilization)} · {UTILIZATION_STATUS[tone].label}
								</span>
							</div>
							<UtilizationMeter value={c.utilization ?? 0} className="mt-2" />
						</li>
					);
				})}
			</ul>
		</Panel>
	);
}

function EmptyState({ onAdd, onConnect, connecting }: { onAdd: () => void; onConnect?: () => void; connecting?: boolean }) {
	return (
		<div className="border-gradient relative overflow-hidden rounded-3xl bg-panel px-6 py-20 text-center">
			<div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
			<div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_123_255/0.25),transparent)]" />
			<div className="relative mx-auto max-w-md">
				<div className="mx-auto w-56 -rotate-6 animate-float">
					<CreditCardVisual compact size="sm" card={{ name: "Your first card", issuer: "Any issuer", network: "visa", last_four: null, color: "violet", current_balance_cents: 0, credit_limit_cents: 0 }} />
				</div>
				<h2 className="mt-10 text-2xl font-semibold tracking-tight">Add your first card</h2>
				<p className="mt-2 text-[15px] leading-relaxed text-muted">
					{onConnect
						? "Connect your bank to import every card automatically, or enter one by hand. Quanta tracks utilization and upcoming payments across everything you own."
						: "Enter a balance, limit, and due date. Quanta will track utilization and upcoming payments across everything you own."}
				</p>
				{onConnect ? (
					<div className="mt-7 flex flex-wrap justify-center gap-3">
						<Button onClick={onConnect} size="lg" disabled={connecting}>
							<FiLink /> {connecting ? "Connecting…" : "Connect a bank"}
						</Button>
						<Button onClick={onAdd} size="lg" variant="secondary">
							<FiPlus /> Add manually
						</Button>
					</div>
				) : (
					<Button onClick={onAdd} size="lg" className="mt-7">
						<FiPlus /> Add a card
					</Button>
				)}
			</div>
		</div>
	);
}

function LoadingSkeleton() {
	return (
		<div className="space-y-4" aria-busy="true" aria-label="Loading">
			<div className="grid gap-4 lg:grid-cols-3">
				<div className="h-56 animate-pulse rounded-3xl bg-white/[0.04] lg:col-span-2" />
				<div className="h-56 animate-pulse rounded-3xl bg-white/[0.04]" />
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				{[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/[0.04]" />)}
			</div>
		</div>
	);
}
