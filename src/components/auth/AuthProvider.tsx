"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, onUnauthorized, setToken } from "@/lib/api";
import type { SignupInput, User } from "@/lib/types";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
	user: User | null;
	status: Status;
	login: (identifier: string, password: string) => Promise<User>;
	signup: (input: SignupInput) => Promise<User>;
	updateProfile: (changes: { first_name?: string; last_name?: string }) => Promise<User>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [status, setStatus] = useState<Status>("loading");

	const logout = useCallback(() => {
		setToken(null);
		setUser(null);
		setStatus("unauthenticated");
	}, []);

	// Restore the session from a stored token on first load.
	useEffect(() => {
		let cancelled = false;
		async function restore() {
			if (!getToken()) {
				if (!cancelled) setStatus("unauthenticated");
				return;
			}
			try {
				const me = await api.me();
				if (cancelled) return;
				setUser(me);
				setStatus("authenticated");
			} catch {
				if (cancelled) return;
				setToken(null);
				setStatus("unauthenticated");
			}
		}
		restore();
		return () => {
			cancelled = true;
		};
	}, []);

	// Any 401 on an authenticated request means the token expired.
	useEffect(() => onUnauthorized(logout), [logout]);

	const login = useCallback(async (identifier: string, password: string) => {
		const res = await api.login(identifier, password);
		setToken(res.access_token);
		setUser(res.user);
		setStatus("authenticated");
		return res.user;
	}, []);

	const signup = useCallback(async (input: SignupInput) => {
		const res = await api.signup(input);
		setToken(res.access_token);
		setUser(res.user);
		setStatus("authenticated");
		return res.user;
	}, []);

	const updateProfile = useCallback(async (changes: { first_name?: string; last_name?: string }) => {
		const updated = await api.updateMe(changes);
		setUser(updated);
		return updated;
	}, []);

	const value = useMemo(
		() => ({ user, status, login, signup, updateProfile, logout }),
		[user, status, login, signup, updateProfile, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
	return ctx;
}

/** Only allow relative in-app paths, so ?next= can't redirect off-site. */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard") {
	if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
	return next;
}
