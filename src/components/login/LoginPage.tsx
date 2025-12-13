"use client";
import React, { useState } from 'react'; 
import { CiCreditCard2 } from "react-icons/ci";
import { Inter } from 'next/font/google';
import Link from "next/link";
import { useRouter } from 'next/navigation';

const inter = Inter({
	weight: '300'
});

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState(false);
	const [emailError, setEmailError] = useState(false);
	const [passwordError, setPasswordError] = useState(false);
	const [authentication, setAuthentication] = useState(false);

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

			setEmailError(false);
			setPasswordError(false);

			if (!response.ok) {
				if (responseData.detail == "User not found") {
					setEmailError(true);
				}
				else if (responseData.detail == "Password is incorrect") {
					setPasswordError(true);
				}
				throw new Error(response.statusText);
			}

			setAuthentication(responseData.access_token === localStorage.auth_token);
			router.push('/');	
		} catch (error) {
			console.log("Account log in failed.");
		}
	}

	return (
		<div className={`${inter.className} block mx-auto w-1/5 mt-45`}>
			<form onSubmit={handleSubmit}>
				<div className='flex justify-center'>
					<CiCreditCard2 size={70} />
</div>
				<h1 className='text-center font-bold text-3xl'>Sign in to Quanta</h1>
<div className='block min-w-fit mt-10'>
					<p>Username or email address*</p>
					<input type='text' placeholder='Email' className={`w-full border rounded-xl p-1 pl-3 mt-1 ${emailError ? "border-red-400 border-2" : "border" }`} value={email} onChange={e => setEmail(e.target.value)}></input>
					<p className={`${emailError ? "text-xs text-red-400 font-bold pt-3 pl-1" : "hidden"}`}>Username or email is invalid. Please try again.</p>
				</div>
				<div className='block min-w-fit mt-5'>
					<div className='flex justify-between'>
						<p>Password*</p>
						<Link href={'/auth/forgotpassword'} target='_blank'><p className='underline text-blue'>Forgot Password?</p></Link>
					</div>
					<input type='password' placeholder='Password' className={`w-full border rounded-xl p-1 pl-3 mt-1 ${passwordError ? "border-red-400 border-2" : "border"}`} value={password} onChange={e => setPassword(e.target.value)}></input>
					<p className={`${passwordError ? "text-xs text-red-400 font-bold pt-3 pl-1" : "hidden"}`}>Invalid password. Please try again.</p>
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
