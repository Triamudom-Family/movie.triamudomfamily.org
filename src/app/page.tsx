import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {getEventSettings} from "@/server/settings";
import {LandingPage} from "./landing-page";

export default async function Home() {
	const [session, eventSettings] = await Promise.all([
		getSession(),
		getEventSettings(),
	]);

	if (session) {
		const user = await prisma.user.findUnique({
			where: {id: session.user.id},
			select: {role: true},
		});
		if (!user) redirect("/login");
		if (user.role === "ADMIN") redirect("/admin");
		if (user.role === "STAFF") redirect("/staff");
	}

	return <LandingPage eventSettings={eventSettings}/>;
}
