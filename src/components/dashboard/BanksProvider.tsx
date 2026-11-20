"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";
import { api, ApiError } from "@/lib/api";
import { openPlaidLink } from "@/lib/plaidLink";
import type { PlaidItem } from "@/lib/types";
import { useCards } from "./CardsProvider";
import BanksModal from "./BanksModal";

interface Notice {
	tone: "good" | "error";
	text: string;
}

interface BanksContextValue {
	/** Plaid keys are configured on the server. */
	enabled: boolean;
	environment: string;
	items: PlaidItem[];
	/** Link is being prepared/opened, or the new connection is importing. */
	connecting: boolean;
	syncing: ReadonlySet<number>;
	/** Bumps whenever synced data may have changed (card pages reload activity). */
	dataVersion: number;
	itemFor: (plaidItemId: number | null | undefined) => PlaidItem | undefined;
	connectBank: () => Promise<void>;
	syncItem: (id: number) => Promise<void>;
	reconnect: (id: number) => Promise<void>;
	disconnect: (id: number) => Promise<void>;
	openBanks: () => void;
}

const BanksContext = createContext<BanksContextValue | null>(null);

// While Plaid prepares the first transaction import, re-check this often.
const PENDING_POLL_MS = 4000;
const PENDING_MAX_POLLS = 15;

function message(err: unknown, fallback: string) {
	return err instanceof ApiError || err instanceof Error ? err.message : fallback;
}

