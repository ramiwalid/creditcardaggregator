import { FiArrowRight, FiCheck } from "react-icons/fi";
import { ButtonLink } from "@/components/ui/Button";
import ProductPreview from "./ProductPreview";

const trust = ["Argon2id-hashed passwords", "No full card numbers, ever", "Works with any issuer"];

export default function Hero() {
	return (
		<section className="relative overflow-hidden pt-32 pb-28 sm:pt-40">
			<div className="bg-grid pointer-events-none absolute inset-0 -z-10" />
			<div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(139_123_255/0.22),transparent)]" />
			<div className="pointer-events-none absolute left-[65%] top-40 -z-10 h-[400px] w-[500px] bg-[radial-gradient(closest-side,rgb(56_211_242/0.12),transparent)]" />

			<div className="mx-auto max-w-6xl px-5 text-center sm:px-6">
				<a href="#how-it-works" className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] py-1 pl-1.5 pr-3 font-mono text-[12px] text-muted transition-colors hover:border-line-strong hover:text-fg">
					<span className="flex items-center gap-1.5 rounded-full bg-good/15 px-2 py-0.5 text-good-text">
						<span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-good-text" /> Beta
					</span>
					Free while we build. See how it works <FiArrowRight size={12} />
				</a>

				<h1 className="animate-fade-up mx-auto mt-7 max-w-4xl text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] text-balance [animation-delay:80ms] sm:text-7xl">
					Every credit card. <br className="hidden sm:block" />
					<span className="text-gradient">One command center.</span>
				</h1>

				<p className="animate-fade-up mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-muted text-pretty [animation-delay:160ms] sm:text-lg">
					Quanta brings your balances, limits, utilization, and due dates into one dashboard, so you always know where you stand and never miss a payment.
				</p>

				<div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 [animation-delay:240ms] sm:flex-row">
					<ButtonLink href="/auth/signup" size="lg" className="w-full sm:w-auto">
						Get started for free <FiArrowRight />
					</ButtonLink>
					<ButtonLink href="/#how-it-works" variant="secondary" size="lg" className="w-full sm:w-auto">
						See how it works
					</ButtonLink>
				</div>

				<ul className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[12px] text-subtle [animation-delay:320ms]">
					{trust.map((t) => (
						<li key={t} className="flex items-center gap-1.5">
							<FiCheck className="text-accent" size={13} /> {t}
						</li>
					))}
				</ul>

				<div className="animate-fade-up mt-20 [animation-delay:420ms]">
					<ProductPreview />
				</div>
			</div>
		</section>
	);
}
