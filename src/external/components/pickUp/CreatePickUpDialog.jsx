import { useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { locationService } from "../../../service/locationService";
import { sportService } from "../../../service/sportService";
import { pickUpService } from "../../../service/pickUpService";
import { describeRequestError, requestErrorDetail } from "../../../utils/requestError";
import Calendar from "../../../components/dayPicker/dayPick";

const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
const pad = (value) => String(value).padStart(2, "0");
const formatLocalDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const twoHoursAfter = (startValue) => {
    const timeOnly = /^T([01]\d|2[0-3]):([0-5]\d)$/.exec(startValue);
    if (timeOnly) {
        const minutes = (Number(timeOnly[1]) * 60 + Number(timeOnly[2]) + 120) % (24 * 60);
        return `T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
    }
    const start = new Date(startValue);
    if (!Number.isFinite(start.getTime())) return "";
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return `${formatLocalDate(end)}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
};
const selectedDate = (value) => {
    const date = value.split("T")[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
};

function DateTimeField({ name, label, value, onPartChange }) {
    const [, time = ""] = value.split("T");
    return <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0">
            <label htmlFor={`${name}-date`} className="block text-sm font-medium text-slate-700">{label}日期</label>
            <div className="mt-1">
                <Calendar buttonId={`${name}-date`} align="end" selectedDate={selectedDate(value)}
                    placeholder="選擇日期" onDayPicked={({ date: picked }) => onPartChange(name, "date", formatLocalDate(picked))} />
            </div>
        </div>
        <label className="block min-w-0 text-sm font-medium text-slate-700">{label}時間
            <input type="time" value={time} onChange={(event) => onPartChange(name, "time", event.target.value)} required className={inputClass} />
        </label>
    </div>;
}

export function buildCreatePayload(form, sportId, levels) {
    const start = new Date(form.start_time);
    const end = new Date(form.end_time);
    const deadline = new Date(form.registration_deadline);
    if (!form.title.trim() || !form.location_id) throw new Error("請填寫團名並選擇場地。");
    if (![start, end, deadline].every((date) => Number.isFinite(date.getTime()))) throw new Error("請填寫完整的日期與時間。");
    if (deadline.getTime() <= Date.now()) throw new Error("報名截止時間必須晚於現在。");
    if (deadline > start) throw new Error("報名截止時間不能晚於開始時間。");
    if (end <= start) throw new Error("結束時間必須晚於開始時間。");
    if (form.fee === "" || !Number.isFinite(Number(form.fee)) || Number(form.fee) < 0) throw new Error("費用必須為 0 或正數。");
    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1) throw new Error("人數上限必須為正整數。");
    const min = Number(form.min_skill_level);
    const max = form.max_skill_level === "" ? null : Number(form.max_skill_level);
    if (!levels.some((item) => item.level === min) || (max !== null && !levels.some((item) => item.level === max))) throw new Error("請選擇有效的程度。");
    if (max !== null && max < min) throw new Error("程度上限不能小於下限。");
    if (form.description.trim().length > 100 || form.social.trim().length > 500) throw new Error("簡介或聯絡資訊超過字數限制。");
    return {
        title: form.title.trim(), description: form.description.trim(), social: form.social.trim(),
        sport_id: sportId, location_id: form.location_id,
        start_time: start.toISOString(), end_time: end.toISOString(), registration_deadline: deadline.toISOString(),
        fee: Number(form.fee), capacity: Number(form.capacity),
        min_skill_level: min, max_skill_level: max, enable: true,
    };
}

export default function CreatePickUpDialog({ sportId, levels, levelsLoading, levelsError, onRetryLevels, onClose, onCreated }) {
    const [form, setForm] = useState({
        title: "", description: "", social: "", location_id: "", start_time: "", end_time: "",
        registration_deadline: "T11:59", fee: "0", capacity: "", min_skill_level: "", max_skill_level: "",
    });
    const [locations, setLocations] = useState([]);
    const [sportName, setSportName] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [retry, setRetry] = useState(0);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const inFlight = useRef(false);
    const endEdited = useRef({ date: false, time: false });
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError("");
        Promise.all([locationService.getCreationLocations(), sportService.getSportById(sportId)])
            .then(([items, sport]) => {
                if (!cancelled) { setLocations(items); setSportName(sport.name); }
            })
            .catch((failure) => { if (!cancelled) setLoadError(describeRequestError(failure).message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [sportId, retry]);
    useEffect(() => {
        if (levels.length) setForm((previous) => previous.min_skill_level === ""
            ? { ...previous, min_skill_level: String(levels[0].level) } : previous);
    }, [levels]);
    const update = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
        setError("");
    };
    const updateDateTime = (name, part, value) => {
        if (name === "end_time") endEdited.current[part] = true;
        setForm((previous) => {
            const [oldDate = "", oldTime = ""] = previous[name].split("T");
            const date = part === "date" ? value : oldDate;
            const time = part === "time" ? value : oldTime;
            const nextValue = `${date}T${time}`;
            const next = { ...previous, [name]: nextValue };
            if (name === "start_time") {
                const [autoDate = "", autoTime = ""] = twoHoursAfter(nextValue).split("T");
                const [endDate = "", endTime = ""] = previous.end_time.split("T");
                next.end_time = `${endEdited.current.date ? endDate : autoDate}T${endEdited.current.time ? endTime : autoTime}`;
            }
            return next;
        });
        setError("");
    };
    const submit = async (event) => {
        event.preventDefault();
        if (inFlight.current || loading || levelsLoading || loadError || levelsError) return;
        let payload;
        try {
            payload = buildCreatePayload(form, sportId, levels);
            if (!locations.some((item) => item.id === payload.location_id)) throw new Error("請重新選擇有效的場地。");
        } catch (failure) { setError(failure.message); return; }
        inFlight.current = true;
        setSaving(true);
        setError("");
        let result;
        try { result = await pickUpService.createPickUpGroup(payload); }
        catch (failure) {
            setError(describeRequestError(failure).message + (requestErrorDetail(failure) ? ` ${requestErrorDetail(failure)}` : ""));
            return;
        } finally { inFlight.current = false; setSaving(false); }
        onCreated(result);
    };
    const field = (name, label, type = "text", extra = {}) => <label className="block text-sm font-medium text-slate-700">
        {label}<input name={name} type={type} value={form[name]} onChange={update} className={inputClass} required {...extra} />
    </label>;
    return <Dialog open onClose={() => { if (!inFlight.current) onClose(); }} className="relative z-[120]">
        <div className="fixed inset-0 bg-slate-950/55" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center">
                <DialogPanel className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div><DialogTitle className="text-xl font-bold text-slate-900">建立臨打團</DialogTitle>
                            <p className="mt-1 text-sm text-slate-500">球類：{sportName || "載入中…"}</p></div>
                        <button type="button" aria-label="關閉建立表單" disabled={saving} onClick={onClose} className="rounded-lg px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100 disabled:opacity-50">×</button>
                    </div>
                    {(loading || levelsLoading) && <p role="status" className="mb-4 text-sm text-slate-500">載入場地與程度資料中…</p>}
                    {(loadError || levelsError) && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                        {loadError || levelsError}
                        <button type="button" onClick={() => { setRetry((value) => value + 1); onRetryLevels(); }} className="ml-3 underline">重新載入</button>
                    </div>}
                    {!loading && !loadError && !locations.length && <p role="status" className="mb-4 text-sm text-amber-700">目前沒有可選擇的開放場地。</p>}
                    {!levelsLoading && !levelsError && !levels.length && <p role="status" className="mb-4 text-sm text-amber-700">目前球類尚未設定程度，暫時無法開團。</p>}
                    <form onSubmit={submit}>
                        <fieldset disabled={saving} className="space-y-4">
                            {field("title", "團名")}
                            <label className="block text-sm font-medium text-slate-700">場地
                                <select name="location_id" value={form.location_id} onChange={update} required disabled={loading} className={inputClass}>
                                    <option value="">請選擇場地</option>
                                    {locations.map((item) => <option key={item.id} value={item.id}>{item.name}{item.address ? ` · ${item.address}` : ""}</option>)}
                                </select>
                            </label>
                            <div className="space-y-4 rounded-xl bg-slate-50 p-3">
                                <DateTimeField name="start_time" label="開始" value={form.start_time} onPartChange={updateDateTime} />
                                <DateTimeField name="end_time" label="結束" value={form.end_time} onPartChange={updateDateTime} />
                            </div>
                            <DateTimeField name="registration_deadline" label="報名截止" value={form.registration_deadline} onPartChange={updateDateTime} />
                            <div className="grid grid-cols-2 gap-4">
                                {field("fee", "每人費用（元）", "number", { min: 0, step: "any" })}
                                {field("capacity", "人數上限", "number", { min: 1, step: 1 })}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {["min_skill_level", "max_skill_level"].map((name, index) => <label key={name} className="block text-sm font-medium text-slate-700">
                                    {index === 0 ? "程度下限" : "程度上限"}
                                    <select name={name} value={form[name]} onChange={update} required={index === 0} disabled={levelsLoading} className={inputClass}>
                                        <option value="">{index === 0 ? "請選擇程度" : "不設上限"}</option>
                                        {levels.map((item) => <option key={item.level} value={item.level}>{item.label}</option>)}
                                    </select>
                                </label>)}
                            </div>
                            <label className="block text-sm font-medium text-slate-700">簡介（選填，最多 100 字）
                                <textarea name="description" value={form.description} onChange={update} maxLength={100} rows={3} className={inputClass} placeholder="活動說明、場地面數或注意事項" />
                            </label>
                            <label className="block text-sm font-medium text-slate-700">聯絡資訊（選填，最多 500 字）
                                <textarea name="social" value={form.social} onChange={update} maxLength={500} rows={2} className={inputClass} placeholder="例如 LINE ID 或聯絡方式；請填寫願意提供給參加者的資訊" />
                            </label>
                        </fieldset>
                        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50">取消</button>
                            <button type="submit" disabled={saving || loading || levelsLoading || !!loadError || !!levelsError || !locations.length || !levels.length} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "建立中…" : "建立臨打團"}</button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </div>
    </Dialog>;
}
