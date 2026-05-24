import {Prisma} from "@prisma/client";
import {prisma} from "./prisma";
import {getCurrentEventId} from "./event";
import {broadcastSeatUpdate} from "./realtime";

export type BookSeatInput = {
	seatId: string;
	studentId: string;
	performedBy: string;
	isAdmin: boolean;
	note?: string;
};

export type BookSeatResult =
	| { ok: true; overrode: boolean }
	| { ok: false; error: string; status: number };

export async function bookSeat(input: BookSeatInput): Promise<BookSeatResult> {
	const {seatId, studentId, performedBy, isAdmin, note} = input;
	const eventId = await getCurrentEventId();

	try {
		const result = await prisma.$transaction(async (tx) => {
			// Row-lock the target seat for the duration of the transaction so
			// concurrent bookings serialize and the status check below is race-free.
			await tx.$executeRaw`SELECT 1 FROM movie."Seat" WHERE "eventId" = ${eventId} AND "id" = ${seatId} FOR UPDATE`;

			const seat = await tx.seat.findUnique({where: {eventId_id: {eventId, id: seatId}}});
			if (!seat) throw new Error("SEAT_NOT_FOUND");

			if (seat.status === "BROKEN") throw new Error("SEAT_BROKEN");
			if (seat.status === "BLOCKED") {
				if (!isAdmin) throw new Error("SEAT_BLOCKED");
			}

			const student = await tx.student.findUnique({
				where: {id: studentId},
			});
			if (!student) throw new Error("STUDENT_NOT_FOUND");

			const isStudentSeat = student.seatId === seatId;

			if (seat.status === "BOOKED" && !isStudentSeat) {
				if (!isAdmin) throw new Error("SEAT_TAKEN");
			}

			const previousSeatId = student.seatId;
			const overrode = seat.status === "BOOKED" && !isStudentSeat;

			// Free the student's previous seat if it differs
			if (previousSeatId && previousSeatId !== seatId) {
				await tx.seat.update({
					where: {eventId_id: {eventId, id: previousSeatId}},
					data: {
						status: "AVAILABLE",
						bookedBy: null,
						bookedAt: null,
					},
				});
				await tx.bookingLog.create({
					data: {
						eventId,
						seatId: previousSeatId,
						studentId: student.id,
						action: "CANCELLED",
						performedBy,
						note: `Reassigned to ${seatId}`,
					},
				});
			}

			// If overriding, log the previous occupant
			if (overrode) {
				const previousOccupant = await tx.student.findUnique({
					where: {eventId_seatId: {eventId, seatId}},
				});
				if (previousOccupant && previousOccupant.id !== student.id) {
					await tx.student.update({
						where: {id: previousOccupant.id},
						data: {seatId: null},
					});
					await tx.bookingLog.create({
						data: {
							eventId,
							seatId,
							studentId: previousOccupant.id,
							action: "OVERRIDDEN",
							performedBy,
							note: note ?? `Overridden by admin for student ${student.studentId}`,
						},
					});
				}
			}

			await tx.seat.update({
				where: {eventId_id: {eventId, id: seatId}},
				data: {
					status: "BOOKED",
					bookedBy: performedBy,
					bookedAt: new Date(),
				},
			});

			await tx.student.update({
				where: {id: student.id},
				data: {seatId},
			});

			await tx.bookingLog.create({
				data: {
					eventId,
					seatId,
					studentId: student.id,
					action: "BOOKED",
					performedBy,
					note: overrode ? note ?? "Override booking" : note,
				},
			});

			return {
				ok: true as const,
				overrode,
				previousSeatId,
				bookedStudent: {
					studentId: student.studentId,
					name: `${student.name} ${student.surname}`,
					class: student.class,
					rollNumber: student.rollNumber,
				},
			};
		});

		if (result.previousSeatId && result.previousSeatId !== seatId) {
			await broadcastSeatUpdate(result.previousSeatId, "AVAILABLE");
		}
		await broadcastSeatUpdate(seatId, "BOOKED", result.bookedStudent);

		return {ok: true, overrode: result.overrode};
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			return {ok: false, error: "Database error", status: 500};
		}
		const msg = e instanceof Error ? e.message : "ERROR";
		if (msg === "SEAT_NOT_FOUND")
			return {ok: false, error: "Seat not found", status: 404};
		if (msg === "STUDENT_NOT_FOUND")
			return {ok: false, error: "Student not found", status: 404};
		if (msg === "SEAT_BROKEN")
			return {ok: false, error: "This seat is broken and cannot be booked.", status: 409};
		if (msg === "SEAT_BLOCKED")
			return {
				ok: false,
				error: "This seat is blocked.",
				status: 409,
			};
		if (msg === "SEAT_TAKEN")
			return {
				ok: false,
				error: "Seat already booked by another student.",
				status: 409,
			};
		return {ok: false, error: msg, status: 500};
	}
}

