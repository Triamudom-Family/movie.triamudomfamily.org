import {PrismaClient} from "@prisma/client";
import {SEAT_LAYOUT} from "../src/lib/seat-layout";

const prisma = new PrismaClient();

const EVENT_YEAR = Number(process.env.SEED_EVENT_YEAR ?? 89);
const EVENT_TITLE = process.env.SEED_EVENT_TITLE ?? `Triamudom Family Movie ${EVENT_YEAR}`;
const EVENT_VENUE = process.env.SEED_EVENT_VENUE ?? "Siam Pavalai · Paragon Cineplex";

async function main() {
	console.log(`Seeding event year ${EVENT_YEAR}...`);
	const event = await prisma.event.upsert({
		where: {year: EVENT_YEAR},
		update: {title: EVENT_TITLE, venue: EVENT_VENUE},
		create: {year: EVENT_YEAR, title: EVENT_TITLE, venue: EVENT_VENUE},
	});

	console.log(`Seeding seats for event ${EVENT_YEAR}...`);
	for (const seat of SEAT_LAYOUT.seats) {
		await prisma.seat.upsert({
			where: {eventId_id: {eventId: event.id, id: seat.id}},
			update: {
				row: seat.row,
				number: seat.number,
				section: seat.section,
				type: seat.type,
			},
			create: {
				id: seat.id,
				eventId: event.id,
				row: seat.row,
				number: seat.number,
				section: seat.section,
				type: seat.type,
			},
		});
	}
	console.log(`Seeded ${SEAT_LAYOUT.seats.length} seats.`);

	console.log("Seeding default admin user...");
	const existingAdmin = await prisma.user.findUnique({where: {username: "admin"}});
	if (existingAdmin) {
		console.log("Admin user already exists, skipping.");
	} else {
		const userId = crypto.randomUUID();
		const accountId = crypto.randomUUID();

		const {hashPassword} = await import("better-auth/crypto");
		const hashed = await hashPassword("admin123");

		await prisma.user.create({
			data: {
				id: userId,
				name: "Administrator",
				username: "admin",
				displayUsername: "admin",
				email: "admin@staff.local",
				role: "ADMIN",
				emailVerified: true,
				accounts: {
					create: {
						id: accountId,
						accountId: userId,
						providerId: "credential",
						password: hashed,
					},
				},
			},
		});
		console.log("Created default admin (username: admin / password: admin123)");
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
