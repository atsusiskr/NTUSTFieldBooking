import { useTranslation } from "../locale/i18n";
import noUiSlider from "nouislider"
import HSRangeSlider from "@preline/range-slider/non-auto";
import { useRef, useEffect, useMemo } from "react";

const EMPTY_LEVELS = [];

export function SingleSlide({ value = [1, 10], onChange }) {
    return (
        <div>

        </div>
    );
}

export function DoubleSlide({ value, onChange, levels = EMPTY_LEVELS }) {
  const t = useTranslation();
    const sliderRef = useRef(null);
    const orderedLevels = useMemo(() => [...levels].sort((a, b) => a.level - b.level), [levels]);
    const getLabel = (level) => orderedLevels.find((item) => item.level === level)?.label ?? t("未設定");
    const range = useMemo(() => {
        if (!orderedLevels.length) return null;
        const result = { min: orderedLevels[0].level, max: orderedLevels[orderedLevels.length - 1].level };
        orderedLevels.slice(1, -1).forEach((item, index) => {
            result[`${((index + 1) / (orderedLevels.length - 1)) * 100}%`] = item.level;
        });
        return result;
    }, [orderedLevels]);
    const selectedValue = useMemo(
        () => value ?? (range ? [range.min, range.max] : []),
        [value, range]
    );
    const valueRef = useRef(selectedValue);

    useEffect(() => {
        valueRef.current = selectedValue;
        const slider = sliderRef.current?.noUiSlider;
        if (!slider) return;
        const current = slider.get().map(Number);
        if (current.some((level, index) => level !== selectedValue[index])) slider.set(selectedValue);
    }, [selectedValue]);

    useEffect(() => {
        const element = sliderRef.current;
        if (!element || !range || range.min === range.max) return;

        window.noUiSlider = noUiSlider;

        window.$hsRangeSliderCollection ??= [];

        const slider = new HSRangeSlider(element, {
            start: valueRef.current,
            range,
            snap: true,
        });

        element.noUiSlider.on("update", (values) => {
            const next = values.map(Number);
            if (next.some((level, index) => level !== valueRef.current[index])) {
                valueRef.current = next;
                onChange(next);
            }
        });

        return () => {
            slider.destroy();
        };
    }, [onChange, range]);

    return (
        <div className="min-w-0 space-y-2">
            <div className="grid grid-cols-2 gap-3">
                <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="shrink-0 text-xs text-slate-500">{t("最低")}</span>
                    <span className="break-words text-right text-sm font-semibold text-blue-600">{getLabel(selectedValue[0])}</span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="shrink-0 text-xs text-slate-500">{t("最高")}</span>
                    <span className="break-words text-right text-sm font-semibold text-blue-600">{getLabel(selectedValue[1])}</span>
                </div>
            </div>
            {range.min < range.max ? <div className="px-3 py-4">
            <div
                ref={sliderRef}
                data-hs-range-slider={JSON.stringify({
                    start: selectedValue,
                    connect: true,
                    range,
                    step: 1,
                    cssClasses: {
                        // 整條軌道與操作區域
                        target: "relative h-1.5 touch-none select-none rounded-full bg-slate-200",
                        base: "relative z-0 size-full",
                        origin: "pointer-events-none absolute top-1/2 right-0 h-0 w-full origin-top-left",
                        handle: "pointer-events-auto absolute top-0 right-0 size-5 translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-blue-600 bg-white shadow-sm transition-shadow hover:ring-4 hover:ring-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 active:cursor-grabbing",
                        connects: "relative size-full overflow-hidden rounded-full",
                        connect: "absolute top-0 right-0 size-full origin-top-left bg-blue-600",
                        touchArea: "absolute -inset-3",
                    }
                })}
            />
            </div> : <p className="text-xs text-slate-500">{t("目前僅提供此程度")}</p>}
        </div>
    )
}
