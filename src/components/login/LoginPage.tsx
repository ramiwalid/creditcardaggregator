"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";
import { safeNextPath, useAuth } from "@/components/auth/AuthProvider";
import { RedirectIfAuthenticated } from "@/components/auth/RequireAuth";
import AuthShell from "@/components/auth/AuthShell";
import Field, { FormAlert } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const next = safeNextPath(searchParams.get("next"));
	const { login } = useAuth();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		setSubmitting(true);
		try {
			await login(identifier.trim(), password);
			router.push(next);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Log in failed. Please try again.");
			setSubmitting(false);
		}
	};

	return (
		<AuthShell
			title="Welcome back"
			subtitle="Log in to your Quanta dashboard."
			footer={
				<>
					New to Quanta?{" "}
					<Link href="/auth/signup" className="font-medium text-fg underline-offset-4 hover:underline">
						Create an account
					</Link>
				</>
			}
		>
			<RedirectIfAuthenticated to={next} />
			<form onSubmit={handleSubmit} className="space-y-5">
				<Field label="Email or username" type="text" autoComplete="username" required placeholder="you@example.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus />
				<Field
					label="Password"
					type="password"
					autoComplete="current-password"
					required
					placeholder="••••••••"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					labelAction={
						<Link href="/auth/forgotpassword" className="text-[13px] text-accent hover:underline">
							Forgot password?
						</Link>
					}
				/>
				{error ? <FormAlert>{error}</FormAlert> : null}
				<Button type="submit" size="lg" className="w-full" disabled={submitting}>
					{submitting ? "Logging in…" : <>Log in <FiArrowRight /></>}
				</Button>
			</form>
		</AuthShell>
	);
}
