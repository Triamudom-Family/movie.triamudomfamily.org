"use client";

import {useEffect, useState} from "react";
import Image from "next/image";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";

const AD_LINK = "https://majorcineplex.app.link/Branch-QRCode-Siam-Paragon";
const AD_HEADLINE = "ดาวน์โหลด Major App";

export function AdPopup() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		setOpen(true);
	}, []);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-[360px] gap-3 border-white/10 bg-[#0f0a18] p-4 text-white print:hidden">
				<div className="overflow-hidden rounded-lg">
					<Image
						src="/MajorApp.webp"
						alt="Major Cineplex App"
						width={640}
						height={640}
						className="h-auto w-full"
						priority
					/>
				</div>
				<DialogTitle asChild>
					<a
						href={AD_LINK}
						target="_blank"
						rel="noopener noreferrer"
						className="block text-center text-[16px] font-semibold text-white underline-offset-4 hover:underline focus-visible:underline"
					>
						{AD_HEADLINE}
					</a>
				</DialogTitle>
			</DialogContent>
		</Dialog>
	);
}
