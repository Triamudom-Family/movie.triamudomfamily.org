import Noise from "./Noise";

const washStyle = {
	background:
		"radial-gradient(ellipse 800px 600px at 20% 15%, rgba(240,53,127,0.10), transparent 60%)," +
		"radial-gradient(ellipse 700px 500px at 85% 90%, rgba(120,40,150,0.10), transparent 60%)",
};

export function AuthShell({children}: {children: React.ReactNode}) {
	return (
		<div
			className="relative flex min-h-svh flex-col overflow-hidden bg-[#08080d] text-white [color-scheme:dark] isolate"
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-0"
				style={washStyle}
			/>
			<Noise
				patternRefreshInterval={100}
				patternAlpha={15}
				className="z-[1] mix-blend-overlay opacity-50"
			/>
			<div className="relative z-[2] flex flex-1 flex-col">{children}</div>
		</div>
	);
}
