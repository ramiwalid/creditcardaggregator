"use client";
import Link from "next/link";
import { useState } from "react";
import { FiArrowRight, FiMail } from "react-icons/fi";
import AuthShell from "@/components/auth/AuthShell";
import Field, { FormAlert } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";

export default function ForgotPassword() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [emailSent, setEmailSent] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		setSubmitting(true);
		try {
			await api.forgotPassword(email.trim());
			setEmailSent(true);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const backToLogin = (
		<Link href="/auth/login" className="font-medium text-fg underline-offset-4 hover:underline">
			← Back to log in
		</Link>
	);

	if (emailSent) {
		return (
			<AuthShell title="Check your email" subtitle={<>If an account exists for <span className="font-medium text-fg">{email}</span>, a reset link is on its way.</>} footer={backToLogin}>
				<div className="rounded-2xl border border-line bg-white/[0.02] p-5">
					<div className="flex items-center gap-3">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent"><FiMail size={18} /></span>
						<div className="text-[13px] text-muted">
							The link expires in <span className="font-mono text-fg">15 min</span> and works once. It may take a minute or two to arrive.
						</div>
					</div>
				</div>
				<ButtonLink href="/auth/login" variant="secondary" size="lg" className="mt-5 w-full">Return to log in</ButtonLink>
			</AuthShell>
		);
	}

	return (
		<AuthShell title="Reset your password" subtitle="Enter your account's email and we'll send you a reset link." footer={backToLogin}>
			<form onSubmit={handleSubmit} className="space-y-5">
				<Field label="Email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
				{error ? <FormAlert>{error}</FormAlert> : null}
				<Button type="submit" size="lg" className="w-full" disabled={submitting}>
					{submitting ? "Sending…" : <>Send reset link <FiArrowRight /></>}
				</Button>
			</form>
		</AuthShell>
	);
}