export async function cancelBooking(
	seatId: string,
	performedBy: string,
	note?: string,
) {
	const eventId = await getCurrentEventId();
	const result = await prisma.$transaction(async (tx) => {
		const seat = await tx.seat.findUnique({where: {eventId_id: {eventId, id: seatId}}});
		if (!seat) throw new Error("SEAT_NOT_FOUND");
		const student = await tx.student.findUnique({where: {eventId_seatId: {eventId, seatId}}});
		await tx.seat.update({
			where: {eventId_id: {eventId, id: seatId}},
			data: {status: "AVAILABLE", bookedBy: null, bookedAt: null},
		});
		if (student) {
			await tx.student.update({
				where: {id: student.id},
				data: {seatId: null},
			});
		}
		await tx.bookingLog.create({
			data: {
				eventId,
				seatId,
				studentId: student?.id,
				action: "CANCELLED",
				performedBy,
				note,
			},
		});
	});
	await broadcastSeatUpdate(seatId, "AVAILABLE");
	return result;
}

export async function setRowBlocked(
	row: string,
	performedBy: string,
	blocked: boolean,
	note?: string,
): Promise<{ count: number }> {
	const eventId = await getCurrentEventId();
	const seats = await prisma.seat.findMany({
		where: {eventId, row, status: blocked ? "AVAILABLE" : "BLOCKED"},
		select: {id: true},
	});
	if (seats.length === 0) return {count: 0};
	const ids = seats.map((s) => s.id);
	const newStatus = blocked ? "BLOCKED" : "AVAILABLE";
	await prisma.$transaction([
		prisma.seat.updateMany({
			where: {eventId, id: {in: ids}},
			data: {status: newStatus, bookedBy: null, bookedAt: null},
		}),
		prisma.bookingLog.createMany({
			data: ids.map((seatId) => ({
				eventId,
				seatId,
				action: blocked ? "BLOCKED" : "UNBLOCKED",
				performedBy,
				note: note ?? `Row ${row} ${blocked ? "blocked" : "unblocked"} in bulk`,
			})),
		}),
	]);
	await Promise.all(ids.map((id) => broadcastSeatUpdate(id, newStatus as "BLOCKED" | "AVAILABLE")));
	return {count: ids.length};
}

export async function setSectionBlocked(
	section: string,
	performedBy: string,
	blocked: boolean,
	note?: string,
): Promise<{ count: number }> {
	const eventId = await getCurrentEventId();
	const seats = await prisma.seat.findMany({
		where: {eventId, section, status: blocked ? "AVAILABLE" : "BLOCKED"},
		select: {id: true},
	});
	if (seats.length === 0) return {count: 0};
	const ids = seats.map((s) => s.id);
	const newStatus = blocked ? "BLOCKED" : "AVAILABLE";
	await prisma.$transaction([
		prisma.seat.updateMany({
			where: {eventId, id: {in: ids}},
			data: {status: newStatus, bookedBy: null, bookedAt: null},
		}),
		prisma.bookingLog.createMany({
			data: ids.map((seatId) => ({
				eventId,
				seatId,
				action: blocked ? "BLOCKED" : "UNBLOCKED",
				performedBy,
				note: note ?? `Section ${section} ${blocked ? "blocked" : "unblocked"} in bulk`,
			})),
		}),
	]);
	await Promise.all(ids.map((id) => broadcastSeatUpdate(id, newStatus as "BLOCKED" | "AVAILABLE")));
	return {count: ids.length};
}

