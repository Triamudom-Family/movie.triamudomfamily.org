"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {Armchair, Maximize2, Minimize2} from "lucide-react";
import {ROW_LABELS, SEAT_LAYOUT, type SeatStatusValue, type SeatType} from "@/lib/seat-layout";
import {getSupabaseClient, SEAT_CHANNEL, SEAT_EVENT} from "@/lib/supabase-client";
import {cn} from "@/lib/utils";

export type {SeatStatusValue};
export type SeatStatusMap = Record<string, SeatStatusValue>;

export type SeatMapProps = {
	initialStatus: SeatStatusMap;
	selectedSeats?: string[];
	ownedByCurrentScan?: string[];
	onSeatClick?: (seatId: string, status: SeatStatusValue, type: SeatType) => void;
	isAdmin?: boolean;
	legend?: boolean;
	className?: string;
};

const TYPE_COLOR: Record<SeatType, string> = {
	normal: "var(--seat-normal)",
	honeymoon: "var(--seat-honeymoon)",
	privilege_plus: "var(--seat-privilege-plus)",
	privilege_normal: "var(--seat-privilege-normal)",
	vip: "var(--seat-vip)",
	premium: "var(--seat-premium)",
	balcony: "var(--seat-balcony)",
};

const NEUTRAL_STROKE = "rgba(255,255,255,0.22)";

