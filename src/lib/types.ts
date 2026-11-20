export interface User {
	id: number;
	email: string;
	username: string;
	first_name: string | null;
	last_name: string | null;
}

export interface SignupInput {
	first_name: string;
	last_name: string;
	email: string;
	username: string;
	password: string;
}

/** What to call the user: first name, falling back to username for
 * accounts created before names were collected. */
export function displayName(user: User | null | undefined): string {
	return user?.first_name || user?.username || "";
}

export function fullName(user: User | null | undefined): string {
	if (!user) return "";
	const full = [user.first_name, user.last_name].filter(Boolean).join(" ");
	return full || user.username;
}

export interface AuthResponse {
	access_token: string;
	token_type: string;
	user: User;
}

export type Network = "visa" | "mastercard" | "amex" | "discover" | "other";
export type CardColor = "violet" | "ocean" | "sunset" | "emerald" | "graphite" | "rose";

/** Fields the user can edit. All money is integer cents. */
export interface CardInput {
	name: string;
	issuer: string;
	network: Network;
	last_four: string | null;
	color: CardColor;
	credit_limit_cents: number;
	current_balance_cents: number;
	statement_balance_cents: number | null;
	minimum_payment_cents: number | null;
	apr: number | null;
	annual_fee_cents: number;
	statement_close_day: number | null;
	payment_due_day: number | null;
	rewards: string | null;
}

export interface Card extends CardInput {
	id: number;
	available_credit_cents: number;
	utilization: number | null;
	next_due_date: string | null;
	days_until_due: number | null;
	next_statement_date: string | null;
	/** "plaid" cards are imported from a bank; their balances are read-only. */
	source: "manual" | "plaid";
	plaid_item_id: number | null;
	synced_at: string | null;
	sync_status: PlaidItemStatus | null;
}

export type PlaidItemStatus = "ok" | "login_required" | "error";

export interface PlaidItem {
	id: number;
	institution_name: string | null;
	status: PlaidItemStatus;
	error_message: string | null;
	last_synced_at: string | null;
	created_at: string;
	card_ids: number[];
	/** True until Plaid finishes the first transaction import. */
	transactions_pending: boolean;
}

/** Fields a linked card gets from the bank (read-only in the edit form). */
export const BANK_OWNED_FIELDS = [
	"issuer",
	"last_four",
	"credit_limit_cents",
	"current_balance_cents",
	"statement_balance_cents",
	"minimum_payment_cents",
	"apr",
	"statement_close_day",
	"payment_due_day",
] as const;

export interface UpcomingPayment {
	card_id: number;
	card_name: string;
	issuer: string;
	last_four: string | null;
	due_date: string;
	days_until_due: number;
	minimum_payment_cents: number | null;
	statement_balance_cents: number | null;
}

export interface CardSummary {
	card_count: number;
	total_balance_cents: number;
	total_limit_cents: number;
	total_available_cents: number;
	overall_utilization: number | null;
	total_minimum_due_cents: number;
	total_statement_balance_cents: number;
	total_annual_fees_cents: number;
	upcoming_payments: UpcomingPayment[];
}

export type TransactionKind = "payment" | "charge";

export interface Transaction {
	id: number;
	card_id: number;
	kind: TransactionKind;
	amount_cents: number;
	description: string | null;
	occurred_on: string;
	/** Imported from the bank via Plaid. */
	synced: boolean;
}

export interface TransactionInput {
	kind: TransactionKind;
	amount_cents: number;
	description?: string | null;
	occurred_on?: string | null;
}
