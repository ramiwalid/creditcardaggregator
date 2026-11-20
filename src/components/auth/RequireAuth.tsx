"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
	const { status } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
		}
	}, [status, router, pathname]);

	if (status !== "authenticated") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
			</div>
		);
	}
	return <>{children}</>;
}

/** Sends already-logged-in users away from login/signup pages. */
export function RedirectIfAuthenticated({ to = "/dashboard" }: { to?: string }) {
	const { status } = useAuth();
	const router = useRouter();
	useEffect(() => {
		if (status === "authenticated") router.replace(to);
	}, [status, router, to]);
	return null;
}
