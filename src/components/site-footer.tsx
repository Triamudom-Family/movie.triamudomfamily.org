export function SiteFooter() {
	return (
		<footer className="relative z-20 border-t border-white/5 px-8 py-4 text-center text-xs">
			<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
				<a
					href="https://github.com/Triamudom-Family/movie.triamudomfamily.org"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 font-medium text-zinc-500 transition-colors hover:text-zinc-200"
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="https://cdn.simpleicons.org/github/71717a" alt="GitHub" className="h-3.5 w-3.5"/>
					Github
				</a>
				<span className="text-zinc-700">·</span>
				<a
					href="https://github.com/Triamudom-Family/movie.triamudomfamily.org?tab=AGPL-3.0-1-ov-file"
					target="_blank"
					rel="noopener noreferrer"
					className="text-zinc-500 transition-colors hover:text-pink-400"
				>
					AGPL-3.0
				</a>
				<span className="text-zinc-700">·</span>
				<span className="text-zinc-500">Movie Registration v1.2.3</span>
			</div>
		</footer>
	);
}
