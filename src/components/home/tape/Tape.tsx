import Image from "next/image"
import amex from "public/americanexpress.svg";
import bofa from "public/bankofamerica.svg";
import venmo from "public/venmo.svg";
import discover from "public/discover.svg";
import goldman from "public/goldmansachs.svg";
import chase from "public/chase.svg";
import barclays from "public/barclays.svg";
import wellsfargo from "public/wellsfargo.svg";
import deutsche from "public/deutschebank.svg";
import axis from "public/axisbank.svg";

const LOGO_WIDTH = 150
const LOGO_HEIGHT = 70

export default function Tape() {
	const institutions = [
		{
			name: "American Express",
			logo: amex 
		},
		{
			name: "Bank of America",
			logo: bofa
		},
		{
			name: "Venmo",
			logo: venmo
		},
		{
			name: "Discover",
			logo: discover
		},
		{
			name: "Goldman Sachs",
			logo: goldman
		},
		{
			name: "JPMorgan & Chase",
			logo: chase
		},
		{
			name: "Barclays",
			logo: barclays
		},
		{
			name: "Wells Fargo",
			logo: wellsfargo
		},
		{
			name: "Deutsche Bank",
			logo: deutsche
		},
		{
			name: "Axis Bank",
			logo: axis
		},
	]

	const tapeItems = institutions.concat(institutions)

	return (
		<div className="w-full h-auto bg-[#0a0f1f] overflow-hidden py-6 bg-transparent px-10 border-b-1 border-white/50">
			<div className="flex animate-scroll whitespace-nowrap font-bold w-max">
			{[...tapeItems, ...tapeItems].map((bank, i) => (
				<div className="invert mx-10 flex-none flex items-center" key={`${bank.name}-${i}`}>
					<Image
						src={bank.logo}
						alt={bank.name}
						width={LOGO_WIDTH}
						height={LOGO_HEIGHT}
						style={{ height: LOGO_HEIGHT, width: "auto" }}
					/>
				</div>
			))}
			</div>
		</div>
	)
}
