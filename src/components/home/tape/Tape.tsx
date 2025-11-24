import Image from "next/image"
import amex from "public/americanexpress.svg";
import bofa from "public/bankofamerica.svg";
import venmo from "public/venmo.svg";
import discover from "public/discover.svg";
import goldman from "public/goldmansachs.svg";
import chase from "public/chase.svg";

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
	]

	return (
		<div className="w-full bg-white overflow-hidden py-6 bg-transparent px-10">
			<div className="flex animate-scroll whitespace-nowrap gap-20 font-bold text-xl">
			{institutions.concat(institutions).map((bank, i) => (
				<div className="flex items-center justify-between text-white/60" key={i}>
					<Image src={bank.logo} alt={bank.name} width={200}/>
				</div>
			))}
			</div>
		</div>
	)
}
