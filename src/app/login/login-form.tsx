"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {signIn} from "@/lib/auth-client";

export function LoginForm() {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		start(async () => {
			const res = await signIn.username({username, password});
			if (res.error) {
				toast.error(res.error.message ?? "Invalid username or password");
				return;
			}
			toast.success("Signed in");
			router.replace("/");
			router.refresh();
		});
	}

	const inputClass =
		"w-full rounded-[9px] border-[0.5px] border-white/[0.10] bg-[#0a0a12] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-[rgba(240,53,127,0.7)]";
	const labelClass = "block text-xs font-medium text-zinc-400 mb-1.5";

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label htmlFor="username" className={labelClass}>Username</label>
				<input
					id="username"
					className={inputClass}
					autoComplete="username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					required
				/>
			</div>
			<div>
				<label htmlFor="password" className={labelClass}>Password</label>
				<input
					id="password"
					type="password"
					className={inputClass}
					autoComplete="current-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>
			<button
				type="submit"
				disabled={pending}
				className="w-full rounded-[9px] bg-[#f0357f] px-4 py-2.5 text-sm font-medium text-white transition-colors transition-transform hover:bg-[#d92970] active:scale-[0.985] disabled:opacity-60"
			>
				{pending ? "Signing in…" : "Sign in"}
			</button>
		</form>
	);
}
