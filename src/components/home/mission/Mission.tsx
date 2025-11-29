"use client";

import { useState, useRef, useEffect } from "react";
import { Quanta } from "./Quanta"
import { Lexend, Merriweather } from "next/font/google"

const lexend = Lexend({
	weight: ['200', '300', '400', '700']
});

const merriweather = Merriweather({
	weight: ['300', '400', '600', '700']
});

export default function Mission() {
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

	function handleClick (index: number) {
		setExpandedIndex(prev => prev === index ? null : index
				);
	};

	const level_up = [
		"Your privacy and security matters to us",
		"Trusted by countless financial institutions worldwide",
		"Pay your bills in a matter of seconds with Quanta",
		"See all of your credit cards, all from one dashboard"
	];

	return (
		<div className="mt-30 mx-auto text-center">
			<Quanta />
			<h1 className={`${merriweather.className} text-4xl font-bold pt-15`}>
				Level up the way you pay with Quanta
			</h1>
			<p className={`${merriweather.className} font-light text-white/80 pt-5`}>
				Time is money, and we don't want you to waste yours
			</p>
			<div className="grid grid-cols-2 mt-10 bg-gradient-to-br from-[#0b0f18] via-[#131a2d] to-[#3b1d63] w-5/6 mx-auto">
				<div className="flex flex-col col-span-1">
					{level_up.map((reason, i) => (
						<button onClick={() => handleClick(i)} key={i}><div className={`flex justify-between border-t border-b rounded-sm border-white/50 p-3 rows-span-1 text-start hover:cursor-pointer text-white/70 hover:text-white transition-all duration-300 overflow-hidden ${expandedIndex === i ? "h-40" : "h-18"}`}>
							<p className={`${merriweather.className} font-bold py-2`}>{reason}</p>
							<p className="content-center text-3xl text-pink-400">+</p>
						</div></button>
					))}
				</div>
			</div>
		</div>
	)
}
