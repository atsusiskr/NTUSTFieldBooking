import { useTranslation, translate } from "../../../locale/i18n";
import { useEffect, useState } from "react";
import { formatDateTime } from "../../../utils/dateTimeFormat";
import { getUserProfile } from "../../../service/userService";
import { functionIconMap } from "../../../constant/IconMap";

const emptyMember = () => ({ gender: "", skill_level: "" });
const GENDERS = [{ value: "male", label: "男性" }, { value: "female", label: "女性" }, { value: "other", label: "其他" }];

export default function JoinGroupDialog({ group, levels, levelsLoading, levelsError, onRetryLevels, joining, onClose, onConfirm }) {
  const t = useTranslation();
    const [mode, setMode] = useState("individual");
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileRetry, setProfileRetry] = useState(0);
    const [partySize, setPartySize] = useState(2);
    const [members, setMembers] = useState(() => [emptyMember(), emptyMember()]);
    const [formError, setFormError] = useState("");
    const remaining = Math.max(0, Number(group.capacity || 0) - Number(group.current_enrolled || 0));
    const canJoinAsGroup = remaining >= 2;
    const organizerName = typeof profile?.username === "string" ? profile.username.trim() : "";
    const profileGender = typeof profile?.gender === "string" ? profile.gender.trim().toLowerCase() : "";

    useEffect(() => {
        if (mode !== "group") return;
        let cancelled = false;
        setProfile(null);
        setProfileLoading(true);
        setProfileError("");
        getUserProfile().then((user) => {
            if (cancelled) return;
            if (!user?.username?.trim()) throw new Error(translate("帳號資料缺少 username"));
            setProfile(user);
        }).catch(() => {
            if (!cancelled) setProfileError(t("無法取得報名者帳號資料，請重新載入。"));
        }).finally(() => {
            if (!cancelled) setProfileLoading(false);
        });
        return () => { cancelled = true; };
    }, [mode, profileRetry, t]);

    const updatePartySize = (value) => {
        const size = Number(value);
        setPartySize(size);
        setMembers((previous) => Array.from({ length: Number.isInteger(size) && size > 0 ? Math.min(size, remaining) : 0 },
            (_, index) => previous[index] || emptyMember()));
        setFormError("");
    };
    const updateMember = (index, key, value) => {
        setMembers((previous) => previous.map((member, memberIndex) =>
            memberIndex === index ? { ...member, [key]: value } : member));
        setFormError("");
    };

    const submit = (event) => {
        event.preventDefault();
        if (mode === "individual") {
            onConfirm(group.id, null);
            return;
        }
        if (!canJoinAsGroup || !Number.isInteger(partySize) || partySize < 2 || partySize > remaining) {
            setFormError(t("團體報名需至少 2 人，且不能超過剩餘的 {value0} 個名額。", { value0: remaining }));
            return;
        }
        if (!organizerName || members.length !== partySize || members.some((member, index) => !(index === 0 ? profileGender || member.gender : member.gender))
            || members.slice(1).some((member) => member.skill_level === ""
                || !levels.some((level) => level.level === Number(member.skill_level)))) {
            setFormError(t("請確認帳號名稱、每位成員的性別，以及同行者的運動程度。"));
            return;
        }
        onConfirm(group.id, {
            organizer_name: organizerName,
            party_size: partySize,
            members: members.map((member, index) => index === 0
                ? { gender: profileGender || member.gender }
                : { gender: member.gender, skill_level: Number(member.skill_level) }),
        });
    };

    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6" onMouseDown={onClose}>
        <div role="dialog" aria-modal="true" aria-labelledby="join-group-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 id="join-group-title" className="text-xl font-bold text-slate-900">{t("確認報名")}</h2>
                    <p className="mt-1 font-semibold text-slate-800">{group.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{formatDateTime(group.start_time).date}　{formatDateTime(group.start_time).time}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={joining}
                    className="grid h-9 w-9 place-items-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                >
                    {functionIconMap.cancel.icon}
                </button>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-5">
                <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-slate-800">{t("報名方式")}</legend>
                    <div className="grid grid-cols-2 gap-2">
                        <label className={`cursor-pointer rounded-xl border p-3 text-sm ${mode === "individual" ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200"}`}>
                            <input type="radio" name="join-mode" checked={mode === "individual"} onChange={() => { setMode("individual"); setFormError(""); }} className="mr-2 accent-blue-600" />{t("個人報名")}
                        </label>
                        <label className={`rounded-xl border p-3 text-sm ${mode === "group" ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200"} ${canJoinAsGroup ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                            <input type="radio" name="join-mode" checked={mode === "group"} disabled={!canJoinAsGroup} onChange={() => { setMode("group"); setFormError(""); }} className="mr-2 accent-blue-600" />{t("團體報名")}
                        </label>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{t("剩餘")} {remaining} {t("個名額。團體報名會一次占用全部所選名額。")}</p>
                </fieldset>

                {mode === "group" && <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">{t("報名者帳號名稱")}
                        <input value={organizerName} readOnly className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2.5 font-normal text-slate-700" placeholder={profileLoading ? t("正在載入帳號資料…") : t("尚未取得帳號名稱")} />
                    </label>
                    {profileError && <p role="alert" className="text-sm text-red-700">{profileError}<button type="button" onClick={() => setProfileRetry((previous) => previous + 1)} className="font-semibold underline">{t("重新載入")}</button></p>}
                    <label className="block text-sm font-semibold text-slate-700">{t("報名人數（含本人）")}
                        <input type="number" min="2" max={remaining} value={partySize} onChange={(event) => updatePartySize(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500" />
                    </label>
                    <div className="space-y-3">
                        {members.map((member, index) => <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <h3 className="text-sm font-semibold text-slate-800">{index === 0 ? t("第 1 位：本人") : translate("第 {value0} 位：同行者", { value0: index + 1 })}</h3>
                            <div className={`mt-2 grid gap-3 ${index === 0 ? "" : "sm:grid-cols-2"}`}>
                                {index === 0 && profileGender
                                    ? <div className="text-xs font-semibold text-slate-600">{t("性別")}
                                        <p className="mt-1 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-normal text-slate-700">{t(GENDERS.find((gender) => gender.value === profileGender)?.label || profileGender)}{t("（帳號資料）")}</p>
                                    </div>
                                    : <label className="text-xs font-semibold text-slate-600">{t("性別")}
                                        <select value={member.gender} onChange={(event) => updateMember(index, "gender", event.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
                                            <option value="">{t("請選擇")}</option>
                                            {GENDERS.map((gender) => <option key={gender.value} value={gender.value}>{t(gender.label)}</option>)}
                                        </select>
                                    </label>}
                                {index > 0 && <label className="text-xs font-semibold text-slate-600">{t("運動程度")}
                                    <select value={member.skill_level} onChange={(event) => updateMember(index, "skill_level", event.target.value)} required disabled={levelsLoading || Boolean(levelsError) || !levels.length} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal disabled:bg-slate-100">
                                        <option value="">{t("請選擇")}</option>
                                        {levels.map((level) => <option key={level.level} value={level.level}>{level.label}</option>)}
                                    </select>
                                </label>}
                            </div>
                            {index === 0 && <p className="mt-2 text-xs text-slate-500">{t("本人的運動程度由帳號設定帶入。")}</p>}
                        </div>)}
                    </div>
                    {(levelsLoading || levelsError || !levels.length) && <p role="status" className="text-sm text-amber-700">{levelsLoading ? t("正在載入運動程度…") : levelsError || t("目前沒有可選的運動程度。")} <button type="button" onClick={onRetryLevels} className="font-semibold underline">{t("重新載入")}</button></p>}
                </div>}

                <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
                    <p>{t("預計費用：NT$")} {(Number(group.fee || 0) * (mode === "group" ? partySize || 0 : 1)).toLocaleString("zh-TW")}</p>
                    {mode === "group" && <p className="mt-1 text-xs">{t("此金額僅供參考，實際付款方式依主揪安排。")}</p>}
                </div>
                {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={joining} className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 disabled:opacity-50">{t("取消")}</button>
                    <button type="submit" disabled={joining || (mode === "group" && (profileLoading || Boolean(profileError) || !organizerName || levelsLoading || Boolean(levelsError) || !levels.length))} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{joining ? t("送出中…") : t("確認報名")}</button>
                </div>
            </form>
        </div>
    </div>;
}
