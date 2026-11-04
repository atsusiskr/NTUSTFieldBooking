import { useTranslation, translate } from "../../locale/i18n";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import Navbar from "../components/navbar";
import { Award, CalendarDays, Mail, Phone, UserRound, UsersRound } from "lucide-react";
import { getUserProfile, setInitialPassword, unlinkLineIdentity, updateUserProfile } from "../../service/userService";
import SetPasswordForm from "../components/SetPasswordForm";
import { InfoIconMap } from "../../constant/IconMap";
import Loading from "../../components/loading";
import { errorPopup, successPopup } from "../../components/pop-up";
import { isValidBirthDate, isValidPhoneNumber, normalizePhoneNumber } from "../../utils/validator";
import Calendar from "../../components/dayPicker/dayPick";
import { skillLevelService } from "../../service/skillLevelService";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { useSportStore } from "../../store/sportStore";
import { describeRequestError } from "../../utils/requestError";

const isMissingSkillLevelError = (error) => error?.response?.status === 400
    && /^skill level not set for this sport\b/i.test(String(error?.response?.data?.error || ""));

const readSkillLevel = (data) => {
    const value = data?.skill_level?.level ?? data?.skill_level ?? data?.level;
    if (value === null || value === undefined || value === "") return null;
    const level = Number(value);
    if (!Number.isInteger(level)) throw new Error(translate("個人程度回應格式不正確"));
    return level;
};

const createEditableProfile = (user) => ({
    display_name: user.display_name || "",
    phone: user.phone || "",
    gender: user.gender || "",
    birth_date: user.birth_date?.slice(0, 10) || "",
});

const parseBirthDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
};

const formatBirthDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const calculateAge = (birthDate) => {
    if (!birthDate) return undefined;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const hasNotHadBirthday = today.getMonth() < birth.getMonth()
        || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    return hasNotHadBirthday ? age - 1 : age;
};

function SetPasswordDialog({ existingEmail, onSubmit, onCancel }) {
    const t = useTranslation();
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        dialog.showModal();
        return () => { if (dialog.open) dialog.close(); };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            onCancel={(event) => { event.preventDefault(); onCancel(); }}
            aria-labelledby="set-password-title"
            className="line-password-dialog w-[calc(100%-2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-950/50"
        >
            <h2 id="set-password-title" className="text-xl font-bold text-slate-900">{t("先設定登入密碼")}</h2>
            <p className="mb-5 mt-2 text-sm text-slate-600">{t("LINE 是目前唯一的登入方式。設定信箱與密碼後，才可以解除綁定。")}</p>
            <SetPasswordForm
                existingEmail={existingEmail}
                onSubmit={onSubmit}
                onCancel={onCancel}
                submitLabel={t("設定密碼並解除 LINE 綁定")}
            />
        </dialog>
    );
}

