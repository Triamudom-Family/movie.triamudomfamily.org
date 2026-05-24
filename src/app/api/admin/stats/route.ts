import {NextResponse} from "next/server";
import os from "node:os";
import fs from "node:fs/promises";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";
import pkg from "../../../../../package.json";

export const dynamic = "force-dynamic";

type DbSizeRow = {size_bytes: bigint; size_pretty: string};

type TableSizeRow = {
	table_name: string;
	total_bytes: bigint;
	table_bytes: bigint;
	index_bytes: bigint;
	total_pretty: string;
	row_estimate: bigint;
};

async function readNumberFile(path: string): Promise<number | null> {
	try {
		const raw = (await fs.readFile(path, "utf8")).trim();
		if (!raw || raw === "max") return null;
		const n = Number(raw);
		return Number.isFinite(n) ? n : null;
	} catch {
		return null;
	}
}

async function readContainerId(): Promise<string | null> {
	for (const path of ["/proc/self/cgroup", "/proc/1/cpuset"]) {
		try {
			const raw = await fs.readFile(path, "utf8");
			const match = raw.match(/[0-9a-f]{12,64}/i);
			if (match) return match[0].slice(0, 12);
		} catch {
			/* ignore */
		}
	}
	return null;
}

async function readCgroup() {
	const [v2Current, v2Max, v1Usage, v1Limit] = await Promise.all([
		readNumberFile("/sys/fs/cgroup/memory.current"),
		readNumberFile("/sys/fs/cgroup/memory.max"),
		readNumberFile("/sys/fs/cgroup/memory/memory.usage_in_bytes"),
		readNumberFile("/sys/fs/cgroup/memory/memory.limit_in_bytes"),
	]);
	const usage = v2Current ?? v1Usage ?? null;
	const limit = v2Max ?? v1Limit ?? null;
	// On hosts without container limits, the "limit" is a huge sentinel (~2^63). Treat as unset.
	const usableLimit = limit !== null && limit < Number.MAX_SAFE_INTEGER / 2 ? limit : null;
	return {usageBytes: usage, limitBytes: usableLimit};
}

async function sampleCpu(intervalMs = 100) {
	const start = process.cpuUsage();
	const startTime = process.hrtime.bigint();
	await new Promise((r) => setTimeout(r, intervalMs));
	const diff = process.cpuUsage(start);
	const elapsedNs = Number(process.hrtime.bigint() - startTime);
	const elapsedUs = elapsedNs / 1000;
	const cpuCount = os.cpus().length;
	const totalUs = diff.user + diff.system;
	return {
		userUs: diff.user,
		systemUs: diff.system,
		// fraction of one core (0..1+)
		percentOfCore: totalUs / elapsedUs,
		// fraction of all cores (0..1)
		percentOfHost: totalUs / (elapsedUs * cpuCount),
	};
}

export async function GET() {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) return NextResponse.json({error: "Unauthorized"}, {status: 401});

	const pingStart = Date.now();
	await prisma.$queryRaw`SELECT 1`;
	const dbPingMs = Date.now() - pingStart;

	const [dbSize, tableSizes, bookingLogs, cgroup, containerId, cpuSample] = await Promise.all([
		prisma.$queryRaw<DbSizeRow[]>`
			SELECT pg_database_size(current_database())::bigint AS size_bytes,
			       pg_size_pretty(pg_database_size(current_database())) AS size_pretty
		`,
		prisma.$queryRaw<TableSizeRow[]>`
			SELECT C.relname                          AS table_name,
			       pg_total_relation_size(C.oid)      AS total_bytes,
			       pg_relation_size(C.oid)            AS table_bytes,
			       pg_indexes_size(C.oid)             AS index_bytes,
			       pg_size_pretty(pg_total_relation_size(C.oid)) AS total_pretty,
			       C.reltuples::bigint                AS row_estimate
			FROM pg_class C
			LEFT JOIN pg_namespace N ON N.oid = C.relnamespace
			WHERE N.nspname = 'movie' AND C.relkind = 'r'
			ORDER BY pg_total_relation_size(C.oid) DESC
		`,
		prisma.bookingLog.count(),
		readCgroup(),
		readContainerId(),
		sampleCpu(),
	]);

	const mem = process.memoryUsage();
	const cpus = os.cpus();
	const totalMem = os.totalmem();
	const freeMem = os.freemem();
	const load = os.loadavg();

	const tables = tableSizes.map((t) => ({
		name: t.table_name,
		totalBytes: Number(t.total_bytes),
		tableBytes: Number(t.table_bytes),
		indexBytes: Number(t.index_bytes),
		totalPretty: t.total_pretty,
		rowEstimate: Number(t.row_estimate),
	}));
	const totalTableBytes = tables.reduce((s, t) => s + t.tableBytes, 0);
	const totalIndexBytes = tables.reduce((s, t) => s + t.indexBytes, 0);
	const totalRelationBytes = tables.reduce((s, t) => s + t.totalBytes, 0);

	return NextResponse.json({
		app: {
			version: pkg.version,
			node: process.version,
			platform: `${process.platform}/${process.arch}`,
			env: process.env.NODE_ENV ?? "unknown",
		},
		runtime: {
			next: pkg.dependencies?.next ?? null,
			react: pkg.dependencies?.react ?? null,
			prisma: pkg.dependencies?.["@prisma/client"] ?? pkg.dependencies?.prisma ?? null,
			betterAuth: pkg.dependencies?.["better-auth"] ?? null,
			supabase: pkg.dependencies?.["@supabase/supabase-js"] ?? null,
			v8: process.versions.v8,
			openssl: process.versions.openssl,
			icu: process.versions.icu,
			uv: process.versions.uv,
		},
		host: {
			hostname: os.hostname(),
			containerId,
			os: `${os.type()} ${os.release()}`,
			arch: os.arch(),
			systemUptimeSeconds: Math.floor(os.uptime()),
			loadAvg1: load[0],
			loadAvg5: load[1],
			loadAvg15: load[2],
		},
		process: {
			uptimeSeconds: Math.floor(process.uptime()),
			pid: process.pid,
			heapUsedBytes: mem.heapUsed,
			heapTotalBytes: mem.heapTotal,
			rssBytes: mem.rss,
			externalBytes: mem.external,
			cpuPercentOfCore: cpuSample.percentOfCore,
			cpuPercentOfHost: cpuSample.percentOfHost,
		},
		cpu: {
			count: cpus.length,
			model: cpus[0]?.model ?? "unknown",
			speedMhz: cpus[0]?.speed ?? 0,
		},
		memory: {
			totalBytes: totalMem,
			freeBytes: freeMem,
			usedBytes: totalMem - freeMem,
		},
		container: {
			limitBytes: cgroup.limitBytes,
			usageBytes: cgroup.usageBytes,
		},
		database: {
			pingMs: dbPingMs,
			sizeBytes: Number(dbSize[0]?.size_bytes ?? 0),
			sizePretty: dbSize[0]?.size_pretty ?? "unknown",
			schema: "movie",
			schemaBytes: totalRelationBytes,
			tableBytes: totalTableBytes,
			indexBytes: totalIndexBytes,
			bookingLogs,
			tables,
		},
		now: new Date().toISOString(),
	});
}
