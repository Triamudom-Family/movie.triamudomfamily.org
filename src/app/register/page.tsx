import Link from "next/link";
import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {GoogleSignInButton} from "./google-sign-in-button";
import {RegisterForm} from "./register-form";

const STUDENT_DOMAIN =
	process.env.STUDENT_EMAIL_DOMAIN ?? "@student.triamudom.ac.th";

function FilmIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
			<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
			<line x1="7" y1="2" x2="7" y2="22"/>
			<line x1="17" y1="2" x2="17" y2="22"/>
			<line x1="2" y1="12" x2="22" y2="12"/>
			<line x1="2" y1="7" x2="7" y2="7"/>
			<line x1="2" y1="17" x2="7" y2="17"/>
			<line x1="17" y1="17" x2="22" y2="17"/>
			<line x1="17" y1="7" x2="22" y2="7"/>
		</svg>
	);
}

function Shell({title, description, email, children, wide}: {
	title: string;
	description: string;
	email?: string;
	children: React.ReactNode;
	wide?: boolean;
}) {
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
					href="/login"
					className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
				>
					Staff login →
				</Link>
			</nav>

			<div className="flex flex-1 items-center justify-center px-4 py-8">
				<div
					className={`${wide ? "w-[460px]" : "w-[380px]"} max-w-[calc(100vw-32px)] rounded-[14px] border-[0.5px] border-white/[0.08] bg-[#14141c] p-7`}
				>
					<div className="mb-5">
						{/*<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[11px] bg-[#f0357f] text-white">*/}
						{/*	<FilmIcon/>*/}
						{/*</div>*/}
						<h1 className="text-[1.4rem] font-semibold tracking-tight text-white">{title}</h1>
						<p className="mt-1.5 text-sm text-zinc-400">{description}</p>
						{email && (
							<div className="mt-3 flex items-center gap-2 rounded-lg border-[0.5px] border-white/[0.08] bg-[#0a0a12] px-3 py-2">
								<span className="shrink-0 text-xs text-zinc-500">บัญชี</span>
								<span className="break-all font-mono text-xs text-zinc-200">{email}</span>
							</div>
						)}
					</div>
					{children}
				</div>
			</div>
		</div>
	);
}

export default async function RegisterPage() {
	const session = await getSession();

	if (!session) {
		return (
			<Shell
				title="ลงทะเบียนนักเรียน"
				description={`เข้าสู่ระบบด้วยบัญชี Google ของโรงเรียน (${STUDENT_DOMAIN}) เพื่อลงทะเบียนชมภาพยนตร์`}
			>
				<GoogleSignInButton/>
			</Shell>
		);
	}

	const email = session.user.email;
	if (!email || !email.endsWith(STUDENT_DOMAIN)) {
		return (
			<Shell
				title="บัญชีไม่ถูกต้อง"
				description={`การลงทะเบียนจำกัดเฉพาะบัญชี ${STUDENT_DOMAIN} เท่านั้น`}
				email={email ?? undefined}
			>
				<GoogleSignInButton signOutFirst label="เข้าสู่ระบบด้วยบัญชีที่ถูกต้อง"/>
			</Shell>
		);
	}

	const student = await prisma.student.findUnique({
		where: {userId: session.user.id},
	});
	if (student) redirect("/register/ticket");

	return (
		<Shell
			title="ลงทะเบียนไปดูหนัง"
			description="กรอกข้อมูลด้านล่างเพื่อรับ E-ticket ของคุณ"
			email={email}
			wide
		>
			<RegisterForm email={email}/>
		</Shell>
	);
}
