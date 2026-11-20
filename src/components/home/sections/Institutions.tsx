import Image, { type StaticImageData } from "next/image";
import amex from "public/americanexpress.svg";
import bofa from "public/bankofamerica.svg";
import chase from "public/chase.svg";
import discover from "public/discover.svg";
import goldman from "public/goldmansachs.svg";
import barclays from "public/barclays.svg";
import wellsfargo from "public/wellsfargo.svg";
import santander from "public/santander.svg";
import deutsche from "public/deutschebank.svg";
import axis from "public/axisbank.svg";
import jpmorgan from "public/jp-morgan-chase.svg";
import schwab from "public/charles-schwab-1.svg";
import venmo from "public/venmo.svg";
import { SectionHeader } from "../Reveal";

const institutions: { name: string; logo: StaticImageData; wide?: boolean }[] = [
	{ name: "American Express", logo: amex },
	{ name: "Chase", logo: chase },
	{ name: "Bank of America", logo: bofa },
	{ name: "Discover", logo: discover, wide: true },
	{ name: "Goldman Sachs", logo: goldman },
	{ name: "Barclays", logo: barclays },
	{ name: "Wells Fargo", logo: wellsfargo },
	{ name: "Santander", logo: santander, wide: true },
	{ name: "JPMorgan Chase", logo: jpmorgan, wide: true },
	{ name: "Charles Schwab", logo: schwab, wide: true },
	{ name: "Deutsche Bank", logo: deutsche },
	{ name: "Axis Bank", logo: axis },
	{ name: "Venmo", logo: venmo, wide: true },
];

function Tile({ name, logo, wide }: (typeof institutions)[number]) {
	return (
		<div className="flex h-[92px] w-[176px] flex-none flex-col items-center justify-center gap-2.5 rounded-2xl border border-line bg-white/[0.02] transition-colors hover:border-line-strong hover:bg-white/[0.04]">
			<Image src={logo} alt="" className={`w-auto opacity-75 [filter:brightness(0)_invert(1)] ${wide ? "h-5 max-w-[120px]" : "h-7 max-w-[100px]"}`} />
			<span className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">{name}</span>
		</div>
	);
}

export default function Institutions() {
	const row = [...institutions, ...institutions];
	return (
		<section id="institutions" className="relative border-y border-line bg-panel/40 py-20">
			<div className="mx-auto max-w-6xl px-5 sm:px-6">
				<SectionHeader
					eyebrow="Supported institutions"
					title="Track cards from the issuers you already use"
					description="If it has a balance and a due date, Quanta can track it: Visa, Mastercard, Amex, and Discover cards from any bank or credit union."
				/>
			</div>
			<div className="mask-fade-x relative mt-12 overflow-hidden" aria-label="Supported issuers">
				<div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
					{row.map((inst, i) => (
						<Tile key={`${inst.name}-${i}`} {...inst} />
					))}
				</div>
			</div>
			<ul className="sr-only">
				{institutions.map((i) => <li key={i.name}>{i.name}</li>)}
			</ul>
		</section>
	);
}
