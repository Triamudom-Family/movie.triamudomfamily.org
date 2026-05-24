"use client";

import {useEffect, useState} from "react";
import {RefreshCw} from "lucide-react";

type Stats = {
	app: {version: string; node: string; platform: string; env: string};
	runtime: {
		next: string | null;
		react: string | null;
		prisma: string | null;
		betterAuth: string | null;
		supabase: string | null;
		v8: string;
		openssl: string;
		icu: string;
		uv: string;
	};
	host: {
		hostname: string;
		containerId: string | null;
		os: string;
		arch: string;
		systemUptimeSeconds: number;
		loadAvg1: number;
		loadAvg5: number;
		loadAvg15: number;
	};
	process: {
		uptimeSeconds: number;
		pid: number;
		heapUsedBytes: number;
		heapTotalBytes: number;
		rssBytes: number;
		externalBytes: number;
		cpuPercentOfCore: number;
		cpuPercentOfHost: number;
	};
	cpu: {count: number; model: string; speedMhz: number};
	memory: {totalBytes: number; freeBytes: number; usedBytes: number};
	container: {limitBytes: number | null; usageBytes: number | null};
	database: {
		pingMs: number;
		sizeBytes: number;
		sizePretty: string;
		schema: string;
		schemaBytes: number;
		tableBytes: number;
		indexBytes: number;
		bookingLogs: number;
		tables: {
			name: string;
			totalBytes: number;
			tableBytes: number;
			indexBytes: number;
			totalPretty: string;
			rowEstimate: number;
		}[];
	};
	now: string;
};

const REFRESH_MS = 5000;

function fmtUptime(s: number) {
	const days = Math.floor(s / 86400);
	const hours = Math.floor((s % 86400) / 3600);
	const minutes = Math.floor((s % 3600) / 60);
	const seconds = s % 60;
	const parts: string[] = [];
	if (days) parts.push(`${days}d`);
	if (hours || days) parts.push(`${hours}h`);
	if (minutes || hours || days) parts.push(`${minutes}m`);
	parts.push(`${seconds}s`);
	return parts.join(" ");
}

function fmtBytes(n: number) {
	if (n < 1024) return `${n} B`;
	const units = ["KiB", "MiB", "GiB", "TiB"];
	let v = n / 1024;
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i += 1;
	}
	return `${v.toFixed(2)} ${units[i]}`;
}

function pingTone(ms: number) {
	if (ms < 50) return "text-emerald-400";
	if (ms < 150) return "text-amber-300";
	return "text-rose-400";
}

function Row({label, value, tone}: {label: string; value: React.ReactNode; tone?: string}) {
	return (
		<div className="flex items-baseline justify-between gap-4 px-3 py-1.5 border-b border-zinc-800/60 last:border-b-0">
			<span className="text-zinc-500 text-[12px] uppercase tracking-wider">{label}</span>
			<span className={`text-zinc-100 ${tone ?? ""}`}>{value}</span>
		</div>
	);
}

function MemoryBar({used, total}: {used: number; total: number}) {
	const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
	const color = pct > 85 ? "bg-rose-500" : pct > 60 ? "bg-amber-400" : "bg-emerald-500";
	return (
		<div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
			<div className={`h-full ${color}`} style={{width: `${pct.toFixed(1)}%`}}/>
		</div>
	);
}

function MemoryGauge({
	                     label,
	                     used,
	                     total,
	                     leftLabel,
	                     rightLabel,
                     }: {
	label: string;
	used: number;
	total: number;
	leftLabel: string;
	rightLabel: string;
}) {
	const pct = total > 0 ? (used / total) * 100 : 0;
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-baseline justify-between">
				<span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
					{label}
				</span>
				<span className="text-[11px] tabular-nums text-zinc-500">
					{pct.toFixed(1)}%
				</span>
			</div>
			<MemoryBar used={used} total={total}/>
			<div className="flex justify-between text-[11px] tabular-nums">
				<span className="text-zinc-300">
					{fmtBytes(used)}{" "}
					<span className="text-zinc-600">{leftLabel}</span>
				</span>
				<span className="text-zinc-300">
					{fmtBytes(total)}{" "}
					<span className="text-zinc-600">{rightLabel}</span>
				</span>
			</div>
		</div>
	);
}

