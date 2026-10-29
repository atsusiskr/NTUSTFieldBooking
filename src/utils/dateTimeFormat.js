import { getLocale, translate } from "../locale/i18n";

const emptyDateTime = () => ({
    date: translate("未定日期"),
    time: translate("未定時間"),
    fullDate: translate("未定日期"),
    numericDate: translate("未定日期"),
    monthDay: translate("未定日期"),
    weekday: "",
    weekdayShort: "",
    shortDate: translate("未定日期"),
});

const pad = (value) => String(value).padStart(2, "0");

// 轉換各種日期格式。
export const formatDateTime = (value, options = {}) => {
    const EMPTY = emptyDateTime();
    if (value === null || value === undefined || value === "") return EMPTY;

    if (options.input === "hour") {
        const hour = Number(value);
        return Number.isInteger(hour) && hour >= 0 && hour <= 24
            ? { ...EMPTY, time: `${pad(hour)}:00` } : EMPTY;
    }

    if (typeof value === "string") {
        const clock = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/);
        if (clock) {
            const hour = Number(clock[1]);
            const minute = Number(clock[2]);
            const second = Number(clock[3] || 0);
            return hour <= 24 && minute <= 59 && second <= 59 && (hour !== 24 || (minute === 0 && second === 0))
                ? { ...EMPTY, time: `${pad(hour)}:${pad(minute)}` } : EMPTY;
        }
    }

    let dateTime;
    if (value instanceof Date) {
        dateTime = value;
    } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-").map(Number);
        dateTime = new Date(year, month - 1, day);
        if (dateTime.getFullYear() !== year || dateTime.getMonth() + 1 !== month || dateTime.getDate() !== day) return EMPTY;
    } else {
        dateTime = new Date(value);
    }
    if (Number.isNaN(dateTime.getTime())) return EMPTY;

    // 單次場地預約 API 目前以 Z 儲存所選的時鐘時間；顯示時需讀取 UTC 欄位，
    // 避免瀏覽器再加上台灣時區的八小時。
    const useUtcClock = options.timeZone === "UTC";
    const timeZone = useUtcClock ? { timeZone: "UTC" } : {};
    const year = useUtcClock ? dateTime.getUTCFullYear() : dateTime.getFullYear();
    const month = useUtcClock ? dateTime.getUTCMonth() + 1 : dateTime.getMonth() + 1;
    const day = useUtcClock ? dateTime.getUTCDate() : dateTime.getDate();

    const locale = getLocale();
    const date = new Intl.DateTimeFormat(locale, {
        month: "long", day: "numeric", weekday: "long", ...timeZone,
    }).format(dateTime);
    const fullDate = new Intl.DateTimeFormat(locale, {
        year: "numeric", month: "long", day: "numeric", ...timeZone,
    }).format(dateTime);
    const time = new Intl.DateTimeFormat(locale, {
        hour: "2-digit", minute: "2-digit", hourCycle: "h23", ...timeZone,
    }).format(dateTime);
    const numericDate = `${year}/${pad(month)}/${pad(day)}`;
    const monthDay = `${month}/${day}`;
    const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: "narrow", ...timeZone }).format(dateTime);
    const weekday = locale === "zh-TW" ? `週${weekdayShort}`
        : new Intl.DateTimeFormat(locale, { weekday: "short", ...timeZone }).format(dateTime);
    const shortDate = locale === "zh-TW" ? `${monthDay}（${weekday}）` : `${monthDay} (${weekday})`;

    return { date, time, fullDate, numericDate, monthDay, weekday, weekdayShort, shortDate };
};
