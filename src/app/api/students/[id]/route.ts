import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";
import {getCurrentEventId} from "@/server/event";

export async function DELETE(
	_req: Request,
	ctx: {params: Promise<{id: string}>},
) {
	const me = await requireUser(["ADMIN"]);
	if (!me) return NextResponse.json({error: "Unauthorized"}, {status: 401});

	const {id} = await ctx.params;
	const eventId = await getCurrentEventId();
	const student = await prisma.student.findFirst({
		where: {id, eventId},
		select: {userId: true, seatId: true},
	});
	if (!student) return NextResponse.json({error: "Not found"}, {status: 404});

	if (student.seatId) {
		await prisma.seat.update({
			where: {eventId_id: {eventId, id: student.seatId}},
			data: {status: "AVAILABLE", bookedBy: null, bookedAt: null},
		});
	}

	// Cascade: deleting User removes Student, Account, Session
	await prisma.user.delete({where: {id: student.userId}});

	return NextResponse.json({ok: true});
}
