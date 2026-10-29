import { useTranslation, translate } from "../../locale/i18n";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../baseApi";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { describeRequestError } from "../../utils/requestError";

function SelectFieldSection({ token, fields, fieldChecked = null, selectedDate}) {
  const t = useTranslation();
  const navigate = useNavigate();
  const [selectedSlots, setSelectedSlots] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  const tableRef = useRef(null);
  const OPEN_HOUR = 8;
  const CLOSE_HOUR = 22;
  const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
  const baseDate = selectedDate ? new Date(selectedDate) : new Date();
  const typeMap = {
    "全部": "all",
    "badminton" : "羽球場",
    "tennis": "網球場",
    "basketball": "籃球場",
    "volleyball": "排球場",
    "football": "足球場",
    "other": "其他"
  }

  const dateKeyLocal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const parseApiDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value !== "string") return null;

    const hasTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
    if (hasTz) {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const s = value.includes(" ") ? value.replace(" ", "T") : value;

    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const da = Number(m[3]);
    const hh = Number(m[4]);
    const mm = Number(m[5]);
    const ss = m[6] ? Number(m[6]) : 0;
    const d = new Date(y, mo, da, hh, mm, ss, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setBookingsError(null);
        setBookingsLoading(true);

        const center = selectedDate ? new Date(selectedDate) : new Date();
        const start = new Date(center);
        start.setDate(center.getDate() - 3);
        start.setHours(0, 0, 0, 0);
        const end = new Date(center);
        end.setDate(center.getDate() + 3);
        end.setHours(23, 59, 59, 999);

        const res = await api.get("/bookings", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: {
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          },
        });

        const items = res?.data?.items ?? res?.data ?? [];
        setBookings(Array.isArray(items) ? items : []);
      } catch (err) {
        setBookingsError(err);
        setBookings([]);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, [token, selectedDate]);

  const bookedMap = useMemo(() => {
    const map = {};

    for (const b of bookings) {
      if (!b) continue;
      if (b.status === "cancelled") continue;

      const resourceId = b.resource_id ?? b?.resource?.id;
      if (!resourceId) continue;

      const start = parseApiDate(b.start_time);
      const end = parseApiDate(b.end_time);
      if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

      const key = dateKeyLocal(start);
      if (!map[resourceId]) map[resourceId] = {};
      if (!map[resourceId][key]) map[resourceId][key] = new Set();

      const cur = new Date(start);
      cur.setMinutes(0, 0, 0);

      while (cur < end) {
        map[resourceId][key].add(cur.getHours());
        cur.setHours(cur.getHours() + 1);
      }
    }

    return map;
  }, [bookings]);

  const handleFieldClick = (fieldId) => {
    navigate(`/${fieldId}/`);
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
    const dateKey = date ? dateKeyLocal(new Date(date)) : null;
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
                    onClick={() => handleFieldClick(field.id)}
                    className="px-4 py-2 border whitespace-nowrap cursor-pointer border-gray-300 bg-blue-100"
                  >
                    <div
                      className={`${isSelected ? "bg-blue-800" : "bg-blue-400"} text-white text-xl px-4 py-1 rounded-full transition-transform hover:scale-110 shadow-md inline-block`}
                    >
                      {field.name}-{t(typeMap[field.resources[0].resource_type])}
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

              return (
                <tr key={h} className="bg-white">
                  {/* 左側時段欄 */}
                  <td className="sticky left-0 w-32 z-20 font-semibold px-4 py-3 border whitespace-nowrap border-gray-300 bg-blue-50 text-center">
                    {start} - {end}
                  </td>

                  {/* 每個場地一格 */}
                  {fields.map((field, colIdx) => {
                    const resources = Array.isArray(field.resources) ? field.resources : [];

                    return (
                      <td key={field.id ?? colIdx} className="px-3 py-3 border border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          
                            <button
                              type="button"
                              disabled={(() => {
                                const resourceId = resources?.[0]?.id;
                                if (!resourceId) return true;
                                const key = dateKeyLocal(baseDate);
                                return bookedMap?.[resourceId]?.[key]?.has(h) || false;
                              })()}
                              onClick={() => {
                                const resourceId = resources?.[0]?.id;
                                if (!resourceId) return;
                                const key = dateKeyLocal(baseDate);
                                const isBooked = bookedMap?.[resourceId]?.[key]?.has(h) || false;
                                if (isBooked) return;
                                handleSelectSlot({ fieldIdx: colIdx, resourceIdx: 0, hour: h, date: baseDate });
                              }}
                              className={`${(() => {
                                const resourceId = resources?.[0]?.id;
                                const key = dateKeyLocal(baseDate);
                                const isBooked = resourceId ? (bookedMap?.[resourceId]?.[key]?.has(h) || false) : true;
                                if (isBooked) return "bg-gray-300 text-gray-500 cursor-not-allowed";
                                if (
                                  selectedSlots?.fieldIdx === colIdx &&
                                  Array.isArray(selectedSlots?.hours) &&
                                  selectedSlots.hours.includes(h)
                                ) {
                                  return "bg-blue-600 text-white";
                                }
                                return "bg-blue-100 text-blue-600 hover:bg-blue-200";
                              })()} w-20 h-10 rounded-xl font-semibold flex items-center justify-center transition`}
                            >
                              {(() => {
                                const resourceId = resources?.[0]?.id;
                                const key = dateKeyLocal(baseDate);
                                const isBooked = resourceId ? (bookedMap?.[resourceId]?.[key]?.has(h) || false) : true;
                                return isBooked ? "已預約" : resources?.[0]?.price;
                              })()}
                            </button>
                          
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

  return (
    <>
      
      <div className="mx-2 md:mx-18">
        {bookingsLoading && (
          <p className="text-center text-sm text-gray-500 mb-2">{t("載入已預約時段中...")}</p>
        )}
        {bookingsError && (
          <p className="text-center text-sm text-red-600 mb-2">{t("取得已預約時段失敗：")}{describeRequestError(bookingsError).message}</p>
        )}
        {tableByDate()}
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

              navigate(`/ntust/pay`, {
                state: {
                  fieldName: fields[selectedSlots.fieldIdx].name + "-" + t(typeMap[fields[selectedSlots.fieldIdx].resources[0].resource_type]),
                  fieldKey: fields[selectedSlots.fieldIdx].resources[selectedSlots.resourceIdx].id,
                  resourceIdx: selectedSlots.resourceIdx,
                  date: formatDateTime(selectedDate).numericDate,
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
