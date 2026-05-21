import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";
import {getCurrentEventId} from "@/server/event";

export async function GET(
	_req: Request,
	ctx: { params: Promise<{ seatId: string }> },
) {
	const auth = await requireUser(["STAFF", "ADMIN"]);
	if (!auth) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const {seatId} = await ctx.params;
	const eventId = await getCurrentEventId();
	const seat = await prisma.seat.findFirst({
		where: {id: seatId, eventId},
		include: {
			student: {
				select: {
					id: true,
					name: true,
					surname: true,
					class: true,
					rollNumber: true,
					studentId: true,
				},
			},
		},
	});
	if (!seat) return NextResponse.json({error: "Not found"}, {status: 404});

	const performer = seat.bookedBy
		? await prisma.user.findUnique({
			where: {id: seat.bookedBy},
			select: {id: true, name: true, username: true},
		})
		: null;

	return NextResponse.json({seat, performer});
}
