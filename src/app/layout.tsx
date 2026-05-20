import type {Metadata} from "next";
import {IBM_Plex_Sans_Thai as IBMPlexSansThai, JetBrains_Mono, Anuphan} from "next/font/google";
import "./globals.css";
import {Toaster} from "@/components/ui/sonner";

const ibmPlexSansThai = IBMPlexSansThai({
	variable: "--font-ibm-plex-sans-thai",
	subsets: ["thai", "latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700"]
})

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

const anuphan = Anuphan({
	variable: "--font-anuphan",
	subsets: ["thai", "latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: "Triamudom Family Movie Registration",
	description: "Registration for Triamudom Family Movie Registration.",
};

export default function RootLayout({
	                                   children,
                                   }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${ibmPlexSansThai.variable} ${jetbrainsMono.variable} ${anuphan.variable} h-full antialiased dark`}>
		<body className="min-h-full flex flex-col bg-background text-foreground font-sans">
		{children}
		<Toaster/>
		</body>
		</html>
	);
}
