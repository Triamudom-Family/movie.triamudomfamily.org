"use client";

import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {signOut} from "@/lib/auth-client";

export function SignOutButton() {
	const router = useRouter();
	const [pending, start] = useTransition();

	function handleClick() {
		start(async () => {
			try {
				await signOut();
				router.refresh();
			} catch {
				toast.error("ออกจากระบบไม่สำเร็จ");
			}
		});
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={pending}
			className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70 transition-colors hover:border-pink-400/40 hover:bg-pink-500/10 hover:text-white disabled:opacity-60"
		>
			{pending ? (
				<svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
					<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
				</svg>
			) : (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
					<polyline points="16 17 21 12 16 7"/>
					<line x1="21" y1="12" x2="9" y2="12"/>
				</svg>
			)}
			<span>ออกจากระบบ</span>
		</button>
	);
}
