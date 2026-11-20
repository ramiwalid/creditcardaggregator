"use client";

import { useState } from "react";
import { FiArrowRight, FiCheckCircle, FiMail } from "react-icons/fi";
import Field, { FormAlert, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import Reveal, { SectionHeader } from "../Reveal";

export default function Contact() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [state, setState] = useState<{ status: "idle" | "sending" | "sent" | "error"; text?: string; field?: string }>({ status: "idle" });

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (message.trim().length < 10) {
			setState({ status: "error", field: "message", text: "Tell us a little more (at least 10 characters)." });
			return;
		}
		setState({ status: "sending" });
		try {
			const res = await api.contact(name.trim(), email.trim(), message.trim());
			setState({ status: "sent", text: res.message });
			setName("");
			setEmail("");
			setMessage("");
		} catch (err) {
			setState({ status: "error", text: err instanceof ApiError ? err.message : "Couldn't send your message.", field: err instanceof ApiError ? err.field : undefined });
		}
	}

	const fieldError = (f: string) => (state.status === "error" && state.field === f ? state.text : undefined);

	return (
		<section id="contact" className="relative border-t border-line py-28">
			<div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
				<div>
					<SectionHeader
						align="left"
						eyebrow="Contact"
						title="Questions, feedback, or a feature request?"
						description="Quanta is actively being built and every message gets read. Tell us what would make it more useful for you."
					/>
					<Reveal delay={100}>
						<div className="mt-8 flex items-center gap-3 rounded-2xl border border-line bg-white/[0.02] p-4 text-[14px] text-muted">
							<span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
								<FiMail size={16} />
							</span>
							Messages go straight to the team, and we&apos;ll reply to the email you provide.
						</div>
					</Reveal>
				</div>

				<Reveal delay={120}>
					<form onSubmit={submit} className="glass rounded-3xl p-6 sm:p-8" noValidate>
						{state.status === "sent" ? (
							<div className="flex flex-col items-center py-10 text-center">
								<FiCheckCircle className="text-good-text" size={36} />
								<p className="mt-4 text-lg font-semibold">Message sent</p>
								<p className="mt-1 text-muted">{state.text}</p>
								<Button variant="secondary" className="mt-6" type="button" onClick={() => setState({ status: "idle" })}>
									Send another
								</Button>
							</div>
						) : (
							<div className="space-y-5">
								<div className="grid gap-5 sm:grid-cols-2">
									<Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" placeholder="Ada Lovelace" error={fieldError("name")} />
									<Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" error={fieldError("email")} />
								</div>
								<div>
									<label htmlFor="contact-message" className="mb-1.5 block text-[13px] font-medium text-muted">
										Message
									</label>
									<textarea
										id="contact-message"
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										required
										rows={5}
										maxLength={4000}
										placeholder="I'd love to see…"
										aria-invalid={fieldError("message") ? true : undefined}
										className={`${inputClass} h-auto resize-y py-3 leading-relaxed`}
									/>
									{fieldError("message") ? <p className="mt-1.5 text-[13px] text-critical-text">{fieldError("message")}</p> : null}
								</div>
								{state.status === "error" && !state.field ? <FormAlert>{state.text}</FormAlert> : null}
								<Button type="submit" size="lg" className="w-full" disabled={state.status === "sending"}>
									{state.status === "sending" ? "Sending…" : <>Send message <FiArrowRight /></>}
								</Button>
							</div>
						)}
					</form>
				</Reveal>
			</div>
		</section>
	);
}
