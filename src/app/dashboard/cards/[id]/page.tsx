"use client";

import { use } from "react";
import CardDetail from "@/components/dashboard/CardDetail";

export default function CardPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	return <CardDetail key={id} cardId={Number(id)} />;
}
