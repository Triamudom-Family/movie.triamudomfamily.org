import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";
import {getCurrentEventId} from "@/server/event";

export async function GET() {
	const auth = await requireUser(["STAFF", "ADMIN"]);
	if (!auth) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const eventId = await getCurrentEventId();
	const seats = await prisma.seat.findMany({
		where: {eventId},
		select: {
			id: true,
			row: true,
			number: true,
			section: true,
			type: true,
			status: true,
			note: true,
		},
	});
	return NextResponse.json({seats});
}
