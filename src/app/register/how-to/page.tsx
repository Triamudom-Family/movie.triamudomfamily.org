import Link from "next/link";
import {
	Armchair,
	Check,
	ChevronLeft,
	QrCode,
	ScanLine,
	Smartphone,
	Ticket,
} from "lucide-react";

const STEPS = [
	{
		icon: Smartphone,
		eyebrow: "ก่อนถึงวันฉาย",
		title: "เตรียม E-ticket ในโทรศัพท์",
		desc: "เปิดเว็บไซต์ก่อนถึงโรงหนัง เลือกเข้าตามแถวเดี่ยวหรือกลุ่ม (หากมาหลายคน)",
	},
	{
		icon: QrCode,
		eyebrow: "หน้าจุดลงทะเบียน",
		title: "แสดง QR Code ใน E-ticket",
		desc: "เปิด E-ticket ให้ Staff สแกน QR (หากมาหลายคนให้ Staff สแกนพร้อมกัน)",
	},
	{
		icon: ScanLine,
		eyebrow: "เลือกที่นั่ง",
		title: "Staff สแกนและให้ท่านเลือกที่นั่ง",
		desc: "หากมาเป็นกลุ่ม Staff สามารถเลือกที่นั่งติดกันให้ได้ (หากเข้าแถวเป็นกลุ่ม)",
	},
	{
		icon: Armchair,
		eyebrow: "ในโรงหนัง",
		title: "หาที่นั่งของคุณ",
		desc: "เข้าไปในโรงหนังและหาที่นั่งตามหมายเลขที่ได้รับ",
	},
];

export default function HowToPage() {
	return (
		<div className="flex flex-1 flex-col">
			{/* Page-specific atmosphere: top-center pink glow behind the success check */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-0"
				style={{
					background:
						"radial-gradient(ellipse 900px 700px at 50% 0%, rgba(236,72,153,0.16), transparent 60%)",
				}}
			/>

			<header className="relative z-10 flex items-center justify-between px-7 py-4">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 text-[13px] text-white/60 transition-colors hover:text-white/90"
				>
					<ChevronLeft className="h-4 w-4"/>
					<span>กลับหน้าหลัก</span>
				</Link>
			</header>

			<main className="relative z-10 flex flex-1 items-start justify-center px-4 pb-10 pt-9">
				<div
					className="w-[480px] max-w-[calc(100vw-32px)] rounded-[14px] border-[0.5px] border-white/10 bg-[rgba(20,20,28,0.55)] px-[22px] pb-[22px] pt-7 backdrop-blur-[20px] sm:px-[30px] sm:pb-[30px] sm:pt-8"
					style={{
						boxShadow:
							"0 0 50px rgba(236,72,153,0.10), 0 20px 40px -10px rgba(0,0,0,0.5)",
						WebkitBackdropFilter: "blur(20px)",
					}}
				>
					{/* Hero: check + eyebrow */}
					<div className="mb-[30px] text-center">
						<div
							className="mb-4 inline-flex h-[60px] w-[60px] items-center justify-center rounded-full text-white"
							style={{
								background: "linear-gradient(135deg, #ec4899, #db2777)",
								boxShadow:
									"0 0 50px rgba(236,72,153,0.5), 0 0 0 6px rgba(236,72,153,0.10), 0 0 0 12px rgba(236,72,153,0.05)",
							}}
						>
							<Check className="h-7 w-7" strokeWidth={2.5}/>
							<span className="sr-only">ลงทะเบียนสำเร็จ</span>
						</div>
						<div className="text-[20px] font-semibold text-white">
							ลงทะเบียนสำเร็จ
						</div>
					</div>

					{/* Timeline */}
					<ol className="relative mb-7 list-none">
						{STEPS.map((step, i) => {
							const Icon = step.icon;
							const isLast = i === STEPS.length - 1;
							return (
								<li
									key={step.title}
									className="relative pl-[50px] pb-[22px] last:pb-0 sm:pl-[56px]"
								>
									{!isLast && (
										<span
											aria-hidden="true"
											className="absolute left-[19px] top-[38px] w-px"
											style={{
												bottom: "-5px",
												background:
													"linear-gradient(180deg, rgba(236,72,153,0.4), rgba(255,255,255,0.04))",
											}}
										/>
									)}
									<span
										className="absolute left-0 top-0 inline-flex h-[38px] w-[38px] items-center justify-center rounded-full text-pink-500"
										style={{
											background: "rgba(236,72,153,0.12)",
											border: "0.5px solid rgba(236,72,153,0.35)",
										}}
									>
										<Icon className="h-[18px] w-[18px]"/>
									</span>
									<div className="pt-1">
										<div className="mb-[3px] text-[11px] text-pink-400/85">
											{step.eyebrow}
										</div>
										<h3 className="mb-[5px] text-[15px] font-medium leading-[1.35] text-white">
											{step.title}
										</h3>
										<p className="text-[12.5px] leading-[1.6] text-white/55">
											{step.desc}
										</p>
									</div>
								</li>
							);
						})}
					</ol>

					{/* Primary CTA */}
					<Link
						href="/register/ticket"
						className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-6 py-3.5 text-[14px] font-medium text-white transition-all hover:bg-pink-600 active:scale-[0.98]"
						style={{
							boxShadow:
								"0 0 16px rgba(236,72,153,0.18), 0 6px 16px -8px rgba(236,72,153,0.35)",
						}}
					>
						ดูตั๋ว
						<Ticket className="h-[15px] w-[15px]"/>
					</Link>
				</div>
			</main>
		</div>
	);
}
