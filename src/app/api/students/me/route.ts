import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {getSession} from "@/server/session";
import {getCurrentEventId} from "@/server/event";

export async function GET() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const eventId = await getCurrentEventId();
	const student = await prisma.student.findUnique({
		where: {eventId_userId: {eventId, userId: session.user.id}},
		include: {seat: true},
	});
	return NextResponse.json({student});
}
