"use client";

import Link from "next/link";
import Image from "next/image";
import {useEffect, useState, useSyncExternalStore} from "react";
import type {EventSettings} from "@/server/settings";

/* ─────────────────────────────────────────────────────────────────────────────
   Fixed event copy — admin override comes later (separate ticket).
───────────────────────────────────────────────────────────────────────────── */
const EVENT_DATE_THAI    = "25 พฤษภาคม 2569";
const EVENT_DATE_EN      = "Monday, 25 May 2026";
const EVENT_TIME         = "15:30 น.";
const EVENT_DOORS        = "Doors open 15:00";
const EVENT_DATETIME_ISO = "2026-05-25T15:30:00+07:00";
const VENUE_NAME         = "Siam Pavalai · ชั้น 5 Paragon Cineplex";
const VENUE_SUB          = "Paragon Cineplex · ชั้น 5 สยามพารากอน";

/* Film-grain texture (SVG fractal-noise as a data-URI) */
const GRAIN =
	"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* ─────────────────────────────────────────────────────────────────────────────
   ImageSlot — shows a styled placeholder until the given src loads.
   ─ Hero:    drop /public/hero.jpg
   ─ Gallery: drop /public/gallery/1.jpg … 9.jpg
───────────────────────────────────────────────────────────────────────────── */
function ImageSlot({src, alt, hint}: {src: string; alt: string; hint: string}) {
	const [failed, setFailed] = useState(false);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0c0c14]">
				<div
					className="absolute inset-0 opacity-[0.025]"
					style={{
						backgroundImage:
							"repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
						backgroundSize: "8px 8px",
					}}
				/>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="relative text-zinc-700"
				>
					<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
					<circle cx="12" cy="13" r="3"/>
				</svg>
				<span className="relative text-[8px] text-zinc-800">{hint}</span>
			</div>

			{!failed && (
				<Image
					src={src}
					alt={alt}
					fill
					sizes="(max-width: 768px) 100vw, 50vw"
					className="object-cover"
					onError={() => setFailed(true)}
				/>
			)}
		</div>
	);
}

const GALLERY = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18, 19].map(
	(n) => ({src: `/${n}.webp`, alt: `Photo ${n}`}),
);

