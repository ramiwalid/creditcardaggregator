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
			logo: amex, 
			link: "https://www.americanexpress.com/" 
		},
		{
			name: "Bank of America",
			logo: bofa,
			link: "https://www.bankofamerica.com"
		},
		{
			name: "Venmo",
			logo: venmo,
			link: "https://www.venmo.com"
		},
		{
			name: "Discover",
			logo: discover,
			link: "https://www.discover.com"
		},
		{
			name: "Goldman Sachs",
			logo: goldman,
			link: "https://www.goldmansachs.com"
		},
		{
			name: "JPMorgan & Chase",
			logo: chase,
			link: "https://www.chase.com",
		},
		{
			name: "Barclays",
			logo: barclays,
			link: "https://www.barclays.com"
		},
		{
			name: "Wells Fargo",
			logo: wellsfargo,
			link: "https://www.wellsfargo.com"
		},
		{
			name: "Deutsche Bank",
			logo: deutsche,
			link: "https://www.db.com"
		},
		{
			name: "Axis Bank",
			logo: axis,
			link: "https://www.axisbank.com"
		},
	]

	const tapeItems = institutions.concat(institutions)

	return (
		<div className="w-full h-auto bg-[#0a0f1f] overflow-hidden py-6 bg-transparent px-10 border-b-1 border-white/50">
			<div className="flex animate-scroll whitespace-nowrap font-bold w-max">
			{[...tapeItems, ...tapeItems].map((bank, i) => (
				<div className="invert mx-10 flex-none flex items-center" key={`${bank.name}-${i}`}>
					<a href={bank.link} target="_blank">
						<Image
							src={bank.logo}
							alt={bank.name}
							width={LOGO_WIDTH}
							height={LOGO_HEIGHT}
							style={{ height: LOGO_HEIGHT, width: "auto" }}
						/>
					</a>
				</div>
			))}
			</div>
		</div>
	)
}