export function UserPage() {
  const t = useTranslation();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUnlinkingLine, setIsUnlinkingLine] = useState(false);
    const [lineUnlinked, setLineUnlinked] = useState(false);
    const [passwordConfigured, setPasswordConfigured] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [myLevel, setMyLevel] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState("");
    const [levelOptions, setLevelOptions] = useState([]);
    const [levelStatus, setLevelStatus] = useState("loading");
    const [levelOptionsError, setLevelOptionsError] = useState(false);
    const [levelRetry, setLevelRetry] = useState(0);
    const [formData, setFormData] = useState({
        display_name: "",
        phone: "",
        gender: "",
        birth_date: "",
    });
    const sportId = useSportStore((state) => state.sportId);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const profile = await getUserProfile();
                setUser(profile);
                setFormData(createEditableProfile(profile));
            } catch (error) {
                console.error("取得個人資料失敗：", error);
                const failure = describeRequestError(error);
                errorPopup(failure.title, failure.message);
            }
        };

        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (!sportId) {
            setLevelStatus("no-sport");
            return;
        }

        let cancelled = false;
        setLevelStatus("loading");
        setLevelOptionsError(false);
        const optionsRequest = levelRetry > 0
            ? skillLevelService.refreshSkillLevels(sportId)
            : skillLevelService.getSkillLevels(sportId);

        Promise.allSettled([optionsRequest, skillLevelService.getMyLevel(sportId)])
            .then(([optionsResult, levelResult]) => {
                if (cancelled) return;
                if (optionsResult.status === "fulfilled") {
                    setLevelOptions(optionsResult.value);
                } else {
                    setLevelOptions([]);
                    setLevelOptionsError(true);
                }

                if (levelResult.status === "fulfilled") {
                    try {
                        const level = readSkillLevel(levelResult.value);
                        setMyLevel(level);
                        setSelectedLevel(level === null ? "" : String(level));
                        setLevelStatus(level === null ? "missing" : "ready");
                    } catch {
                        setLevelStatus("error");
                    }
                } else if (isMissingSkillLevelError(levelResult.reason)) {
                    setMyLevel(null);
                    setSelectedLevel("");
                    setLevelStatus("missing");
                } else {
                    setLevelStatus("error");
                }
            });

        return () => { cancelled = true; };
    }, [sportId, levelRetry]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleCancelEdit = () => {
        setFormData(createEditableProfile(user));
        setSelectedLevel(myLevel === null ? "" : String(myLevel));
        setIsEditing(false);
    };

    const performUnlinkLine = async (offerPasswordSetup) => {
        setIsUnlinkingLine(true);
        try {
            await unlinkLineIdentity();
            setLineUnlinked(true);
            successPopup(t("解除綁定成功"), t("LINE 帳號已與目前帳號解除綁定。"));
        } catch (error) {
            if (error?.response?.status === 409 && offerPasswordSetup) {
                setShowPasswordDialog(true);
                return;
            }
            if (error?.response?.status === 404) {
                setLineUnlinked(true);
            }
            const failure = describeRequestError(error, {
                404: { title: t("LINE 尚未綁定"), message: t("目前帳號沒有綁定 LINE，無需解除。") },
                409: { title: t("無法解除 LINE 綁定"), message: t("密碼已設定，但 LINE 仍無法解除。請重新整理後再試。") },
            });
            errorPopup(failure.title, failure.message);
        } finally {
            setIsUnlinkingLine(false);
        }
    };

    const handleUnlinkLine = async () => {
        if (isUnlinkingLine || lineUnlinked) return;
        const confirmation = await Swal.fire({
            icon: "warning",
            title: t("解除 LINE 綁定？"),
            text: t("解除後，這個 LINE 帳號將無法再登入目前帳號。請先確認已有其他登入方式。"),
            showCancelButton: true,
            confirmButtonText: t("確認解除綁定"),
            cancelButtonText: t("取消"),
            confirmButtonColor: "#dc2626",
            focusCancel: true,
        });
        if (confirmation.isConfirmed) await performUnlinkLine(true);
    };

    const handleSetPassword = async ({ email, password }) => {
        await setInitialPassword({ email, password });
        setPasswordConfigured(true);
        if (email) setUser((current) => ({ ...current, email }));
        setShowPasswordForm(false);
        if (showPasswordDialog) {
            setShowPasswordDialog(false);
            await performUnlinkLine(false);
        } else {
            successPopup(t("密碼設定成功"), t("現在可以使用信箱與密碼登入。"));
        }
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();

        if (!formData.display_name.trim() || !formData.gender) {
            errorPopup(t("資料不完整"), t("請填寫顯示名稱與性別。"));
            return;
        }
        if (formData.birth_date && !isValidBirthDate(formData.birth_date)) {
            errorPopup(t("出生日期錯誤"), t("請選擇有效且不晚於今天的出生日期。"));
            return;
        }
        if (!isValidPhoneNumber(formData.phone)) {
            errorPopup(t("電話格式錯誤"), t("請輸入有效的手機號碼"));
            return;
        }

        const savedProfile = createEditableProfile(user);
        const editableData = {
            display_name: formData.display_name.trim(),
            gender: formData.gender,
        };
        if (formData.birth_date) editableData.birth_date = formData.birth_date;
        const phone = normalizePhoneNumber(formData.phone);
        if (phone || savedProfile.phone) editableData.phone = phone;
        const profileChanged = Object.keys(editableData).some((key) => editableData[key] !== savedProfile[key]);
        const level = selectedLevel === "" ? null : Number(selectedLevel);
        const levelChanged = level !== null && level !== myLevel;
        if (levelChanged && (!sportId || !levelOptions.some((item) => item.level === level))) {
            errorPopup(t("程度選擇錯誤"), t("請先載入並選擇有效的程度。"));
            return;
        }

        let profileSaved = false;
        let savingLevel = false;
        try {
            setIsSaving(true);
            if (profileChanged) {
                const result = await updateUserProfile(editableData);
                const updatedUser = result?.user || {};
                setUser((current) => ({
                    ...current,
                    ...editableData,
                    age: calculateAge(editableData.birth_date || current.birth_date),
                    ...updatedUser,
                }));
                profileSaved = true;
            }
            if (levelChanged) {
                savingLevel = true;
                await skillLevelService.setMyLevel(sportId, level);
                setMyLevel(level);
                setLevelStatus("ready");
            }
            setIsEditing(false);
            if (profileChanged || levelChanged) {
                successPopup(t("儲存成功"), profileChanged && levelChanged
                    ? t("個人資料與程度已更新。")
                    : levelChanged ? t("程度已更新。") : t("個人資料已更新。"));
            }
        } catch (error) {
            console.error(savingLevel ? "更新程度失敗：" : "更新個人資料失敗：", error);
            const apiErrorText = String(error?.response?.data?.error || error?.response?.data?.message || "");
            if (savingLevel) {
                const failure = describeRequestError(error);
                errorPopup(failure.title, profileSaved
                    ? translate("基本資料已更新，但程度未更新。{value0}", { value0: failure.message })
                    : failure.message);
            } else if ([400, 422].includes(error?.response?.status) && /phone|mobile|電話|手機/i.test(apiErrorText)) {
                errorPopup(t("電話格式錯誤"), t("電話號碼未通過驗證，請確認格式後再試。"));
            } else {
                const failure = describeRequestError(error);
                errorPopup(failure.title, failure.message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return <Loading />;

    const avatar = user.avatar;
    const displayName = user.display_name || user.username || t("使用者");
    const birthDate = user.birth_date ? formatDateTime(user.birth_date).fullDate : t("未提供");
    const genderMap = { male: "男性", female: "女性", other: "其他" };
    const today = new Date();
    const levelLabel = levelOptions.find((item) => item.level === myLevel)?.label;
    const displayedLevel = levelStatus === "loading" ? t("讀取中...")
        : levelStatus === "error" ? t("暫時無法讀取")
            : levelStatus === "no-sport" ? t("尚未選擇球類")
                : myLevel === null ? t("尚未設定") : levelLabel || t("等級 {level}", { level: myLevel });

    return (
        <div className="app-page pb-12 text-slate-900">
            <Navbar />
            <main className="mx-auto w-[92%] max-w-4xl pt-8 sm:pt-10">
                <div className="mb-5">
                    <h1 className="text-3xl font-bold text-gray-900">{t("個人檔案")}</h1>
                </div>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 text-2xl font-bold text-blue-700 sm:h-20 sm:w-20">
                            {displayName.charAt(0)}
                            {avatar && (
                                <img
                                    src={avatar}
                                    alt={translate("{value0} 的頭像", { value0: displayName })}
                                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{displayName}</h2>
                            <p className="mt-1 text-sm text-slate-500">@{user.username || t("未設定 username")}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {user.is_pickup_host && (
                                    <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">{t("臨打團主")}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-5">
                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><UserRound size={20} /></span>
                                <div>
                                    <h3 className="font-bold text-slate-900">{t("基本資訊")}</h3>
                                    <p className="text-sm text-slate-500">{t("個人與聯絡資料")}</p>
                                </div>
                            </div>
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
                                >
                                    {t("編輯資料")}
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        {t("顯示名稱")}
                                        <input name="display_name" value={formData.display_name} onChange={handleInputChange} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                    </label>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        {t("電話")} <span className="text-xs font-normal text-slate-500">{t("（選填）")}</span>
                                        <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                    </label>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        {t("性別")}
                                        <select name="gender" value={formData.gender} onChange={handleInputChange} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                            <option value="" disabled>{t("請選擇")}</option>
                                            <option value="male">{t("男性")}</option>
                                            <option value="female">{t("女性")}</option>
                                            <option value="other">{t("其他")}</option>
                                        </select>
                                    </label>
                                    <div>
                                        <label htmlFor="profile-birth-date" className="block text-sm font-semibold text-slate-700">{t("出生日期")} <span className="font-normal text-slate-500">{t("（選填）")}</span></label>
                                        <Calendar
                                            buttonId="profile-birth-date"
                                            placeholder={t("選擇出生日期")}
                                            selectedDate={parseBirthDate(formData.birth_date)}
                                            showYearDropdown
                                            maxDate={today}
                                            onDayPicked={({ date }) => setFormData((current) => ({ ...current, birth_date: formatBirthDate(date) }))}
                                        />
                                    </div>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        {t("程度（目前球類）")}
                                        <select
                                            value={selectedLevel}
                                            onChange={(event) => setSelectedLevel(event.target.value)}
                                            disabled={isSaving || levelStatus === "loading" || levelStatus === "error" || levelStatus === "no-sport" || levelOptionsError || levelOptions.length === 0}
                                            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                                        >
                                            <option value="" disabled>{t("請選擇程度")}</option>
                                            {levelOptions.map((item) => <option key={item.level} value={item.level}>{item.label}</option>)}
                                        </select>
                                    </label>
                                </div>
                                {(levelStatus === "error" || levelOptionsError) && (
                                    <p role="alert" className="text-sm text-red-600">
                                        {t("無法載入程度，請重試。")}
                                        <button type="button" onClick={() => setLevelRetry((current) => current + 1)} className="ml-2 font-semibold underline">{t("重新載入")}</button>
                                    </p>
                                )}
                                {levelStatus === "no-sport" && <p className="text-sm text-slate-500">{t("尚未選擇球類，請先選擇球類再設定程度。")}</p>}
                                {!levelOptionsError && levelStatus !== "loading" && levelOptions.length === 0 && sportId && <p className="text-sm text-slate-500">{t("目前沒有可選的程度。")}</p>}
                                <p className="text-sm text-slate-500">{t("登入信箱可在首次設定密碼時補上；username、頭像與組織資料無法在此修改。")}</p>
                                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                                    <button type="button" onClick={handleCancelEdit} disabled={isSaving} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">{t("取消")}</button>
                                    <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? t("儲存中...") : t("儲存變更")}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                    <span className="text-blue-600"><Mail size={19} /></span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-500">{t("電子信箱")}</p>
                                        <p className="mt-0.5 truncate font-medium text-slate-800">{user.email || t("未提供")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                    <span className="text-blue-600"><Phone size={19} /></span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500">{t("聯絡電話")}</p>
                                        <p className="mt-0.5 font-medium text-slate-800">{user.phone || t("未提供")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                    <div className="text-blue-600">{InfoIconMap.gender.icon}</div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500">{t("性別")}</p>
                                        <p className="mt-0.5 font-medium text-slate-800">{t(genderMap[user.gender] || "未提供")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                    <span className="text-blue-600"><CalendarDays size={19} /></span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500">{t("出生日期")}</p>
                                        <p className="mt-0.5 font-medium text-slate-800">{birthDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                    <span className="text-blue-600"><Award size={19} /></span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500">{t("程度（目前球類）")}</p>
                                        <p className="mt-0.5 font-medium text-slate-800">{displayedLevel}</p>
                                        {(levelStatus === "error" || levelOptionsError) && (
                                            <button type="button" onClick={() => setLevelRetry((current) => current + 1)} className="mt-1 text-xs font-semibold text-blue-600 underline">{t("重新載入程度")}</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900">{t("登入信箱與密碼")}</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                {t(passwordConfigured || user.has_password === true
                                    ? "此帳號已設定密碼，可以使用信箱與密碼登入。"
                                    : "尚未設定密碼時，可在此補上登入信箱與密碼。每個帳號只能設定一次。")}
                            </p>
                        </div>
                        {!(passwordConfigured || user.has_password === true || showPasswordForm) && (
                            <button type="button" onClick={() => setShowPasswordForm(true)} className="shrink-0 rounded-lg border border-blue-300 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50">
                                {t("設定登入信箱與密碼")}
                            </button>
                        )}
                    </div>
                    {!(passwordConfigured || user.has_password === true) && showPasswordForm && (
                        <div className="mt-4 max-w-md">
                            <SetPasswordForm
                                existingEmail={user.email}
                                onSubmit={handleSetPassword}
                                onCancel={() => setShowPasswordForm(false)}
                                submitLabel={t("儲存登入密碼")}
                            />
                        </div>
                    )}
                </section>

                <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-slate-900">{t("LINE 帳號綁定")}</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                {t(lineUnlinked
                                    ? "目前帳號未綁定 LINE。"
                                    : "解除後將無法再用這個 LINE 帳號登入目前帳號。")}
                            </p>
                        </div>
                        {!lineUnlinked && (
                            <button
                                type="button"
                                onClick={handleUnlinkLine}
                                disabled={isUnlinkingLine}
                                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {t(isUnlinkingLine ? "解除綁定中..." : "解除 LINE 綁定")}
                            </button>
                        )}
                    </div>
                </section>

                {user.organizations?.length > 0 && (
                    <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><UsersRound size={20} /></span>
                            <div>
                                <h3 className="font-bold text-slate-900">{t("所屬組織")}</h3>
                                <p className="text-sm text-slate-500">{t("你目前參與的運動社群")}</p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {user.organizations.map((org) => (
                                <div key={org.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <h4 className="font-bold text-slate-900">{org.name || t("未命名組織")}</h4>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {org.owner && <span className="rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-700">{t("負責人")}</span>}
                                        {org.organization_manager && <span className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-bold text-green-700">{t("管理員")}</span>}
                                        {org.location_manager?.length > 0 && <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{t("管理")} {org.location_manager.length} {t("個場地")}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
            {showPasswordDialog && (
                <SetPasswordDialog
                    existingEmail={user.email}
                    onSubmit={handleSetPassword}
                    onCancel={() => setShowPasswordDialog(false)}
                />
            )}
        </div>
    );
}
