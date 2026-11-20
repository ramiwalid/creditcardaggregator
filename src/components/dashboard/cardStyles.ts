import type { CardColor, Network } from "@/lib/types";

/** Layered mesh gradients for each card theme. `dot` is the solid swatch
 * used wherever the card is referenced in lists. */
export const CARD_THEMES: Record<CardColor, { label: string; background: string; dot: string }> = {
	violet: {
		label: "Nebula",
		dot: "#8b7bff",
		background:
			"radial-gradient(120% 140% at 0% 0%, #6d5dfc 0%, transparent 55%), radial-gradient(120% 120% at 100% 100%, #c084fc 0%, transparent 50%), linear-gradient(135deg, #1b1640 0%, #2a1f6b 100%)",
	},
	ocean: {
		label: "Tide",
		dot: "#38bdf8",
		background:
			"radial-gradient(120% 140% at 100% 0%, #22d3ee 0%, transparent 50%), radial-gradient(120% 120% at 0% 100%, #2563eb 0%, transparent 60%), linear-gradient(135deg, #071a33 0%, #0c2c5c 100%)",
	},
	sunset: {
		label: "Ember",
		dot: "#fb923c",
		background:
			"radial-gradient(120% 140% at 0% 100%, #f97316 0%, transparent 55%), radial-gradient(120% 120% at 100% 0%, #e11d74 0%, transparent 55%), linear-gradient(135deg, #2b0d1e 0%, #4a1230 100%)",
	},
	emerald: {
		label: "Aurora",
		dot: "#34d399",
		background:
			"radial-gradient(120% 140% at 100% 100%, #10b981 0%, transparent 55%), radial-gradient(100% 120% at 0% 0%, #22d3ee 0%, transparent 50%), linear-gradient(135deg, #04201b 0%, #063a30 100%)",
	},
	graphite: {
		label: "Carbon",
		dot: "#a1a1aa",
		background:
			"radial-gradient(120% 120% at 100% 0%, #52525b 0%, transparent 55%), radial-gradient(100% 120% at 0% 100%, #27272a 0%, transparent 60%), linear-gradient(135deg, #0f1013 0%, #1c1d22 100%)",
	},
	rose: {
		label: "Flare",
		dot: "#f472b6",
		background:
			"radial-gradient(120% 140% at 0% 0%, #ec4899 0%, transparent 55%), radial-gradient(120% 120% at 100% 100%, #8b5cf6 0%, transparent 55%), linear-gradient(135deg, #2a0b26 0%, #3d0f3a 100%)",
	},
};

export const CARD_COLORS = Object.keys(CARD_THEMES) as CardColor[];

export const NETWORK_LABELS: Record<Network, string> = {
	visa: "VISA",
	mastercard: "Mastercard",
	amex: "AMEX",
	discover: "Discover",
	other: "Card",
};

export const ISSUER_SUGGESTIONS = [
	"American Express",
	"Apple",
	"Bank of America",
	"Barclays",
	"Capital One",
	"Chase",
	"Citi",
	"Discover",
	"Goldman Sachs",
	"U.S. Bank",
	"Wells Fargo",
];

/** Status mapping for utilization. Color is always paired with the label. */
export const UTILIZATION_STATUS = {
	good: { color: "var(--color-good)", label: "Healthy" },
	warning: { color: "var(--color-warning)", label: "Elevated" },
	critical: { color: "var(--color-critical)", label: "High" },
	none: { color: "rgb(255 255 255 / 0.25)", label: "No limit" },
} as const;
