import { useTranslation } from "../../../locale/i18n";
import { functionIconMap, sportIconMap } from "../../../constant/IconMap";

export default function ProfileSetupPrompt({ sportName, sportCode, showLevel, showGender, levels, levelsError, value, onChange, gender, onGenderChange, onSave, onClose, onRetry, saving, saveError }) {
    const t = useTranslation();
    const sportIcon = sportIconMap[sportCode?.toUpperCase()]?.icon
        || Object.values(sportIconMap).find((sport) => sport.name === sportName)?.icon;
    const description = showLevel && showGender
        ? t("pickUpPage.profileSetup.messages.pleaseFillGenderAndLevelRegistrationData")
        : showGender ? t("pickUpPage.profileSetup.messages.pleaseSelectYourGenderPickupRegistrationData")
            : t("pickUpPage.profileSetup.messages.selectLevelProfile");
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 px-4 py-6">
            <div role="dialog" aria-modal="true" aria-labelledby="profile-setup-title" aria-describedby="profile-setup-description" className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 id="profile-setup-title" className="text-xl font-bold tracking-tight text-slate-900">{showGender ? t("pickUpPage.profileSetup.headings.settingsYourBasicProfile") : t("pickUpPage.profileSetup.headings.settingsYourSkillLevel")}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("common.accessibility.close")}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        {functionIconMap.cancel.icon}
                    </button>
                </div>
                {showLevel && <span className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                    <span aria-hidden="true" className="text-base">{sportIcon}</span>
                    <span className="truncate">{sportName || t("common.messages.loading")}</span>
                </span>}
                <p id="profile-setup-description" className="mt-3 text-sm leading-6 text-slate-500">{description}</p>

                <form onSubmit={onSave} className="mt-5 space-y-4">
                    {showGender && <div>
                        <label htmlFor="my-gender" className="block text-sm font-semibold text-slate-700">{t("common.labels.gender")}</label>
                        <select id="my-gender" value={gender} onChange={(event) => onGenderChange(event.target.value)} disabled={saving} required autoFocus={!showLevel}
                            className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100">
                            <option value="" disabled>{t("common.messages.pleaseSelect")}</option>
                            <option value="male">{t("common.messages.male")}</option>
                            <option value="female">{t("common.messages.female")}</option>
                            <option value="other">{t("common.messages.other")}</option>
                        </select>
                    </div>}
                    {showLevel && <div>
                        <label htmlFor="my-skill-level" className="block text-sm font-semibold text-slate-700">{t("pickUpPage.profileSetup.labels.myLevel")}</label>
                        <select
                            id="my-skill-level"
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            disabled={saving || Boolean(levelsError) || levels.length === 0}
                            required
                            autoFocus
                            className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                        >
                            <option value="" disabled>{t("common.messages.selectSkillLevel")}</option>
                            {levels.map((item) => <option key={item.level} value={item.level}>{item.label}</option>)}
                        </select>
                    </div>}

                    {showLevel && levelsError && (
                        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            <p>{levelsError}</p>
                            <button type="button" onClick={onRetry} className="mt-2 font-semibold underline">{t("pickUpPage.profileSetup.actions.reloadLevel")}</button>
                        </div>
                    )}
                    {showLevel && !levelsError && levels.length === 0 && (
                        <div role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                            <p>{t("pickUpPage.profileSetup.messages.sportCurrentNoneLevel")}</p>
                            <button type="button" onClick={onRetry} className="mt-2 font-semibold text-blue-700 underline">{t("pickUpPage.profileSetup.actions.reloadLevel")}</button>
                        </div>
                    )}
                    {saveError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}

                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">{t("pickUpPage.profileSetup.actions.laterSettings")}</button>
                        <button type="submit" disabled={(showLevel && (!value || Boolean(levelsError) || levels.length === 0)) || (showGender && !gender) || saving} className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {saving ? t("common.actions.saving") : showLevel && showGender ? t("pickUpPage.profileSetup.actions.saveSettings") : showGender ? t("pickUpPage.profileSetup.actions.saveGender") : t("pickUpPage.profileSetup.actions.saveLevel")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
