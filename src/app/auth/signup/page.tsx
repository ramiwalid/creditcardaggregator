import LoginPage from "@/components/login/LoginPage"
import LeftSideSignUp from "@/components/signup/LeftSideSignUp"
import RightSideSignUp from "@/components/signup/RightSideSignUp"

export default function CreateAccount() {
	return (
		<div className="grid grid-cols-2">
			<div className="col-span-1 min-h-screen">
				<LeftSideSignUp />
			</div>
			<div className="col-span-1 min-h-screen bg-white">
				<RightSideSignUp />
			</div>
		</div>
	)
}
