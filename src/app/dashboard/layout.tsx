import type { Metadata } from "next";
import RequireAuth from "@/components/auth/RequireAuth";
import { CardsProvider } from "@/components/dashboard/CardsProvider";
import AppShell from "@/components/dashboard/AppShell";
import { BanksProvider } from "@/components/dashboard/BanksProvider";

export const metadata: Metadata = {
	title: "Dashboard · Quanta",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<RequireAuth>
			<CardsProvider>
				<BanksProvider>
					<AppShell>{children}</AppShell>
				</BanksProvider>
			</CardsProvider>
		</RequireAuth>
	);
}
