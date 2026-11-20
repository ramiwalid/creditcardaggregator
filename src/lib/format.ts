const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function formatCents(cents: number | null | undefined, opts: { whole?: boolean } = {}): string {
	if (cents === null || cents === undefined) return "—";
	return (opts.whole ? usdWhole : usd).format(cents / 100);
}

/** "1,234.56" / "$1234" / "" -> cents (or null when blank/invalid). */
export function parseDollars(input: string): number | null {
	const cleaned = input.replace(/[$,\s]/g, "");
	if (cleaned === "") return null;
	if (!/^-?\d*(\.\d{0,2})?$/.test(cleaned) || cleaned === "-" || cleaned === ".") return NaN;
	return Math.round(parseFloat(cleaned) * 100);
}

/** cents -> "1234.56" for pre-filling inputs. */
export function centsToInput(cents: number | null | undefined): string {
	if (cents === null || cents === undefined) return "";
	return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

export function formatPercent(fraction: number | null | undefined, digits = 0): string {
	if (fraction === null || fraction === undefined) return "—";
	return `${(fraction * 100).toFixed(digits)}%`;
}

/** Parse "YYYY-MM-DD" as a local date (new Date("2026-01-02") would be UTC). */
export function parseISODate(iso: string): Date {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y, m - 1, d);
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
	if (!iso) return "—";
	return parseISODate(iso).toLocaleDateString("en-US", opts);
}

export function todayISO(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function relativeDays(days: number | null | undefined): string {
	if (days === null || days === undefined) return "";
	if (days === 0) return "Due today";
	if (days === 1) return "Due tomorrow";
	return `Due in ${days} days`;
}

export function ordinal(n: number): string {
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Utilization bands: under 30% is healthy, 30-50% elevated, 50%+ high. */
export function utilizationTone(fraction: number | null | undefined): "good" | "warning" | "critical" | "none" {
	if (fraction === null || fraction === undefined) return "none";
	if (fraction < 0.3) return "good";
	if (fraction < 0.5) return "warning";
	return "critical";
}

/** Compact currency for chart axes: $1.2K, $15K, $1.1M. */
export function formatCompactCents(cents: number): string {
	return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(cents / 100);
}

/** "just now", "5 min ago", "3 hr ago", "2 days ago" for an ISO timestamp. */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
	if (!iso) return "never";
	const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
	if (seconds < 45) return "just now";
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} hr ago`;
	const days = Math.round(hours / 24);
	return `${days} day${days === 1 ? "" : "s"} ago`;
}
