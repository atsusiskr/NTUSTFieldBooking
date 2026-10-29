import { useTranslation, translate } from "../../locale/i18n";
import { useEffect, useState } from "react";
import Loading from "../../components/loading";
import Navbar from "../components/navbar";
import { useParams } from "react-router-dom";
import Calendar from "../../components/dayPicker/dayPick";
import NearbyMap from "../components/nearbyMap";
import VenueBookingCards from "../components/VenueBookingCards";
import api from "../../baseApi";
import { earliestBookingDate } from "../utils/bookingWindow";
import { sportService } from "../../service/sportService";
import { findVenueSport, resourcesForSport, resourceTypeForSport } from "../utils/venueSportFilter";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { useSportStore } from "../../store/sportStore";
import { describeRequestError } from "../../utils/requestError";

export default function VenuePage() {
  const { fieldType } = useParams();
  const sportId = useSportStore((state) => state.sportId);
  const selection = sportId || (fieldType && fieldType !== "all" ? fieldType : null) || "badminton";
  return <VenuePageContent key={selection} selection={selection} />;
}

function VenuePageContent({ selection }) {
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [filteredFields, setFilteredFields] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(earliestBookingDate);
  const [selectedVenueId, setSelectedVenueId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadFields = async () => {
      setLoading(true);
      setError(false);
      setSelectedVenueId(null);
      setFilteredFields([]);
      try {
        const sportResponse = await sportService.getSportList();
        if (cancelled) return;
        const sportItems = Array.isArray(sportResponse?.items) ? sportResponse.items : [];
        const sport = findVenueSport(sportItems, selection);
        const resourceType = resourceTypeForSport(sport);
        if (!sport || !resourceType) throw new Error(translate("無法辨識選取的球類"));
        setSelectedSport(sport);
        const res = await api.get("/locations");
        const token = localStorage.getItem("token");
        const filteredField = await Promise.all(
          (res.data?.items || []).map(async (loc) => {
            const resource = await api.get("/resources", {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              params: { location_id: loc.id, resource_type: resourceType },
            });
            const matchingResources = resourcesForSport(resource.data?.items, sport);
            if (matchingResources.length === 0) return null;
            const detail = await api.get(`/locations/${loc.id}`);

            return {
              ...loc,
              ...detail.data,
              resources: matchingResources,
            }
          })
        )
        if (!cancelled) {
          setFilteredFields(filteredField.filter(Boolean));
        }
      }
      catch (error) {
        if (!cancelled) setError(describeRequestError(error).message);
      }
      finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadFields();
    return () => { cancelled = true; };
  }, [selection]);

  const dates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(selectedDate);
    day.setDate(day.getDate() + index);
    return day;
  });

  return (
    <div className="app-page text-slate-900">
      <Navbar />
      <Loading isLoading={loading} text={t("載入場地資料中...")} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-center my-8">{t("場地預約")}</h1>
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3"><NearbyMap key={selectedSport?.id} fields={filteredFields} onConfirmPlace={({ place }) => {
          if (place?.id == null) return;
          setSelectedVenueId(place.id);
          requestAnimationFrame(() => document.getElementById("venue-booking-section")?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }} /></div>
        <section aria-label={t("選擇預約日期")} className="mb-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t("選擇日期")}</h2>
            <Calendar align="end" selectedDate={selectedDate} onDayPicked={({ date }) => setSelectedDate(date)} />
          </div>
          <p className="mb-4 text-sm text-slate-600">{t("需提前 7 天預約，最早可選")} {formatDateTime(earliestBookingDate()).numericDate}。</p>
          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[560px] grid-cols-7 gap-2">
            {dates.map((date) => {
              const selected = date.toDateString() === selectedDate.toDateString();
              return <button key={date.toDateString()} type="button" aria-pressed={selected} onClick={() => setSelectedDate(date)}
                className={`rounded-xl border px-3 py-3 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${selected ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white hover:border-blue-400"}`}>
                <span className="block text-xs">{formatDateTime(date).weekday}</span>
                <span className="mt-1 block text-lg font-bold">{formatDateTime(date).monthDay}</span>
              </button>;
            })}
            </div>
          </div>
        </section>
        {error && <section role="alert" className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 sm:p-6">{t("場地資料載入失敗：")}{error}</section>}
        {!loading && !error && filteredFields.length === 0 && <section role="status" aria-label={t("場地搜尋結果")} className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 text-slate-600 shadow-sm sm:p-6">{t("目前沒有提供")}{selectedSport?.name}{t("場面的場館。")}</section>}
      </main>
      {!loading && !error && filteredFields.length > 0 && <VenueBookingCards key={selectedSport?.id} fields={filteredFields} selectedDate={selectedDate} selectedVenueId={selectedVenueId} sportFilter={selectedSport?.id} />}
    </div>
  );
}
