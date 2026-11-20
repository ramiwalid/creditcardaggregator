import { FiPlus } from "react-icons/fi";
import Reveal, { SectionHeader } from "../Reveal";

const faqs = [
	{
		q: "Does Quanta connect to my bank?",
		a: "Not yet. Today you add cards manually, which takes about a minute per card and means Quanta never needs your banking credentials. Automatic syncing is on the roadmap.",
	},
	{
		q: "Do you store my card number?",
		a: "No. Quanta never asks for full card numbers, CVVs, or expiry dates. You can optionally add the last four digits to tell cards apart.",
	},
	{
		q: "Will using Quanta affect my credit score?",
		a: "No. Quanta doesn't pull your credit or talk to the credit bureaus. It only shows the numbers you enter.",
	},
	{
		q: "How is utilization calculated?",
		a: "Balance divided by credit limit, per card and across all cards that have a limit. Charge cards with no preset limit are excluded so they don't skew the number. Under 30% is shown as healthy, 30–50% as elevated, and 50% or more as high.",
	},
	{
		q: "How much does it cost?",
		a: "Quanta is free while it's in beta.",
	},
];

export default function FAQ() {
	return (
		<section id="faq" className="py-28">
			<div className="mx-auto max-w-3xl px-5 sm:px-6">
				<SectionHeader eyebrow="FAQ" title="Questions, answered" />
				<Reveal className="mt-12">
					<div className="divide-y divide-line rounded-3xl border border-line bg-white/[0.015]">
						{faqs.map((f) => (
							<details key={f.q} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
								<summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16px] font-medium text-fg">
									{f.q}
									<FiPlus className="flex-none text-subtle transition-transform duration-300 group-open:rotate-45 group-open:text-accent" />
								</summary>
								<p className="-mt-1 pb-5 pr-8 text-[15px] leading-relaxed text-muted">{f.a}</p>
							</details>
						))}
					</div>
				</Reveal>
			</div>
		</section>
	);
}
