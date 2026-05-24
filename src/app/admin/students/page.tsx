"use client";

import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import {Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

function batchOf(email: string): string {
	const m = email.match(/^(\d{2})/);
	return m ? m[1] : "—";
}

type Seat = {
	id: string;
	row: string;
	number: number;
	section: string;
	type: string;
	status: string;
};

type Student = {
	id: string;
	studentId: string;
	name: string;
	surname: string;
	class: string;
	rollNumber: number;
	email: string;
	seatId: string | null;
	createdAt: string;
	seat: Seat | null;
};

export default function StudentsPage() {
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState({q: "", class: "", seat: "", batch: ""});
	const [allBatches, setAllBatches] = useState<string[]>([]);
	const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
	const [deleting, setDeleting] = useState(false);
	const isMount = useRef(true);

	async function fetchStudents(): Promise<Student[] | null> {
		const params = new URLSearchParams();
		if (filters.q) params.set("q", filters.q);
		if (filters.class) params.set("class", filters.class);
		if (filters.seat) params.set("seat", filters.seat);
		if (filters.batch) params.set("batch", filters.batch);
		const res = await fetch(`/api/students?${params.toString()}`);
		if (!res.ok) return null;
		return (await res.json()).students;
	}

	async function load() {
		setLoading(true);
		try {
			const next = await fetchStudents();
			if (next) setStudents(next);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchStudents().then((next) => {
			if (next) {
				setStudents(next);
				const tus = Array.from(
					new Set(next.map((s) => batchOf(s.email)).filter((b) => b !== "—")),
				).sort();
				setAllBatches(tus);
			}
			setLoading(false);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (isMount.current) { isMount.current = false; return; }
		const t = setTimeout(() => load(), 400);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters.q, filters.class, filters.batch]);

	async function deleteStudent() {
		if (!deleteTarget || deleting) return;
		setDeleting(true);
		const res = await fetch(`/api/students/${deleteTarget.id}`, {method: "DELETE"});
		setDeleting(false);
		if (res.ok) {
			toast.success("Student deleted");
			setDeleteTarget(null);
			load();
		} else {
			const data = await res.json();
			toast.error(data.error ?? "Failed");
		}
	}

	function exportCsv() {
		const header = [
			"student_id",
			"name",
			"surname",
			"class",
			"roll_number",
			"tu",
			"email",
			"seat",
			"seat_type",
			"seat_status",
			"registered_at",
		].join(",");
		const rows = students.map((s) => {
			const cells = [
				s.studentId,
				s.name,
				s.surname,
				s.class,
				s.rollNumber,
				batchOf(s.email),
				s.email,
				s.seat ? `${s.seat.row}-${s.seat.number}` : "",
				s.seat?.type ?? "",
				s.seat?.status ?? "",
				new Date(s.createdAt).toLocaleString("sv-SE", {timeZone: "Asia/Bangkok"}) + "+07:00",
			];
			return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
		});
		const csv = [header, ...rows].join("\n");
		const blob = new Blob([csv], {type: "text/csv"});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `students-${new Date().toLocaleDateString("sv-SE", {timeZone: "Asia/Bangkok"})}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	const booked = students.filter((s) => s.seat).length;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Student data</h1>
					<p className="text-sm text-muted-foreground">
						All registered students and their seat assignments.
					</p>
				</div>
				<Button onClick={exportCsv} disabled={students.length === 0}>
					Export CSV
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-4">
					<div className="space-y-1">
						<Label>Search</Label>
						<Input
							placeholder="Name, surname, or student ID"
							value={filters.q}
							onChange={(e) => setFilters({...filters, q: e.target.value})}
						/>
					</div>
					<div className="space-y-1">
						<Label>Class</Label>
						<Input
							placeholder="e.g. 946"
							maxLength={3}
							value={filters.class}
							onChange={(e) => setFilters({...filters, class: e.target.value})}
						/>
					</div>
					<div className="space-y-1">
						<Label>TU</Label>
						<Select
							value={filters.batch || "all"}
							onValueChange={(v) =>
								setFilters({...filters, batch: v === "all" ? "" : v})
							}
						>
							<SelectTrigger>
								<SelectValue/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								{allBatches.map((b) => (
									<SelectItem key={b} value={b}>
										{b}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<Label>Seat</Label>
						<Select
							value={filters.seat || "all"}
							onValueChange={(v) =>
								setFilters({...filters, seat: v === "all" ? "" : v})
							}
						>
							<SelectTrigger>
								<SelectValue/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="booked">Seat booked</SelectItem>
								<SelectItem value="unbooked">No seat</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<Button onClick={load} className="sm:col-span-4" disabled={loading}>
						{loading ? "Loading…" : "Apply filters"}
					</Button>
				</CardContent>
			</Card>

			<div className="flex items-center gap-4 text-sm text-muted-foreground">
				<span>{students.length} student{students.length !== 1 ? "s" : ""}</span>
				<span>{booked} assigned · {students.length - booked} unassigned</span>
			</div>

			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>TU</TableHead>
								<TableHead>Student ID</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Class</TableHead>
								<TableHead>Number</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Seat</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Registered</TableHead>
								<TableHead/>
							</TableRow>
						</TableHeader>
						<TableBody>
							{students.length === 0 && (
								<TableRow>
									<TableCell colSpan={10} className="text-center text-muted-foreground py-8">
										{loading ? "Loading…" : "No students found."}
									</TableCell>
								</TableRow>
							)}
							{students.map((s) => (
								<TableRow key={s.id}>
									<TableCell className="font-mono text-xs">{batchOf(s.email)}</TableCell>
									<TableCell className="font-mono text-xs">{s.studentId}</TableCell>
									<TableCell>{s.name} {s.surname}</TableCell>
									<TableCell>{s.class}</TableCell>
									<TableCell className="text-xs text-muted-foreground">{s.rollNumber}</TableCell>
									<TableCell className="text-xs text-muted-foreground">{s.email}</TableCell>
									<TableCell>
										{s.seat ? (
											<span className="font-mono text-xs">
												{s.seat.row}-{s.seat.number}
											</span>
										) : (
											<span className="text-xs text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell>
										{s.seat ? (
											<Badge variant="outline" className="text-xs capitalize">
												{s.seat.type}
											</Badge>
										) : null}
									</TableCell>
									<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
										{new Date(s.createdAt).toLocaleString(undefined, {
											timeZone: "Asia/Bangkok",
											year: "numeric",
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setDeleteTarget(s)}
										>
											<Trash2 className="h-4 w-4"/>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		<Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete student data</DialogTitle>
						<DialogDescription>
							This will permanently delete all data for{" "}
							<strong>{deleteTarget?.name} {deleteTarget?.surname}</strong>{" "}
							({deleteTarget?.studentId}) and free their seat if booked. This cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteTarget(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={deleteStudent} disabled={deleting}>
							{deleting ? "Deleting…" : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
