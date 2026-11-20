"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiMenu, FiX } from "react-icons/fi";
import Logo from "@/components/ui/Logo";
import { ButtonLink, Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { displayName } from "@/lib/types";

export const NAV_LINKS = [
	{ label: "Features", href: "/#features" },
	{ label: "How it works", href: "/#how-it-works" },
	{ label: "Institutions", href: "/#institutions" },
	{ label: "Security", href: "/#security" },
	{ label: "About", href: "/#about" },
	{ label: "Contact", href: "/#contact" },
];

export default function Navbar() {
	const { status, user, logout } = useAuth();
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);

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

	return (
		<header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${scrolled || open ? "border-b border-line bg-bg/75 backdrop-blur-xl" : "border-b border-transparent"}`}>
			<nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6" aria-label="Main">
				<Logo />

				<ul className="hidden items-center gap-1 lg:flex">
					{NAV_LINKS.map((l) => (
						<li key={l.href}>
							<Link href={l.href} className="rounded-full px-3 py-1.5 text-[14px] text-muted transition-colors hover:bg-white/[0.05] hover:text-fg">
								{l.label}
							</Link>
						</li>
					))}
				</ul>

				<div className={`hidden items-center gap-2 lg:flex ${status === "loading" ? "invisible" : ""}`}>
					{authed ? (
						<>
							<span className="mr-1 text-[14px] text-muted">Hi, <span className="text-fg">{displayName(user)}</span></span>
							<Button variant="ghost" size="sm" onClick={logout}>Log out</Button>
							<ButtonLink href="/dashboard" size="sm">
								Dashboard <FiArrowRight size={14} />
							</ButtonLink>
						</>
					) : (
						<>
							<ButtonLink href="/auth/login" variant="ghost" size="sm">Log in</ButtonLink>
							<ButtonLink href="/auth/signup" size="sm">
								Get started <FiArrowRight size={14} />
							</ButtonLink>
						</>
					)}
				</div>

				<button
					className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-fg hover:bg-white/5 lg:hidden"
					onClick={() => setOpen((o) => !o)}
					aria-label={open ? "Close menu" : "Open menu"}
					aria-expanded={open}
				>
					{open ? <FiX size={20} /> : <FiMenu size={20} />}
				</button>
			</nav>

			{open ? (
				<div className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-bg px-5 pb-10 pt-4 lg:hidden">
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
