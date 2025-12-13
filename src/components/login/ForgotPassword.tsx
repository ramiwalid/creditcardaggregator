import { CiCreditCard2 } from "react-icons/ci"
import { Inter } from "next/font/google"

const inter = Inter({
	weight: '300'
});

export default function ForgotPassword() {
	return (
		<div className={`${inter.className} mx-auto mt-45 min-h-screen w-1/5`}>
			<div className="flex justify-center">
				<CiCreditCard2 size={70} />
			</div>
			<div className="text-center">
				<h1 className="font-bold text-2xl">Reset your password</h1>
				<p className="text-[15px] mt-2">Enter your user account's email address and we will send you a password reset link.</p>
			</div>
			<form>
				<div className="mt-8">
					<p>Email*</p>
					<input type="email" placeholder="Email" className={`w-full border rounded-xl p-1 pl-3 mt-1`}></input>
					<button className="bg-green-700 min-w-full rounded-xl px-3 py-1 font-bold hover:cursor-pointer hover:bg-green-700/80 mt-5">Send password reset email</button>
				</div>
			</form>
		</div>
	)
}
