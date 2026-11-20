import { FiCheck } from "react-icons/fi";
import Reveal, { SectionHeader } from "../Reveal";

const lines: [string, string][] = [
	["passwords", "argon2id · m=64MiB t=3 p=4"],
	["sessions", "signed JWT · expiring bearer tokens"],
	["reset links", "single-use · expire in 15 min"],
	["card data", "last 4 digits only · no PAN / CVV"],
	["isolation", "every query scoped to its owner"],
	["login", "uniform errors · no account enumeration"],
];

const points = [
	"We never ask for your bank username or password.",
	"Full card numbers, CVVs, and expiry dates are never collected.",
	"Your cards are only visible to your account. Other users get a 404, not a 403.",
];

export default function Security() {
	return (
		<section id="security" className="relative py-28">
			<div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-6 lg:grid-cols-2">
				<div>
					<SectionHeader
						align="left"
						eyebrow="Security"
						title="Built like a vault, not a spreadsheet"
						description="Quanta is designed to hold as little sensitive data as possible, and to protect what it does hold with modern, boring, battle-tested cryptography."
					/>
					<Reveal delay={100}>
						<ul className="mt-8 space-y-3">
							{points.map((p) => (
								<li key={p} className="flex gap-3 text-[15px] text-muted">
									<span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent/15 text-accent">
										<FiCheck size={12} />
									</span>
									{p}
								</li>
							))}
						</ul>
					</Reveal>
				</div>

				<Reveal delay={150}>
					<div className="border-gradient overflow-hidden rounded-2xl bg-panel shadow-[0_30px_80px_-30px_rgb(139_123_255/0.45)]">
						<div className="flex items-center gap-2 border-b border-line px-4 py-3">
							<span className="h-2.5 w-2.5 rounded-full bg-white/15" />
							<span className="h-2.5 w-2.5 rounded-full bg-white/15" />
							<span className="h-2.5 w-2.5 rounded-full bg-white/15" />
							<span className="ml-3 font-mono text-[11px] text-subtle">~/quanta: security audit</span>
						</div>
						<pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-7 sm:p-6 sm:text-[13px]">
							<code>
								<span className="text-subtle">$</span> <span className="text-fg">quanta audit --security</span>
								{"\n"}
								{lines.map(([k, v]) => (
									<span key={k}>
										<span className="text-good-text">✓</span> <span className="inline-block w-28 text-accent">{k}</span>
										<span className="text-muted">{v}</span>
										{"\n"}
									</span>
								))}
								<span className="text-subtle">6 checks passed · 0 warnings</span>
								<span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-accent/80" />
							</code>
						</pre>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
