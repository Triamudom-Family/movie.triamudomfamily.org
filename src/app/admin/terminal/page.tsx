"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {
	getSupabaseClient,
	SEAT_CHANNEL,
	SEAT_EVENT,
	REGISTRATION_CHANNEL,
	REGISTRATION_EVENT,
} from "@/lib/supabase-client";
import {SEAT_LAYOUT, SEAT_TYPE_COLORS, type SeatType} from "@/lib/seat-layout";

type LineKind = "system" | "booking" | "registration";

type Line = {
	id: string;
	at: Date;
	kind: LineKind;
	text: string;
	seatType?: SeatType;
};

type SeatPayload = {
	seat: string;
	status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "BROKEN";
	student: {studentId: string; name: string; class: string; rollNumber: number} | null;
};
type RegPayload = {studentId: string; name: string; class: string; rollNumber: number};

const THAI_RE = /[฀-๿]/;

function hasThai(s: string) {
	return THAI_RE.test(s);
}

const STATUS_COLOR: Record<SeatPayload["status"], string> = {
	AVAILABLE: "text-emerald-400",
	BOOKED: "text-amber-300",
	BLOCKED: "text-zinc-400",
	BROKEN: "text-rose-400",
};

function fmtTime(d: Date) {
	return d.toLocaleTimeString("en-GB", {hour12: false});
}

let counter = 0;
function nextId() {
	counter += 1;
	return `${Date.now()}-${counter}`;
}

export default function TerminalPage() {
	const [lines, setLines] = useState<Line[]>([]);
	const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
	const [autoScroll, setAutoScroll] = useState(true);
	const scrollRef = useRef<HTMLDivElement>(null);

	const seatTypeById = useMemo(() => {
		const map = new Map<string, SeatType>();
		for (const s of SEAT_LAYOUT.seats) map.set(s.id, s.type);
		return map;
	}, []);

	const append = (line: Omit<Line, "id" | "at"> & {at?: Date}) => {
		setLines((prev) => {
			const next = [...prev, {id: nextId(), at: line.at ?? new Date(), ...line}];
			return next.length > 500 ? next.slice(-500) : next;
		});
	};

	useEffect(() => {
		const supabase = getSupabaseClient();
		if (!supabase) {
			setStatus("offline");
			append({
				kind: "system",
				text: "Supabase client unavailable — check NEXT_PUBLIC_SUPABASE_* env vars.",
			});
			return;
		}

		append({kind: "system", text: "Connecting to realtime…"});

		const seatChan = supabase.channel(SEAT_CHANNEL);
		const regChan = supabase.channel(REGISTRATION_CHANNEL);

		seatChan.on("broadcast", {event: SEAT_EVENT}, ({payload}) => {
			const p = payload as SeatPayload;
			const seatType = seatTypeById.get(p.seat);
			const who =
				p.status === "BOOKED" && p.student
					? `  ${p.student.studentId} ${p.student.name} (${p.student.class}/${p.student.rollNumber})`
					: "";
			append({
				kind: "booking",
				seatType,
				text: `seat ${p.seat.padEnd(5)} → ${p.status}${who}`,
			});
		});

		regChan.on("broadcast", {event: REGISTRATION_EVENT}, ({payload}) => {
			const p = payload as RegPayload;
			append({
				kind: "registration",
				text: `${p.studentId} ${p.name} (${p.class}/${p.rollNumber})`,
			});
		});

		let connected = 0;
		const onSub = (label: string) => (s: string) => {
			if (s === "SUBSCRIBED") {
				connected += 1;
				if (connected === 2) {
					setStatus("live");
					append({kind: "system", text: "Streaming live."});
				}
			} else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
				setStatus("offline");
				append({kind: "system", text: `${label} channel: ${s}`});
			}
		};

		seatChan.subscribe(onSub("seats"));
		regChan.subscribe(onSub("registrations"));

		return () => {
			supabase.removeChannel(seatChan);
			supabase.removeChannel(regChan);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [seatTypeById]);

	useEffect(() => {
		if (!autoScroll) return;
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [lines, autoScroll]);

	const dotColor =
		status === "live" ? "bg-emerald-500" : status === "connecting" ? "bg-amber-500" : "bg-rose-500";

	return (
		<div className="flex flex-1 flex-col p-4">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className={`h-2 w-2 rounded-full ${dotColor}`}/>
					<span className="text-sm font-medium uppercase tracking-wide">
						{status === "live" ? "Live" : status === "connecting" ? "Connecting" : "Offline"}
					</span>
					<span className="text-xs text-muted-foreground">
						{lines.length} {lines.length === 1 ? "line" : "lines"}
					</span>
				</div>
				<div className="flex items-center gap-3 text-xs">
					<label className="flex items-center gap-1.5 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={autoScroll}
							onChange={(e) => setAutoScroll(e.target.checked)}
							className="h-3.5 w-3.5"
						/>
						auto-scroll
					</label>
					<button
						onClick={() => setLines([])}
						className="rounded border px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
					>
						clear
					</button>
				</div>
			</div>

			<div
				ref={scrollRef}
				className="flex-1 min-h-[60vh] overflow-y-auto rounded-md border bg-zinc-950 p-3 text-[12px] leading-relaxed text-zinc-200"
				style={{fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace"}}
			>
				{lines.length === 0 ? (
					<div className="text-zinc-600">waiting for events…</div>
				) : (
					lines.map((l) => {
						const thai = hasThai(l.text);
						const lineStyle = thai
							? {fontFamily: "var(--font-ibm-plex-sans-thai), sans-serif"}
							: undefined;
						let tagEl: React.ReactNode;
						if (l.kind === "booking") {
							const color = l.seatType ? SEAT_TYPE_COLORS[l.seatType] : "#a1a1aa";
							tagEl = <span style={{color}}>SEAT </span>;
						} else if (l.kind === "registration") {
							tagEl = <span className="text-cyan-400">REG  </span>;
						} else {
							tagEl = <span className="text-zinc-500">SYS  </span>;
						}
						// Status word coloring inside booking text
						let body: React.ReactNode = l.text;
						if (l.kind === "booking") {
							const m = l.text.match(/^(seat \S+\s*→ )(AVAILABLE|BOOKED|BLOCKED|BROKEN)(.*)$/);
							if (m) {
								const status = m[2] as SeatPayload["status"];
								body = (
									<>
										{m[1]}
										<span className={STATUS_COLOR[status]}>{status}</span>
										{m[3]}
									</>
								);
							}
						}
						return (
							<div key={l.id} className="whitespace-pre-wrap" style={lineStyle}>
								<span className="text-zinc-600">{fmtTime(l.at)}</span>{" "}
								{tagEl}{" "}
								<span>{body}</span>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
