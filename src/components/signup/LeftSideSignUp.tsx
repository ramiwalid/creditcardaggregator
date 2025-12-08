import { FaAngleDown, FaWeight } from "react-icons/fa"
import { FaA } from "react-icons/fa6"
import { Inter } from "next/font/google"

const inter = Inter({
	weight: '300',
});

export default function LeftSideSignUp() {
	return (
		<div className={`${inter.className} flex justify-center min-h-screen`}>
			<div className="block mx-auto col-span-1">
				<h1 className="mt-20 text-4xl font-bold pb-3">Create your free account</h1>	
				<p className="">Get started with Quanta today and simplify your finances</p>
				<div className="flex justify-between max-w-fit items-center pt-10 gap-2 hover:cursor-pointer">
					<p className="">Why Quanta?</p>
					<FaAngleDown size={20} />
				</div>
			</div>
			<div className="col-span-1 bg-white min-h-screen">
				<p>Hello</p>
			</div>
		</div>
	)
}


