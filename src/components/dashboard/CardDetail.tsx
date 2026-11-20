"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowDownLeft, FiArrowUpRight, FiChevronRight, FiEdit2, FiTrash2, FiActivity, FiLink, FiRefreshCw } from "react-icons/fi";
import { useBanks } from "./BanksProvider";
import { SyncStatus } from "./BanksModal";
import { Button } from "@/components/ui/Button";
import { FormAlert, inputClass } from "@/components/ui/Field";
import { api, ApiError } from "@/lib/api";
import { centsToInput, formatCents, formatDate, formatPercent, ordinal, parseDollars, relativeDays, todayISO, utilizationTone } from "@/lib/format";
import type { Card, Transaction, TransactionKind } from "@/lib/types";
import BalanceChart, { type BalancePoint } from "./BalanceChart";
import CreditCardVisual from "./CreditCardVisual";
import { useCards } from "./CardsProvider";
import { NETWORK_LABELS } from "./cardStyles";
import { Panel, PanelHeader, StatusLabel, UtilizationMeter } from "./ui";

const delta = (tx: Transaction) => (tx.kind === "charge" ? tx.amount_cents : -tx.amount_cents);

function shiftDay(iso: string, days: number) {
	const d = new Date(iso + "T00:00:00");
	d.setDate(d.getDate() + days);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Walk back from the current balance through the ledger (newest first) to get
 * the balance after each entry, plus a per-day series for the chart. */
function buildHistory(card: Card, txs: Transaction[]) {
	const after = new Map<number, number>();
	let bal = card.current_balance_cents;
	for (const tx of txs) {
		after.set(tx.id, bal);
		bal -= delta(tx);
	}
	const points: BalancePoint[] = [];
	if (txs.length > 0) {
		const asc = [...txs].reverse();
		points.push({ date: shiftDay(asc[0].occurred_on, -1), value: bal, note: "Before logged activity" });
		for (const tx of asc) {
			const v = after.get(tx.id)!;
			const label = `${tx.kind === "payment" ? "Payment" : "Charge"} ${formatCents(tx.amount_cents)}${tx.description ? ` · ${tx.description}` : ""}`;
			const prev = points[points.length - 1];
			if (prev.date === tx.occurred_on) {
				prev.value = v;
				prev.note = "Multiple entries";
			} else points.push({ date: tx.occurred_on, value: v, note: label });
		}
		const today = todayISO();
		if (points[points.length - 1].date < today) points.push({ date: today, value: card.current_balance_cents, note: "Today" });
	}
	return { after, points };
}

export default function CardDetail({ cardId }: { cardId: number }) {
	const router = useRouter();
	const { cards, refresh, openEditCard } = useCards();
	const banks = useBanks();
	const card = cards?.find((c) => c.id === cardId);
	const linked = card?.source === "plaid";
	const item = banks.itemFor(card?.plaid_item_id);
	const itemSyncing = item ? banks.syncing.has(item.id) : false;

	const [txs, setTxs] = useState<Transaction[] | null>(null);
	const [loadError, setLoadError] = useState("");
	const [confirmDelete, setConfirmDelete] = useState(false);

	const loadTxs = useCallback(async () => {
		try {
			setTxs(await api.listTransactions(cardId));
			setLoadError("");
		} catch (err) {
			setLoadError(err instanceof ApiError ? err.message : "Couldn't load activity.");
		}
	}, [cardId]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state is set after the await
		loadTxs();
	}, [loadTxs, banks.dataVersion]); // reload after a bank sync

	const history = useMemo(() => (card && txs ? buildHistory(card, txs) : null), [card, txs]);
	// Bank activity is limited to ~90 days of posted entries, so walking back
	// from the bank's balance can produce impossible history (e.g. deeply
	// negative). Don't chart an estimate we can't stand behind.
	const historyReliable = !linked || !history || history.points.every((p) => p.value >= -5000);

	if (cards === null) return <div className="h-96 animate-pulse rounded-3xl bg-white/[0.04]" />;
	if (!card) {
		return (
			<div className="py-24 text-center">
				<p className="font-mono text-[12px] text-subtle">404</p>
				<h1 className="mt-2 text-2xl font-semibold">Card not found</h1>
				<p className="mt-2 text-muted">It may have been deleted.</p>
				<Link href="/dashboard" className="mt-6 inline-block text-accent hover:underline">Back to overview</Link>
			</div>
		);
	}

	async function deleteCard() {
		try {
			await api.deleteCard(cardId);
			router.push("/dashboard");
			await refresh();
		} catch (err) {
			setLoadError(err instanceof ApiError ? err.message : "Couldn't delete the card.");
		}
	}

	const afterChange = async () => {
		await Promise.all([loadTxs(), refresh()]);
	};

	const tone = utilizationTone(card.utilization);

	return (
		<div className="space-y-6">
			<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-subtle">
				<Link href="/dashboard" className="hover:text-fg">Overview</Link>
				<FiChevronRight size={13} />
				<span className="text-muted">{card.name}</span>
			</nav>

			<header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
						{card.issuer} · {NETWORK_LABELS[card.network]}{card.last_four ? ` · •••• ${card.last_four}` : ""}
					</p>
					<h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[34px]">{card.name}</h1>
					{linked ? (
						<div className="mt-2.5 flex flex-wrap items-center gap-3">
							<span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[12px] text-fg">
								<FiLink size={11} className="text-accent" /> Linked
							</span>
							{item ? <SyncStatus item={item} syncing={itemSyncing} /> : null}
						</div>
					) : null}
				</div>
				<div className="flex gap-2">
					{linked ? (
						<>
							{item?.status === "login_required" ? (
								<Button variant="secondary" size="sm" onClick={() => banks.reconnect(item.id)}>Reconnect</Button>
							) : item ? (
								<Button variant="ghost" size="sm" disabled={itemSyncing} onClick={() => banks.syncItem(item.id)}>
									<FiRefreshCw size={13} className={itemSyncing ? "animate-spin" : ""} /> Sync now
								</Button>
							) : null}
							<Button variant="secondary" size="sm" onClick={() => openEditCard(card)}><FiEdit2 size={13} /> Edit card</Button>
						</>
					) : confirmDelete ? (
						<>
							<Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
							<Button variant="danger" size="sm" onClick={deleteCard}><FiTrash2 size={13} /> Confirm delete</Button>
						</>
					) : (
						<>
							<Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}><FiTrash2 size={13} /> Delete</Button>
							<Button variant="secondary" size="sm" onClick={() => openEditCard(card)}><FiEdit2 size={13} /> Edit card</Button>
						</>
					)}
				</div>
			</header>

			{loadError ? <FormAlert>{loadError}</FormAlert> : null}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
				<div className="space-y-4">
					<CreditCardVisual card={card} className="mx-auto max-w-[420px]" />
					<Panel className="!p-5">
						<div className="flex items-center justify-between">
							<p className="text-[13px] text-muted">Utilization</p>
							<StatusLabel tone={tone} />
						</div>
						{card.utilization !== null ? (
							<>
								<p className="mt-2 text-3xl font-semibold tracking-tight">{formatPercent(card.utilization)}</p>
								<UtilizationMeter value={card.utilization} className="mt-4" showThresholds />
							</>
						) : (
							<p className="mt-2 text-[13px] text-subtle">This card has no preset limit.</p>
						)}
					</Panel>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
						<Stat label="Current balance" value={formatCents(card.current_balance_cents)} />
						<Stat label="Available" value={card.credit_limit_cents > 0 ? formatCents(card.available_credit_cents) : "—"} sub={card.credit_limit_cents > 0 ? `of ${formatCents(card.credit_limit_cents, { whole: true })}` : "No preset limit"} />
						<Stat label="Statement balance" value={formatCents(card.statement_balance_cents)} sub={card.next_statement_date ? `Closes ${formatDate(card.next_statement_date)}` : undefined} />
						<Stat label="Minimum due" value={formatCents(card.minimum_payment_cents)} sub={card.next_due_date ? `${formatDate(card.next_due_date)} · ${relativeDays(card.days_until_due).replace("Due ", "")}` : "Due day not set"} />
					</div>
					<Panel className="!p-5">
						<PanelHeader
							title="Balance history"
							action={<span className="font-mono text-[11px] text-subtle">{linked ? (historyReliable ? "estimated from bank activity" : "") : "from logged activity"}</span>}
						/>
						<div className="mt-4">
							{txs === null ? (
								<div className="h-[240px] animate-pulse rounded-2xl bg-white/[0.03]" />
							) : history && history.points.length > 0 && historyReliable ? (
								<BalanceChart points={history.points} />
							) : history && history.points.length > 0 ? (
								<div className="flex h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 text-center">
									<FiActivity className="text-subtle" size={22} />
									<p className="mt-3 text-[14px] text-muted">No reliable history to chart</p>
									<p className="mt-1 max-w-sm text-[13px] text-subtle">
										Your bank&apos;s recent activity doesn&apos;t fully account for the current balance (usually older or pending charges), so Quanta won&apos;t guess.
									</p>
								</div>
							) : (
								<div className="flex h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-line text-center">
									<FiActivity className="text-subtle" size={22} />
									<p className="mt-3 text-[14px] text-muted">No history yet</p>
									<p className="mt-1 max-w-xs text-[13px] text-subtle">
										{linked
											? item?.transactions_pending
												? "Importing activity from your bank. This usually takes a few seconds."
												: "No posted activity from your bank in the last 90 days."
											: "Log a payment or charge and your balance history will chart itself here."}
									</p>
								</div>
							)}
						</div>
					</Panel>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
				<div className="space-y-4">
					{linked ? <LinkedNotice issuer={card.issuer} onOpenBanks={banks.openBanks} /> : <LogActivity card={card} onLogged={afterChange} />}
					<Details card={card} />
				</div>
				<Ledger txs={txs} after={historyReliable ? history?.after : undefined} cardId={card.id} onChanged={afterChange} linked={linked} importing={!!item?.transactions_pending} />
			</div>
		</div>
	);
}

