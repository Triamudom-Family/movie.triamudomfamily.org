"use client";

import {Toaster as Sonner, type ToasterProps} from "sonner";

const Toaster = (props: ToasterProps) => (
	<Sonner
		theme="dark"
		position="top-center"
		style={{fontFamily: "var(--font-ibm-plex-sans-thai)"}}
		toastOptions={{
			style: {
				background: "var(--card)",
				color: "var(--foreground)",
				border: "1px solid var(--border)",
				fontFamily: "var(--font-ibm-plex-sans-thai)",
			},
		}}
		{...props}
	/>
);

export {Toaster};
