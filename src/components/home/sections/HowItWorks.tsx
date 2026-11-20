import Reveal, { SectionHeader } from "../Reveal";

const steps = [
	{
		n: "01",
		title: "Create your account",
		body: "Sign up with an email and password in under a minute. Your password is hashed with Argon2id before it ever touches the database.",
	},
	{
		n: "02",
		title: "Add your cards",
		body: "Enter each card's balance, limit, and due day. No bank credentials or card numbers required: about a minute per card.",
	},
	{
		n: "03",
		title: "Stay ahead",
		body: "Your dashboard ranks upcoming payments, flags high utilization, and keeps a running ledger as you log payments and charges.",
	},
];

export default function HowItWorks() {
	return (
		<section id="how-it-works" className="relative border-y border-line bg-panel/40 py-28">
			<div className="bg-dots pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
			<div className="relative mx-auto max-w-6xl px-5 sm:px-6">
				<SectionHeader eyebrow="How it works" title="From sign-up to full picture in three steps" />

				<ol className="relative mt-16 grid gap-4 md:grid-cols-3">
					<div className="pointer-events-none absolute left-[16%] right-[16%] top-[43px] hidden h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent md:block" />
					{steps.map((s, i) => (
						<Reveal key={s.n} delay={i * 100}>
							<li className="relative h-full rounded-3xl border border-line bg-bg/80 p-7 backdrop-blur">
								<span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-bg font-mono text-[13px] text-accent shadow-[0_0_24px_-4px_rgb(139_123_255/0.6)]">
									{s.n}
								</span>
								<h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
								<p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
							</li>
						</Reveal>
					))}
				</ol>
			</div>
		</section>
	);
}
