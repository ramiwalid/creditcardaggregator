"use client";

import { useState } from "react";
import Modal from "./Modal";
import Field, { FormAlert } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api";

export default function ProfileModal({ onClose }: { onClose: () => void }) {
	const { user, updateProfile } = useAuth();
	const [firstName, setFirstName] = useState(user?.first_name ?? "");
	const [lastName, setLastName] = useState(user?.last_name ?? "");
	const [errors, setErrors] = useState<{ first_name?: string; last_name?: string; form?: string }>({});
	const [saving, setSaving] = useState(false);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		const errs: typeof errors = {};
		if (!firstName.trim()) errs.first_name = "Enter your first name";
		if (!lastName.trim()) errs.last_name = "Enter your last name";
		setErrors(errs);
		if (Object.keys(errs).length) return;

		setSaving(true);
		try {
			await updateProfile({ first_name: firstName.trim(), last_name: lastName.trim() });
			onClose();
		} catch (err) {
			if (err instanceof ApiError && (err.field === "first_name" || err.field === "last_name")) setErrors({ [err.field]: err.message });
			else setErrors({ form: err instanceof ApiError ? err.message : "Couldn't save your name." });
			setSaving(false);
		}
	}

	return (
		<Modal title="Your profile" description="This is how Quanta greets you." onClose={onClose}>
			<form onSubmit={submit} className="space-y-5" noValidate>
				<div className="grid grid-cols-2 gap-3">
					<Field label="First name" autoComplete="given-name" maxLength={50} value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.first_name} autoFocus />
					<Field label="Last name" autoComplete="family-name" maxLength={50} value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.last_name} />
				</div>
				<dl className="divide-y divide-line rounded-2xl border border-line bg-white/[0.02] px-4 text-[13px]">
					<div className="flex justify-between py-3">
						<dt className="text-subtle">Username</dt>
						<dd className="font-mono text-muted">{user?.username}</dd>
					</div>
					<div className="flex justify-between py-3">
						<dt className="text-subtle">Email</dt>
						<dd className="truncate pl-4 text-muted">{user?.email}</dd>
					</div>
				</dl>
				{errors.form ? <FormAlert>{errors.form}</FormAlert> : null}
				<div className="flex justify-end gap-2 border-t border-line pt-5">
					<Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
					<Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
				</div>
			</form>
		</Modal>
	);
}
