import {loadSeatStatuses} from "@/components/seat/seat-map-loader";
import {StaffSeatMap} from "./staff-seat-map";

export default async function StaffPage() {
	const initial = await loadSeatStatuses();
	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Live view of all seat statuses. To book a seat, scan the student&apos;s
				QR via the <span className="font-mono">Scan QR</span> tab.
			</p>
			<StaffSeatMap initialStatus={initial}/>
		</div>
	);
}
