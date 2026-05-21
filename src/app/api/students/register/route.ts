import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/server/prisma";
import {getSession} from "@/server/session";
import {getCurrentEventId} from "@/server/event";

const STUDENT_DOMAIN =
	process.env.STUDENT_EMAIL_DOMAIN ?? "@student.triamudom.ac.th";

const RegisterSchema = z.object({
	name: z.string().trim().min(1).max(80),
	surname: z.string().trim().min(1).max(80),
	class: z
		.string()
		.trim()
		.regex(/^\d{3}$/, "Class must be a 3-digit string"),
	rollNumber: z.coerce.number().int().min(1).max(999),
	studentId: z.string().trim().min(1).max(40),
});

export async function POST(req: Request) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const email = session.user.email;
	if (!email || !email.endsWith(STUDENT_DOMAIN)) {
		return NextResponse.json(
			{error: `Sign-in restricted to ${STUDENT_DOMAIN} accounts.`},
			{status: 403},
		);
	}

	const json = await req.json().catch(() => null);
	const parsed = RegisterSchema.safeParse(json);
	if (!parsed.success) {
		return NextResponse.json(
			{error: "Invalid input", details: parsed.error.flatten()},
			{status: 400},
		);
	}
	const data = parsed.data;
	const eventId = await getCurrentEventId();

	// If they already registered for the current event, return idempotently.
	const existingCurrent = await prisma.student.findUnique({
		where: {eventId_userId: {eventId, userId: session.user.id}},
	});
	if (existingCurrent) {
		return NextResponse.json({student: existingCurrent}, {status: 200});
	}

	// Block any user who registered in a previous event.
	const existingAnyEvent = await prisma.student.findFirst({
		where: {userId: session.user.id},
	});
	if (existingAnyEvent) {
		return NextResponse.json(
			{error: "บัญชีนี้ลงทะเบียนในปีก่อนหน้าแล้ว"},
			{status: 409},
		);
	}

	const idTaken = await prisma.student.findUnique({
		where: {eventId_studentId: {eventId, studentId: data.studentId}},
	});
	if (idTaken) {
		return NextResponse.json(
			{error: "This student ID is already registered."},
			{status: 409},
		);
	}

	const account = await prisma.account.findFirst({
		where: {userId: session.user.id, providerId: "google"},
		select: {accountId: true},
	});
	if (!account) {
		return NextResponse.json(
			{error: "Google account not linked."},
			{status: 400},
		);
	}

	const qrToken = `STU-${crypto.randomUUID()}`;

	const student = await prisma.student.create({
		data: {
			eventId,
			userId: session.user.id,
			googleId: account.accountId,
			email,
			name: data.name,
			surname: data.surname,
			class: data.class,
			rollNumber: data.rollNumber,
			studentId: data.studentId,
			qrToken,
		},
	});

	await prisma.user.update({
		where: {id: session.user.id},
		data: {role: "STUDENT", name: `${data.name} ${data.surname}`},
	});

	return NextResponse.json({student}, {status: 201});
}
