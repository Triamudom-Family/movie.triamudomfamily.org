import {cache} from "react";
import {prisma} from "./prisma";

const CURRENT_EVENT_YEAR = Number(process.env.CURRENT_EVENT_YEAR ?? 89);

export const getCurrentEvent = cache(async () => {
	const event = await prisma.event.findUnique({
		where: {year: CURRENT_EVENT_YEAR},
	});
	if (!event) {
		throw new Error(
			`No Event row found for CURRENT_EVENT_YEAR=${CURRENT_EVENT_YEAR}. ` +
			`Insert one in movie."Event" or set CURRENT_EVENT_YEAR.`,
		);
	}
	return event;
});

export async function getCurrentEventId() {
	return (await getCurrentEvent()).id;
}