/* ─────────────────────────────────────────────────────────────────────────────
   LandingPage
───────────────────────────────────────────────────────────────────────────── */
export function LandingPage({eventSettings}: {eventSettings: EventSettings}) {
	const {eventAt, eventEndTime, venue} = eventSettings;
	const countdownIso = eventAt ?? EVENT_DATETIME_ISO;

	let dateDisplay = EVENT_DATE_THAI;
	let timeDisplay = EVENT_TIME;
	if (eventAt) {
		const d = new Date(eventAt);
		dateDisplay = d.toLocaleDateString("th-TH", {
			timeZone: "Asia/Bangkok",
			day: "numeric",
			month: "long",
			year: "numeric",
		});
		const start = d.toLocaleTimeString("th-TH", {
			timeZone: "Asia/Bangkok",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		timeDisplay = eventEndTime ? `${start} – ${eventEndTime} น.` : `${start} น.`;
	}
	const venueDisplay = venue ?? VENUE_NAME;

	// Defer the countdown until after hydration so server and client first paint match.
	const showCountdown = useSyncExternalStore(
		() => () => {},
		() => new Date(countdownIso).getTime() > Date.now(),
		() => false,
	);

	return (
		<div className="bg-[#07060a] text-white">

			{/* ── Fixed atmospheric overlays ──────────────────────────────── */}
			<div
				className="pointer-events-none fixed inset-0 z-10"
				style={{
					background: [
						"radial-gradient(ellipse 80% 50% at 20% 0%, rgba(236,72,153,0.18) 0%, transparent 60%)",
						"radial-gradient(ellipse 60% 40% at 80% 0%, rgba(168,85,247,0.10) 0%, transparent 60%)",
					].join(", "),
				}}
				aria-hidden
			/>
			<div
				className="pointer-events-none fixed inset-0 z-10 opacity-[0.032] mix-blend-overlay"
				style={{backgroundImage: GRAIN, backgroundRepeat: "repeat"}}
				aria-hidden
			/>
			<div
				className="pointer-events-none fixed inset-0 z-10"
				style={{
					background:
						"radial-gradient(ellipse 110% 110% at 50% 50%, transparent 45%, rgba(7,6,10,0.7) 100%)",
				}}
				aria-hidden
			/>

			{/* ════════════════════════════════════════════════════════════════
			    HERO SECTION
			════════════════════════════════════════════════════════════════ */}
			<section className="relative z-20 flex min-h-svh flex-col">

				{/* Header */}
				<header className="flex items-center justify-between px-8 py-6">
					<Image
						src="/logo.webp"
						alt="TU89 Movie"
						width={412}
						height={191}
						priority
						className="h-7 w-auto select-none"
					/>
					<Link
						href="/register"
						className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-zinc-300 backdrop-blur-sm transition-all hover:border-pink-400/30 hover:bg-pink-500/10 hover:text-white"
					>
						ลงทะเบียน →
					</Link>
				</header>

				{/* Hero content */}
				<main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-10 px-6 py-14 md:grid-cols-2 md:gap-[50px] md:py-20">

					{/* Group photo */}
					<div
						className="relative w-full overflow-hidden rounded-[2px]"
						style={{
							aspectRatio: "3 / 2",
							boxShadow: [
								"0 0 70px rgba(236,72,153,0.28)",
								"0 30px 60px -20px rgba(0,0,0,0.8)",
								"0 0 0 0.5px rgba(255,255,255,0.08)",
							].join(", "),
						}}
					>
						<ImageSlot src="/1.webp" alt="TU89 group photo" hint="Add /public/1.webp"/>
						<span
							className="pointer-events-none absolute bottom-3 left-3 font-mono text-[9px] tracking-[0.3em] uppercase"
							style={{color: "rgba(255,255,255,0.55)"}}
						>
							TU·88
						</span>
						<span
							className="pointer-events-none absolute right-3 bottom-3 font-mono text-[9px] tracking-[0.3em] uppercase"
							style={{color: "rgba(255,255,255,0.55)"}}
						>
							2025
						</span>
					</div>

					{/* Info */}
					<div className="flex w-full max-w-[500px] flex-col gap-5">

						{/*/!* Now booking pill *!/*/}
						{/*<div className="flex items-center gap-2">*/}
						{/*	<span*/}
						{/*		className="h-1.5 w-1.5 rounded-full bg-pink-500"*/}
						{/*		style={{boxShadow: "0 0 6px 2px rgba(236,72,153,0.7)"}}*/}
						{/*	/>*/}
						{/*	<span className="font-mono text-[10px] tracking-[0.45em] text-zinc-400 uppercase">*/}
						{/*		Now booking*/}
						{/*	</span>*/}
						{/*</div>*/}

						{/*/!* Credit *!/*/}
						{/*<span className="-mt-2 font-mono text-[10px] tracking-[0.4em] text-zinc-500 uppercase">*/}
						{/*	Triam Udom Suksa · Class of 89*/}
						{/*</span>*/}

						{/* Title */}
						<h1
							className="-mt-1 text-[72px] font-medium leading-[0.88] tracking-[-0.05em] text-white"
							style={{textShadow: "0 0 60px rgba(236,72,153,0.45)"}}
						>
							The First Movie<br/>
							<em className="not-italic text-pink-500">Where it all begins.</em>
						</h1>

						{/* Subtitle */}
						<p className="font-mono text-[11px] font-bold tracking-[0.35em] text-white/70 uppercase">
							First meet · First memory · #TU89
						</p>

						{/* Description */}
						{/*<p className="text-[14px] leading-[1.75] text-white/70">*/}
						{/*	เริ่มต้นชีวิตในเตรียมอุดมในโรงหนังที่ใหญ่ที่สุดในประเทศ{" "}*/}
						{/*	<strong className="font-medium text-white">*/}
						{/*		@ Siam Pavalai — Paragon Cineplex*/}
						{/*	</strong>{" "}*/}
						{/*	แล้วมาดูหนัง <span className="text-pink-400">&ldquo;....&rdquo;</span>{" "}*/}
						{/*	ทำความรู้จักเพื่อนใหม่กัน !*/}
						{/*</p>*/}

						{/* Spec sheet */}
						<dl className="mt-1 flex flex-col">
							<SpecRow label="Date">
								<>
									{dateDisplay}
									<SpecDot/>
									{timeDisplay}
								</>
								{/*<>*/}
								{/*	{EVENT_DATE_EN}*/}
								{/*	<SpecDot/>*/}
								{/*	{EVENT_DOORS}*/}
								{/*</>*/}
							</SpecRow>
							<SpecRow label="Venue">
								{venueDisplay}
								{/*{VENUE_SUB}*/}
							</SpecRow>
						</dl>

						{/* Countdown */}
						{showCountdown && <HeroCountdown targetIso={countdownIso}/>}

						{/* CTA row */}
						<div className="mt-[10px] flex items-center gap-[14px]">
							<Link
								href="/register"
								className="rounded-full bg-pink-500 px-[30px] py-[15px] text-sm font-semibold tracking-wide text-white transition-all hover:bg-pink-600 active:scale-[0.97]"
								style={{
									boxShadow:
										"0 0 40px rgba(236,72,153,0.5), 0 8px 24px -6px rgba(236,72,153,0.55)",
								}}
							>
								ลงทะเบียน →
							</Link>
							<span
								className="font-mono text-[10px] tracking-[0.4em] uppercase"
								style={{color: "rgba(236,72,153,0.85)"}}
							>
								{/*#TU89*/}
							</span>
						</div>
					</div>
				</main>

				{/* Scroll indicator */}
				<div className="absolute bottom-6 left-1/2 -translate-x-1/2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="animate-bounce text-white/30"
					>
						<polyline points="6 9 12 15 18 9"/>
					</svg>
				</div>
			</section>

			{/* ════════════════════════════════════════════════════════════════
			    GALLERY SECTION
			════════════════════════════════════════════════════════════════ */}
			<section className="relative z-20 mx-auto max-w-5xl px-6 pt-16 pb-24">

				<div className="mb-10 flex flex-col items-center gap-3 text-center">
					<div className="flex w-full items-center gap-4">
						<div className="h-px flex-1 bg-zinc-800"/>
						<div className="flex flex-col items-center gap-1">
							<span className="font-mono text-[9px] tracking-[0.5em] text-pink-400 uppercase">
								From last year
							</span>
							<h2 className="text-lg font-bold tracking-wide text-zinc-300">
								ความทรงจำ · TU88
							</h2>
						</div>
						<div className="h-px flex-1 bg-zinc-800"/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
					{GALLERY.map(({src, alt}) => (
						<div
							key={src}
							className="overflow-hidden rounded-[2px]"
							style={{
								aspectRatio: "3 / 2",
								boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
							}}
						>
							<ImageSlot src={src} alt={alt} hint={src}/>
						</div>
					))}
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-20 border-t border-white/5 px-8 py-4 text-center text-xs">
				<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
					<a
						href="https://github.com/Triamudom-Family/movie.triamudomfamily.org"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 font-medium text-zinc-500 transition-colors hover:text-zinc-200"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src="https://cdn.simpleicons.org/github/71717a" alt="GitHub" className="h-3.5 w-3.5"/>
						Arckanop
					</a>
					<span className="text-zinc-700">·</span>
					<a
						href="https://github.com/Triamudom-Family/movie.triamudomfamily.org?tab=AGPL-3.0-1-ov-file"
						target="_blank"
						rel="noopener noreferrer"
						className="text-zinc-500 transition-colors hover:text-pink-400"
					>
						AGPL-3.0
					</a>
					<span className="text-zinc-700">·</span>
					<span className="text-zinc-500">Movie Registration v1.1.0</span>
				</div>
			</footer>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Spec sheet row — hairline borders top and bottom.
───────────────────────────────────────────────────────────────────────────── */
function SpecRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode | [React.ReactNode, React.ReactNode];
}) {
	const arr = Array.isArray(children) ? children : [children, null];
	const [primary, secondary] = arr;

	return (
		<div className="flex items-start gap-4 border-t border-b border-white/5 py-3 -mt-px">
			<dt className="w-[110px] shrink-0 pt-0.5 font-mono text-[9px] font-bold tracking-[0.4em] text-white/70 uppercase">
				{label}
			</dt>
			<dd className="flex flex-col">
				<span className="text-[14px] text-white">{primary}</span>
				{secondary && (
					<span className="mt-0.5 text-[12px] text-zinc-400">{secondary}</span>
				)}
			</dd>
		</div>
	);
}

function SpecDot() {
	return (
		<span style={{color: "rgba(255,255,255,0.25)", margin: "0 10px"}}>·</span>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hero countdown — 4-cell grid.
───────────────────────────────────────────────────────────────────────────── */
function HeroCountdown({targetIso}: {targetIso: string}) {
	const [diff, setDiff] = useState<number | null>(null);

	useEffect(() => {
		const target = new Date(targetIso).getTime();
		const tick = () => setDiff(Math.max(0, target - Date.now()));
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [targetIso]);

	if (diff === null) return null;

	const days  = Math.floor(diff / 86_400_000);
	const hours = Math.floor((diff % 86_400_000) / 3_600_000);
	const mins  = Math.floor((diff % 3_600_000)  / 60_000);
	const secs  = Math.floor((diff % 60_000)     / 1_000);

	return (
		<div className="grid grid-cols-4 gap-2">
			<CountCell value={days}  label="Days"/>
			<CountCell value={hours} label="Hours"/>
			<CountCell value={mins}  label="Min"/>
			<CountCell value={secs}  label="Sec"/>
		</div>
	);
}

function CountCell({value, label}: {value: number; label: string}) {
	return (
		<div
			className="flex flex-col items-center gap-1.5 rounded-[2px] px-2 py-3"
			style={{
				background: "rgba(255,255,255,0.02)",
				boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.06)",
			}}
		>
			<span className="text-[26px] font-medium leading-none tabular-nums text-white">
				{String(value).padStart(2, "0")}
			</span>
			<span className="font-mono text-[8px] tracking-[0.3em] text-zinc-500 uppercase">
				{label}
			</span>
		</div>
	);
}
