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
    if (!Number.isInteger(level)) throw new Error(translate("userPage.messages.peopleLevel"));
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
            <h2 id="set-password-title" className="text-xl font-bold text-slate-900">{t("userPage.headings.settingsLoginPassword")}</h2>
            <p className="mb-5 mt-2 text-sm text-slate-600">{t("userPage.messages.lineCurrentLoginMethodSettingsAndPassword")}</p>
            <SetPasswordForm
                existingEmail={existingEmail}
                onSubmit={onSubmit}
                onCancel={onCancel}
                submitLabel={t("userPage.messages.settingsPasswordLineLink")}
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
            successPopup(t("userPage.feedback.unlinkSuccess"), t("userPage.feedback.lineAccountAlreadyAndCurrentAccountUnlink"));
        } catch (error) {
            if (error?.response?.status === 409 && offerPasswordSetup) {
                setShowPasswordDialog(true);
                return;
            }
            if (error?.response?.status === 404) {
                setLineUnlinked(true);
            }
            const failure = describeRequestError(error, {
                404: { title: t("userPage.errors.lineNotYetLink"), message: t("userPage.errors.currentAccountNoneLinkLineNone") },
                409: { title: t("userPage.errors.cannotLineLink"), message: t("userPage.errors.passwordAlreadySettingsLineCannotPleaseRetry") },
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
            title: t("userPage.messages.lineLink"),
            text: t("userPage.errors.lineAccountCannotLoginCurrentAccountPleaseFirst"),
            showCancelButton: true,
            confirmButtonText: t("userPage.messages.confirmUnlink"),
            cancelButtonText: t("common.messages.cancel"),
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
            successPopup(t("userPage.feedback.passwordSettingsSuccess"), t("userPage.feedback.nowCanAndPasswordLogin"));
        }
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();

        if (!formData.display_name.trim() || !formData.gender) {
            errorPopup(t("userPage.errors.dataComplete"), t("userPage.errors.pleaseFillDisplayNameAndGender"));
            return;
        }
        if (formData.birth_date && !isValidBirthDate(formData.birth_date)) {
            errorPopup(t("userPage.errors.birthDateError"), t("userPage.errors.pleaseSelectValidTodayBirthDate"));
            return;
        }
        if (!isValidPhoneNumber(formData.phone)) {
            errorPopup(t("userPage.errors.phoneError"), t("userPage.errors.pleaseEnterValid"));
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
            errorPopup(t("userPage.errors.levelSelectError"), t("userPage.errors.pleaseFirstLoadSelectValidLevel"));
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
                successPopup(t("userPage.feedback.saveSuccess"), profileChanged && levelChanged
                    ? t("userPage.feedback.profileAndLevelAlreadyUpdate")
                    : levelChanged ? t("userPage.feedback.levelAlreadyUpdate") : t("userPage.feedback.profileAlreadyUpdate"));
            }
        } catch (error) {
            console.error(savingLevel ? "更新程度失敗：" : "更新個人資料失敗：", error);
            const apiErrorText = String(error?.response?.data?.error || error?.response?.data?.message || "");
            if (savingLevel) {
                const failure = describeRequestError(error);
                errorPopup(failure.title, profileSaved
                    ? translate("userPage.errors.skillLevelUpdateFailed", { value0: failure.message })
                    : failure.message);
            } else if ([400, 422].includes(error?.response?.status) && /phone|mobile|電話|手機/i.test(apiErrorText)) {
                errorPopup(t("userPage.errors.phoneError"), t("userPage.errors.phonePleaseConfirm"));
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
    const displayName = user.display_name || user.username || t("userPage.messages.user");
    const birthDate = user.birth_date ? formatDateTime(user.birth_date).fullDate : t("common.messages.notProvided");
    const genderMap = { male: "common.gender.male", female: "common.gender.female", other: "common.gender.other" };
    const today = new Date();
    const levelLabel = levelOptions.find((item) => item.level === myLevel)?.label;
    const displayedLevel = levelStatus === "loading" ? t("userPage.messages.loading")
        : levelStatus === "error" ? t("userPage.errors.temporarilyCannot")
            : levelStatus === "no-sport" ? t("userPage.messages.notYetSelectSport")
                : myLevel === null ? t("userPage.messages.notYetSettings") : levelLabel || t("userPage.messages.levelLevel", { level: myLevel });

    return (
        <div className="app-page pb-12 text-slate-900">
            <Navbar />
            <main className="mx-auto w-[92%] max-w-4xl pt-8 sm:pt-10">
                <div className="mb-5">
                    <h1 className="text-3xl font-bold text-gray-900">{t("userPage.headings.people")}</h1>
                </div>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 text-2xl font-bold text-blue-700 sm:h-20 sm:w-20">
                            {displayName.charAt(0)}
                            {avatar && (
                                <img
                                    src={avatar}
                                    alt={translate("userPage.images.avatar", { value0: displayName })}
                                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{displayName}</h2>
                            <p className="mt-1 text-sm text-slate-500">@{user.username || t("userPage.messages.notSetUsername")}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {user.is_pickup_host && (
                                    <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">{t("userPage.messages.pickupGroup")}</span>
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
                                    <h3 className="font-bold text-slate-900">{t("userPage.headings.info")}</h3>
                                    <p className="text-sm text-slate-500">{t("userPage.messages.peopleAndData")}</p>
                                </div>
                            </div>
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
                                >
                                    {t("userPage.actions.editData")}
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        {t("userPage.labels.displayName")}
                                        <input name="display_name" value={formData.display_name} onChange={handleInputChange} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                    </label>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        {t("userPage.labels.phone")} <span className="text-xs font-normal text-slate-500">{t("userPage.messages.optional")}</span>
                                        <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                    </label>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        {t("common.labels.gender")}
                                        <select name="gender" value={formData.gender} onChange={handleInputChange} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                            <option value="" disabled>{t("common.messages.pleaseSelect")}</option>
                                            <option value="male">{t("common.messages.male")}</option>
                                            <option value="female">{t("common.messages.female")}</option>
                                            <option value="other">{t("common.messages.other")}</option>
                                        </select>
                                    </label>
                                    <div>
                                        <label htmlFor="profile-birth-date" className="block text-sm font-semibold text-slate-700">{t("userPage.labels.birthDate")} <span className="font-normal text-slate-500">{t("userPage.messages.optional")}</span></label>
                                        <Calendar
                                            buttonId="profile-birth-date"
                                            placeholder={t("userPage.placeholders.selectBirthDate")}
                                            selectedDate={parseBirthDate(formData.birth_date)}
                                            showYearDropdown
                                            maxDate={today}
                                            onDayPicked={({ date }) => setFormData((current) => ({ ...current, birth_date: formatBirthDate(date) }))}
                                        />
                                    </div>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        {t("userPage.labels.levelCurrentSport")}
                                        <select
                                            value={selectedLevel}
                                            onChange={(event) => setSelectedLevel(event.target.value)}
                                            disabled={isSaving || levelStatus === "loading" || levelStatus === "error" || levelStatus === "no-sport" || levelOptionsError || levelOptions.length === 0}
                                            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                                        >
                                            <option value="" disabled>{t("common.messages.selectSkillLevel")}</option>
                                            {levelOptions.map((item) => <option key={item.level} value={item.level}>{item.label}</option>)}
                                        </select>
                                    </label>
                                </div>
                                {(levelStatus === "error" || levelOptionsError) && (
                                    <p role="alert" className="text-sm text-red-600">
                                        {t("userPage.errors.cannotLoadLevelPleaseRetry")}
                                        <button type="button" onClick={() => setLevelRetry((current) => current + 1)} className="ml-2 font-semibold underline">{t("common.actions.reload")}</button>
                                    </p>
                                )}
                                {levelStatus === "no-sport" && <p className="text-sm text-slate-500">{t("userPage.errors.notYetSelectSportPleaseFirstSelectSportSettings")}</p>}
                                {!levelOptionsError && levelStatus !== "loading" && levelOptions.length === 0 && sportId && <p className="text-sm text-slate-500">{t("userPage.messages.currentNoneLevel")}</p>}
                                <p className="text-sm text-slate-500">{t("userPage.errors.loginSettingsPasswordUsernameAndDataCannot")}</p>
                                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                                    <button type="button" onClick={handleCancelEdit} disabled={isSaving} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">{t("common.actions.cancel")}</button>
                                    <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? t("common.actions.saving") : t("userPage.actions.saveChanges")}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                    <span className="text-blue-600"><Mail size={19} /></span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-500">{t("userPage.messages.email")}</p>
                                        <p className="mt-0.5 truncate font-medium text-slate-800">{user.email || t("common.messages.notProvided")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                    <span className="text-blue-600"><Phone size={19} /></span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500">{t("userPage.messages.phone")}</p>
                                        <p className="mt-0.5 font-medium text-slate-800">{user.phone || t("common.messages.notProvided")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                    <div className="text-blue-600">{InfoIconMap.gender.icon}</div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500">{t("common.messages.gender")}</p>
                                        <p className="mt-0.5 font-medium text-slate-800">{t(genderMap[user.gender] || "common.messages.notProvided")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                    <span className="text-blue-600"><CalendarDays size={19} /></span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500">{t("userPage.messages.birthDate")}</p>
                                        <p className="mt-0.5 font-medium text-slate-800">{birthDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                    <span className="text-blue-600"><Award size={19} /></span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500">{t("userPage.messages.levelCurrentSport")}</p>
                                        <p className="mt-0.5 font-medium text-slate-800">{displayedLevel}</p>
                                        {(levelStatus === "error" || levelOptionsError) && (
                                            <button type="button" onClick={() => setLevelRetry((current) => current + 1)} className="mt-1 text-xs font-semibold text-blue-600 underline">{t("userPage.actions.reloadLevel")}</button>
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
                            <h3 className="font-bold text-slate-900">{t("userPage.headings.loginAndPassword")}</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                {t(passwordConfigured || user.has_password === true
                                    ? "userPage.password.messages.configured"
                                    : "userPage.password.messages.setupHint")}
                            </p>
                        </div>
                        {!(passwordConfigured || user.has_password === true || showPasswordForm) && (
                            <button type="button" onClick={() => setShowPasswordForm(true)} className="shrink-0 rounded-lg border border-blue-300 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50">
                                {t("userPage.actions.settingsLoginAndPassword")}
                            </button>
                        )}
                    </div>
                    {!(passwordConfigured || user.has_password === true) && showPasswordForm && (
                        <div className="mt-4 max-w-md">
                            <SetPasswordForm
                                existingEmail={user.email}
                                onSubmit={handleSetPassword}
                                onCancel={() => setShowPasswordForm(false)}
                                submitLabel={t("userPage.messages.saveLoginPassword")}
                            />
                        </div>
                    )}
                </section>

                <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-slate-900">{t("userPage.headings.lineAccountLink")}</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                {t(lineUnlinked
                                    ? "userPage.line.messages.notLinked"
                                    : "userPage.line.messages.unlinkWarning")}
                            </p>
                        </div>
                        {!lineUnlinked && (
                            <button
                                type="button"
                                onClick={handleUnlinkLine}
                                disabled={isUnlinkingLine}
                                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {t(isUnlinkingLine ? "userPage.line.actions.unlinking" : "userPage.line.actions.unlink")}
                            </button>
                        )}
                    </div>
                </section>

                {user.organizations?.length > 0 && (
                    <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><UsersRound size={20} /></span>
                            <div>
                                <h3 className="font-bold text-slate-900">{t("userPage.headings.organization")}</h3>
                                <p className="text-sm text-slate-500">{t("userPage.messages.yourCurrentAnd")}</p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {user.organizations.map((org) => (
                                <div key={org.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <h4 className="font-bold text-slate-900">{org.name || t("userPage.headings.unnamedOrganization")}</h4>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {org.owner && <span className="rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-700">{t("userPage.messages.people")}</span>}
                                        {org.organization_manager && <span className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-bold text-green-700">{t("userPage.messages.administrator")}</span>}
                                        {org.location_manager?.length > 0 && <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{t("userPage.messages.manage")} {org.location_manager.length} {t("userPage.messages.venue")}</span>}
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
