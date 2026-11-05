import { useTranslation } from "../../../locale/i18n";
import Calendar from "../../../components/dayPicker/dayPick";
import { functionIconMap } from "../../../constant/IconMap";
import { DoubleSlide } from "../../../components/rangeSlide";
import { Search } from "lucide-react";

const sortOptions = [
    { value: "distance", label: "距離近" },
    { value: "start_time", label: "快開始" },
];

function FilterContent({ activeFilter, onFilterChange, selectedDate, onDatePicked, onClearDate, isMobile, onClose,
    levels, levelRange, onLevelChange, levelsLoading, levelsError, onRetryLevels,
    searchDraft, onSearchDraftChange, onSearchSubmit, onClearSearch }) {
  const t = useTranslation();
    const handleDatePicked = (day) => {
        onDatePicked(day.date);
        if (isMobile) onClose();
    };

    const handleFilterChange = (filter) => {
        onFilterChange(filter);
        if (isMobile) onClose();
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900">{t("篩選球團")}</p>
                {isMobile && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-9 w-9 place-items-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    >
                        {functionIconMap.cancel.icon}
                    </button>
                )}
            </div>

            <div className="space-y-5">
                <form onSubmit={(event) => { event.preventDefault(); onSearchSubmit(); if (isMobile) onClose(); }} className="space-y-2">
                    <label htmlFor={isMobile ? "pickup-search-mobile" : "pickup-search-desktop"} className="text-xs font-bold tracking-wider text-gray-500">
                        {t("搜尋團名或團主")}
                    </label>
                    <div className="flex gap-2">
                        <input
                            id={isMobile ? "pickup-search-mobile" : "pickup-search-desktop"}
                            type="search"
                            value={searchDraft}
                            onChange={(event) => onSearchDraftChange(event.target.value)}
                            maxLength={100}
                            placeholder={t("輸入團名或團主名稱")}
                            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <button type="submit" aria-label={t("搜尋球團")} className="grid min-h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                            <Search size={18} aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="shrink-0 rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                            {t("清除")}
                        </button>
                    </div>
                </form>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold tracking-wider text-gray-500">{t("排序方式")}</label>
                    <div className="flex w-full rounded-lg bg-gray-100 p-1">
                        {sortOptions.map((option) => (
                            <button
                                type="button"
                                key={option.value}
                                onClick={() => handleFilterChange(option.value)}
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-all ${activeFilter === option.value
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {t(option.label)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold tracking-wider text-gray-500">{t("選擇日期")}</label>
                    <div className="flex items-center gap-2">
                        <Calendar selectedDate={selectedDate} onDayPicked={handleDatePicked} />
                        <button
                            type="button"
                            onClick={onClearDate}
                            className="rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                            {t("清除")}
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold tracking-wider text-gray-500">{t("篩選程度")}</p>
                    {levelsLoading ? <p className="text-sm text-slate-500">{t("載入程度中…")}</p>
                        : levelsError ? <div className="text-sm text-red-600" role="status">
                            <p>{levelsError}</p>
                            <button type="button" onClick={onRetryLevels} className="mt-2 text-blue-600 underline">{t("重新載入")}</button>
                        </div>
                        : levels.length > 0 && levelRange ? <>
                            <DoubleSlide value={levelRange} onChange={onLevelChange} levels={levels} />
                            {levels.length > 1 && <div aria-hidden="true" className="relative mx-3 h-4 text-xs tabular-nums text-slate-400">
                                <span className="absolute left-0 -translate-x-1/2">{levels[0].label}</span>
                                <span className="absolute right-0 translate-x-1/2">{levels[levels.length - 1].label}</span>
                            </div>}
                        </> : <p className="text-sm text-slate-500">{t("此球類尚未設定程度")}</p>}
                </div>
            </div>
        </section>
    );
}

export default function PickUpFilterSection({ activeFilter, onFilterChange, selectedDate, onDatePicked, onClearDate,
    levels, levelRange, onLevelChange, levelsLoading, levelsError, onRetryLevels, isMobileOpen, onMobileClose,
    searchDraft, onSearchDraftChange, onSearchSubmit, onClearSearch }) {
    const levelProps = { levels, levelRange, onLevelChange, levelsLoading, levelsError, onRetryLevels };
    const searchProps = { searchDraft, onSearchDraftChange, onSearchSubmit, onClearSearch };

    return (
        <>
            <aside className="sticky top-4 hidden w-72 shrink-0 lg:block z-10">
                <FilterContent
                    {...levelProps}
                    {...searchProps}
                    activeFilter={activeFilter}
                    onFilterChange={onFilterChange}
                    selectedDate={selectedDate}
                    onDatePicked={onDatePicked}
                    onClearDate={onClearDate}
                />
            </aside>

            <div className={`${isMobileOpen ? "mb-4" : ""} lg:hidden`}>
                <div
                    id="mobile-pickup-filters"
                    className={`relative z-20 grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out-in ${isMobileOpen
                        ? "grid-rows-[1fr] translate-y-2 overflow-visible opacity-100"
                        : "grid-rows-[0fr] translate-y-2 overflow-hidden opacity-0 pointer-events-none"
                        }`}
                >
                    <div className={isMobileOpen ? "overflow-visible" : "overflow-hidden"}>
                        <FilterContent
                            {...levelProps}
                            {...searchProps}
                            activeFilter={activeFilter}
                            onFilterChange={onFilterChange}
                            selectedDate={selectedDate}
                            onDatePicked={onDatePicked}
                            onClearDate={onClearDate}
                            isMobile
                            onClose={onMobileClose}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
