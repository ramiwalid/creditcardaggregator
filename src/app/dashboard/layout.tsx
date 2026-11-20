import type { Metadata } from "next";
import RequireAuth from "@/components/auth/RequireAuth";
import { CardsProvider } from "@/components/dashboard/CardsProvider";
import AppShell from "@/components/dashboard/AppShell";

export const metadata: Metadata = {
	title: "Dashboard · Quanta",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<RequireAuth>
			<CardsProvider>
				<AppShell>{children}</AppShell>
			</CardsProvider>
		</RequireAuth>
	);
}
