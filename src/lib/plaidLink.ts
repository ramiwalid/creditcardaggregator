/** Minimal Plaid Link loader (avoids a React wrapper dependency).
 * Docs: https://plaid.com/docs/link/web/ */

const SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

interface PlaidHandler {
	open: () => void;
	destroy: () => void;
}

interface PlaidExitError {
	error_code: string;
	error_message: string;
	display_message: string | null;
}

declare global {
	interface Window {
		Plaid?: {
			create: (config: {
				token: string;
				onSuccess: (publicToken: string, metadata: unknown) => void;
				onExit: (error: PlaidExitError | null, metadata: unknown) => void;
			}) => PlaidHandler;
		};
	}
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
	if (window.Plaid) return Promise.resolve();
	scriptPromise ??= new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = SCRIPT_SRC;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => {
			scriptPromise = null;
			reject(new Error("Couldn't load Plaid. Check your connection or ad blocker and try again."));
		};
		document.head.appendChild(script);
	});
	return scriptPromise;
}

export type LinkResult =
	| { status: "success"; publicToken: string }
	| { status: "exit"; error: string | null };

/** Opens Plaid Link and resolves when the user finishes or closes it. */
export async function openPlaidLink(linkToken: string): Promise<LinkResult> {
	await loadScript();
	return new Promise<LinkResult>((resolve) => {
		const handler = window.Plaid!.create({
			token: linkToken,
			onSuccess: (publicToken) => {
				handler.destroy();
				resolve({ status: "success", publicToken });
			},
			onExit: (error) => {
				handler.destroy();
				resolve({ status: "exit", error: error ? error.display_message || error.error_message : null });
			},
		});
		handler.open();
	});
}
