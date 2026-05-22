"use client";

import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {ChevronLeft, Download, LogOut, Armchair} from "lucide-react";
import Link from "next/link";
import {signOut} from "@/lib/auth-client";
import {AdPopup} from "./ad-popup";

type SeatInfo =
	| {assigned: false}
	| {assigned: true; row: string; number: number};

export type TicketViewProps = {
	student: {
		name: string;
		surname: string;
		studentId: string;
		class: string;
		rollNumber: number;
		qrToken: string;
	};
	seat: SeatInfo;
	movieTitle: string;
	movieTagline: string;
	movieSubTagline: string;
	dateDisplay: string;
	timeDisplay: string;
	venuePrimary: string;
	venueSecondary: string;
	issuedAtFormatted: string;
	qr: {size: number; data: number[]};
};

export function TicketView(props: TicketViewProps) {
	const {
		student,
		seat,
		movieTitle,
		movieTagline,
		movieSubTagline,
		dateDisplay,
		timeDisplay,
		venuePrimary,
		venueSecondary,
		issuedAtFormatted,
		qr,
	} = props;

	return (
		<div className="relative mx-auto w-full max-w-[420px] px-6 pt-4 pb-8">
			<AdPopup />
			<header className="flex items-center justify-between px-1 py-3.5 text-[12px] text-white/60 print:hidden">
				<Link href="/" className="inline-flex items-center gap-1 hover:text-white/90">
					<ChevronLeft className="h-4 w-4" aria-hidden />
					<span>กลับหน้าหลัก</span>
				</Link>
				<span className="text-[9px] uppercase tracking-[0.4em] text-white/45">
					<b className="font-medium text-white">TU</b>
					{/*<span className="mx-0.5">·</span>*/}
					<b className="font-medium text-white">89</b>
				</span>
			</header>

			<article
				className="ticket relative mt-4 overflow-hidden rounded-[22px] bg-white"
				style={{
					boxShadow:
						"0 0 60px rgba(236, 72, 153, 0.25), 0 30px 60px -20px rgba(0, 0, 0, 0.6)",
				}}
			>
				<TicketHero
				title={movieTitle}
				tagline={movieTagline}
				subTagline={movieSubTagline}
			/>

				<div className="px-[22px] pt-[16px] pb-[12px]">
					<div className="grid grid-cols-2 gap-x-3 gap-y-3">
						<MetaCell
							label="วันที่ฉาย"
							primary={timeDisplay ? `${dateDisplay} · ${timeDisplay}` : dateDisplay}
						/>
						<MetaCell
							label="สถานที่"
							primary={venuePrimary}
							secondary={venueSecondary}
							align="right"
						/>
						<MetaCell
							label="ชื่อ-นามสกุล"
							primary={`${student.name} ${student.surname}`}
						/>
						<MetaCell
							label="ห้องเรียน"
							primary={`${student.class} · #${student.rollNumber}`}
							primaryMono
							align="right"
						/>
					</div>

				</div>

				<Perforation />

				<div className="px-[22px] pt-[16px] pb-3 text-center">
					<div className="mb-2.5 text-[13px] font-semibold tracking-[0.02em] text-[#ec4899]">
						-- สแกนที่จุดลงทะเบียน --
					</div>

					<div className="mb-2.5 flex justify-center">
						<div
							className="rounded-full border border-[#f9a8d4] px-5 py-2 font-mono text-[18px] font-semibold tracking-[0.08em] text-[#831843]"
							style={{
								background:
									"linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f5d0fe 100%)",
								boxShadow:
									"0 4px 14px -4px rgba(236, 72, 153, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
							}}
						>
							{student.studentId}
						</div>
					</div>

					<div className="mx-auto mb-2.5 flex h-[236px] w-[236px] items-center justify-center bg-white p-3.5">
						<StyledQR data={qr.data} size={qr.size} pixels={200} />
					</div>

					<SeatStatusPill seat={seat} />

					<hr className="mt-3 border-0 border-t border-[#e5e5e5]" />
				</div>

				<div className="border-t border-[#f0f0f0] px-[22px] py-[12px]">
					<div className="flex items-baseline justify-between text-[10px] text-[#999]">
						<div>
							<div className="mb-0.5 font-semibold uppercase tracking-[0.18em] text-[#4a4a4a]">
								รหัสตั๋ว
							</div>
							<div className="font-mono text-[11px] text-[#555]">{student.qrToken}</div>
						</div>
						<div className="text-right">
							<div className="mb-0.5 font-semibold uppercase tracking-[0.18em] text-[#4a4a4a]">
								ออกเมื่อ
							</div>
							<div className="whitespace-nowrap text-[11px] text-[#555]">
								{issuedAtFormatted}
							</div>
						</div>
					</div>
				</div>
			</article>

			<ActionRow />
		</div>
	);
}

function TicketHero({
	title,
	tagline,
	subTagline,
}: {
	title: string;
	tagline: string;
	subTagline: string;
}) {
	return (
		<div
			className="relative flex aspect-[16/9] flex-col items-center overflow-hidden px-[22px] pt-[24px] pb-[18px] text-center backdrop-blur-md"
			style={{
				background:
					"linear-gradient(135deg, rgba(20, 14, 26, 0.92) 0%, rgba(10, 6, 18, 0.88) 50%, rgba(26, 15, 29, 0.92) 100%)",
				borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
				boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
			}}
		>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 300px 200px at 30% 40%, rgba(236, 72, 153, 0.22), transparent 65%), radial-gradient(ellipse 250px 180px at 75% 30%, rgba(168, 85, 247, 0.16), transparent 60%)",
				}}
			/>
			<div className="relative z-10 flex flex-col items-center">
				<div className="mb-4 text-[11px] font-medium tracking-[0.08em] text-white/70">
					Triamudom Family
				</div>
				<h1 className="text-[42px] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
					{title}
				</h1>
				<div className="mt-2 text-[18px] font-medium text-white/85">{tagline}</div>
				<div className="mt-3 text-[13px] font-medium tracking-[0.04em] text-white/75">
					{subTagline}
				</div>
			</div>
		</div>
	);
}

