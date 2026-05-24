import type {SeatStatusValue} from "@/lib/seat-layout";

export type SeatBroadcastStatus = SeatStatusValue;

async function httpBroadcast(
	messages: {topic: string; event: string; payload: object}[],
) {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key =
		process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !key) return;
	try {
		await fetch(`${url}/realtime/v1/api/broadcast`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				apikey: key,
				Authorization: `Bearer ${key}`,
			},
			body: JSON.stringify({messages}),
		});
	} catch { /* non-fatal — realtime is best-effort */ }
}

export type SeatBookingStudent = {
	studentId: string;
	name: string;
	class: string;
	rollNumber: number;
};

export async function broadcastSeatUpdate(
	seat: string,
	status: SeatBroadcastStatus,
	student?: SeatBookingStudent,
) {
	await httpBroadcast([
		{topic: "seats", event: "seat-update", payload: {seat, status, student: student ?? null}},
	]);
}

export async function broadcastSeatUpdates(
	updates: {seat: string; status: SeatBroadcastStatus}[],
) {
	await httpBroadcast(
		updates.map((u) => ({topic: "seats", event: "seat-update", payload: u})),
	);
}

export type RegistrationBroadcast = {
	studentId: string;
	name: string;
	class: string;
	rollNumber: number;
};

export async function broadcastRegistration(payload: RegistrationBroadcast) {
	await httpBroadcast([
		{topic: "registrations", event: "student-registered", payload},
	]);
}
