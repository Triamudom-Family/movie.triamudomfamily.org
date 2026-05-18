"use client";

import {useRef, useEffect} from "react";

/**
 * Adapted from React Bits (https://reactbits.dev/backgrounds/noise).
 * Difference from upstream: the canvas sizes to its parent (100% / 100%)
 * instead of 100vw / 100vh so it can be scoped to a section of the page.
 */
type NoiseProps = {
	patternSize?: number;
	patternScaleX?: number;
	patternScaleY?: number;
	patternRefreshInterval?: number;
	patternAlpha?: number;
	className?: string;
};

export default function Noise({
	patternRefreshInterval = 2,
	patternAlpha = 15,
	className,
}: NoiseProps) {
	const grainRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = grainRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", {alpha: true});
		if (!ctx) return;

		let frame = 0;
		let animationId = 0;
		const canvasSize = 1024;

		const resize = () => {
			canvas.width = canvasSize;
			canvas.height = canvasSize;
		};

		const drawGrain = () => {
			const imageData = ctx.createImageData(canvasSize, canvasSize);
			const data = imageData.data;
			for (let i = 0; i < data.length; i += 4) {
				const value = Math.random() * 255;
				data[i] = value;
				data[i + 1] = value;
				data[i + 2] = value;
				data[i + 3] = patternAlpha;
			}
			ctx.putImageData(imageData, 0, 0);
		};

		const loop = () => {
			if (frame % patternRefreshInterval === 0) drawGrain();
			frame++;
			animationId = window.requestAnimationFrame(loop);
		};

		resize();
		loop();

		return () => {
			window.cancelAnimationFrame(animationId);
		};
	}, [patternRefreshInterval, patternAlpha]);

	return (
		<canvas
			ref={grainRef}
			aria-hidden="true"
			className={className}
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
				imageRendering: "pixelated",
			}}
		/>
	);
}
