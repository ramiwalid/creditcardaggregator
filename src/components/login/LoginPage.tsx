"use client";
import React, { useState } from 'react'; 
import { CiCreditCard2 } from "react-icons/ci";
import { Inter } from 'next/font/google';
import Link from "next/link";

const inter = Inter({
	weight: '300'
});

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState(false);
	const [authenticated, setAuthentication] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		console.log("Must verify: ", {email, password});

		const payload = {
			email: email,
			password: password
		}

		try {
			const response = await fetch('http://localhost:8000/auth/login', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(payload),
			});
			const responseData = await response.json()

			if (!response.ok) {
				throw new Error(response.statusText);
			}

			setAuthentication(responseData.access_token === localStorage.auth_token);

		} catch (error) {
			setError(true);	
		}
	}

	return (
		<div className={`${inter.className} block mx-auto w-1/4 mt-45`}>
			<form onSubmit={handleSubmit}>
				<div className='flex justify-center'>
					<CiCreditCard2 size={70} />
</div>
				<h1 className='text-center font-bold text-3xl'>Sign in to Quanta</h1>
				<div className='block min-w-fit mt-10'>
					<p>Username or email address*</p>
					<input type='email' placeholder='Email' className='w-full border rounded-xl p-1 pl-3 mt-1' value={email} onChange={e => setEmail(e.target.value)}></input>
				</div>
				<div className='block min-w-fit mt-5'>
					<p>Password*</p>
					<input type='password' placeholder='Password' className='w-full border rounded-xl p-1 pl-3 mt-1' value={password} onChange={e => setPassword(e.target.value)}></input>
				</div>
				<div>
					<button className='bg-green-700 min-w-full rounded-xl px-3 py-2 font-bold hover:cursor-pointer hover:bg-green-700/80 mt-5'>Log In</button>
					<h1 className='text-center font-semibold mt-3'>Don't have an account? <Link href='/auth/signup'><span className='underline hover-cursor-pointer hover:text-white/80'>Sign up</span></Link></h1>
				</div>
				<div>
				</div>
			</form>
		</div>
	);
}
