"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import AuthShell from "@/components/auth/AuthShell";
import PasswordChecklist from "@/components/auth/PasswordChecklist";
import Field, { FormAlert } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";

interface ResetPasswordPageProps {
	params: Promise<{ token: string }>;
}

export default function ResetPassword({ params }: ResetPasswordPageProps) {
	const { token } = React.use(params);
	const [password, setPassword] = useState("");
	const [confirmedPassword, setConfirmedPassword] = useState("");
	const [error, setError] = useState<{ field?: string; message: string } | null>(null);
	const [done, setDone] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		if (password !== confirmedPassword) {
			setError({ field: "confirm", message: "Passwords don't match." });
			return;
		}
		setSubmitting(true);
		try {
			await api.resetPassword(decodeURIComponent(token), password);
			setDone(true);
		} catch (err) {
			if (err instanceof ApiError) setError({ field: err.field, message: err.message });
			else setError({ message: "Couldn't update your password. Please try again." });
		} finally {
			setSubmitting(false);
		}
	};

	if (done) {
		return (
			<AuthShell title="Password updated" subtitle="You can now log in with your new password.">
				<div className="flex items-center gap-3 rounded-2xl border border-good/30 bg-good/10 p-4 text-[14px] text-good-text">
					<FiCheckCircle size={18} /> Your password was changed successfully.
				</div>
				<ButtonLink href="/auth/login" size="lg" className="mt-5 w-full">
					Go to log in <FiArrowRight />
				</ButtonLink>
			</AuthShell>
		);
	}

	return (
		<AuthShell title="Choose a new password" subtitle="Pick something strong. This link works once and expires 15 minutes after it was sent.">
			<form onSubmit={handleSubmit} className="space-y-5">
				<Field
					label="New password"
					type="password"
					autoComplete="new-password"
					required
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					error={error?.field === "password" ? error.message : undefined}
					hint={<PasswordChecklist password={password} />}
					autoFocus
				/>
				<Field
					label="Confirm password"
					type="password"
					autoComplete="new-password"
					required
					value={confirmedPassword}
					onChange={(e) => setConfirmedPassword(e.target.value)}
					error={error?.field === "confirm" ? error.message : undefined}
				/>
				{error && error.field !== "password" && error.field !== "confirm" ? (
					<FormAlert>
						{error.message}{" "}
						{error.field === "token" ? <Link href="/auth/forgotpassword" className="underline">Request a new link</Link> : null}
					</FormAlert>
				) : null}
				<Button type="submit" size="lg" className="w-full" disabled={submitting}>
					{submitting ? "Updating…" : "Update password"}
				</Button>
			</form>
		</AuthShell>
	);
}
