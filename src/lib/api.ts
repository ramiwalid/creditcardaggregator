import type {
	AuthResponse,
	Card,
	CardInput,
	CardSummary,
	PlaidItem,
	SignupInput,
	Transaction,
	TransactionInput,
	User,
} from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const TOKEN_KEY = "quanta_token";

// localStorage can throw (private mode, blocked storage), so guard every access.
export function getToken(): string | null {
	try {
		return localStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
}

export function setToken(token: string | null) {
	try {
		if (token) localStorage.setItem(TOKEN_KEY, token);
		else localStorage.removeItem(TOKEN_KEY);
	} catch {
		/* ignore */
	}
}

export class ApiError extends Error {
	status: number;
	/** Which input the error is about, when the API says so (e.g. "email"). */
	field?: string;

	constructor(status: number, message: string, field?: string) {
		super(message);
		this.status = status;
		this.field = field;
	}
}

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

/** Called whenever an authenticated request comes back 401 (expired token). */
export function onUnauthorized(listener: Listener) {
	unauthorizedListeners.add(listener);
	return () => {
		unauthorizedListeners.delete(listener);
	};
}

/** Turn FastAPI's various error shapes into one readable message. */
function parseError(status: number, body: unknown): ApiError {
	const detail = (body as { detail?: unknown } | null)?.detail;
	if (typeof detail === "string") return new ApiError(status, detail);
	if (detail && typeof detail === "object" && !Array.isArray(detail)) {
		const d = detail as { message?: string; field?: string };
		return new ApiError(status, d.message ?? "Something went wrong.", d.field);
	}
	if (Array.isArray(detail) && detail.length > 0) {
		// Pydantic validation error: [{loc: ["body", "field"], msg: "..."}]
		const first = detail[0] as { loc?: (string | number)[]; msg?: string };
		const field = first.loc?.[first.loc.length - 1];
		return new ApiError(
			status,
			first.msg?.replace(/^Value error, /, "") ?? "Invalid input.",
			typeof field === "string" ? field : undefined,
		);
	}
	return new ApiError(status, `Request failed (${status}).`);
}

async function request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
	const { auth = true, headers, ...rest } = init;
	const finalHeaders = new Headers(headers);
	if (rest.body && !finalHeaders.has("Content-Type")) {
		finalHeaders.set("Content-Type", "application/json");
	}
	const token = auth ? getToken() : null;
	if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

	let res: Response;
	try {
		res = await fetch(`${API_URL}${path}`, { ...rest, headers: finalHeaders });
	} catch {
		throw new ApiError(0, "Can't reach the Quanta server. Is the API running?");
	}

	if (res.status === 204) return undefined as T;

	const body = await res.json().catch(() => null);
	if (!res.ok) {
		if (res.status === 401 && token) unauthorizedListeners.forEach((l) => l());
		throw parseError(res.status, body);
	}
	return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

export const api = {
	// Auth
	signup: (input: SignupInput) =>
		request<AuthResponse>("/auth/signup", { method: "POST", auth: false, body: json(input) }),
	login: (identifier: string, password: string) =>
		request<AuthResponse>("/auth/login", { method: "POST", auth: false, body: json({ identifier, password }) }),
	me: () => request<User>("/auth/me"),
	updateMe: (changes: { first_name?: string; last_name?: string }) =>
		request<User>("/auth/me", { method: "PATCH", body: json(changes) }),
	forgotPassword: (email: string) =>
		request<{ message: string }>("/auth/forgotpassword", { method: "POST", auth: false, body: json({ email }) }),
	resetPassword: (token: string, password: string) =>
		request<{ message: string }>("/auth/resetpassword", { method: "POST", auth: false, body: json({ token, password }) }),

	contact: (name: string, email: string, message: string) =>
		request<{ message: string }>("/contact", { method: "POST", auth: false, body: json({ name, email, message }) }),

	// Cards
	listCards: () => request<Card[]>("/cards"),
	summary: () => request<CardSummary>("/cards/summary"),
	createCard: (card: CardInput) => request<Card>("/cards", { method: "POST", body: json(card) }),
	updateCard: (id: number, card: Partial<CardInput>) =>
		request<Card>(`/cards/${id}`, { method: "PATCH", body: json(card) }),
	deleteCard: (id: number) => request<void>(`/cards/${id}`, { method: "DELETE" }),

	// Transactions
	listTransactions: (cardId: number) => request<Transaction[]>(`/cards/${cardId}/transactions`),
	addTransaction: (cardId: number, tx: TransactionInput) =>
		request<Transaction>(`/cards/${cardId}/transactions`, { method: "POST", body: json(tx) }),
	deleteTransaction: (cardId: number, txId: number) =>
		request<void>(`/cards/${cardId}/transactions/${txId}`, { method: "DELETE" }),

	// Bank connections (Plaid)
	plaidConfig: () => request<{ enabled: boolean; environment: string }>("/plaid/config"),
	plaidLinkToken: () => request<{ link_token: string }>("/plaid/link-token", { method: "POST" }),
	plaidExchange: (publicToken: string) =>
		request<PlaidItem>("/plaid/exchange", { method: "POST", body: json({ public_token: publicToken }) }),
	plaidItems: () => request<PlaidItem[]>("/plaid/items"),
	/** Syncs connections that are due (throttled server-side). */
	plaidSyncAll: () => request<PlaidItem[]>("/plaid/sync", { method: "POST" }),
	plaidSyncItem: (id: number) => request<PlaidItem>(`/plaid/items/${id}/sync`, { method: "POST" }),
	plaidReconnectToken: (id: number) =>
		request<{ link_token: string }>(`/plaid/items/${id}/link-token`, { method: "POST" }),
	plaidDisconnect: (id: number) => request<void>(`/plaid/items/${id}`, { method: "DELETE" }),
};
