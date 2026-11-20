import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import Logo from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "../Reveal";

const columns = [
	{
		title: "Product",
		links: [
			["Features", "/#features"],
			["How it works", "/#how-it-works"],
			["Institutions", "/#institutions"],
			["Dashboard", "/dashboard"],
		],
	},
	{
		title: "Company",
		links: [
			["About", "/#about"],
			["Security", "/#security"],
			["FAQ", "/#faq"],
			["Contact", "/#contact"],
		],
	},
	{
		title: "Account",
		links: [
			["Create account", "/auth/signup"],
			["Log in", "/auth/login"],
			["Reset password", "/auth/forgotpassword"],
		],
	},
];

export function FinalCTA() {
	return (
		<section className="px-5 pb-28 sm:px-6">
			<Reveal>
				<div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-line bg-panel px-6 py-20 text-center">
					<div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_75%)]" />
					<div className="pointer-events-none absolute left-1/2 top-full h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgb(139_123_255/0.4),transparent)]" />
					<div className="relative">
						<h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">Know where every card stands, in seconds.</h2>
						<p className="mx-auto mt-4 max-w-lg text-[17px] text-muted">Set up your dashboard in a few minutes. Free while in beta.</p>
						<ButtonLink href="/auth/signup" size="lg" className="mt-8">
							Create your free account <FiArrowRight />
						</ButtonLink>
					</div>
				</div>
			</Reveal>
		</section>
	);
}

export default function Footer() {
	return (
		<footer className="border-t border-line">
			<div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
				<div>
					<Logo />
					<p className="mt-4 max-w-xs text-[14px] leading-relaxed text-subtle">Every credit card, one command center. Balances, utilization, and due dates in one private dashboard.</p>
				</div>
				{columns.map((col) => (
					<div key={col.title}>
						<p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">{col.title}</p>
						<ul className="mt-4 space-y-2.5">
							{col.links.map(([label, href]) => (
								<li key={label}>
									<Link href={href} className="text-[14px] text-muted transition-colors hover:text-fg">
										{label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
			<div className="border-t border-line">
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 font-mono text-[12px] text-subtle sm:flex-row sm:px-6">
					<span>© {new Date().getFullYear()} Quanta</span>
					<span>Built with Next.js + FastAPI</span>
				</div>
			</div>
		</footer>
	);
}