export function SeatMap({
	initialStatus,
	selectedSeats = [],
	ownedByCurrentScan = [],
	onSeatClick,
	isAdmin,
	legend = true,
	className,
}: SeatMapProps) {
	const [status, setStatus] = useState<SeatStatusMap>(initialStatus);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);

	// Merge in fresh server data when the parent passes a new initialStatus,
	// without dropping seat updates that arrived via realtime/polling. Adjust
	// during render (React 19 pattern) instead of in an effect.
	const [lastInitialStatus, setLastInitialStatus] = useState(initialStatus);
	if (initialStatus !== lastInitialStatus) {
		setLastInitialStatus(initialStatus);
		setStatus((prev) => ({...prev, ...initialStatus}));
	}

	useEffect(() => {
		const handler = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", handler);
		return () => document.removeEventListener("fullscreenchange", handler);
	}, []);

	const toggleFullscreen = () => {
		if (!containerRef.current) return;
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			containerRef.current.requestFullscreen();
		}
	};

	// Supabase Realtime — instant updates when the broadcast reaches the client
	useEffect(() => {
		const client = getSupabaseClient();
		if (!client) return;
		const channel = client.channel(SEAT_CHANNEL);
		channel.on(
			"broadcast",
			{event: SEAT_EVENT},
			(payload: {payload: {seat?: string; status?: SeatStatusValue}}) => {
				const seat = payload.payload?.seat;
				const next = payload.payload?.status;
				if (!seat || !next) return;
				setStatus((prev) => ({...prev, [seat]: next}));
			},
		);
		channel.subscribe();
		return () => {
			client.removeChannel(channel);
		};
	}, []);

	// Polling fallback — catches anything realtime misses
	useEffect(() => {
		const tick = async () => {
			try {
				const res = await fetch("/api/seats");
				if (!res.ok) return;
				const {seats} = await res.json() as {seats: {id: string; status: SeatStatusValue}[]};
				setStatus((prev) => {
					const changed = seats.some((s) => prev[s.id] !== s.status);
					if (!changed) return prev;
					const map: SeatStatusMap = {};
					for (const s of seats) map[s.id] = s.status;
					return map;
				});
			} catch { /* ignore */ }
		};
		const id = setInterval(tick, 1_000);
		return () => clearInterval(id);
	}, []);

	const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);
	const ownedSet = useMemo(() => new Set(ownedByCurrentScan), [ownedByCurrentScan]);

	return (
		<div className={cn("flex flex-col items-stretch gap-3", className)}>
			<div
				ref={containerRef}
				className={cn(
					"seat-map-scroll relative w-full overflow-auto rounded-lg border bg-black/60 p-4",
					isFullscreen && "flex flex-col items-center justify-center h-full rounded-none border-0",
				)}
			>
				<button
					type="button"
					onClick={toggleFullscreen}
					title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
					className="absolute top-2 right-2 z-10 rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
				>
					{isFullscreen ? <Minimize2 className="h-4 w-4"/> : <Maximize2 className="h-4 w-4"/>}
				</button>
				<div aria-hidden className="mb-3 mx-auto min-[1400px]:hidden" style={{width: "min(100%, 320px)"}}>
					<div className="h-1.5 rounded-t-[50%] bg-gradient-to-b from-white/30 via-white/10 to-transparent border-t border-x border-white/40 shadow-[0_6px_18px_-6px_rgba(255,255,255,0.25)]"/>
					<div className="mt-1 text-[9px] uppercase tracking-[0.5em] text-zinc-400 text-center">Screen</div>
				</div>
				<div
					aria-hidden
					className="hidden min-[1400px]:block mx-auto mb-4"
					style={{width: `${SEAT_LAYOUT.cols * 16 + (SEAT_LAYOUT.cols - 1) * 3}px`}}
				>
					<div className="mx-16 h-2.5 rounded-t-[50%] bg-gradient-to-b from-white/35 via-white/15 to-transparent border-t border-x border-white/50 shadow-[0_8px_24px_-6px_rgba(255,255,255,0.25)]"/>
					<div className="mt-1 text-[11px] uppercase tracking-[0.6em] text-zinc-400 text-center">Screen</div>
					<div
						className="mt-3 grid"
						style={{
							gridTemplateColumns: `repeat(${SEAT_LAYOUT.cols}, 16px)`,
							gridAutoRows: "16px",
							gap: "3px",
						}}
					>
						<div
							style={{gridColumn: "19 / 31", gridRow: "span 2"}}
							className="flex items-center justify-center rounded border border-zinc-700/70 bg-zinc-800/40 text-[10px] uppercase tracking-[0.3em] text-zinc-400 select-none"
						>
							Stage
						</div>
					</div>
				</div>
				<div
					className="relative mx-auto"
					style={{
						display: "grid",
						width: "max-content",
						gridTemplateColumns: `repeat(${SEAT_LAYOUT.cols}, 16px)`,
						gridAutoRows: "16px",
						gap: "3px",
					}}
				>
					{SEAT_LAYOUT.separators.map((sep) => (
						<div key={`sep-${sep.gridRow}`} aria-hidden style={{gridRow: sep.gridRow}}/>
					))}
					{(() => {
						const cRow = ROW_LABELS.find((r) => r.row === "C")?.gridRow;
						const aRow = ROW_LABELS.find((r) => r.row === "A")?.gridRow;
						if (!cRow || !aRow) return null;
						return (
							<div
								aria-hidden
								style={{gridRow: `${cRow} / ${aRow + 1}`, gridColumn: "19 / 30"}}
								className="flex items-center justify-center rounded border border-zinc-700/70 bg-zinc-800/40 text-[10px] uppercase tracking-[0.3em] text-zinc-400 select-none"
							>
								Projection Room
							</div>
						);
					})()}
					{ROW_LABELS.map((r) => (
						<div
							key={`lbl-l-${r.row}`}
							aria-hidden
							style={{gridRow: r.gridRow, gridColumn: 1}}
							className="flex items-center justify-center text-[9px] font-bold text-zinc-400 select-none"
						>
							{r.row}
						</div>
					))}
					{ROW_LABELS.map((r) => (
						<div
							key={`lbl-r-${r.row}`}
							aria-hidden
							style={{gridRow: r.gridRow, gridColumn: SEAT_LAYOUT.cols}}
							className="flex items-center justify-center text-[9px] font-bold text-zinc-400 select-none"
						>
							{r.row}
						</div>
					))}
					{SEAT_LAYOUT.seats.map((s) => {
						const seatStatus = status[s.id] ?? "AVAILABLE";
						const isSelected = selectedSet.has(s.id);
						const isOwned = ownedSet.has(s.id);
						const clickable =
							!!onSeatClick &&
							(isAdmin || ((seatStatus === "AVAILABLE" || isOwned) && seatStatus !== "BROKEN"));
						const fillColor =
							seatStatus === "AVAILABLE"
								? TYPE_COLOR[s.type]
								: seatStatus === "BOOKED"
									? isOwned
										? "var(--seat-scanned)"
										: "var(--seat-booked)"
									: seatStatus === "BROKEN"
										? "var(--seat-broken)"
										: "var(--seat-blocked)";
						const strokeColor = isSelected ? "#ffffff" : NEUTRAL_STROKE;
						return (
							<button
								key={s.id}
								type="button"
								disabled={!clickable}
								title={`${s.id} · ${s.type} · ${seatStatus}${isOwned ? " · scanned student" : ""}`}
								onClick={() => onSeatClick?.(s.id, seatStatus, s.type)}
								style={{
									gridRow: s.gridRow,
									gridColumn: s.col,
									opacity: clickable ? 1 : 0.65,
								}}
								className={cn(
									"relative w-full aspect-square transition-transform",
									clickable
										? "cursor-pointer hover:scale-[1.3]"
										: "cursor-not-allowed",
								)}
							>
								<Armchair
									className="w-full h-full"
									style={{
										stroke: strokeColor,
										fill: fillColor,
										strokeWidth: isSelected ? 1.5 : 1,
									}}
								/>
								<span
									className="absolute inset-x-0 bottom-[2px] text-center text-[7px] leading-none font-bold select-none pointer-events-none"
									style={{color: seatStatus === "BLOCKED" ? TYPE_COLOR[s.type] : "rgba(255,255,255,0.9)"}}
								>
									{s.number}
								</span>
							</button>
						);
					})}
				</div>
			</div>
			{legend && <SeatLegend/>}
		</div>
	);
}

