import { DayPicker } from "react-day-picker";
import { enUS, zhTW } from "react-day-picker/locale";
import { useState } from "react";
import "react-day-picker/style.css";
import "./dayPick.css";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { getLocale, useTranslation } from "../../locale/i18n";

function getWeekday(date) {
  return formatDateTime(date).weekdayShort;
}

function Calendar({
  onDayPicked = () => {},
  buttonId,
  placeholder = "選擇日期",
  showYearDropdown = false,
  maxDate,
  selectedDate,
  align = "start",
}) {
  const t = useTranslation();
  const [internalSelected, setInternalSelected] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const selected = selectedDate === undefined ? internalSelected : selectedDate;

  const openCalendar = () => {
    setShowCalendar((isOpen) => !isOpen);
  }

  const handleSelect = (date) => {
    if (selectedDate === undefined) setInternalSelected(date);
    if (date && typeof onDayPicked === "function") {
      const weekday = getWeekday(date);
      onDayPicked({
        date,
        weekday,
        formatted: formatDateTime(date).numericDate,
      });
    }
    setShowCalendar(false);
  };

  return (
    <div className={`flex flex-col relative ${showYearDropdown ? "calendar-birth" : ""}`}>
      <button
        id={buttonId}
        type="button"
        onClick={openCalendar}
        aria-expanded={showCalendar}
        aria-haspopup="dialog"
        className="relative inline-block w-full rounded-lg border border-gray-300 bg-white px-6 py-2 hover:bg-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-auto"
      >
        {selected
          ? formatDateTime(selected).numericDate
          : t(placeholder)}
      </button>
      <div
        className={`calendar-container ${showCalendar ? 'active' : ''} ${showYearDropdown ? 'calendar-container--birth' : ''} ${align === 'end' ? 'calendar-container--end' : ''}`}
        style={{
          pointerEvents: showCalendar ? "auto" : "none",
        }}
      >
        <DayPicker
          mode="single"
          required={showYearDropdown}
          selected={selected}
          onSelect={handleSelect}
          className={`day-picker ${showYearDropdown ? "day-picker--birth" : ""}`}
          captionLayout={showYearDropdown ? "dropdown" : undefined}
          reverseYears={showYearDropdown}
          startMonth={showYearDropdown ? new Date(1900, 0) : undefined}
          endMonth={showYearDropdown ? maxDate || new Date() : undefined}
          defaultMonth={selected || (showYearDropdown ? new Date(new Date().getFullYear() - 20, new Date().getMonth()) : undefined)}
          disabled={maxDate ? { after: maxDate } : undefined}
          locale={getLocale() === "zh-TW" ? zhTW : enUS}
        />
      </div>
    </div>


  );
}

export default Calendar;
