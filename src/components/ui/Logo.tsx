import Link from "next/link";

/** Quanta mark: two offset cards forming a "Q"-like stack. */
export function LogoMark({ size = 28 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
			<defs>
				<linearGradient id="qm-a" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
					<stop stopColor="#b4a8ff" />
					<stop offset="0.5" stopColor="#8b7bff" />
					<stop offset="1" stopColor="#38d3f2" />
				</linearGradient>
			</defs>
			<rect x="1" y="1" width="30" height="30" rx="9" fill="#0d0f17" stroke="url(#qm-a)" strokeOpacity="0.6" />
			<rect x="7" y="9" width="15" height="10" rx="2.5" fill="url(#qm-a)" opacity="0.45" />
			<rect x="10" y="13" width="15" height="10" rx="2.5" fill="url(#qm-a)" />
			<rect x="12.5" y="16" width="4" height="2" rx="0.6" fill="#05060a" opacity="0.7" />
		</svg>
	);
}

export default function Logo({ href = "/", size = 28 }: { href?: string; size?: number }) {
	return (
		<Link href={href} className="group flex items-center gap-2.5" aria-label="Quanta home">
			<LogoMark size={size} />
			<span className="text-[17px] font-semibold tracking-tight text-fg">Quanta</span>
		</Link>
	);
}
