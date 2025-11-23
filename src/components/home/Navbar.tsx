import { CiCreditCard2 } from "react-icons/ci";

export default function Navbar() {
	return (
		<div className="flex justify-between items-center max-h-fit p-5">
			<div className="flex gap-5 font-bold">
				<div className="content-center">
					<CiCreditCard2 size={36} />	
				</div>
				<div className="flex items-center gap-5">
					<p>Supported Institutions</p>
					<p>How It Works</p>
					<p>Connect a Bank</p>
					<p>About Us</p>
					<p>Contact Us</p>
				</div>
			</div>
			<div className="flex gap-5 font-bold">
				<button className="">
					Log In	
				</button>
				<button className="border px-3 py-1 rounded-xl">
					Sign Up	
				</button>
			</div>
		</div>
	)
}
