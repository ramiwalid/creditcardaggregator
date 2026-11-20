"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Card, CardSummary } from "@/lib/types";
import CardFormModal from "./CardFormModal";
import ProfileModal from "./ProfileModal";

interface CardsContextValue {
	cards: Card[] | null;
	summary: CardSummary | null;
	error: string;
	refresh: () => Promise<void>;
	openAddCard: () => void;
	openEditCard: (card: Card) => void;
	openProfile: () => void;
}

const CardsContext = createContext<CardsContextValue | null>(null);

/** Loads the user's cards + summary once for every dashboard route and owns
 * the add/edit card dialog so any screen (sidebar, overview, card page) can open it. */
export function CardsProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const [cards, setCards] = useState<Card[] | null>(null);
	const [summary, setSummary] = useState<CardSummary | null>(null);
	const [error, setError] = useState("");
	const [editing, setEditing] = useState<Card | "new" | null>(null);
	const [profileOpen, setProfileOpen] = useState(false);

	const refresh = useCallback(async () => {
		try {
			const [c, s] = await Promise.all([api.listCards(), api.summary()]);
			setCards(c);
			setSummary(s);
			setError("");
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Couldn't load your cards.");
		}
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch; state is set after the await
		refresh();
	}, [refresh]);

	const openAddCard = useCallback(() => setEditing("new"), []);
	const openEditCard = useCallback((card: Card) => setEditing(card), []);
	const close = useCallback(() => setEditing(null), []);
	const openProfile = useCallback(() => setProfileOpen(true), []);
	const closeProfile = useCallback(() => setProfileOpen(false), []);

	const value = useMemo(
		() => ({ cards, summary, error, refresh, openAddCard, openEditCard, openProfile }),
		[cards, summary, error, refresh, openAddCard, openEditCard, openProfile],
	);

	return (
		<CardsContext.Provider value={value}>
			{children}
			{editing ? (
				<CardFormModal
					card={editing === "new" ? undefined : editing}
					onClose={close}
					onSaved={async (saved) => {
						const wasNew = editing === "new";
						setEditing(null);
						await refresh();
						if (wasNew) router.push(`/dashboard/cards/${saved.id}`);
					}}
				/>
			) : null}
			{profileOpen ? <ProfileModal onClose={closeProfile} /> : null}
		</CardsContext.Provider>
	);
}

export function useCards() {
	const ctx = useContext(CardsContext);
	if (!ctx) throw new Error("useCards must be used inside <CardsProvider>");
	return ctx;
}
