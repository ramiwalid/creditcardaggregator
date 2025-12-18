"use client";
import React, { useState } from "react";
import { Inter } from "next/font/google";
import { CiCreditCard2 } from "react-icons/ci";

interface ResetPasswordPageProps {
	params: Promise<{
		token: string;
	}>;
}

const inter = Inter({
	weight: '300'
})

export default function ResetPassword( {params}: ResetPasswordPageProps) {
	const resolvedParams = React.use(params);
	const token = resolvedParams.token;
	const [password, setPassword] = useState('');
	const [confirmedPassword, setConfirmedPassword] = useState('');
	const [passwordsMatch, setPasswordsMatch] = useState(false);
	const [passwordError, setPasswordError] = useState('');

	const checkPasswords = () => {
		setPasswordsMatch(password == confirmedPassword);
	}

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		checkPasswords();
		if (!passwordsMatch) {
			setPasswordError("Passwords don't match");
			throw new Error(passwordError);
		}

		const payload = {
			password: password,
			password_token: token 
}

		try {
			const response = await fetch('http://localhost:8000/auth/resetpassword', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(payload),
			});

			const responseData = await response.json();

			if (!response.ok) {
				setPasswordError(responseData.detail);
				throw new Error(response.statusText);
			}

		} catch(error) {
			console.log("Couldn't update password");
		}
	};

	return (
		<div className={`${inter.className} mx-auto mt-55 w-1/5 min-h-screen`}>
			<div className="flex justify-center">
				<CiCreditCard2 size={70} />
			</div>
			<form>
				<div className={`block`}>
					<h1 className="text-center font-bold text-2xl">Create new password</h1>
					<p className={`mt-5`}>New Password*</p>
<input id="password1" type="password" className={`w-full border rounded-xl p-1 pl-3 mt-1`} value={password} onChange={e => setPassword(e.target.value)}>
					</input>
					<p className={`mt-5`}>Confirm Password*</p>
					<input id="password2" type="password" className={`w-full border rounded-xl p-1 pl-3 mt-1`} value={confirmedPassword} onChange={e => setConfirmedPassword(e.target.value)}>
					</input>
					<p className="text-xs text-white/90 pt-3 pl-1 mt-1">Password should be at least 15 characters OR 8 characters including a number and an uppercase letter
					</p>
					<div>
						<button className='bg-green-700 min-w-full rounded-xl px-3 py-2 font-bold hover:cursor-pointer hover:bg-green-700/80 mt-5'>
						Change Password
						</button>
					</div>
				</div>
			</form>
		</div>
	)
}
