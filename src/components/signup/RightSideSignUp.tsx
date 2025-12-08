import { Inter } from "next/font/google"
import { FaAngleRight } from "react-icons/fa"; 

const inter = Inter({
	weight: '300',
});

export default function RightSideSignUp() {
	return (
		<div className={`${inter.className} mx-auto mt-55 w-3/5 text-black`}>
			<div className="block mx-auto">
				<h1 className="mt-20 font-bold text-2xl">
				Sign up for Quanta
				</h1>
				<div className="block min-w-fit mt-15">
					<p>Email*</p>
					<input type="email" placeholder="Email" className="w-full border rounded-xl p-1 pl-3 mt-1"></input>
				</div>
				<div className="block min-w-fit mt-5">
					<p>Password*</p>
					<input type="password" placeholder="Password" className="w-full border rounded-xl p-1 pl-3 mt-1"></input>
					<p className="text-xs text-black/70 pt-3 pl-1">Password should be at least 15 characters OR 8 characters including a number and an uppercase letter</p>
				</div>
				<div className="mt-5">
					<p>Username*</p>
					<input type="text" placeholder="Username" className="w-full border rounded-xl p-1 pl-3 mt-1"></input>
					<p className="text-xs text-black/70 pt-3 pl-1">Username may only alphanumeric characters or single hyphens, and cannot begin with a hyphen.</p>
				</div>
				<div className="flex text-white mt-5">
					<button className="bg-[#11152a] justify-center border rounded-xl p-3 min-w-full font-bold hover:cursor-pointer hover:bg-[#11152a]/90">Create Account</button>
					<FaAngleRight size={20} />
				</div>
			</div>
		</div>
	)
}