function LinkedNotice({ issuer, onOpenBanks }: { issuer: string; onOpenBanks: () => void }) {
	return (
		<Panel className="!p-5">
			<PanelHeader title="Synced from your bank" />
			<p className="mt-3 text-[13px] leading-relaxed text-muted">
				Balances, limit, due dates, and activity come from {issuer} and update each time you open Quanta.
				You can still rename this card, change its theme, and track its annual fee and rewards.
			</p>
			<button onClick={onOpenBanks} className="mt-4 cursor-pointer text-[13px] text-accent hover:underline">
				Manage bank connections
			</button>
		</Panel>
	);
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<Panel className="!rounded-2xl !p-4">
			<p className="text-[12px] text-subtle">{label}</p>
			<p className="mt-1.5 text-xl font-semibold tracking-tight">{value}</p>
			{sub ? <p className="mt-0.5 truncate text-[11px] text-subtle">{sub}</p> : null}
		</Panel>
	);
}

function Details({ card }: { card: Card }) {
	const rows: [string, string][] = [
		["Payment due", card.payment_due_day ? `${ordinal(card.payment_due_day)} of each month` : "Not set"],
		["Statement closes", card.statement_close_day ? `${ordinal(card.statement_close_day)} of each month` : "Not set"],
		["APR", card.apr != null ? `${card.apr}%` : "—"],
		["Annual fee", card.annual_fee_cents ? formatCents(card.annual_fee_cents) : "None"],
		["Credit limit", card.credit_limit_cents ? formatCents(card.credit_limit_cents) : "No preset limit"],
		["Rewards", card.rewards ?? "—"],
	];
	return (
		<Panel className="!p-5">
			<PanelHeader title="Card details" />
			<dl className="mt-3 divide-y divide-line">
				{rows.map(([k, v]) => (
					<div key={k} className="flex justify-between gap-4 py-2.5 text-[13px]">
						<dt className="text-subtle">{k}</dt>
						<dd className="text-right text-fg">{v}</dd>
					</div>
				))}
			</dl>
		</Panel>
	);
}

