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
	const [passwordError, setPasswordError] = useState(false);
	const [emailError, setEmailError] = useState(false);
	const [usernameError, setUsernameError] = useState(false);

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

			setEmailError(false);
			setPasswordError(false);
			setUsernameError(false);

			if (!response.ok) {
				if (responseData.detail == "Email taken") {
					setEmailError(true);
				}
				else if (responseData.detail == "Invalid password") {
					setPasswordError(true);
				}
				else if (responseData.detail == "Invalid username") {
					setUsernameError(true);
				}
				throw new Error(response.statusText);
			}

			const auth_token = responseData.access_token;
			localStorage.setItem('authToken', auth_token);
			router.push('/');
		} catch (error) {
			console.log("Account creation failed");
		}
	};

	return (
		<div>
			<Link href='/auth/login'><div className="text-black absolute top-0 right-0 p-3 max-w-full flex justify-between items-center hover:cursor-pointer hover:text-black/50">
				<p>Log In</p>
				<FaAngleRight size={25}/>
			</div></Link>
			<div className={`${inter.className} mx-auto content-center min-h-screen w-3/5 text-black`}>
				<div className="block mx-auto">
					<form onSubmit={handleSubmit}>
						<h1 className="mt-20 font-bold text-2xl">
						Sign up for Quanta
						</h1>
						<div className="block min-w-fit mt-15">
							<p>Email*</p>
							<input type="email" placeholder="Email" className={`w-full border rounded-xl p-1 pl-3 mt-1 ${emailError ? "border-red-400 border-2" : "border-black"}`} value={email} onChange={e => setEmail(e.target.value)}></input>
							<p className={`${emailError ? "text-xs text-red-400 font-bold pt-3 pl-1" : "hidden"}`}>Email taken. Try a different one.</p>
						</div>
						<div className="block min-w-fit mt-5">
							<p>Password*</p>
							<input type="password" placeholder="Password" className={`w-full border rounded-xl p-1 pl-3 mt-1 ${passwordError ? "border-red-400 border-2" : "border-black"}`} value={password} onChange={e => setPassword(e.target.value)}></input>
							<p className="text-xs text-black/70 pt-3 pl-1">Password should be at least 15 characters OR 8 characters including a number and an uppercase letter</p>
							<p className={`${passwordError ? "text-xs text-red-400 font-bold pt-3 pl-1" : "hidden"}`}>Invalid password. Follow rules above</p>
						</div>
						<div className="mt-5">
							<p>Username*</p>
							<input type="text" placeholder="Username" className={`w-full border rounded-xl p-1 pl-3 mt-1 ${usernameError ? "border-red-400 border-2" : "border-black"}`} value={username} onChange={e => setUsername(e.target.value)}></input>
							<p className="text-xs text-black/70 pt-3 pl-1">Username may only alphanumeric characters or single hyphens, must be at least 3 characters long, and cannot begin with a hyphen.</p>
							<p className={`${usernameError ? "text-xs text-red-400 font-bold pt-3 pl-1" : "hidden"}`}>Invalid username. Follow rules above</p>
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
