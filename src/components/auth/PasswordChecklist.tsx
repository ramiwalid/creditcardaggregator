import { FiCheck } from "react-icons/fi";

/** Mirrors the backend rule: 15+ characters, OR 8+ with an uppercase letter and a number. */
export function passwordMeetsRules(pw: string) {
	return pw.length >= 15 || (pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw));
}

export default function PasswordChecklist({ password }: { password: string }) {
	const long = password.length >= 15;
	const checks = [
		{ label: "8+ characters", ok: long || password.length >= 8 },
		{ label: "Uppercase letter", ok: long || /[A-Z]/.test(password) },
		{ label: "Number", ok: long || /[0-9]/.test(password) },
	];
	const score = long ? 3 : checks.filter((c) => c.ok).length;

	return (
		<div className="space-y-2.5" aria-live="polite">
			<div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
				{[0, 1, 2].map((i) => (
					<span key={i} className={`h-1 rounded-full transition-colors duration-300 ${i < score ? (score === 3 ? "bg-good" : "bg-warning") : "bg-white/10"}`} />
				))}
			</div>
			<ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
				{checks.map((c) => (
					<li key={c.label} className={`flex items-center gap-1.5 transition-colors ${c.ok ? "text-fg" : "text-subtle"}`}>
						<span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${c.ok ? "bg-good text-white" : "border border-line-strong"}`}>
							{c.ok ? <FiCheck size={9} strokeWidth={3} /> : null}
						</span>
						{c.label}
					</li>
				))}
			</ul>
			<p className="text-[11px] text-subtle">Or use any 15+ characters, like a passphrase.</p>
		</div>
	);
}