function LogActivity({ card, onLogged }: { card: Card; onLogged: () => Promise<void> }) {
	const [kind, setKind] = useState<TransactionKind>("payment");
	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState(todayISO);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	const quick =
		kind === "payment"
			? ([
					["Minimum", card.minimum_payment_cents],
					["Statement", card.statement_balance_cents],
					["Full balance", card.current_balance_cents],
				] as const).filter(([, v]) => v != null && v > 0)
			: [];

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		const cents = parseDollars(amount);
		if (cents === null || Number.isNaN(cents) || cents <= 0) {
			setError("Enter an amount greater than zero.");
			return;
		}
		setError("");
		setSaving(true);
		try {
			await api.addTransaction(card.id, { kind, amount_cents: cents, description: description.trim() || null, occurred_on: date || null });
			setAmount("");
			setDescription("");
			await onLogged();
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Couldn't save that.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Panel className="border-gradient !p-5">
			<PanelHeader title="Log activity" />
			<p className="mt-1 text-[12px] text-subtle">Payments lower the balance. Charges raise it.</p>
			<form onSubmit={submit} className="mt-4 space-y-3" noValidate>
				<div role="tablist" aria-label="Entry type" className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-bg/60 p-1 text-[13px]">
					{(["payment", "charge"] as const).map((k) => (
						<button
							key={k}
							type="button"
							role="tab"
							aria-selected={kind === k}
							onClick={() => setKind(k)}
							className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 capitalize transition-colors ${kind === k ? "bg-white/[0.08] text-fg shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]" : "text-subtle hover:text-fg"}`}
						>
							{k === "payment" ? <FiArrowDownLeft size={14} /> : <FiArrowUpRight size={14} />}
							{k}
						</button>
					))}
				</div>

				<div className="relative">
					<span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-mono text-xl text-subtle">$</span>
					<input
						aria-label="Amount"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder="0.00"
						inputMode="decimal"
						className={`${inputClass} h-14 pl-9 font-mono text-2xl tracking-tight`}
					/>
				</div>
				{quick.length ? (
					<div className="flex flex-wrap gap-1.5">
						{quick.map(([label, v]) => (
							<button
								key={label}
								type="button"
								onClick={() => setAmount(centsToInput(v))}
								className="cursor-pointer rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/50 hover:text-fg"
							>
								{label} <span className="font-mono text-subtle">{formatCents(v, { whole: (v ?? 0) % 100 === 0 })}</span>
							</button>
						))}
					</div>
				) : null}

				<div className="grid grid-cols-1 gap-2">
					<input aria-label="Date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={`${inputClass} font-mono text-[13px] [color-scheme:dark]`} />
					<input aria-label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={kind === "payment" ? "Autopay…" : "Groceries…"} maxLength={120} className={`${inputClass} text-[14px]`} />
				</div>
				{error ? <p className="text-[12px] text-critical-text">{error}</p> : null}
				<Button type="submit" className="w-full" disabled={saving}>
					{saving ? "Saving…" : `Log ${kind}`}
				</Button>
			</form>
		</Panel>
	);
}

function Ledger({ txs, after, cardId, onChanged, linked, importing }: { txs: Transaction[] | null; after?: Map<number, number>; cardId: number; onChanged: () => Promise<void>; linked?: boolean; importing?: boolean }) {
	const [error, setError] = useState("");

	async function remove(tx: Transaction) {
		try {
			await api.deleteTransaction(cardId, tx.id);
			await onChanged();
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Couldn't delete that entry.");
		}
	}

	const groups = useMemo(() => {
		const map = new Map<string, Transaction[]>();
		for (const tx of txs ?? []) {
			const key = formatDate(tx.occurred_on, { month: "long", year: "numeric" });
			map.set(key, [...(map.get(key) ?? []), tx]);
		}
		return [...map.entries()];
	}, [txs]);

	const totals = useMemo(() => {
		const paid = (txs ?? []).filter((t) => t.kind === "payment").reduce((s, t) => s + t.amount_cents, 0);
		const charged = (txs ?? []).filter((t) => t.kind === "charge").reduce((s, t) => s + t.amount_cents, 0);
		return { paid, charged };
	}, [txs]);

	return (
		<Panel className="!p-0">
			<div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
				<h2 className="text-[15px] font-semibold">Activity</h2>
				{txs && txs.length ? (
					<div className="flex gap-4 font-mono text-[11px] text-subtle">
						<span>paid <span className="text-good-text">{formatCents(totals.paid)}</span></span>
						<span>charged <span className="text-fg">{formatCents(totals.charged)}</span></span>
					</div>
				) : null}
			</div>
			{error ? <div className="px-5 pt-3"><FormAlert>{error}</FormAlert></div> : null}

			{txs === null ? (
				<div className="space-y-2 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.03]" />)}</div>
			) : txs.length === 0 ? (
				<p className="px-5 pb-6 pt-4 text-[14px] text-subtle">
					{linked
						? importing
							? "Importing activity from your bank…"
							: "No posted activity from your bank in the last 90 days."
						: "No activity logged yet. Entries you log will appear here with a running balance."}
				</p>
			) : (
				<div className="mt-3 overflow-x-auto pb-2">
					<table className="w-full min-w-[520px] text-[13px]">
						<thead>
							<tr className="border-y border-line font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
								<th className="px-5 py-2.5 text-left font-normal">Date</th>
								<th className="px-2 py-2.5 text-left font-normal">Description</th>
								<th className="px-2 py-2.5 text-right font-normal">Amount</th>
								{after ? <th className="px-2 py-2.5 text-right font-normal">Balance</th> : null}
								<th className="w-12 px-5" aria-label="Actions" />
							</tr>
						</thead>
						{groups.map(([month, rows]) => (
							<tbody key={month}>
								<tr>
									<td colSpan={after ? 5 : 4} className="px-5 pb-1.5 pt-4 text-[11px] font-medium text-muted">{month}</td>
								</tr>
								{rows.map((tx) => (
									<tr key={tx.id} className="group border-b border-line/60 last:border-0 hover:bg-white/[0.02]">
										<td className="whitespace-nowrap px-5 py-3 font-mono text-[12px] text-subtle [font-variant-numeric:tabular-nums]">{formatDate(tx.occurred_on, { month: "short", day: "2-digit" })}</td>
										<td className="px-2 py-3">
											<div className="flex items-center gap-2.5">
												<span className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg border ${tx.kind === "payment" ? "border-good/30 bg-good/10 text-good-text" : "border-line bg-white/[0.03] text-muted"}`}>
													{tx.kind === "payment" ? <FiArrowDownLeft size={13} /> : <FiArrowUpRight size={13} />}
												</span>
												<span className="min-w-0">
													<span className="block truncate text-fg">{tx.description || (tx.kind === "payment" ? "Payment" : "Charge")}</span>
													<span className="block text-[11px] capitalize text-subtle">{tx.kind}</span>
												</span>
											</div>
										</td>
										<td className={`whitespace-nowrap px-2 py-3 text-right font-mono [font-variant-numeric:tabular-nums] ${tx.kind === "payment" ? "text-good-text" : "text-fg"}`}>
											{tx.kind === "payment" ? "−" : "+"}
											{formatCents(tx.amount_cents)}
										</td>
										{after ? <td className="whitespace-nowrap px-2 py-3 text-right font-mono text-subtle [font-variant-numeric:tabular-nums]">{formatCents(after.get(tx.id))}</td> : null}
										<td className="px-5 py-3 text-right">
											{tx.synced ? null : <button
												onClick={() => remove(tx)}
												aria-label={`Delete ${tx.description || tx.kind}`}
												className="cursor-pointer rounded-lg p-1.5 text-subtle opacity-100 transition hover:bg-critical/10 hover:text-critical-text focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
											>
												<FiTrash2 size={13} />
											</button>}
										</td>
									</tr>
								))}
							</tbody>
						))}
					</table>
				</div>
			)}
		</Panel>
	);
}
