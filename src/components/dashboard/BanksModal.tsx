"use client";

import { useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiLink, FiLock, FiRefreshCw, FiXCircle } from "react-icons/fi";
import Modal from "./Modal";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/format";
import type { PlaidItem } from "@/lib/types";
import { useBanks } from "./BanksProvider";

export function SyncStatus({ item, syncing }: { item: PlaidItem; syncing?: boolean }) {
	if (syncing) {
		return (
			<span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
				<FiRefreshCw size={12} className="animate-spin" /> Syncing…
			</span>
		);
	}
	if (item.status === "login_required") {
		return (
			<span className="inline-flex items-center gap-1.5 text-[12px] text-fg">
				<FiAlertTriangle size={12} className="text-warning" /> Sign-in needed
			</span>
		);
	}
	if (item.status === "error") {
		return (
			<span className="inline-flex items-center gap-1.5 text-[12px] text-fg">
				<FiXCircle size={12} className="text-critical-text" /> Sync failed
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
			<FiCheckCircle size={12} className="text-good-text" />
			{item.transactions_pending ? "Importing activity…" : `Synced ${timeAgo(item.last_synced_at)}`}
		</span>
	);
}

function Connection({ item }: { item: PlaidItem }) {
	const { syncing, syncItem, reconnect, disconnect } = useBanks();
	const [confirming, setConfirming] = useState(false);
	const [removing, setRemoving] = useState(false);
	const busy = syncing.has(item.id);
	const n = item.card_ids.length;

	return (
		<li className="rounded-2xl border border-line bg-white/[0.02] p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-line bg-white/[0.04] text-[13px] font-semibold uppercase text-fg">
						{(item.institution_name ?? "B").slice(0, 1)}
					</span>
					<div className="min-w-0">
						<p className="truncate text-[14px] font-medium text-fg">{item.institution_name ?? "Bank"}</p>
						<p className="text-[12px] text-subtle">
							{n} card{n === 1 ? "" : "s"}
						</p>
					</div>
				</div>
				<SyncStatus item={item} syncing={busy} />
			</div>

			{item.status !== "ok" && item.error_message ? <p className="mt-3 text-[13px] text-muted">{item.error_message}</p> : null}

			<div className="mt-4 flex flex-wrap justify-end gap-2">
				{confirming ? (
					<>
						<p className="mr-auto self-center text-[12px] text-muted">
							Removes {n} imported card{n === 1 ? "" : "s"} and their activity.
						</p>
						<Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
						<Button
							size="sm"
							variant="danger"
							disabled={removing}
							onClick={async () => {
								setRemoving(true);
								await disconnect(item.id);
								setRemoving(false);
							}}
						>
							{removing ? "Disconnecting…" : "Disconnect"}
						</Button>
					</>
				) : (
					<>
						<Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>Disconnect</Button>
						{item.status === "login_required" ? (
							<Button size="sm" variant="secondary" onClick={() => reconnect(item.id)}>Reconnect</Button>
						) : (
							<Button size="sm" variant="secondary" disabled={busy} onClick={() => syncItem(item.id)}>
								<FiRefreshCw size={13} className={busy ? "animate-spin" : ""} /> Sync now
							</Button>
						)}
					</>
				)}
			</div>
		</li>
	);
}

export default function BanksModal({ onClose }: { onClose: () => void }) {
	const { items, environment, connecting, connectBank } = useBanks();

	return (
		<Modal title="Bank connections" description="Cards from connected banks update automatically." onClose={onClose}>
			<div className="space-y-5">
				{items.length ? (
					<ul className="space-y-3">
						{items.map((item) => <Connection key={item.id} item={item} />)}
					</ul>
				) : (
					<p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-[14px] text-muted">No banks connected yet.</p>
				)}

				<div className="flex items-start gap-2.5 rounded-2xl border border-line bg-white/[0.02] px-4 py-3 text-[12px] leading-relaxed text-subtle">
					<FiLock className="mt-0.5 flex-none" />
					<p>
						Connections go through Plaid. Quanta never sees your bank password, and only credit card accounts are shared.
						{environment === "sandbox" ? (
							<>
								{" "}<span className="text-muted">Test mode: pick any bank and sign in with</span>{" "}
								<code className="font-mono text-fg">user_good</code> / <code className="font-mono text-fg">pass_good</code>.
							</>
						) : null}
					</p>
				</div>

				<div className="flex justify-end gap-2 border-t border-line pt-5">
					<Button type="button" variant="ghost" onClick={onClose}>Close</Button>
					<Button type="button" disabled={connecting} onClick={connectBank}>
						<FiLink size={14} /> {connecting ? "Connecting…" : items.length ? "Connect another bank" : "Connect a bank"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
