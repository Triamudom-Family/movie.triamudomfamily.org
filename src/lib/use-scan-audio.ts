"use client";

import {useRef, useCallback} from "react";

type SoundType = "success" | "error" | "info";

export function useScanAudio() {
	const ctxRef = useRef<AudioContext | null>(null);

	function getCtx(): AudioContext {
		if (!ctxRef.current || ctxRef.current.state === "closed") {
			ctxRef.current = new AudioContext();
		}
		if (ctxRef.current.state === "suspended") {
			void ctxRef.current.resume();
		}
		return ctxRef.current;
	}

	return useCallback((type: SoundType) => {
		try {
			const ctx = getCtx();
			const t = ctx.currentTime;
			if (type === "success") {
				tone(ctx, 880,  "sine",     0.30, t,        0.08);
				tone(ctx, 1100, "sine",     0.30, t + 0.09, 0.10);
			} else if (type === "error") {
				tone(ctx, 180,  "sawtooth", 0.35, t,        0.22);
			} else {
				tone(ctx, 660,  "sine",     0.25, t,        0.10);
			}
		} catch {
			// AudioContext unavailable (SSR, locked-down browser, etc.)
		}
	}, []);
}

function tone(
	ctx: AudioContext,
	freq: number,
	shape: OscillatorType,
	peak: number,
	start: number,
	duration: number,
) {
	const osc  = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.type = shape;
	osc.frequency.setValueAtTime(freq, start);

	gain.gain.setValueAtTime(0, start);
	gain.gain.linearRampToValueAtTime(peak, start + 0.010);
	gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

	osc.start(start);
	osc.stop(start + duration + 0.015);
}