export async function setSeatTypeBlocked(
	type: string,
	performedBy: string,
	blocked: boolean,
	note?: string,
): Promise<{ count: number }> {
	const eventId = await getCurrentEventId();
	const seats = await prisma.seat.findMany({
		where: {eventId, type, status: blocked ? "AVAILABLE" : "BLOCKED"},
		select: {id: true},
	});
	if (seats.length === 0) return {count: 0};
	const ids = seats.map((s) => s.id);
	const newStatus = blocked ? "BLOCKED" : "AVAILABLE";
	await prisma.$transaction([
		prisma.seat.updateMany({
			where: {eventId, id: {in: ids}},
			data: {status: newStatus, bookedBy: null, bookedAt: null},
		}),
		prisma.bookingLog.createMany({
			data: ids.map((seatId) => ({
				eventId,
				seatId,
				action: blocked ? "BLOCKED" : "UNBLOCKED",
				performedBy,
				note: note ?? `Zone ${type} ${blocked ? "blocked" : "unblocked"} in bulk`,
			})),
		}),
	]);
	await Promise.all(ids.map((id) => broadcastSeatUpdate(id, newStatus as "BLOCKED" | "AVAILABLE")));
	return {count: ids.length};
}

export async function setSeatBroken(
	seatId: string,
	performedBy: string,
	broken: boolean,
	note?: string,
) {
	const eventId = await getCurrentEventId();
	await prisma.$transaction(async (tx) => {
		const seat = await tx.seat.findUnique({where: {eventId_id: {eventId, id: seatId}}});
		if (!seat) throw new Error("SEAT_NOT_FOUND");
		if (broken && seat.status === "BOOKED") throw new Error("SEAT_BOOKED");
		await tx.seat.update({
			where: {eventId_id: {eventId, id: seatId}},
			data: {
				status: broken ? "BROKEN" : "AVAILABLE",
				note: broken ? (note ?? null) : null,
				bookedBy: null,
				bookedAt: null,
			},
		});
		await tx.bookingLog.create({
			data: {
				eventId,
				seatId,
				action: broken ? "BROKEN" : "REPAIRED",
				performedBy,
				note,
			},
		});
	});
	await broadcastSeatUpdate(seatId, broken ? "BROKEN" : "AVAILABLE");
}

export async function setSeatBlocked(
	seatId: string,
	performedBy: string,
	blocked: boolean,
	note?: string,
) {
	const eventId = await getCurrentEventId();
	await prisma.$transaction(async (tx) => {
		const seat = await tx.seat.findUnique({where: {eventId_id: {eventId, id: seatId}}});
		if (!seat) throw new Error("SEAT_NOT_FOUND");
		if (blocked && seat.status === "BOOKED") {
			throw new Error("SEAT_BOOKED");
		}
		await tx.seat.update({
			where: {eventId_id: {eventId, id: seatId}},
			data: {
				status: blocked ? "BLOCKED" : "AVAILABLE",
				bookedBy: null,
				bookedAt: null,
			},
		});
		await tx.bookingLog.create({
			data: {
				eventId,
				seatId,
				action: blocked ? "BLOCKED" : "UNBLOCKED",
				performedBy,
				note,
			},
		});
	});
	await broadcastSeatUpdate(seatId, blocked ? "BLOCKED" : "AVAILABLE");
}
