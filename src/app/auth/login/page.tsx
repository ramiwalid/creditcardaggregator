import { Suspense } from "react";
import LoginPage from "@/components/login/LoginPage";

export default function Login() {
	return (
		// LoginPage reads ?next=, and useSearchParams needs a Suspense boundary.
		<Suspense>
			<LoginPage />
		</Suspense>
	)
}
