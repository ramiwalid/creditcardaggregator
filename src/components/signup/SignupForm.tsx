"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { RedirectIfAuthenticated } from "@/components/auth/RequireAuth";
import AuthShell from "@/components/auth/AuthShell";
import PasswordChecklist from "@/components/auth/PasswordChecklist";
import Field, { FormAlert } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";

type FieldName = "first_name" | "last_name" | "email" | "password" | "username";
const FIELDS: FieldName[] = ["first_name", "last_name", "email", "password", "username"];

export default function SignupForm() {
	const router = useRouter();
	const { signup } = useAuth();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [errors, setErrors] = useState<Partial<Record<FieldName | "form", string>>>({});
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrors({});
		setSubmitting(true);
		try {
			await signup({
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				email: email.trim(),
				username: username.trim(),
				password,
			});
			router.push("/dashboard");
		} catch (err) {
			if (err instanceof ApiError && FIELDS.includes(err.field as FieldName)) {
				setErrors({ [err.field as FieldName]: err.message });
			} else {
				setErrors({ form: err instanceof ApiError ? err.message : "Account creation failed. Please try again." });
			}
			setSubmitting(false);
		}
	};

	return (
		<AuthShell
			title="Create your account"
			subtitle="Free while in beta. Set up takes about a minute."
			footer={
				<>
					Already have an account?{" "}
					<Link href="/auth/login" className="font-medium text-fg underline-offset-4 hover:underline">
						Log in
					</Link>
				</>
			}
		>
			<RedirectIfAuthenticated />
			<form onSubmit={handleSubmit} className="space-y-5">
				<div className="grid grid-cols-2 gap-3">
					<Field label="First name" type="text" autoComplete="given-name" required maxLength={50} placeholder="Ada" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.first_name} autoFocus />
					<Field label="Last name" type="text" autoComplete="family-name" required maxLength={50} placeholder="Lovelace" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.last_name} />
				</div>
				<Field label="Email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
				<Field
					label="Username"
					type="text"
					autoComplete="username"
					required
					placeholder="ada-lovelace"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					error={errors.username}
					hint="3–39 letters or numbers. Single hyphens allowed, not at the start or end."
				/>
				<Field
					label="Password"
					type="password"
					autoComplete="new-password"
					required
					placeholder="Create a password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					error={errors.password}
					hint={<PasswordChecklist password={password} />}
				/>
				{errors.form ? <FormAlert>{errors.form}</FormAlert> : null}
				<Button type="submit" size="lg" className="w-full" disabled={submitting}>
					{submitting ? "Creating account…" : <>Create account <FiArrowRight /></>}
				</Button>
			</form>
		</AuthShell>
	);
}
