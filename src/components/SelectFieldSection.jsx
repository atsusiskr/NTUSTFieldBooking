import { useTranslation, translate } from "../locale/i18n";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../baseApi";
import { formatDateTime } from "../utils/dateTimeFormat";

function SelectFieldSection({ token, fields, fieldChecked = null, selectedDate, viewMode: defaultViewMode }) {
  const t = useTranslation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState(defaultViewMode || "byDate");
  const [selectedSlots, setSelectedSlots] = useState(null);
  const tableRef = useRef(null);
  const OPEN_HOUR = 8;
  const CLOSE_HOUR = 22;
  const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

  const baseDate = selectedDate ? new Date(selectedDate) : new Date();

  const sevenDays = Array.from({ length: 7}, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i - 3);
    return d;
  });

  const formatDate = (d) => formatDateTime(d).shortDate;

  const scrollToField = () => {
    const idx = fieldChecked?.idx;
    if (idx === null || idx === undefined) return;

    const container = tableRef.current;
    const target = document.getElementById(`field-column-${idx}`);
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const currentScrollLeft = container.scrollLeft;
    const targetCenter = (targetRect.left - containerRect.left) + (currentScrollLeft) + (targetRect.width / 2);

    const nextScrollLeft = targetCenter - (containerRect.width / 2) - 60;
    container.scrollTo({ left: Math.max(0, nextScrollLeft), behavior: 'smooth' });
    setViewMode("byPlace");

  };

  useEffect(() => {
    const idx = fieldChecked?.idx;
    if (idx === null || idx === undefined) return;

    // 確認場地後：強制切換到七日單場地
    setViewMode("byPlace");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = tableRef.current;
        const middleDayHeader = document.getElementById("day-column-3");
        if (!container || !middleDayHeader) return;

                const containerRect = container.getBoundingClientRect();
        const targetRect = middleDayHeader.getBoundingClientRect();

        // 左側 sticky 時段欄會蓋住內容：把置中的參考點改成「扣掉 sticky 後的可視區域中心」
        const stickyEl = container.querySelector('[data-sticky-time="true"]');
        const stickyW = stickyEl ? stickyEl.getBoundingClientRect().width : 0;

        const currentScrollLeft = container.scrollLeft;
        const targetCenterX =
          (targetRect.left - containerRect.left) + currentScrollLeft + targetRect.width / 2;

        // 可視區域(扣掉 sticky) 的中心點座標（相對 container 左側）
        const visibleCenterX = stickyW + (container.clientWidth - stickyW) / 2;

        const nextScrollLeft = targetCenterX - visibleCenterX;

        container.scrollTo({
          left: Math.max(0, nextScrollLeft) - 80,
          behavior: "smooth",
        });
      });
    });
  }, [fieldChecked?.idx]);

  const handleFieldClick = (fieldName, isSchool, field_img) => {
    navigate(`/${fieldName}/${isSchool}`);
  };

  //判斷是否為連續時段
  const isContiguous = (hours) => {
    if (!hours || hours.length <= 1) return true;
    const sortedHours = [...hours].sort((a, b) => a - b);
    for (let i = 1; i < sortedHours.length; i++) {
      if (sortedHours[i] !== sortedHours[i - 1] + 1) return false;
    }
    return true;
  };

  const handleSelectSlot = ({ fieldIdx, resourceIdx, hour, date }) => {
    const dateKey = date ? new Date(date).toISOString().slice(0, 10) : null;
    setSelectedSlots((prev) => {

      if (!prev) {
        return { fieldIdx, resourceIdx, hours: [hour], date: dateKey };
      }

      const sameCourt = prev.fieldIdx === fieldIdx && prev.resourceIdx === resourceIdx;
      const sameDate = prev.date === dateKey;

      if (!sameCourt || !sameDate) {
        return { fieldIdx, resourceIdx, hours: [hour], date: dateKey };
      }

      const hoursSet = new Set(prev.hours);

      if (hoursSet.has(hour)) {
        return null;
      }

      const nextHours = [...hoursSet, hour].sort((a, b) => a - b);

      if (!isContiguous(nextHours)) {
        return { fieldIdx, resourceIdx, hours: [hour], date: dateKey };
      }

      return { ...prev, hours: nextHours };
    });
  };

  {/* 單日多場地表格 */ }
  function tableByDate() {
    console.log("fieldChecked in tableByDate:", fieldChecked);

    return (
      <div ref={tableRef} className="overflow-x-auto rounded-2xl ">
        <table className="min-w-full border-collapse shadow-sm text-center text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 w-32 z-30 px-4 py-2 border whitespace-nowrap border-gray-300 bg-blue-100">
                {t("時段")}
              </th>

              {fields.map((field, idx) => {
                const isSelected = fieldChecked?.idx === idx;

                return (
                  <th
                    id={`field-column-${idx}`}
                    key={field.id ?? idx}
                    onClick={() => handleFieldClick(field.name, field.isSchool, field.pict)}
                    className="px-4 py-2 border whitespace-nowrap cursor-pointer border-gray-300 bg-blue-100"
                  >
                    <div
                      className={`${isSelected ? "bg-blue-800" : "bg-blue-400"} text-white text-xl px-4 py-1 rounded-full transition-transform hover:scale-110 shadow-md inline-block`}
                    >
                      {field.name}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {HOURS.map((h) => {
              const start = formatDateTime(h, { input: "hour" }).time;
              const end = formatDateTime(h + 1, { input: "hour" }).time;
              const isLunch = h === 0; // 之後依需求改成訂單判斷

              return (
                <tr key={h} className={isLunch ? "bg-gray-50" : "bg-white"}>
                  {/* 左側時段欄 */}
                  <td className="sticky left-0 w-32 z-20 font-semibold px-4 py-3 border whitespace-nowrap border-gray-300 bg-blue-50 text-center">
                    {start} - {end}
                  </td>

                  {/* 每個場地一格 */}
                  {fields.map((field, colIdx) => {
                    const resources = Array.isArray(field.resources) ? field.resources : [];
                    const count = resources.length;

                    return (
                      <td key={field.id ?? colIdx} className="px-3 py-3 border border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          {Array.from({ length: count }, (_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectSlot({ fieldIdx: colIdx, resourceIdx: i, hour: h, date: baseDate })}
                              className={`${selectedSlots?.fieldIdx === colIdx &&
                                selectedSlots?.resourceIdx === i &&
                                Array.isArray(selectedSlots?.hours) &&
                                selectedSlots.hours.includes(h)
                                ? "bg-blue-600 text-white"
                                : isLunch
                                  ? "bg-gray-200 text-gray-500"
                                  : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                } w-8 h-10 rounded-full font-semibold flex items-center justify-center transition`}
                              title={translate("第 {value0} 面場地 / {value1}-{value2}", { value0: i + 1, value1: start, value2: end })}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  {/* 七日單場地表格 */}
  function tableByPlace() {
    return (
      <div ref={tableRef} className="overflow-x-auto rounded-2xl ">
        <table className="min-w-full border-collapse shadow-sm text-center text-sm">
          <thead>
            <tr>
              <th className="sticky text-lg left-0 z-30 px-4 py-2 border whitespace-nowrap border-gray-300 bg-blue-100">
                {fieldChecked ? fields[fieldChecked.idx].name : t("場地")}
              </th>

              {sevenDays.map((day, idx) => {
                return (
                  <th
                    id={`day-column-${idx}`}
                    key={idx}
                    className={`px-4 py-2 border whitespace-nowrap cursor-pointer border-gray-300 ${idx === 3 ? "bg-blue-400" : "bg-blue-100"}`}
                  >
                    <div
                      className={`flex text-center justify-center text-lg`}
                    >
                      {formatDate(day)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {!fieldChecked ? (
              <tr>
                <td
                  colSpan={sevenDays.length + 1}
                  className="font-bold text-2xl px-4 py-16 text-center align-middle text-gray-500 border border-gray-300"
                >
                  {t("請先選擇場地")}
                </td>
              </tr>
            ) : (
              HOURS.map((h) => {
                const start = formatDateTime(h, { input: "hour" }).time;
                const end = formatDateTime(h + 1, { input: "hour" }).time;
                const isLunch = h === 20; // 之後依需求改成訂單判斷

                return (
                  <tr key={h} className={isLunch ? "bg-gray-50" : "bg-white"}>
                    {/* 左側時段欄 */}
                    <td className="sticky left-0 z-20 font-semibold px-4 py-3 border whitespace-nowrap border-gray-300 bg-blue-50 text-center">
                      {start} - {end}
                    </td>

                    {/* 每個日期一格 */}
                    {sevenDays.map((day, colIdx) => (
                      <td key={colIdx} className="px-3 py-3 border border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          {Array.from(
                            { length: fields[fieldChecked.idx].resources.length },
                            (_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() =>
                                  handleSelectSlot({
                                    fieldIdx: fieldChecked.idx,
                                    resourceIdx: i,
                                    hour: h,
                                    date: day,
                                  })
                                }
                                className={`${
                                  selectedSlots?.fieldIdx === fieldChecked.idx &&
                                  selectedSlots?.resourceIdx === i &&
                                  selectedSlots?.date === day.toISOString().slice(0, 10) &&
                                  Array.isArray(selectedSlots?.hours) &&
                                  selectedSlots.hours.includes(h)
                                    ? "bg-blue-600 text-white"
                                    : isLunch
                                    ? "bg-gray-200 text-gray-500"
                                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                } w-8 h-10 rounded-full font-semibold flex items-center justify-center transition`}
                              >
                                {i + 1}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-center">
        <button
          onClick={() => setViewMode(viewMode === "byDate" ? "byPlace" : "byDate")}
          className="bg-blue-500 md:bg-blue-300 my-4 px-4 py-1 rounded text-white hover:bg-blue-500 transition"
        >
          {t("切換為")} {viewMode === "byDate" ? t("單場地七日") : t("單日多場地")}
        </button>
      </div>
      <div className="mx-2 md:mx-18">
        {viewMode === "byDate" ? tableByDate() : tableByPlace()}
      </div>

      {/* 底部選取資訊與完成預約按鈕 */}
      {selectedSlots?.hours?.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full flex items-center px-2 md:px-16 pb-5 z-50">
          <div className="bg-blue-100 text-blue-700 px-4 py-2 border border-gray-300 rounded-lg shadow-xl font-semibold">
            {(() => {
              const startHour = Math.min(...selectedSlots.hours);
              const endHour = Math.max(...selectedSlots.hours) + 1;
              return translate("你已選擇：{value0} - {value1}", { value0: formatDateTime(startHour, { input: "hour" }).time, value1: formatDateTime(endHour, { input: "hour" }).time });
            })()}
            <br />
            {translate("場地：{value0} / 第 {value1} 面", { value0: fields[selectedSlots.fieldIdx].name, value1: selectedSlots.resourceIdx + 1 })}
          </div>

          <div className="flex-1" />

          <button
            onClick={() => {
              const startHour = Math.min(...selectedSlots.hours);
              const endHour = Math.max(...selectedSlots.hours) + 1;

              navigate(`/pay`, {
                state: {
                  fieldIdx: selectedSlots.fieldIdx,
                  resourceIdx: selectedSlots.resourceIdx,
                  date: formatDateTime(new Date()).numericDate,
                  timeRange: `${formatDateTime(startHour, { input: "hour" }).time} - ${formatDateTime(endHour, { input: "hour" }).time}`,
                  hours: selectedSlots.hours.length,
                },
              });
            }}
            className="bg-green-500 text-white w-[150px] md:px-8 py-2.5 border-gray-300 rounded-lg shadow-xl hover:bg-green-600 transition font-semibold"
          >
            {t("完成預約")}
          </button>
        </div>
      )
      }
    </>
  );
}

export default SelectFieldSection;
