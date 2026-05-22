import Link from "next/link";
import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {getCurrentEventId} from "@/server/event";
import {GoogleSignInButton} from "./google-sign-in-button";
import {RegisterForm} from "./register-form";
import {SignOutButton} from "./sign-out-button";

const STUDENT_DOMAIN =
	process.env.STUDENT_EMAIL_DOMAIN ?? "@student.triamudom.ac.th";

function Topbar({showStaffLogin = false}: {showStaffLogin?: boolean}) {
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
			{showStaffLogin && (
				<Link
					href="/login"
					className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
				>
					Staff login →
				</Link>
			)}
		</header>
	);
}

function AccountChip({email, showSignOut = false}: {email: string; showSignOut?: boolean}) {
	return (
		<div className="mb-[22px]">
			<div className="mb-1.5 text-[12px] font-medium text-white/75">บัญชี</div>
			<div className="flex flex-col gap-3 rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 sm:flex-row sm:items-center sm:gap-2 sm:py-2.5">
				<div className="min-w-0 flex-1 break-all font-mono text-[15px] text-white/90 sm:truncate sm:break-normal">
					{email}
				</div>
				{showSignOut && (
					<div className="self-center sm:self-auto">
						<SignOutButton/>
					</div>
				)}
			</div>
		</div>
	);
}

function Card({
	eyebrow,
	title,
	subtitle,
	children,
}: {
	eyebrow?: string;
	title: string;
	subtitle: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div
			className="w-[500px] max-w-[calc(100vw-32px)] rounded-[14px] border-[0.5px] border-white/10 bg-[rgba(20,20,28,0.55)] p-[30px] backdrop-blur-[20px] sm:p-[30px]"
			style={{
				boxShadow:
					"0 0 50px rgba(236,72,153,0.10), 0 20px 40px -10px rgba(0,0,0,0.5)",
				WebkitBackdropFilter: "blur(20px)",
			}}
		>
			{eyebrow && (
				<div className="mb-3 text-[12px] font-medium text-pink-400/85">
					{eyebrow}
				</div>
			)}
			<h1 className="mb-4 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-white">
				{title}
			</h1>
			<p className="mb-3 text-[13px] leading-[1.5] text-white/60">{subtitle}</p>
			{children}
		</div>
	);
}

export default async function RegisterPage() {
	const session = await getSession();

	const layout = (cardContents: React.ReactNode, {showStaffLogin = false}: {showStaffLogin?: boolean} = {}) => (
		<div className="flex flex-1 flex-col">
			<Topbar showStaffLogin={showStaffLogin}/>
			<main className="flex flex-1 items-center justify-center px-4 py-8">
				{cardContents}
			</main>
		</div>
	);

	if (!session) {
		return layout(
			<Card
				title="ลงทะเบียนนักเรียน"
				subtitle={
					<>
						<span className="whitespace-nowrap">ลงทะเบียนด้วยบัญชี Google</span>{" "}
						<span className="whitespace-nowrap">ของโรงเรียน ({STUDENT_DOMAIN})</span>{" "}
						<span className="whitespace-nowrap">เพื่อลงทะเบียน</span>
					</>
				}
			>
				<GoogleSignInButton/>
			</Card>,
			{showStaffLogin: true},
		);
	}

	const email = session.user.email;
	if (!email || !email.endsWith(STUDENT_DOMAIN)) {
		return layout(
			<Card
				title="บัญชีไม่ถูกต้อง"
				subtitle={`การลงทะเบียนจำกัดเฉพาะบัญชี ${STUDENT_DOMAIN} เท่านั้น`}
			>
				{email && <AccountChip email={email}/>}
				<GoogleSignInButton signOutFirst label="เข้าสู่ระบบด้วยบัญชีที่ถูกต้อง"/>
			</Card>,
			{showStaffLogin: true},
		);
	}

	const eventId = await getCurrentEventId();
	const student = await prisma.student.findUnique({
		where: {eventId_userId: {eventId, userId: session.user.id}},
	});
	if (student) redirect("/register/ticket");

	// Block users who registered in a prior event from re-registering.
	const pastRegistration = await prisma.student.findFirst({
		where: {userId: session.user.id},
		select: {event: {select: {year: true}}},
	});
	if (pastRegistration) {
		return layout(
			<Card
				title="ลงทะเบียนไปแล้วในปีก่อนหน้า"
				subtitle={`บัญชีนี้เคยลงทะเบียนในรุ่น ${pastRegistration.event.year} แล้ว ไม่สามารถลงทะเบียนซ้ำในปีนี้ได้`}
			>
				<AccountChip email={email} showSignOut/>
			</Card>,
		);
	}

	return layout(
		<Card
			eyebrow="ลงทะเบียน · STEP 2 / 2"
			title="ลงทะเบียน"
			subtitle="กรอกข้อมูลด้านล่างเพื่อลงทะเบียนและรับ E-ticket"
		>
			<AccountChip email={email} showSignOut/>
			<RegisterForm email={email}/>
		</Card>,
	);
}
