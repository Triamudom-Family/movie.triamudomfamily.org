import Link from "next/link";
import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {LoginForm} from "./login-form";

function LockIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
			<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
		</svg>
	);
}

export default async function LoginPage() {
	const session = await getSession();
	if (session) {
		const user = await prisma.user.findUnique({
			where: {id: session.user.id},
			select: {role: true},
		});
		if (user?.role === "ADMIN") redirect("/admin");
		if (user?.role === "STAFF") redirect("/staff");
	}
	return (
		<div className="flex flex-1 flex-col">
			<nav className="flex items-center justify-between px-6 py-4">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
					กลับหน้าหลัก
				</Link>
				<Link
					href="/register"
					className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
				>
					Student register →
				</Link>
			</nav>

			<div className="flex flex-1 items-center justify-center px-4 py-8">
				<div className="w-[380px] max-w-[calc(100vw-32px)] rounded-[14px] border-[0.5px] border-white/[0.08] bg-[#14141c] p-7">
					<div className="mb-5">
						<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[11px] bg-[#f0357f] text-white">
							<LockIcon/>
						</div>
						<h1 className="text-[1.4rem] font-semibold tracking-tight text-white">Staff &amp; Admin Login</h1>
						<p className="mt-1.5 text-sm text-zinc-400">
							Students should use{" "}
							<Link href="/register" className="text-zinc-200 underline underline-offset-4 hover:text-white transition-colors">
								/register
							</Link>{" "}
							with their school Google account.
						</p>
					</div>
					<LoginForm/>
				</div>
			</div>
		</div>
	);
}