function MetaCell({
	label,
	primary,
	secondary,
	primaryMono,
	secondaryMono,
	align = "left",
}: {
	label: string;
	primary: string;
	secondary?: string;
	primaryMono?: boolean;
	secondaryMono?: boolean;
	align?: "left" | "right";
}) {
	return (
		<div className={align === "right" ? "text-right" : ""}>
			<div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4a4a4a]">
				{label}
			</div>
			<div
				className={`text-[14px] font-medium text-[#0a0a0a] ${
					primaryMono ? "font-mono" : ""
				}`}
			>
				{primary}
			</div>
			{secondary ? (
				<div
					className={`mt-0.5 text-[11px] text-[#888] ${
						secondaryMono ? "font-mono" : ""
					}`}
				>
					{secondary}
				</div>
			) : null}
		</div>
	);
}

function StyledQR({
	data,
	size,
	pixels,
}: {
	data: number[];
	size: number;
	pixels: number;
}) {
	const isOn = (r: number, c: number) => data[r * size + c] === 1;

	// 8x8 finder zones (7 finder + 1 separator) at top-left, top-right, bottom-left.
	const inFinderZone = (r: number, c: number) =>
		(r < 8 && c < 8) ||
		(r < 8 && c >= size - 8) ||
		(r >= size - 8 && c < 8);

	const dots: React.ReactNode[] = [];
	for (let r = 0; r < size; r++) {
		for (let c = 0; c < size; c++) {
			if (!isOn(r, c) || inFinderZone(r, c)) continue;
			dots.push(
				<circle
					key={`${r}-${c}`}
					cx={c + 0.5}
					cy={r + 0.5}
					r={0.44}
				/>,
			);
		}
	}

	const eyes: Array<[number, number]> = [
		[0, 0],
		[0, size - 7],
		[size - 7, 0],
	];

	return (
		<svg
			width={pixels}
			height={pixels}
			viewBox={`0 0 ${size} ${size}`}
			shapeRendering="geometricPrecision"
			aria-label="QR Code สำหรับเข้าโรงภาพยนตร์"
			role="img"
		>
			<g fill="#0a0a0a">
				{dots}
				{eyes.map(([r, c]) => (
					<g key={`eye-${r}-${c}`}>
						<rect x={c} y={r} width={7} height={7} rx={1.8} ry={1.8} />
						<rect
							x={c + 1}
							y={r + 1}
							width={5}
							height={5}
							rx={1.3}
							ry={1.3}
							fill="#ffffff"
						/>
						<rect
							x={c + 2}
							y={r + 2}
							width={3}
							height={3}
							rx={0.85}
							ry={0.85}
						/>
					</g>
				))}
			</g>
		</svg>
	);
}

function Perforation() {
	return (
		<div className="relative px-[22px]">
			<div
				aria-hidden
				className="perforation-notch absolute left-[-10px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#07060a]"
			/>
			<div
				aria-hidden
				className="perforation-notch absolute right-[-10px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#07060a]"
			/>
			<div className="border-t-2 border-dashed border-[#d4d4d4]" />
		</div>
	);
}

function SeatStatusPill({seat}: {seat: SeatInfo}) {
	if (seat.assigned) {
		return (
			<div
				className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px]"
				style={{
					background: "rgba(34, 197, 94, 0.08)",
					border: "0.5px solid rgba(34, 197, 94, 0.35)",
					color: "#15803d",
				}}
				role="status"
				aria-live="polite"
			>
				<Armchair className="h-3.5 w-3.5" aria-hidden />
				ที่นั่งของคุณ · {seat.row} · {seat.number}
			</div>
		);
	}
	return (
		<div
			className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px]"
			style={{
				background: "rgba(236, 72, 153, 0.08)",
				border: "0.5px solid rgba(236, 72, 153, 0.3)",
				color: "#be185d",
			}}
			role="status"
			aria-live="polite"
		>
			<span
				aria-hidden
				className="h-1.5 w-1.5 rounded-full bg-pink-500"
				style={{boxShadow: "0 0 8px #ec4899"}}
			/>
			ยังไม่ได้กำหนดที่นั่ง — Staff จะกำหนดให้ในวันฉาย
		</div>
	);
}

function ActionRow() {
	const router = useRouter();
	const [pending, start] = useTransition();

	function handleSave() {
		if (typeof window !== "undefined") window.print();
	}

	function handleLogout() {
		start(async () => {
			await signOut();
			router.replace("/register");
		});
	}

	return (
		<div className="action-row flex gap-2.5 px-1 pt-[18px] print:hidden">
			<button
				type="button"
				onClick={handleSave}
				className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/[0.14] bg-transparent py-3 text-[13px] text-white/85 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
			>
				<Download className="h-4 w-4" aria-hidden />
				บันทึก
			</button>
			<button
				type="button"
				onClick={handleLogout}
				disabled={pending}
				className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/[0.14] bg-transparent py-3 text-[13px] text-white/85 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-60"
			>
				<LogOut className="h-4 w-4" aria-hidden />
				{pending ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
			</button>
		</div>
	);
}
