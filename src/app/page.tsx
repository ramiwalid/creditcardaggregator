import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/sections/Hero";
import Institutions from "@/components/home/sections/Institutions";
import Features from "@/components/home/sections/Features";
import HowItWorks from "@/components/home/sections/HowItWorks";
import Security from "@/components/home/sections/Security";
import About from "@/components/home/sections/About";
import FAQ from "@/components/home/sections/FAQ";
import Contact from "@/components/home/sections/Contact";
import Footer, { FinalCTA } from "@/components/home/sections/Footer";

export default function Home() {
	return (
		<div className="overflow-x-clip">
			<Navbar />
			<main>
				<Hero />
				<Institutions />
				<Features />
				<HowItWorks />
				<Security />
				<About />
				<FAQ />
				<Contact />
				<FinalCTA />
			</main>
			<Footer />
		</div>
	);
}
