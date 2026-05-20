const GRAIN =
	"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function AuthShell({children}: {children: React.ReactNode}) {
	return (
		<div className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#07060a] text-white [color-scheme:dark]">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-0"
				style={{
					background: [
						"radial-gradient(ellipse 900px 700px at 20% 15%, rgba(236,72,153,0.18), transparent 60%)",
						"radial-gradient(ellipse 700px 500px at 85% 5%, rgba(168,85,247,0.10), transparent 55%)",
					].join(", "),
				}}
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-0 opacity-[0.05] mix-blend-overlay"
				style={{backgroundImage: GRAIN, backgroundRepeat: "repeat"}}
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-0"
				style={{
					background:
						"radial-gradient(ellipse 80% 70% at 50% 40%, transparent, rgba(7,6,10,0.7) 100%)",
				}}
			/>
			<div className="relative z-10 flex flex-1 flex-col">{children}</div>
		</div>
	);
}