export function SeatLegend() {
	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
			<LegendSeat fill="var(--seat-normal)" stroke={NEUTRAL_STROKE} label="Normal"/>
			<LegendSeat fill="var(--seat-honeymoon)" stroke={NEUTRAL_STROKE} label="Honeymoon"/>
			<LegendSeat fill="var(--seat-privilege-plus)" stroke={NEUTRAL_STROKE} label="Privilege+"/>
			<LegendSeat fill="var(--seat-privilege-normal)" stroke={NEUTRAL_STROKE} label="Privilege"/>
			<LegendSeat fill="var(--seat-vip)" stroke={NEUTRAL_STROKE} label="VIP"/>
			<LegendSeat fill="var(--seat-premium)" stroke={NEUTRAL_STROKE} label="Premium"/>
			<LegendSeat fill="var(--seat-balcony)" stroke={NEUTRAL_STROKE} label="Balcony"/>
			<span className="mx-1 h-3 w-px bg-border"/>
			<LegendSeat fill="var(--seat-booked)" stroke={NEUTRAL_STROKE} label="Booked"/>
			<LegendSeat fill="var(--seat-scanned)" stroke={NEUTRAL_STROKE} label="Scanned"/>
			<LegendSeat fill="var(--seat-blocked)" stroke={NEUTRAL_STROKE} label="Blocked"/>
			<LegendSeat fill="var(--seat-broken)" stroke={NEUTRAL_STROKE} label="Broken"/>
		</div>
	);
}

function LegendSeat({fill, stroke, label}: {fill: string; stroke: string; label: string}) {
	return (
		<span className="inline-flex items-center gap-1.5">
			<Armchair
				aria-hidden
				className="h-4 w-4 shrink-0"
				style={{fill, stroke, strokeWidth: 1.5}}
			/>
			{label}
		</span>
	);
}
