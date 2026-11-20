import Link from "next/link";
import { FiCheck } from "react-icons/fi";
import Logo from "@/components/ui/Logo";
import CreditCardVisual from "@/components/dashboard/CreditCardVisual";

interface Props {
	title: string;
	subtitle?: React.ReactNode;
	children: React.ReactNode;
	footer?: React.ReactNode;
}

const points = ["Every balance and limit in one view", "Due dates sorted by urgency", "Link your bank or add cards by hand"];

export default function AuthShell({ title, subtitle, children, footer }: Props) {
	return (
		<div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
			<div className="relative flex flex-col px-5 py-6 sm:px-10">
				<div className="bg-grid pointer-events-none absolute inset-0 opacity-60 lg:hidden" />
				<div className="relative flex items-center justify-between">
					<Logo />
					<Link href="/" className="text-[13px] text-subtle hover:text-fg">← Back to site</Link>
				</div>
				<main className="relative mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">
					<div className="animate-fade-up">
						<h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
						{subtitle ? <p className="mt-2 text-[15px] text-muted">{subtitle}</p> : null}
					</div>
					<div className="animate-fade-up mt-8 [animation-delay:80ms]">{children}</div>
					{footer ? <div className="animate-fade-up mt-8 text-center text-[14px] text-muted [animation-delay:160ms]">{footer}</div> : null}
				</main>
				<p className="relative text-center font-mono text-[11px] text-subtle">Protected with Argon2id · We never store card numbers</p>
			</div>

			<aside className="relative hidden overflow-hidden border-l border-line bg-panel lg:block" aria-hidden="true">
				<div className="bg-grid absolute inset-0" />
				<div className="absolute left-1/2 top-1/3 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_123_255/0.35),transparent)]" />
				<div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(56_211_242/0.18),transparent)]" />

				<div className="relative flex h-full flex-col justify-center px-14 xl:px-20">
					<div className="relative mx-auto h-[300px] w-full max-w-[420px]">
						<div className="absolute left-0 top-0 w-[78%] -rotate-[8deg] animate-float opacity-80 [animation-delay:-2s]">
							<CreditCardVisual compact card={{ name: "Gold Card", issuer: "American Express", network: "amex", last_four: "3948", color: "sunset", current_balance_cents: 125050, credit_limit_cents: 0 }} />
						</div>
						<div className="absolute bottom-0 right-0 w-[78%] rotate-[4deg] animate-float">
							<CreditCardVisual compact card={{ name: "Sapphire Preferred", issuer: "Chase", network: "visa", last_four: "1029", color: "ocean", current_balance_cents: 460000, credit_limit_cents: 2000000 }} />
						</div>
					</div>
					<div className="mx-auto mt-14 w-full max-w-[420px]">
						<p className="text-2xl font-semibold leading-snug tracking-tight">
							Every credit card. <span className="text-gradient">One command center.</span>
						</p>
						<ul className="mt-6 space-y-3">
							{points.map((p) => (
								<li key={p} className="flex items-center gap-3 text-[15px] text-muted">
									<span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent">
										<FiCheck size={12} />
									</span>
									{p}
								</li>
							))}
						</ul>
					</div>
				</div>
			</aside>
		</div>
	);
}
