"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiAlertTriangle, FiArrowUpRight, FiGrid, FiLink, FiLogOut, FiMenu, FiPlus, FiRefreshCw, FiX, FiXCircle } from "react-icons/fi";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatCents } from "@/lib/format";
import { displayName, fullName } from "@/lib/types";
import { useCards } from "./CardsProvider";
import { useBanks } from "./BanksProvider";
import { CARD_THEMES } from "./cardStyles";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();
	const { user, logout } = useAuth();
	const { cards, openAddCard, openProfile } = useCards();
	const banks = useBanks();

	const navItem = (active: boolean) =>
		`group flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] transition-colors ${active ? "bg-white/[0.07] text-fg shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]" : "text-muted hover:bg-white/[0.04] hover:text-fg"}`;

	return (
		<div className="flex h-full flex-col">
			<div className="px-5 pt-5 pb-6">
				<Logo href="/dashboard" />
			</div>

			<nav className="flex-1 overflow-y-auto px-3" aria-label="Dashboard">
				<Link href="/dashboard" onClick={onNavigate} className={navItem(pathname === "/dashboard")}>
					<FiGrid size={16} /> Overview
				</Link>

				<div className="mt-7 flex items-center justify-between px-3">
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">Cards</p>
					<button onClick={() => { openAddCard(); onNavigate?.(); }} aria-label="Add card" className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-subtle hover:bg-white/[0.06] hover:text-fg">
						<FiPlus size={14} />
					</button>
				</div>
				<ul className="mt-2 space-y-0.5">
					{cards === null ? (
						[0, 1, 2].map((i) => <li key={i} className="mx-3 my-2 h-5 animate-pulse rounded bg-white/[0.04]" />)
					) : cards.length === 0 ? (
						<li className="px-3 py-2 text-[13px] text-subtle">No cards yet</li>
					) : (
						cards.map((c) => {
							const href = `/dashboard/cards/${c.id}`;
							return (
								<li key={c.id}>
									<Link href={href} onClick={onNavigate} className={navItem(pathname === href)}>
										<span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: CARD_THEMES[c.color].dot }} />
										<span className="min-w-0 flex-1 truncate">{c.name}</span>
										{c.source === "plaid" ? <FiLink size={11} className="flex-none text-subtle" aria-label="Linked" /> : null}
										<span className="font-mono text-[11px] text-subtle">{formatCents(c.current_balance_cents, { whole: true })}</span>
									</Link>
								</li>
							);
						})
					)}
				</ul>

				{banks.enabled ? (
					<>
						<div className="mt-7 flex items-center justify-between px-3">
							<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">Banks</p>
							<button onClick={() => { banks.connectBank(); onNavigate?.(); }} aria-label="Connect a bank" className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-subtle hover:bg-white/[0.06] hover:text-fg">
								<FiPlus size={14} />
							</button>
						</div>
						<ul className="mt-2 space-y-0.5">
							{banks.items.length === 0 ? (
								<li>
									<button onClick={() => { banks.connectBank(); onNavigate?.(); }} disabled={banks.connecting} className={`${navItem(false)} w-full cursor-pointer text-left`}>
										<FiLink size={14} /> {banks.connecting ? "Connecting…" : "Connect a bank"}
									</button>
								</li>
							) : (
								banks.items.map((item) => (
									<li key={item.id}>
										<button onClick={() => { banks.openBanks(); onNavigate?.(); }} className={`${navItem(false)} w-full cursor-pointer text-left`}>
											<span className="flex h-5 w-5 flex-none items-center justify-center rounded-md border border-line bg-white/[0.04] text-[10px] font-semibold uppercase text-fg">
												{(item.institution_name ?? "B").slice(0, 1)}
											</span>
											<span className="min-w-0 flex-1 truncate">{item.institution_name ?? "Bank"}</span>
											{banks.syncing.has(item.id) || item.transactions_pending ? (
												<FiRefreshCw size={12} className="flex-none animate-spin text-subtle" aria-label="Syncing" />
											) : item.status === "login_required" ? (
												<FiAlertTriangle size={12} className="flex-none text-warning" aria-label="Sign-in needed" />
											) : item.status === "error" ? (
												<FiXCircle size={12} className="flex-none text-critical-text" aria-label="Sync failed" />
											) : null}
										</button>
									</li>
								))
							)}
						</ul>
					</>
				) : null}
			</nav>

			<div className="space-y-1 border-t border-line p-3">
				<Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-subtle hover:bg-white/[0.04] hover:text-fg">
					<FiArrowUpRight size={15} /> Back to site
				</Link>
				<div className="flex items-center gap-1">
					<button
						onClick={() => { openProfile(); onNavigate?.(); }}
						title="Edit profile"
						className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
					>
						<span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[13px] font-semibold uppercase text-bg">
							{displayName(user).slice(0, 1)}
						</span>
						<span className="min-w-0 flex-1">
							<span className="block truncate text-[13px] font-medium text-fg">{fullName(user)}</span>
							<span className="block truncate text-[11px] text-subtle">{user?.email}</span>
						</span>
					</button>
					<button onClick={logout} aria-label="Log out" title="Log out" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-subtle hover:bg-white/[0.06] hover:text-fg">
						<FiLogOut size={15} />
					</button>
				</div>
			</div>
		</div>
	);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false);

	return (
		<div className="min-h-screen bg-bg">
			<div className="bg-grid pointer-events-none fixed inset-0 opacity-50" />

			{/* desktop sidebar */}
			<aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-panel/80 backdrop-blur-xl lg:block">
				<SidebarContent />
			</aside>

			{/* mobile top bar + drawer */}
			<div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-bg/80 px-4 backdrop-blur-xl lg:hidden">
				<Logo href="/dashboard" size={24} />
				<button onClick={() => setOpen(true)} aria-label="Open menu" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-fg hover:bg-white/5">
					<FiMenu size={19} />
				</button>
			</div>
			{open ? (
				<div className="fixed inset-0 z-50 lg:hidden">
					<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
					<aside className="absolute inset-y-0 left-0 w-72 border-r border-line bg-panel animate-[fade-up_0.2s_ease-out_both]">
						<button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-white/5">
							<FiX size={18} />
						</button>
						<SidebarContent onNavigate={() => setOpen(false)} />
					</aside>
				</div>
			) : null}

			<main className="relative lg:pl-64">
				<div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">{children}</div>
			</main>
		</div>
	);
}
