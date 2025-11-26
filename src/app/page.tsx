import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/hero/Hero";
import Demo from "@/components/home/demo/Demo";
import Tape from "@/components/home/tape/Tape";
import Mission from "@/components/home/mission/Mission";
import 'animate.css';

export default function Home() {
	return (
		<div className="scrollbar-width-none">
			<Navbar />
			<Hero />
			<Demo />
			<div className="relative bg-[#11152a]">
				<div className="relative w-full overflow-hidden py-6">
					<div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0f1f] to-transparent">
					</div>
					<div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-1 from-[#0a0f1f] to-transparent">
					</div>
					<Tape />
					<Mission />
				</div>
			</div>
		</div>
	)
}
