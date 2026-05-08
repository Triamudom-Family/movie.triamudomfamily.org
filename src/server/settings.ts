import {prisma} from "./prisma";

export type EventSettings = {
	eventAt: string | null;       // UTC ISO string
	eventEndTime: string | null;  // display string e.g. "21:00"
	venue: string | null;
};

const KEYS = ["eventAt", "eventEndTime", "venue"] as const;

export async function getEventSettings(): Promise<EventSettings> {
	try {
		const rows = await prisma.siteSetting.findMany({where: {key: {in: [...KEYS]}}});
		const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
		return {
			eventAt: map.eventAt ?? null,
			eventEndTime: map.eventEndTime ?? null,
			venue: map.venue ?? null,
		};
	} catch {
		return {eventAt: null, eventEndTime: null, venue: null};
	}
}
