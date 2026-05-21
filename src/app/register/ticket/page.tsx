import {redirect} from "next/navigation";
import QRCode from "qrcode";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {getCurrentEventId} from "@/server/event";
import {getEventSettings} from "@/server/settings";
import {TicketView} from "./ticket-view";

const TZ = "Asia/Bangkok";

function shortDate(d: Date): string {
	return d.toLocaleDateString("en-GB", {
		timeZone: TZ,
		day: "2-digit",
		month: "2-digit",
		year: "2-digit",
	});
}

function shortTime(d: Date): string {
	return d.toLocaleTimeString("en-GB", {
		timeZone: TZ,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

export default async function TicketPage() {
	const session = await getSession();
	if (!session) redirect("/register");
	const eventId = await getCurrentEventId();
	const student = await prisma.student.findUnique({
		where: {eventId_userId: {eventId, userId: session.user.id}},
		include: {seat: true},
	});
	if (!student) redirect("/register");

	const settings = await getEventSettings();

	const eventDate = settings.eventAt ? new Date(settings.eventAt) : null;
	const dateDisplay = eventDate ? shortDate(eventDate) : "—";
	const timeDisplay = eventDate
		? settings.eventEndTime
			? `${shortTime(eventDate)} – ${settings.eventEndTime}`
			: shortTime(eventDate)
		: "";

	const venueRaw = settings.venue ?? "";
	const [venuePrimary, venueSecondary] = venueRaw.includes(" · ")
		? (venueRaw.split(" · ", 2) as [string, string])
		: [venueRaw, ""];

	const now = new Date();
	const issuedAtFormatted = `${shortDate(now)} ${shortTime(now)}`;

	const qrMatrix = QRCode.create(student.qrToken, {errorCorrectionLevel: "H"});
	const qr = {
		size: qrMatrix.modules.size,
		data: Array.from(qrMatrix.modules.data),
	};

	const seat = student.seat
		? {assigned: true as const, row: student.seat.row, number: student.seat.number}
		: {assigned: false as const};

	return (
		<TicketView
			student={{
				name: student.name,
				surname: student.surname,
				studentId: student.studentId,
				class: student.class,
				rollNumber: student.rollNumber,
				qrToken: student.qrToken,
			}}
			seat={seat}
			movieTitle="The First Movie"
			movieTagline="Where it all begins."
			movieSubTagline="First meet · First memory · #TU89"
			dateDisplay={dateDisplay}
			timeDisplay={timeDisplay}
			venuePrimary={venuePrimary || "—"}
			venueSecondary={venueSecondary}
			issuedAtFormatted={issuedAtFormatted}
			qr={qr}
		/>
	);
}
