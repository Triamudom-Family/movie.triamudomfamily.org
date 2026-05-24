"use client";

import {useState} from "react";
import {toast} from "sonner";
import {SeatMap, type SeatStatusMap, type SeatStatusValue} from "@/components/seat/seat-map";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {Badge} from "@/components/ui/badge";

type SeatInfo = {
	seat: {
		id: string;
		status: SeatStatusValue;
		note: string | null;
		bookedBy: string | null;
		bookedAt: string | null;
		student: {
			id: string;
			name: string;
			surname: string;
			class: string;
			rollNumber: number;
			studentId: string;
		} | null;
	};
	performer: { id: string; name: string; username: string | null } | null;
};

type SearchedStudent = {
	id: string;
	name: string;
	surname: string;
	class: string;
	rollNumber: number;
	studentId: string;
	seatId: string | null;
};

export function AdminSeatMap({initialStatus}: { initialStatus: SeatStatusMap }) {
	const [info, setInfo] = useState<SeatInfo | null>(null);
	const [openSeat, setOpenSeat] = useState<string | null>(null);
	const [confirmAction, setConfirmAction] = useState<
		| { kind: "cancel"; seatId: string }
		| { kind: "block"; seatId: string }
		| { kind: "unblock"; seatId: string }
		| { kind: "break"; seatId: string }
		| { kind: "unbreak"; seatId: string }
		| null
	>(null);
	const [search, setSearch] = useState("");
	const [searchResults, setSearchResults] = useState<SearchedStudent[]>([]);
	const [assignTarget, setAssignTarget] = useState<string | null>(null);
	const [blockingAssign, setBlockingAssign] = useState(false);
	const [assignBlocked, setAssignBlocked] = useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [confirmSuccess, setConfirmSuccess] = useState(false);
	const [confirmNote, setConfirmNote] = useState("");
	const [moveConfirm, setMoveConfirm] = useState<{ student: SearchedStudent; targetSeat: string } | null>(null);

	async function loadInfo(seatId: string) {
		setOpenSeat(seatId);
		setInfo(null);
		const res = await fetch(`/api/seats/${seatId}/info`);
		if (res.ok) setInfo(await res.json());
	}

	function handleSeatClick(
		seatId: string,
		status: SeatStatusValue,
	) {
		if (status === "AVAILABLE") {
			setAssignTarget(seatId);
			setSearch("");
			setSearchResults([]);
			setAssignBlocked(false);
			return;
		}
		loadInfo(seatId);
	}

	async function blockAssignTarget() {
		if (!assignTarget) return;
		setBlockingAssign(true);
		const res = await fetch(`/api/seats/${assignTarget}/block`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: "{}",
		});
		setBlockingAssign(false);
		if (res.ok) {
			toast.success(`${assignTarget} blocked`);
			setAssignTarget(null);
		} else {
			const data = await res.json();
			toast.error(data.error ?? "Failed");
		}
	}

	async function searchStudents(q: string) {
		setSearch(q);
		if (q.trim().length < 2) {
			setSearchResults([]);
			return;
		}
		const res = await fetch(`/api/students/search?q=${encodeURIComponent(q)}`);
		if (res.ok) {
			const data = await res.json();
			setSearchResults(data.students);
		}
	}

	async function assignSeat(seatId: string, studentId: string) {
		const res = await fetch("/api/bookings", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({seatId, studentId}),
		});
		if (res.ok) {
			toast.success(`${seatId} assigned`);
			setAssignTarget(null);
		} else {
			const data = await res.json();
			toast.error(data.error ?? "Booking failed");
		}
	}

	async function applyConfirm() {
		if (!confirmAction || confirmLoading) return;
		const action = confirmAction;
		setConfirmLoading(true);

		let ok = false;
		let errorMsg = "Failed";

		if (action.kind === "cancel") {
			const res = await fetch(`/api/bookings/${action.seatId}`, {method: "DELETE"});
			ok = res.ok;
		} else if (action.kind === "block") {
			const res = await fetch(`/api/seats/${action.seatId}/block`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: "{}",
			});
			ok = res.ok;
			if (!ok) errorMsg = (await res.json().catch(() => ({}))).error ?? "Failed";
		} else if (action.kind === "unblock") {
			const res = await fetch(`/api/seats/${action.seatId}/unblock`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: "{}",
			});
			ok = res.ok;
		} else if (action.kind === "break") {
			const res = await fetch(`/api/seats/${action.seatId}/break`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({note: confirmNote || undefined}),
			});
			ok = res.ok;
			if (!ok) errorMsg = (await res.json().catch(() => ({}))).error ?? "Failed";
		} else if (action.kind === "unbreak") {
			const res = await fetch(`/api/seats/${action.seatId}/unbreak`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({note: confirmNote || undefined}),
			});
			ok = res.ok;
		}

		setConfirmLoading(false);
		if (ok) {
			setConfirmSuccess(true);
			setTimeout(() => {
				setConfirmSuccess(false);
				setConfirmAction(null);
				setConfirmNote("");
				setOpenSeat(null);
			}, 1000);
		} else {
			toast.error(errorMsg);
		}
	}

	return (
		<>
			<Card>
				<CardContent className="pt-6">
					<SeatMap
						initialStatus={initialStatus}
						isAdmin
						onSeatClick={handleSeatClick}
					/>
				</CardContent>
			</Card>

			<Dialog open={!!openSeat} onOpenChange={(o) => !o && setOpenSeat(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Seat {openSeat}{" "}
							{info && (
								<Badge variant="secondary" className="ml-2">
									{info.seat.status}
								</Badge>
							)}
						</DialogTitle>
					</DialogHeader>
					{info ? (
						<div className="space-y-3 text-sm">
							{info.seat.student && (
								<div className="rounded-md border p-3">
									<div className="font-medium">
										{info.seat.student.name} {info.seat.student.surname}
									</div>
									<div className="text-xs text-muted-foreground">
										Class {info.seat.student.class} · #{info.seat.student.rollNumber} ·{" "}
										{info.seat.student.studentId}
									</div>
								</div>
							)}
							{info.seat.bookedAt && (
								<div className="text-xs text-muted-foreground">
									Booked by{" "}
									<span className="font-medium text-foreground">
										{info.performer?.username ?? info.performer?.name ?? "unknown"}
									</span>{" "}
									on {new Date(info.seat.bookedAt).toLocaleString("en-GB", {timeZone: "Asia/Bangkok"})}
								</div>
							)}
							{info.seat.status === "BROKEN" && info.seat.note && (
								<div className="rounded-md border border-orange-800/50 bg-orange-950/30 px-3 py-2 text-xs text-orange-300">
									<span className="font-semibold uppercase tracking-wider text-orange-500">Note · </span>
									{info.seat.note}
								</div>
							)}
							<div className="flex flex-wrap gap-2 w-full">
								{info.seat.status === "BOOKED" && (
									<Button
										variant="destructive"
										onClick={() => setConfirmAction({kind: "cancel", seatId: info.seat.id})}
									>
										Cancel booking
									</Button>
								)}
								{info.seat.status === "AVAILABLE" && (
									<Button
										variant="secondary"
										onClick={() => setConfirmAction({kind: "block", seatId: info.seat.id})}
									>
										Block seat
									</Button>
								)}
								{info.seat.status === "BLOCKED" && (
									<Button
										variant="secondary"
										className="w-full"
										onClick={() => setConfirmAction({kind: "unblock", seatId: info.seat.id})}
									>
										Unblock seat
									</Button>
								)}
								{info.seat.status === "BOOKED" && (
									<Button
										variant="secondary"
										onClick={() => setConfirmAction({kind: "block", seatId: info.seat.id})}
									>
										Block (after cancelling)
									</Button>
								)}
								{(info.seat.status === "AVAILABLE" || info.seat.status === "BLOCKED") && (
									<Button
										variant="outline"
										className="border-amber-700 text-amber-500 hover:bg-amber-950"
										onClick={() => setConfirmAction({kind: "break", seatId: info.seat.id})}
									>
										Mark as broken
									</Button>
								)}
								{info.seat.status === "BROKEN" && (
									<Button
										variant="secondary"
										className="w-full"
										onClick={() => setConfirmAction({kind: "unbreak", seatId: info.seat.id})}
									>
										Repair seat
									</Button>
								)}
							</div>
						</div>
					) : (
						<div className="text-sm text-muted-foreground">Loading…</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={!!assignTarget} onOpenChange={(o) => { if (!o) { setAssignTarget(null); setMoveConfirm(null); } }}>
				<DialogContent>
					{moveConfirm ? (
						<>
							<DialogHeader>
								<DialogTitle>Move seat?</DialogTitle>
								<DialogDescription>
									<span className="font-medium text-foreground">
										{moveConfirm.student.name} {moveConfirm.student.surname}
									</span>
									{" "}is currently in seat{" "}
									<span className="font-mono font-medium text-amber-400">{moveConfirm.student.seatId}</span>.
									Move them to seat{" "}
									<span className="font-mono font-medium text-emerald-400">{moveConfirm.targetSeat}</span>?
									Their old seat will be freed.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button variant="outline" onClick={() => setMoveConfirm(null)}>Back</Button>
								<Button onClick={() => { assignSeat(moveConfirm.targetSeat, moveConfirm.student.id); setMoveConfirm(null); }}>
									Move seat
								</Button>
							</DialogFooter>
						</>
					) : (
						<>
							<DialogHeader>
								<DialogTitle>Assign seat {assignTarget}</DialogTitle>
								<DialogDescription>
									Search for a student by name, surname, class, or student ID.
								</DialogDescription>
							</DialogHeader>
							<div className="flex gap-2">
								<Button
									variant="destructive"
									className="flex-1"
									disabled={blockingAssign || assignBlocked}
									onClick={blockAssignTarget}
								>
									{blockingAssign ? "Blocking…" : assignBlocked ? "Blocked" : "Block seat"}
								</Button>
								<Button
									variant="outline"
									className="flex-1 border-orange-700 text-orange-400 hover:bg-orange-950"
									onClick={() => {
										const seatId = assignTarget!;
										setAssignTarget(null);
										setConfirmNote("");
										setConfirmAction({kind: "break", seatId});
									}}
								>
									Mark as broken
								</Button>
							</div>
							<Input
								autoFocus
								placeholder="Type to search…"
								value={search}
								onChange={(e) => searchStudents(e.target.value)}
							/>
							<div className="max-h-72 space-y-1 overflow-y-auto">
								{searchResults.map((s) => (
									<div key={s.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
										<div>
											<div className="font-medium">{s.name} {s.surname}</div>
											<div className="text-xs text-muted-foreground">
												Class {s.class} · #{s.rollNumber} · {s.studentId}
											</div>
											{s.seatId && (
												<div className="text-xs text-amber-400">Currently in seat {s.seatId}</div>
											)}
										</div>
										{s.seatId && s.seatId !== assignTarget ? (
											<Button
												size="sm"
												variant="outline"
												onClick={() => assignTarget && setMoveConfirm({student: s, targetSeat: assignTarget})}
											>
												Move here
											</Button>
										) : (
											<Button
												size="sm"
												onClick={() => assignTarget && assignSeat(assignTarget, s.id)}
											>
												Assign
											</Button>
										)}
									</div>
								))}
								{search.length >= 2 && searchResults.length === 0 && (
									<div className="text-xs text-muted-foreground">No matches.</div>
								)}
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={!!confirmAction} onOpenChange={(o) => { if (!o && !confirmLoading && !confirmSuccess) { setConfirmAction(null); setConfirmNote(""); } }}>
				<DialogContent>
					{confirmLoading ? (
						<div className="flex flex-col items-center gap-3 py-6">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"/>
							<p className="text-sm text-muted-foreground">
								{confirmAction?.kind === "block" ? "Blocking…" : confirmAction?.kind === "unblock" ? "Unblocking…" : confirmAction?.kind === "break" ? "Marking as broken…" : confirmAction?.kind === "unbreak" ? "Repairing…" : "Processing…"}
							</p>
						</div>
					) : confirmSuccess ? (
						<div className="flex flex-col items-center gap-3 py-6">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
							</svg>
							<p className="text-sm font-medium">
								{confirmAction?.kind === "block" ? "Blocked successfully" : confirmAction?.kind === "unblock" ? "Unblocked successfully" : confirmAction?.kind === "break" ? "Marked as broken" : confirmAction?.kind === "unbreak" ? "Repaired successfully" : "Done"}
							</p>
						</div>
					) : (
						<>
							<DialogHeader>
								<DialogTitle>Are you sure?</DialogTitle>
								<DialogDescription>
									{confirmAction?.kind === "cancel" &&
										`This will cancel the booking for ${confirmAction.seatId} and free the seat.`}
									{confirmAction?.kind === "block" &&
										`This will block ${confirmAction.seatId}. Staff will not be able to assign it.`}
									{confirmAction?.kind === "unblock" &&
										`This will unblock ${confirmAction.seatId} and make it available.`}
									{confirmAction?.kind === "break" &&
										`This will mark ${confirmAction.seatId} as broken. No one will be able to book it.`}
									{confirmAction?.kind === "unbreak" &&
										`This will mark ${confirmAction.seatId} as repaired and make it available again.`}
								</DialogDescription>
							</DialogHeader>
							{(confirmAction?.kind === "break" || confirmAction?.kind === "unbreak") && (
								<Input
									placeholder="Note (optional)"
									value={confirmNote}
									onChange={(e) => setConfirmNote(e.target.value)}
								/>
							)}
							<DialogFooter>
								<Button variant="outline" onClick={() => { setConfirmAction(null); setConfirmNote(""); }}>Cancel</Button>
								<Button variant="destructive" onClick={applyConfirm}>Confirm</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

		</>
	);
}
