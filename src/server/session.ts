import {headers} from "next/headers";
import {auth} from "./auth";
import {prisma} from "./prisma";
import {getCurrentEventId} from "./event";

export async function getSession() {
	const h = await headers();
	return auth.api.getSession({headers: h});
}

export type AppRole = "STAFF" | "ADMIN" | "STUDENT";

export async function requireUser(roles?: AppRole[]) {
	const session = await getSession();
	if (!session) return null;
	const user = await prisma.user.findUnique({
		where: {id: session.user.id},
	});
	if (!user) return null;
	if (roles && !roles.includes(user.role as AppRole)) return null;

	// Students must belong to the current event. Past-year students are rejected.
	if (user.role === "STUDENT") {
		const eventId = await getCurrentEventId();
		const current = await prisma.student.findUnique({
			where: {eventId_userId: {eventId, userId: user.id}},
			select: {id: true},
		});
		if (!current) return null;
	}

	return {session, user};
}
