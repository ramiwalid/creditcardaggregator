"use client";
import React, { useState } from 'react'; 

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	return (
		<div className="bg-white-300">
			<div>
				<label htmlFor='email'>Email:</label> <input id='email' type='email'></input>
			</div>
			<div>
				<label htmlFor='password'>Password:</label>
				<input id='password' type='password'></input>
			</div>
		</div>
	);
}
