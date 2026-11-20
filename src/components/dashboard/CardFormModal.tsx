"use client";

import { useId, useState } from "react";
import { FiCheck, FiChevronDown, FiLock } from "react-icons/fi";
import Modal from "./Modal";
import CreditCardVisual from "./CreditCardVisual";
import { CARD_COLORS, CARD_THEMES, ISSUER_SUGGESTIONS, NETWORK_LABELS } from "./cardStyles";
import { Button } from "@/components/ui/Button";
import { FormAlert, inputClass } from "@/components/ui/Field";
import { api, ApiError } from "@/lib/api";
import { centsToInput, ordinal, parseDollars } from "@/lib/format";
import { BANK_OWNED_FIELDS, type Card, type CardColor, type CardInput, type Network } from "@/lib/types";

interface Props {
	card?: Card; // present when editing
	onClose: () => void;
	onSaved: (card: Card) => void;
}

interface FormState {
	name: string;
	issuer: string;
	network: Network;
	last_four: string;
	color: CardColor;
	credit_limit: string;
	current_balance: string;
	statement_balance: string;
	minimum_payment: string;
	apr: string;
	annual_fee: string;
	payment_due_day: string;
	statement_close_day: string;
	rewards: string;
}

function initialState(card?: Card): FormState {
	return {
		name: card?.name ?? "",
		issuer: card?.issuer ?? "",
		network: card?.network ?? "visa",
		last_four: card?.last_four ?? "",
		color: card?.color ?? "violet",
		credit_limit: centsToInput(card?.credit_limit_cents || null),
		current_balance: centsToInput(card?.current_balance_cents),
		statement_balance: centsToInput(card?.statement_balance_cents),
		minimum_payment: centsToInput(card?.minimum_payment_cents),
		apr: card?.apr != null ? String(card.apr) : "",
		annual_fee: centsToInput(card?.annual_fee_cents || null),
		payment_due_day: card?.payment_due_day ? String(card.payment_due_day) : "",
		statement_close_day: card?.statement_close_day ? String(card.statement_close_day) : "",
		rewards: card?.rewards ?? "",
	};
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const selectClass = `${inputClass} cursor-pointer appearance-none pr-10`;

function Select(props: React.ComponentProps<"select">) {
	return (
		<div className="relative">
			<select {...props} className={selectClass} />
			<FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle" size={15} />
		</div>
	);
}

function Labeled({ label, error, hint, children, className = "" }: { label: string; error?: string; hint?: string; children: (id: string) => React.ReactNode; className?: string }) {
	const id = useId();
	return (
		<div className={className}>
			<label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-muted">
				{label}
			</label>
			{children(id)}
			{error ? <p className="mt-1.5 text-[12px] text-critical-text">{error}</p> : hint ? <p className="mt-1.5 text-[11px] text-subtle">{hint}</p> : null}
		</div>
	);
}

function Prefixed({ prefix, suffix, ...props }: React.ComponentProps<"input"> & { prefix?: string; suffix?: string }) {
	return (
		<div className="relative">
			{prefix ? <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center font-mono text-[14px] text-subtle">{prefix}</span> : null}
			<input {...props} className={`${inputClass} font-mono text-[14px] ${prefix ? "pl-7" : ""} ${suffix ? "pr-8" : ""}`} />
			{suffix ? <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center font-mono text-[14px] text-subtle">{suffix}</span> : null}
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<fieldset>
			<legend className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">{title}</legend>
			<div className="grid grid-cols-2 gap-x-3 gap-y-4">{children}</div>
		</fieldset>
	);
}

export default function CardFormModal({ card, onClose, onSaved }: Props) {
	const [form, setForm] = useState<FormState>(() => initialState(card));
	const [errors, setErrors] = useState<Partial<Record<keyof FormState | "form", string>>>({});
	const [saving, setSaving] = useState(false);

	const linked = card?.source === "plaid";
	const fromBank = linked ? "From your bank" : undefined;
	const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

	/** Validate and convert the string form into the API payload. */
	function toPayload(): CardInput | null {
		const errs: typeof errors = {};
		const money = (key: keyof FormState, { allowNegative = false } = {}) => {
			const v = parseDollars(form[key] as string);
			if (v === null) return null;
			if (Number.isNaN(v)) {
				errs[key] = "Enter an amount like 1,250.00";
				return null;
			}
			if (!allowNegative && v < 0) {
				errs[key] = "Can't be negative";
				return null;
			}
			return v;
		};

		if (!form.name.trim()) errs.name = "Give the card a name";
		if (!form.issuer.trim()) errs.issuer = "Who issues this card?";
		if (form.last_four && !/^\d{4}$/.test(form.last_four)) errs.last_four = "Exactly 4 digits";

		const credit_limit_cents = money("credit_limit") ?? 0;
		const current_balance_cents = money("current_balance", { allowNegative: true }) ?? 0;
		const statement_balance_cents = money("statement_balance", { allowNegative: true });
		const minimum_payment_cents = money("minimum_payment");
		const annual_fee_cents = money("annual_fee") ?? 0;

		let apr: number | null = null;
		if (form.apr.trim()) {
			apr = Number(form.apr.replace("%", ""));
			if (Number.isNaN(apr) || apr < 0 || apr > 100) errs.apr = "Enter a percentage, e.g. 24.99";
		}

		setErrors(errs);
		if (Object.keys(errs).length > 0) return null;

		return {
			name: form.name.trim(),
			issuer: form.issuer.trim(),
			network: form.network,
			last_four: form.last_four || null,
			color: form.color,
			credit_limit_cents,
			current_balance_cents,
			statement_balance_cents,
			minimum_payment_cents,
			apr,
			annual_fee_cents,
			payment_due_day: form.payment_due_day ? Number(form.payment_due_day) : null,
			statement_close_day: form.statement_close_day ? Number(form.statement_close_day) : null,
			rewards: form.rewards.trim() || null,
		};
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const payload = toPayload();
		if (!payload) return;
		setSaving(true);
		try {
			// Linked cards: never send bank-owned values; the sync owns them.
			const body: Partial<CardInput> = { ...payload };
			if (linked) for (const f of BANK_OWNED_FIELDS) delete body[f];
			const saved = card ? await api.updateCard(card.id, body) : await api.createCard(payload);
			onSaved(saved);
		} catch (err) {
			setErrors({ form: err instanceof ApiError ? err.message : "Couldn't save this card." });
			setSaving(false);
		}
	}

	const previewBalance = parseDollars(form.current_balance);
	const previewLimit = parseDollars(form.credit_limit);

	return (
		<Modal
			title={card ? `Edit ${card.name}` : "Add a card"}
			description={
				linked
					? `Balances, limits, and dates sync from ${card.issuer}. You can rename it and track fees and rewards.`
					: card
						? "Update balances, dates, and details."
						: "Only the details you want to track. No card numbers needed."
			}
			onClose={onClose}
			wide
		>
			<form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]" noValidate>
				<div className="space-y-6 md:sticky md:top-24 md:self-start">
					<CreditCardVisual
						compact
						card={{
							name: form.name,
							issuer: form.issuer,
							network: form.network,
							last_four: form.last_four,
							color: form.color,
							current_balance_cents: previewBalance && !Number.isNaN(previewBalance) ? previewBalance : 0,
							credit_limit_cents: previewLimit && !Number.isNaN(previewLimit) ? previewLimit : 0,
						}}
					/>
					<div>
						<p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">Theme</p>
						<div className="grid grid-cols-6 gap-2">
							{CARD_COLORS.map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => set("color", c)}
									aria-label={`${CARD_THEMES[c].label} theme`}
									aria-pressed={form.color === c}
									title={CARD_THEMES[c].label}
									className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-xl ring-1 transition ${form.color === c ? "ring-2 ring-fg ring-offset-2 ring-offset-panel" : "ring-white/10 hover:ring-white/30"}`}
									style={{ background: CARD_THEMES[c].background }}
								>
									{form.color === c ? <FiCheck className="text-white drop-shadow" size={14} /> : null}
								</button>
							))}
						</div>
					</div>
					<p className="flex gap-2.5 rounded-xl border border-line bg-white/[0.02] p-3 text-[12px] leading-relaxed text-subtle">
						<FiLock className="mt-0.5 flex-none text-accent" size={13} />
						Quanta never asks for your full card number, CVV, or expiry. The last four digits are optional.
					</p>
				</div>

				<div className="space-y-7">
					<Section title="Card">
						<Labeled label="Card name" error={errors.name} className="col-span-2">
							{(id) => <input id={id} className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Sapphire Preferred" maxLength={60} autoFocus aria-invalid={!!errors.name || undefined} />}
						</Labeled>
						<Labeled label="Issuer" error={errors.issuer} hint={fromBank} className="col-span-2">
							{(id) => (
								<>
									<input id={id} className={inputClass} value={form.issuer} onChange={(e) => set("issuer", e.target.value)} placeholder="Chase" list="issuer-suggestions" maxLength={60} disabled={linked} aria-invalid={!!errors.issuer || undefined} />
									<datalist id="issuer-suggestions">
										{ISSUER_SUGGESTIONS.map((i) => <option key={i} value={i} />)}
									</datalist>
								</>
							)}
						</Labeled>
						<Labeled label="Network">
							{(id) => (
								<Select id={id} value={form.network} onChange={(e) => set("network", e.target.value as Network)}>
									{(Object.keys(NETWORK_LABELS) as Network[]).map((n) => (
										<option key={n} value={n} className="bg-panel">{n === "other" ? "Other" : n === "visa" ? "Visa" : NETWORK_LABELS[n]}</option>
									))}
								</Select>
							)}
						</Labeled>
						<Labeled label="Last 4 digits" error={errors.last_four} hint={fromBank}>
							{(id) => <Prefixed id={id} disabled={linked} value={form.last_four} onChange={(e) => set("last_four", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" inputMode="numeric" />}
						</Labeled>
					</Section>

					<Section title="Balances">
						<Labeled label="Current balance" error={errors.current_balance} hint={fromBank}>
							{(id) => <Prefixed id={id} disabled={linked} prefix="$" value={form.current_balance} onChange={(e) => set("current_balance", e.target.value)} placeholder="0.00" inputMode="decimal" />}
						</Labeled>
						<Labeled label="Credit limit" error={errors.credit_limit} hint={fromBank ?? "Leave blank for charge cards"}>
							{(id) => <Prefixed id={id} disabled={linked} prefix="$" value={form.credit_limit} onChange={(e) => set("credit_limit", e.target.value)} placeholder="10,000" inputMode="decimal" />}
						</Labeled>
						<Labeled label="Statement balance" error={errors.statement_balance} hint={fromBank}>
							{(id) => <Prefixed id={id} disabled={linked} prefix="$" value={form.statement_balance} onChange={(e) => set("statement_balance", e.target.value)} placeholder="0.00" inputMode="decimal" />}
						</Labeled>
						<Labeled label="Minimum payment" error={errors.minimum_payment} hint={fromBank}>
							{(id) => <Prefixed id={id} disabled={linked} prefix="$" value={form.minimum_payment} onChange={(e) => set("minimum_payment", e.target.value)} placeholder="0.00" inputMode="decimal" />}
						</Labeled>
					</Section>

					<Section title="Dates & terms">
						<Labeled label="Payment due" hint={fromBank}>
							{(id) => (
								<Select id={id} disabled={linked} value={form.payment_due_day} onChange={(e) => set("payment_due_day", e.target.value)}>
									<option value="" className="bg-panel">Not set</option>
									{DAYS.map((d) => <option key={d} value={d} className="bg-panel">{ordinal(d)} of the month</option>)}
								</Select>
							)}
						</Labeled>
						<Labeled label="Statement closes" hint={fromBank}>
							{(id) => (
								<Select id={id} disabled={linked} value={form.statement_close_day} onChange={(e) => set("statement_close_day", e.target.value)}>
									<option value="" className="bg-panel">Not set</option>
									{DAYS.map((d) => <option key={d} value={d} className="bg-panel">{ordinal(d)} of the month</option>)}
								</Select>
							)}
						</Labeled>
						<Labeled label="APR" error={errors.apr} hint={fromBank}>
							{(id) => <Prefixed id={id} disabled={linked} suffix="%" value={form.apr} onChange={(e) => set("apr", e.target.value)} placeholder="24.99" inputMode="decimal" />}
						</Labeled>
						<Labeled label="Annual fee" error={errors.annual_fee}>
							{(id) => <Prefixed id={id} prefix="$" value={form.annual_fee} onChange={(e) => set("annual_fee", e.target.value)} placeholder="0" inputMode="decimal" />}
						</Labeled>
						<Labeled label="Rewards" className="col-span-2">
							{(id) => <input id={id} className={inputClass} value={form.rewards} onChange={(e) => set("rewards", e.target.value)} placeholder="3x dining, 2x travel" maxLength={200} />}
						</Labeled>
					</Section>

					{errors.form ? <FormAlert>{errors.form}</FormAlert> : null}

					<div className="flex justify-end gap-2 border-t border-line pt-5">
						<Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
						<Button type="submit" disabled={saving}>{saving ? "Saving…" : card ? "Save changes" : "Add card"}</Button>
					</div>
				</div>
			</form>
		</Modal>
	);
}
