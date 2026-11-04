import { useTranslation } from "../../../locale/i18n";
import { functionIconMap } from "../../../constant/IconMap";

export default function ProfileSetupPrompt({ showLevel, showGender, levels, levelsError, value, onChange, gender, onGenderChange, onSave, onClose, onRetry, saving, saveError }) {
    const t = useTranslation();
    const description = showLevel && showGender
        ? t("請先補上性別並設定這個球類的運動程度。")
        : showGender ? t("請選擇你的性別，以便完成臨打報名資料。")
            : t("你還沒有設定這個球類的程度。請選擇符合自己的程度後儲存。");
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 px-4 py-6">
            <div role="dialog" aria-modal="true" aria-labelledby="profile-setup-title" aria-describedby="profile-setup-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 id="profile-setup-title" className="text-xl font-bold text-slate-900">{showGender ? t("設定你的基本資料") : t("設定你的運動程度")}</h2>
                        <p id="profile-setup-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("關閉")}
                        className="grid h-9 w-9 place-items-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    >
                        {functionIconMap.cancel.icon}
                    </button>
                </div>

                <form onSubmit={onSave} className="mt-6 space-y-4">
                    {showGender && <div>
                        <label htmlFor="my-gender" className="block text-sm font-semibold text-slate-700">{t("性別")}</label>
                        <select id="my-gender" value={gender} onChange={(event) => onGenderChange(event.target.value)} disabled={saving} required autoFocus={!showLevel}
                            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100">
                            <option value="" disabled>{t("請選擇")}</option>
                            <option value="male">{t("男性")}</option>
                            <option value="female">{t("女性")}</option>
                            <option value="other">{t("其他")}</option>
                        </select>
                    </div>}
                    {showLevel && <div>
                        <label htmlFor="my-skill-level" className="block text-sm font-semibold text-slate-700">{t("我的程度")}</label>
                        <select
                            id="my-skill-level"
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            disabled={saving || Boolean(levelsError) || levels.length === 0}
                            required
                            autoFocus
                            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                        >
                            <option value="" disabled>{t("請選擇程度")}</option>
                            {levels.map((item) => <option key={item.level} value={item.level}>{item.label}</option>)}
                        </select>
                    </div>}

                    {showLevel && levelsError && (
                        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            <p>{levelsError}</p>
                            <button type="button" onClick={onRetry} className="mt-2 font-semibold underline">{t("重新載入程度選項")}</button>
                        </div>
                    )}
                    {showLevel && !levelsError && levels.length === 0 && (
                        <div role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                            <p>{t("這個球類目前沒有可選的程度。")}</p>
                            <button type="button" onClick={onRetry} className="mt-2 font-semibold text-blue-700 underline">{t("重新載入程度選項")}</button>
                        </div>
                    )}
                    {saveError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{t("稍後再設定")}</button>
                        <button type="submit" disabled={(showLevel && (!value || Boolean(levelsError) || levels.length === 0)) || (showGender && !gender) || saving} className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {saving ? t("儲存中...") : showLevel && showGender ? t("儲存設定") : showGender ? t("儲存性別") : t("儲存程度")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
