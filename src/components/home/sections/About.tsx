import Reveal, { SectionHeader } from "../Reveal";

const facts = [
	{ value: "1", label: "dashboard for every card you own" },
	{ value: "0", label: "full card numbers stored, ever" },
	{ value: "15m", label: "lifetime of a password reset link" },
];

export default function About() {
	return (
		<section id="about" className="relative border-y border-line bg-panel/40 py-28">
			<div className="mx-auto max-w-6xl px-5 sm:px-6">
				<SectionHeader
					eyebrow="About"
					title={<>Five banking apps is <span className="text-gradient">four too many</span></>}
					description="Quanta started as a personal project to answer one question without opening a single banking app: where do all my cards stand right now? It's built for people who juggle multiple cards and want clarity, not another budgeting lecture."
				/>
				<div className="mx-auto mt-14 grid max-w-4xl gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
					{facts.map((f, i) => (
						<Reveal key={f.label} delay={i * 80} className="bg-bg">
							<div className="p-8 text-center">
								<p className="text-gradient text-5xl font-semibold tracking-tight">{f.value}</p>
								<p className="mt-2 text-[14px] text-muted">{f.label}</p>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}
