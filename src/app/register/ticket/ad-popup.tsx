"use client";

import {useEffect, useState} from "react";
import Image from "next/image";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";

// const AD_LINK = "https://majorcineplex.app.link/Branch-QRCode-Siam-Paragon";
const AD_LINK = "https://majorcineplex.app.link/Gn94RJpyl3b";
const AD_HEADLINE = "ดาวน์โหลด Major App";

export function AdPopup() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		setOpen(true);
	}, []);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-[360px] overflow-hidden gap-0 rounded-3xl border border-white/10 bg-neutral-950 p-0 text-white shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8)] sm:rounded-3xl print:hidden">
				<div className="border-b border-white/10 bg-white/[0.03] px-5 py-3.5">
					<DialogTitle className="text-center text-[15px] font-semibold tracking-wide text-white">
						{AD_HEADLINE}
					</DialogTitle>
				</div>
				<div className="px-4 pt-4">
					<div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
						<Image
							src="/MajorApp.webp"
							alt="Major Cineplex App"
							width={640}
							height={640}
							className="h-auto w-full"
							priority
						/>
					</div>
				</div>
				<div className="p-4">
					<a
						href={AD_LINK}
						target="_blank"
						rel="noopener noreferrer"
						className="flex w-full items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-[15px] font-semibold tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
					>
						ดาวน์โหลดเลย
					</a>
				</div>
			</DialogContent>
		</Dialog>
	);
}
