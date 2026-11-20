"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiChevronDown, FiGrid, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import Logo from "@/components/ui/Logo";
import { ButtonLink, Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { displayName, fullName, type User } from "@/lib/types";

export const NAV_LINKS = [
	{ label: "Features", href: "/#features" },
	{ label: "How it works", href: "/#how-it-works" },
	{ label: "Institutions", href: "/#institutions" },
	{ label: "Security", href: "/#security" },
	{ label: "About", href: "/#about" },
	{ label: "Contact", href: "/#contact" },
];

const SECTION_IDS = NAV_LINKS.map((l) => l.href.split("#")[1]);

/** Which landing section is currently in the middle band of the viewport. */
function useActiveSection() {
	const [active, setActive] = useState<string | null>(null);

	useEffect(() => {
		const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
		if (!sections.length) return;
		const visible = new Set<string>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) visible.add(e.target.id);
					else visible.delete(e.target.id);
				}
				// First section (in page order) inside the band wins.
				setActive(SECTION_IDS.find((id) => visible.has(id)) ?? null);
			},
			{ rootMargin: "-45% 0px -50% 0px" },
		);
		sections.forEach((s) => observer.observe(s));
		return () => observer.disconnect();
	}, []);

	return active;
}

function Avatar({ user, size = 32 }: { user: User | null; size?: number }) {
	return (
		<span
			className="flex flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 font-semibold uppercase text-bg"
			style={{ width: size, height: size, fontSize: size * 0.42 }}
		>
			{displayName(user).slice(0, 1)}
		</span>
	);
}

function AccountMenu({ user, onLogout }: { user: User | null; onLogout: () => void }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (!ref.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	const item = "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-muted transition-colors hover:bg-white/[0.06] hover:text-fg";

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((o) => !o)}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label={`Account menu for ${displayName(user)}`}
				className={`flex h-11 cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 transition-colors xl:gap-2.5 xl:pr-3.5 ${open ? "border-line-strong bg-white/[0.07]" : "border-line bg-white/[0.03] hover:border-line-strong hover:bg-white/[0.06]"}`}
			>
				<Avatar user={user} size={34} />
				<span className="hidden max-w-[140px] truncate text-[14px] text-muted xl:inline">
					Hi, <span className="font-medium text-fg">{displayName(user)}</span>
				</span>
				<FiChevronDown size={15} className={`text-subtle transition-transform ${open ? "rotate-180" : ""}`} />
			</button>

			{open ? (
				<div role="menu" className="absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl border border-line-strong bg-elev/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl animate-[fade-up_0.18s_ease-out_both]">
					<div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
						<Avatar user={user} size={36} />
						<div className="min-w-0">
							<p className="truncate text-[14px] font-medium text-fg">{fullName(user)}</p>
							<p className="truncate text-[12px] text-subtle">{user?.email}</p>
						</div>
					</div>
					<div className="mb-1.5 h-px bg-line" />
					<Link href="/dashboard" role="menuitem" className={item} onClick={() => setOpen(false)}>
						<FiGrid size={15} /> Dashboard
					</Link>
					<button role="menuitem" className={item} onClick={() => { setOpen(false); onLogout(); }}>
						<FiLogOut size={15} /> Log out
					</button>
				</div>
			) : null}
		</div>
	);
}

export default function Navbar() {
	const { status, user, logout } = useAuth();
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);
	const active = useActiveSection();

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	const authed = status === "authenticated";
	const solid = scrolled || open;

	return (
		<header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${solid ? "border-b border-line bg-bg/75 backdrop-blur-xl" : "border-b border-transparent"}`}>
			{/* accent hairline once the bar is solid */}
			<div className={`pointer-events-none absolute inset-x-0 bottom-[-1px] h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent transition-opacity duration-300 ${solid ? "opacity-100" : "opacity-0"}`} />

			<nav
				className={`flex w-full items-center justify-between gap-6 px-5 transition-[height] duration-300 sm:px-8 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:px-12 ${solid ? "h-[68px]" : "h-[76px] lg:h-20"}`}
				aria-label="Main"
			>
				<div className="flex items-center">
					<Logo size={34} />
				</div>

				<ul className="hidden items-center gap-0.5 rounded-full border border-line bg-white/[0.025] p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] lg:flex">
					{NAV_LINKS.map((l) => {
						const isActive = active === l.href.split("#")[1];
						return (
							<li key={l.href}>
								<Link
									href={l.href}
									aria-current={isActive ? "true" : undefined}
									className={`block whitespace-nowrap rounded-full px-3 py-2 text-[14px] transition-colors xl:px-4 xl:text-[14.5px] ${isActive ? "bg-white/[0.08] text-fg shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]" : "text-muted hover:bg-white/[0.04] hover:text-fg"}`}
								>
									{l.label}
								</Link>
							</li>
						);
					})}
				</ul>

				<div className={`hidden items-center justify-end gap-3 lg:flex ${status === "loading" ? "invisible" : ""}`}>
					{authed ? (
						<>
							<AccountMenu user={user} onLogout={logout} />
							<ButtonLink href="/dashboard" className="h-11 px-5">
								Dashboard <FiArrowRight size={15} />
							</ButtonLink>
						</>
					) : (
						<>
							<ButtonLink href="/auth/login" variant="ghost" className="h-11 px-5">Log in</ButtonLink>
							<ButtonLink href="/auth/signup" className="h-11 px-5">
								Get started <FiArrowRight size={15} />
							</ButtonLink>
						</>
					)}
				</div>

				<button
					className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white/[0.03] text-fg hover:bg-white/[0.07] lg:hidden"
					onClick={() => setOpen((o) => !o)}
					aria-label={open ? "Close menu" : "Open menu"}
					aria-expanded={open}
				>
					{open ? <FiX size={20} /> : <FiMenu size={20} />}
				</button>
			</nav>

			{open ? (
				<div className="h-[calc(100dvh-68px)] overflow-y-auto border-t border-line bg-bg px-5 pb-10 pt-4 sm:px-8 lg:hidden">
					{authed ? (
						<div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] p-4">
							<Avatar user={user} size={42} />
							<div className="min-w-0">
								<p className="truncate text-[16px] font-medium text-fg">Hi, {displayName(user)}</p>
								<p className="truncate text-[13px] text-subtle">{user?.email}</p>
							</div>
						</div>
					) : null}
					<ul className="space-y-1">
						{NAV_LINKS.map((l) => (
							<li key={l.href}>
								<Link href={l.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-3.5 text-lg text-fg hover:bg-white/5">
									{l.label}
									<FiArrowRight className="text-subtle" />
								</Link>
							</li>
						))}
					</ul>
					<div className="mt-6 grid gap-3">
						{authed ? (
							<>
								<ButtonLink href="/dashboard" size="lg">Open dashboard</ButtonLink>
								<Button variant="secondary" size="lg" onClick={() => { logout(); setOpen(false); }}>Log out</Button>
							</>
						) : (
							<>
								<ButtonLink href="/auth/signup" size="lg">Get started free</ButtonLink>
								<ButtonLink href="/auth/login" variant="secondary" size="lg">Log in</ButtonLink>
							</>
						)}
					</div>
				</div>
			) : null}
		</header>
	);
}
