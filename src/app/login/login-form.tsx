"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {cn} from "@/lib/utils";
import {signIn} from "@/lib/auth-client";

type FieldProps = {
	id: string;
	label: string;
	mono?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

function Field({id, label, mono, className, ...rest}: FieldProps) {
	return (
		<div>
			<div className="mb-1.5 flex items-baseline justify-between gap-2">
				<label htmlFor={id} className="text-[12px] font-medium text-white/75">
					{label}
				</label>
			</div>
			<input
				id={id}
				className={cn(
					"w-full rounded-[9px] border border-white/10 bg-[#0a0a12] px-3.5 py-2.5 text-[14px] text-white outline-none transition-colors",
					"placeholder:text-white/[0.22]",
					"focus:border-pink-500/70 focus:bg-[#0d0d16]",
					"focus-visible:ring-2 focus-visible:ring-pink-500/30",
					"disabled:cursor-not-allowed disabled:text-white/50",
					mono && "font-mono tracking-[0.05em]",
					className,
				)}
				{...rest}
			/>
		</div>
	);
}

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

	return (
		<form onSubmit={handleSubmit} className="flex flex-col">
			<fieldset disabled={pending} className="contents">
				<div className="mb-3.5">
					<Field
						id="username"
						label="Username"
						mono
						autoComplete="username"
						required
						value={username}
						onChange={(e) => setUsername(e.target.value)}
					/>
				</div>

				<div className="mb-2">
					<Field
						id="password"
						label="Password"
						type="password"
						autoComplete="current-password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>

				<button
					type="submit"
					className="mt-2 inline-flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-pink-500 px-6 py-3.5 text-[14px] font-medium text-white transition-all hover:bg-pink-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
					style={{
						boxShadow:
							"0 0 18px rgba(236,72,153,0.18), 0 4px 14px -6px rgba(236,72,153,0.28)",
					}}
				>
					{pending ? (
						<>
							<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
							</svg>
							<span>กำลังเข้าสู่ระบบ...</span>
						</>
					) : (
						<>
							<span>เข้าสู่ระบบ</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<line x1="5" y1="12" x2="19" y2="12"/>
								<polyline points="12 5 19 12 12 19"/>
							</svg>
						</>
					)}
				</button>
			</fieldset>
		</form>
	);
}
