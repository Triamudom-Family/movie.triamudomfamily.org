"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {cn} from "@/lib/utils";

type FieldProps = {
	id: string;
	label: string;
	hint?: string;
	hintMono?: boolean;
	mono?: boolean;
	error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

function Field({id, label, hint, hintMono = true, mono, error, className, ...rest}: FieldProps) {
	return (
		<div>
			<div className="mb-1.5 flex items-baseline justify-between gap-2">
				<label htmlFor={id} className="text-[12px] font-medium text-white/75">
					{label}
				</label>
				{hint && (
					<span
						className={cn(
							"text-[11px] tracking-[0.05em] text-white/40",
							hintMono && "font-mono",
						)}
					>
						{hint}
					</span>
				)}
			</div>
			<input
				id={id}
				className={cn(
					"w-full rounded-[9px] border border-white/10 bg-[#0a0a12] px-3.5 py-2.5 text-[14px] text-white outline-none transition-colors",
					"placeholder:text-white/[0.22]",
					"focus:border-pink-500/70 focus:bg-[#0d0d16]",
					"focus-visible:ring-2 focus-visible:ring-pink-500/30",
					"disabled:cursor-not-allowed disabled:text-white/50",
					mono && "font-mono tracking-[0.05em]",
					error && "border-red-400/60 focus:border-red-400/70",
					className,
				)}
				{...rest}
			/>
			{error && (
				<p className="mt-1 font-mono text-[11px] text-red-400/90">{error}</p>
			)}
		</div>
	);
}

export function RegisterForm({email}: {email: string}) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const studentId = email.split("@")[0].slice(2);
	const [form, setForm] = useState({
		name: "",
		surname: "",
		class: "",
		rollNumber: "",
		studentId,
	});

	function update<K extends keyof typeof form>(key: K, value: string) {
		setForm((prev) => ({...prev, [key]: value}));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!/^\d{3}$/.test(form.class)) {
			toast.error("ห้อง เช่น 067 หรือ 946");
			return;
		}
		start(async () => {
			try {
				const res = await fetch("/api/students/register", {
					method: "POST",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify({
						name: form.name,
						surname: form.surname,
						class: form.class,
						rollNumber: Number(form.rollNumber),
						studentId: form.studentId,
					}),
				});
				const data = await res.json();
				if (!res.ok) {
					toast.error(data.error ?? "การลงทะเบียนล้มเหลว");
					return;
				}
				toast.success("ลงทะเบียนสำเร็จ!");
				router.push("/register/how-to");
			} catch {
				toast.error("เกิดข้อผิดพลาดเครือข่าย กรุณาลองใหม่อีกครั้ง");
			}
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col">
			<fieldset disabled={pending} className="contents">
				<div className="mb-3.5 grid grid-cols-2 gap-3">
					<Field
						id="name"
						label="ชื่อ"
						required
						value={form.name}
						onChange={(e) => update("name", e.target.value)}
					/>
					<Field
						id="surname"
						label="นามสกุล"
						required
						value={form.surname}
						onChange={(e) => update("surname", e.target.value)}
					/>
				</div>

				<div className="mb-3.5 grid grid-cols-[2fr_1fr] gap-3">
					<Field
						id="class"
						label="ห้อง"
						hint="เช่น 067 หรือ 946"
						hintMono={false}
						mono
						placeholder="070"
						required
						type="tel"
						inputMode="numeric"
						pattern="[0-9]*"
						maxLength={3}
						value={form.class}
						onChange={(e) =>
							update("class", e.target.value.replace(/\D/g, "").slice(0, 3))
						}
					/>
					<Field
						id="rollNumber"
						label="เลขที่"
						mono
						placeholder="12"
						required
						type="tel"
						inputMode="numeric"
						pattern="[0-9]*"
						value={form.rollNumber}
						onChange={(e) =>
							update("rollNumber", e.target.value.replace(/\D/g, ""))
						}
					/>
				</div>

				<div className="mb-2">
					<Field
						id="studentId"
						label="รหัสนักเรียน"
						hint="ยืนยันจากอีเมล"
						hintMono={false}
						mono
						required
						value={form.studentId}
						disabled
					/>
				</div>

				<button
					type="submit"
					className="mt-2 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-pink-500 px-6 py-3.5 text-[14px] font-medium text-white transition-all hover:bg-pink-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
					style={{
						boxShadow:
							"0 0 36px rgba(236,72,153,0.4), 0 6px 20px -5px rgba(236,72,153,0.5)",
					}}
				>
					{pending ? (
						<>
							<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
							</svg>
							<span>กำลังลงทะเบียน...</span>
						</>
					) : (
						<>
							<span>ยืนยันการลงทะเบียน</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<line x1="5" y1="12" x2="19" y2="12"/>
								<polyline points="12 5 19 12 12 19"/>
							</svg>
						</>
					)}
				</button>
			</fieldset>
		</form>
	);
}
