import Link from "next/link";
import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {SiteFooter} from "@/components/site-footer";
import {LoginForm} from "./login-form";

function Topbar() {
	return (
		<header className="flex items-center justify-between px-7 py-4">
			<Link
				href="/"
				className="inline-flex items-center gap-1.5 text-[13px] text-white/60 transition-colors hover:text-white/90"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M15 18l-6-6 6-6"/>
				</svg>
				<span>กลับหน้าหลัก</span>
			</Link>
			<Link
				href="/register"
				className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
			>
				Student Registration →
			</Link>
		</header>
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
			<Topbar/>
			<main className="flex flex-1 items-center justify-center px-4 py-8">
				<div
					className="w-[500px] max-w-[calc(100vw-32px)] rounded-[14px] border-[0.5px] border-white/10 bg-[rgba(20,20,28,0.55)] p-[30px] backdrop-blur-[20px] sm:p-[30px]"
					style={{
						boxShadow:
							"0 0 50px rgba(236,72,153,0.10), 0 20px 40px -10px rgba(0,0,0,0.5)",
						WebkitBackdropFilter: "blur(20px)",
					}}
				>
					{/*<div className="mb-3 text-[12px] font-medium text-pink-400/85">*/}
					{/*	STAFF · เข้าสู่ระบบ*/}
					{/*</div>*/}
					<h1 className="mb-4 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-white">
						Staff Login
					</h1>
					{/*<p className="mb-3 text-[13px] leading-[1.5] text-white/60">*/}
					{/*	สำหรับเจ้าหน้าที่เท่านั้น นักเรียนใช้{" "}*/}
					{/*	<Link href="/register" className="text-white/80 underline underline-offset-4 hover:text-white transition-colors">*/}
					{/*		/register*/}
					{/*	</Link>{" "}*/}
					{/*	ด้วยบัญชี Google ของโรงเรียน*/}
					{/*</p>*/}
					<LoginForm/>
				</div>
			</main>
			<SiteFooter/>
		</div>
	);
}
