"use client";
import { CiCreditCard2 } from "react-icons/ci"
import { Inter } from "next/font/google"
import { useState } from "react";

const inter = Inter({
	weight: '300'
});

export default function ForgotPassword() {
	const [email, setEmail] = useState('');
	const [emailError, setEmailError] = useState(false);
	const [emailSent, setEmailSent] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		console.log("Submitting: ", {email});

		const payload = {
			email: email
		}

		try {
			const response = await fetch('http://localhost:8000/auth/forgotpassword', {
				method: 'POST',
				headers: {'Content-Type': "application/json"},
				body: JSON.stringify(payload),
			});
			const responseData = await response.json();
			setEmailError(false);

			if (!response.ok) {
				setEmailError(true);
				throw new Error(response.statusText);
			}

			setEmailSent(true)
		} catch (error) {
			console.log("Failed email verification");
		}
	}

	return (
		<div className={`${inter.className} mx-auto min-h-screen w-1/5`}>
			<div className={`${emailSent ? "hidden" : "mt-45 text-center"}`}>
				<div className="flex justify-center">
					<CiCreditCard2 size={70} />
				</div>
				<h1 className="font-bold text-2xl">Reset your password</h1>
				<p className="text-[15px] mt-2">Enter your user account's email address and we will send you a password reset link.</p>
			</div>
			<form onSubmit={handleSubmit}>
				<div className={`${emailSent ? "hidden" : "mt-8"}`}>
					<p>Email*</p>
					<input type="email" placeholder="Email"  value={email} onChange={e => setEmail(e.target.value)} className={`${emailError ? "border-red-400 border-2" : "border" } w-full rounded-xl p-1 pl-3 mt-1`}></input>
					<p className={`${emailError ? "text-xs text-red-400 font-bold pt-3 pl-1" : "hidden"}`}>Email not found. Please try again.</p>
					<button className="bg-green-700 min-w-full rounded-xl px-3 py-1 font-bold hover:cursor-pointer hover:bg-green-700/80 mt-5">Send password reset email</button>
				</div>
				<div className={`${emailSent ? "text-center mt-80 min-h-screen" : "hidden"}`}>
					<div className="flex justify-center">
						<CiCreditCard2 size={70} />
					</div>
					<h1 className="font-bold text-2xl">Reset password link sent!</h1>
					<p className="text-[15px] mt-2">Please check your email: <span className="font-bold underline">{email}</span>. <br></br>Please allow 1-2 minutes for the email to arrive!</p>
				</div>
			</form>
		</div>
	)
}
