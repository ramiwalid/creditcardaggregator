"use client";
import { Inter } from "next/font/google"
import Link from "next/link";
import { FaAngleRight } from "react-icons/fa"; 
import React, { use, useState } from 'react';
import { useRouter } from "next/navigation";

const inter = Inter({
	weight: '300',
});

export default function RightSideSignUp() {
	const router = useRouter()
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [username, setUsername] = useState('');
	const [visible, setVisible] = useState(false);
	const [error, setError] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		console.log("Submitting: ", {email, password, username});

		const payload = {
			email: email,
			password: password,
			username: username
		}

		try {
			const response = await fetch('http://localhost:8000/auth/signup', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(payload),
			});
			const responseData = await response.json()

			if (!response.ok) {
				throw new Error(response.statusText);
			}

			const auth_token = responseData.access_token;
			localStorage.setItem('authToken', auth_token);
			router.push('/');
		} catch (error) {
			setError(true);
		}
	};

	return (
		<div>
			<Link href='/auth/login'><div className="text-black absolute top-0 right-0 p-3 max-w-full flex justify-between items-center hover:cursor-pointer hover:text-black/50">
				<p>Log In</p>
				<FaAngleRight size={25}/>
			</div></Link>
			<div className={`${inter.className} mx-auto mt-55 w-3/5 text-black`}>
				<div className="block mx-auto">
					<form onSubmit={handleSubmit}>
						<h1 className="mt-20 font-bold text-2xl">
						Sign up for Quanta
						</h1>
						<div className="block min-w-fit mt-15">
							<p>Email*</p>
							<input type="email" placeholder="Email" className="w-full border rounded-xl p-1 pl-3 mt-1" value={email} onChange={e => setEmail(e.target.value)}></input>
						</div>
						<div className="block min-w-fit mt-5">
							<p>Password*</p>
							<input type="password" placeholder="Password" className="w-full border rounded-xl p-1 pl-3 mt-1" value={password} onChange={e => setPassword(e.target.value)}></input>
							<p className="text-xs text-black/70 pt-3 pl-1">Password should be at least 15 characters OR 8 characters including a number and an uppercase letter</p>
						</div>
						<div className="mt-5">
							<p>Username*</p>
							<input type="text" placeholder="Username" className="w-full border rounded-xl p-1 pl-3 mt-1" value={username} onChange={e => setUsername(e.target.value)}></input>
							<p className="text-xs text-black/70 pt-3 pl-1">Username may only alphanumeric characters or single hyphens, and cannot begin with a hyphen.</p>
						</div>
						<div className="flex text-white mt-5">
							<button className="bg-[#11152a] justify-center border rounded-xl p-3 min-w-full font-bold hover:cursor-pointer hover:bg-[#11152a]/90" type="submit">Create Account</button>
							<FaAngleRight size={20} />
						</div>
						<h1 className="text-center font-semibold mt-2">Already have an account? <Link href='/auth/login'><span className="underline font-semibold hover:cursor-pointer hover:text-black/50">Log in</span></Link></h1>
					</form>
				</div>
			</div>
		</div>
	)
}