export function BanksProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const { refresh } = useCards();

	const [enabled, setEnabled] = useState(false);
	const [environment, setEnvironment] = useState("");
	const [items, setItems] = useState<PlaidItem[]>([]);
	const [connecting, setConnecting] = useState(false);
	const [syncing, setSyncing] = useState<ReadonlySet<number>>(new Set());
	const [dataVersion, setDataVersion] = useState(0);
	const [notice, setNotice] = useState<Notice | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const polls = useRef(new Map<number, number>());

	const afterSync = useCallback(async () => {
		await refresh();
		setDataVersion((v) => v + 1);
	}, [refresh]);

	const upsertItem = useCallback((item: PlaidItem) => {
		setItems((prev) => (prev.some((i) => i.id === item.id) ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item]));
	}, []);

	// On dashboard load: check config, then sync any connection that's due.
	const load = useCallback(async () => {
		try {
			const config = await api.plaidConfig();
			setEnabled(config.enabled);
			setEnvironment(config.environment);
			if (!config.enabled) return;
			setItems(await api.plaidItems());
			const synced = await api.plaidSyncAll();
			setItems(synced);
			if (synced.length) await afterSync();
		} catch {
			// Bank sync is optional; the dashboard works without it.
		}
	}, [afterSync]);

	useEffect(() => {
		load();
	}, [load]);

	const syncItem = useCallback(
		async (id: number, { quiet = false } = {}) => {
			setSyncing((s) => new Set(s).add(id));
			try {
				const item = await api.plaidSyncItem(id);
				upsertItem(item);
				await afterSync();
				if (!quiet && item.status !== "ok") setNotice({ tone: "error", text: item.error_message ?? "Sync failed." });
			} catch (err) {
				if (!quiet) setNotice({ tone: "error", text: message(err, "Sync failed.") });
			} finally {
				setSyncing((s) => {
					const next = new Set(s);
					next.delete(id);
					return next;
				});
			}
		},
		[afterSync, upsertItem],
	);

	// Plaid needs a few seconds after linking before transactions are ready.
	useEffect(() => {
		const waiting = items.filter((i) => i.transactions_pending && (polls.current.get(i.id) ?? 0) < PENDING_MAX_POLLS);
		if (!waiting.length) return;
		const timer = setTimeout(() => {
			for (const item of waiting) {
				polls.current.set(item.id, (polls.current.get(item.id) ?? 0) + 1);
				syncItem(item.id, { quiet: true });
			}
		}, PENDING_POLL_MS);
		return () => clearTimeout(timer);
	}, [items, syncItem]);

	const connectBank = useCallback(async () => {
		setModalOpen(false);
		setConnecting(true);
		try {
			const { link_token } = await api.plaidLinkToken();
			const result = await openPlaidLink(link_token);
			if (result.status === "exit") {
				if (result.error) setNotice({ tone: "error", text: result.error });
				return;
			}
			const item = await api.plaidExchange(result.publicToken);
			upsertItem(item);
			await afterSync();
			const bank = item.institution_name ?? "your bank";
			const n = item.card_ids.length;
			setNotice(
				n
					? { tone: "good", text: `Imported ${n} card${n === 1 ? "" : "s"} from ${bank}.` }
					: { tone: "error", text: `No credit cards were shared from ${bank}.` },
			);
			if (n === 1) router.push(`/dashboard/cards/${item.card_ids[0]}`);
		} catch (err) {
			setNotice({ tone: "error", text: message(err, "Couldn't connect your bank.") });
		} finally {
			setConnecting(false);
		}
	}, [afterSync, router, upsertItem]);

	const reconnect = useCallback(
		async (id: number) => {
			setModalOpen(false);
			try {
				const { link_token } = await api.plaidReconnectToken(id);
				const result = await openPlaidLink(link_token);
				if (result.status === "success") {
					// Update mode re-authenticates the existing connection; no exchange needed.
					await syncItem(id);
				} else if (result.error) {
					setNotice({ tone: "error", text: result.error });
				}
			} catch (err) {
				setNotice({ tone: "error", text: message(err, "Couldn't reconnect.") });
			}
		},
		[syncItem],
	);

	const disconnect = useCallback(
		async (id: number) => {
			const item = items.find((i) => i.id === id);
			try {
				await api.plaidDisconnect(id);
				setItems((prev) => prev.filter((i) => i.id !== id));
				if (item && item.card_ids.some((cid) => pathname === `/dashboard/cards/${cid}`)) router.push("/dashboard");
				await afterSync();
				setNotice({ tone: "good", text: `Disconnected ${item?.institution_name ?? "bank"}.` });
			} catch (err) {
				setNotice({ tone: "error", text: message(err, "Couldn't disconnect.") });
			}
		},
		[afterSync, items, pathname, router],
	);

	useEffect(() => {
		if (!notice) return;
		const timer = setTimeout(() => setNotice(null), 6000);
		return () => clearTimeout(timer);
	}, [notice]);

	const itemFor = useCallback((id: number | null | undefined) => items.find((i) => i.id === id), [items]);
	const openBanks = useCallback(() => setModalOpen(true), []);
	const syncPublic = useCallback((id: number) => syncItem(id), [syncItem]);

	const value = useMemo(
		() => ({ enabled, environment, items, connecting, syncing, dataVersion, itemFor, connectBank, syncItem: syncPublic, reconnect, disconnect, openBanks }),
		[enabled, environment, items, connecting, syncing, dataVersion, itemFor, connectBank, syncPublic, reconnect, disconnect, openBanks],
	);

	return (
		<BanksContext.Provider value={value}>
			{children}
			{modalOpen ? <BanksModal onClose={() => setModalOpen(false)} /> : null}
			{notice ? (
				<div role="status" className="fixed inset-x-4 bottom-4 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6">
					<div className="flex max-w-md items-start gap-3 rounded-2xl border border-line-strong bg-elev/95 px-4 py-3 text-[14px] shadow-2xl shadow-black/50 backdrop-blur animate-[fade-up_0.25s_ease-out_both]">
						{notice.tone === "good" ? <FiCheckCircle className="mt-0.5 flex-none text-good-text" /> : <FiAlertCircle className="mt-0.5 flex-none text-critical-text" />}
						<p className="text-fg">{notice.text}</p>
						<button onClick={() => setNotice(null)} aria-label="Dismiss" className="-mr-1 cursor-pointer rounded p-0.5 text-subtle hover:text-fg">
							<FiX size={14} />
						</button>
					</div>
				</div>
			) : null}
		</BanksContext.Provider>
	);
}

export function useBanks() {
	const ctx = useContext(BanksContext);
	if (!ctx) throw new Error("useBanks must be used inside <BanksProvider>");
	return ctx;
}