function TableBreakdown({
	                        tables,
	                        schemaBytes,
                        }: {
	tables: Stats["database"]["tables"];
	schemaBytes: number;
}) {
	const max = Math.max(1, ...tables.map((t) => t.totalBytes));
	return (
		<div className="rounded-md border border-zinc-800 bg-zinc-950 overflow-hidden">
			<div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2">
				<span className="h-1.5 w-1.5 rounded-full bg-violet-400"/>
				<span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
					Tables ({tables.length})
				</span>
				<span className="ml-auto text-[11px] text-zinc-500">
					{fmtBytes(schemaBytes)} total
				</span>
			</div>
			<div className="grid grid-cols-[1fr_repeat(4,minmax(0,auto))] items-center gap-x-4 px-3 py-1.5 border-b border-zinc-800 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
				<span>Table</span>
				<span className="text-right">Rows (est)</span>
				<span className="text-right">Table</span>
				<span className="text-right">Indexes</span>
				<span className="text-right">Total</span>
			</div>
			<div className="text-[12px]">
				{tables.length === 0 ? (
					<div className="px-3 py-3 text-zinc-500">No tables found in schema.</div>
				) : (
					tables.map((t) => {
						const pct = (t.totalBytes / max) * 100;
						const indexPct = t.totalBytes > 0 ? (t.indexBytes / t.totalBytes) * 100 : 0;
						return (
							<div
								key={t.name}
								className="grid grid-cols-[1fr_repeat(4,minmax(0,auto))] items-center gap-x-4 px-3 py-2 border-b border-zinc-800/60 last:border-b-0"
							>
								<div className="min-w-0">
									<div className="flex items-center gap-2 text-zinc-100">
										<span className="truncate">{t.name}</span>
										<span className="shrink-0 text-[10px] text-zinc-500">
											{indexPct.toFixed(0)}% idx
										</span>
									</div>
									<div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
										<div className="h-full flex">
											<div
												className="h-full bg-violet-500"
												style={{width: `${(t.tableBytes / max) * 100}%`}}
											/>
											<div
												className="h-full bg-cyan-500"
												style={{width: `${(t.indexBytes / max) * 100}%`}}
											/>
										</div>
									</div>
									<div className="mt-0.5 text-[10px] text-zinc-600">
										{pct.toFixed(1)}% of largest
									</div>
								</div>
								<span className="text-right text-zinc-400 tabular-nums">
									{t.rowEstimate.toLocaleString()}
								</span>
								<span className="text-right text-violet-300 tabular-nums">
									{fmtBytes(t.tableBytes)}
								</span>
								<span className="text-right text-cyan-300 tabular-nums">
									{fmtBytes(t.indexBytes)}
								</span>
								<span className="text-right text-zinc-100 tabular-nums">
									{t.totalPretty}
								</span>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}

function Section({title, accent, children}: {title: string; accent: string; children: React.ReactNode}) {
	return (
		<div className="rounded-md border border-zinc-800 bg-zinc-950 overflow-hidden">
			<div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2">
				<span className={`h-1.5 w-1.5 rounded-full ${accent}`}/>
				<span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
					{title}
				</span>
			</div>
			<div className="text-[13px]">{children}</div>
		</div>
	);
}

export default function StatsPage() {
	const [stats, setStats] = useState<Stats | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [lastFetched, setLastFetched] = useState<Date | null>(null);

	const load = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/stats", {cache: "no-store"});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = (await res.json()) as Stats;
			setStats(data);
			setError(null);
			setLastFetched(new Date());
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		const id = setInterval(load, REFRESH_MS);
		return () => clearInterval(id);
	}, []);

	const heapPct =
		stats && stats.process.heapTotalBytes > 0
			? (stats.process.heapUsedBytes / stats.process.heapTotalBytes) * 100
			: 0;

	return (
		<div
			className="flex flex-1 flex-col gap-4 p-4"
			style={{fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace"}}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className={`h-2 w-2 rounded-full ${error ? "bg-rose-500" : "bg-emerald-500"}`}/>
					<span className="text-sm font-medium uppercase tracking-wide">
						{error ? "Error" : "Online"}
					</span>
					{lastFetched && (
						<span className="text-xs text-muted-foreground">
							updated {lastFetched.toLocaleTimeString("en-GB", {hour12: false})}
						</span>
					)}
				</div>
				<button
					onClick={load}
					disabled={loading}
					className="inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-50"
				>
					<RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}/>
					refresh
				</button>
			</div>

			{error && (
				<div className="rounded-md border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
					Failed to load stats: {error}
				</div>
			)}

			{!stats ? (
				<div className="rounded-md border bg-zinc-950 px-3 py-6 text-center text-sm text-zinc-500">
					{loading ? "Loading…" : "No data."}
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					<Section title="Application" accent="bg-cyan-400">
						<Row label="Version" value={stats.app.version}/>
						<Row label="Environment" value={stats.app.env}/>
						<Row label="Node" value={stats.app.node}/>
						<Row label="Platform" value={stats.app.platform}/>
						<Row label="PID" value={stats.process.pid}/>
					</Section>

					<Section title="Process" accent="bg-emerald-400">
						<Row label="Uptime" value={fmtUptime(stats.process.uptimeSeconds)}/>
						<Row
							label="Heap Used"
							value={
								<span>
									{fmtBytes(stats.process.heapUsedBytes)}{" "}
									<span className="text-zinc-500">
										/ {fmtBytes(stats.process.heapTotalBytes)} ({heapPct.toFixed(0)}%)
									</span>
								</span>
							}
						/>
						<Row label="RSS" value={fmtBytes(stats.process.rssBytes)}/>
						<Row label="External" value={fmtBytes(stats.process.externalBytes)}/>
					</Section>

					<Section title="Database" accent="bg-violet-400">
						<Row
							label="Ping"
							value={`${stats.database.pingMs}ms`}
							tone={pingTone(stats.database.pingMs)}
						/>
						<Row label="Total Size" value={stats.database.sizePretty}/>
						<Row
							label={`${stats.database.schema} Schema`}
							value={fmtBytes(stats.database.schemaBytes)}
						/>
						<Row label="Tables" value={fmtBytes(stats.database.tableBytes)}/>
						<Row label="Indexes" value={fmtBytes(stats.database.indexBytes)}/>
						<Row label="Booking Logs" value={stats.database.bookingLogs.toLocaleString()}/>
					</Section>

					<Section title="Host" accent="bg-amber-300">
						<Row label="Hostname" value={<span className="break-all">{stats.host.hostname}</span>}/>
						<Row
							label="Container"
							value={stats.host.containerId ? (
								<span className="font-mono">{stats.host.containerId}</span>
							) : (
								<span className="text-zinc-500">—</span>
							)}
						/>
						<Row label="OS" value={stats.host.os}/>
						<Row label="Arch" value={stats.host.arch}/>
						<Row label="Sys Uptime" value={fmtUptime(stats.host.systemUptimeSeconds)}/>
						<Row
							label="Load Avg"
							value={
								<span className="tabular-nums">
									{stats.host.loadAvg1.toFixed(2)}{" "}
									<span className="text-zinc-500">
										{stats.host.loadAvg5.toFixed(2)} {stats.host.loadAvg15.toFixed(2)}
									</span>
								</span>
							}
						/>
					</Section>

					<Section title="Runtime" accent="bg-lime-400">
						<Row label="Next.js" value={stats.runtime.next ?? "—"}/>
						<Row label="React" value={stats.runtime.react ?? "—"}/>
						<Row label="Prisma" value={stats.runtime.prisma ?? "—"}/>
						<Row label="Better-Auth" value={stats.runtime.betterAuth ?? "—"}/>
						<Row label="Supabase JS" value={stats.runtime.supabase ?? "—"}/>
						<Row label="V8" value={stats.runtime.v8}/>
						<Row
							label="OpenSSL / ICU"
							value={
								<span className="tabular-nums">
									{stats.runtime.openssl}{" "}
									<span className="text-zinc-500">/ {stats.runtime.icu}</span>
								</span>
							}
						/>
					</Section>

					<Section title="CPU" accent="bg-orange-400">
						<Row label="Cores" value={stats.cpu.count}/>
						<Row label="Model" value={<span className="text-right">{stats.cpu.model}</span>}/>
						{stats.cpu.speedMhz > 0 && (
							<Row label="Clock" value={`${(stats.cpu.speedMhz / 1000).toFixed(2)} GHz`}/>
						)}
						<Row
							label="Process CPU"
							value={
								<span className="tabular-nums">
									{(stats.process.cpuPercentOfCore * 100).toFixed(1)}%{" "}
									<span className="text-zinc-500">of core</span>
								</span>
							}
						/>
						<Row
							label="Host CPU"
							value={
								<span className="tabular-nums">
									{(stats.process.cpuPercentOfHost * 100).toFixed(2)}%{" "}
									<span className="text-zinc-500">total</span>
								</span>
							}
						/>
					</Section>

					<div className="md:col-span-2 xl:col-span-3">
						<Section title="Memory" accent="bg-rose-400">
							<div className="grid gap-x-6 gap-y-4 px-3 py-3 md:grid-cols-3">
								<MemoryGauge
									label="System"
									used={stats.memory.usedBytes}
									total={stats.memory.totalBytes}
									leftLabel="used"
									rightLabel="total"
								/>
								{stats.container.limitBytes === null &&
								stats.container.usageBytes === null ? (
									<div className="flex flex-col justify-center">
										<div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
											Container
										</div>
										<div className="mt-1 text-xs text-zinc-500">
											No cgroup limits — host or unlimited container.
										</div>
									</div>
								) : stats.container.limitBytes !== null &&
								  stats.container.usageBytes !== null ? (
									<MemoryGauge
										label="Container"
										used={stats.container.usageBytes}
										total={stats.container.limitBytes}
										leftLabel="used"
										rightLabel="limit"
									/>
								) : (
									<div className="flex flex-col justify-center">
										<div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
											Container
										</div>
										<div className="mt-1 text-xs text-zinc-500">
											{stats.container.usageBytes !== null
												? `Usage ${fmtBytes(stats.container.usageBytes)} (no limit)`
												: "Limit set, usage unavailable"}
										</div>
									</div>
								)}
								<MemoryGauge
									label="Heap"
									used={stats.process.heapUsedBytes}
									total={stats.process.heapTotalBytes}
									leftLabel="used"
									rightLabel="total"
								/>
							</div>
							<div className="grid grid-cols-2 gap-x-6 border-t border-zinc-800 px-3 py-2 text-[11px] text-zinc-500 md:grid-cols-4">
								<div>
									<span className="text-zinc-600">RSS</span>{" "}
									<span className="text-zinc-300 tabular-nums">{fmtBytes(stats.process.rssBytes)}</span>
								</div>
								<div>
									<span className="text-zinc-600">External</span>{" "}
									<span className="text-zinc-300 tabular-nums">{fmtBytes(stats.process.externalBytes)}</span>
								</div>
								<div>
									<span className="text-zinc-600">Sys Free</span>{" "}
									<span className="text-zinc-300 tabular-nums">{fmtBytes(stats.memory.freeBytes)}</span>
								</div>
								<div>
									<span className="text-zinc-600">Sys Total</span>{" "}
									<span className="text-zinc-300 tabular-nums">{fmtBytes(stats.memory.totalBytes)}</span>
								</div>
							</div>
						</Section>
					</div>

					<div className="md:col-span-2 xl:col-span-3">
						<TableBreakdown
							tables={stats.database.tables}
							schemaBytes={stats.database.schemaBytes}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
