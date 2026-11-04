import { useTranslation } from "../../locale/i18n";
import { useEffect, useState } from "react";
import Loading from "../../components/loading";
import Navbar from "../components/navbar";
import { useParams } from "react-router-dom";
import SelectVenueSection from "../components/SelectVenueSection";
import Calendar from "../../components/dayPicker/dayPick";
import api from "../../baseApi";

function Homepage() {
  const t = useTranslation();
  const { token } = useParams();
  const [loading, setLoading] = useState(false);
  const [resourceType, setResourceType] = useState("all");
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    let cancelled = false;

    const loadVenues = async () => {
      setLoading(true);
      try {
        const res = await api.get("/locations", {
          params: { organization_id: "7e5c364a-db8b-4aff-939b-c6648f59cfaa" },
        });
        const filteredVenue = await Promise.all(
          res.data.items.map(async (loc) => {
            const resource = await api.get("/resources", {
              headers: { Authorization: `Bearer ${token}` },
              params: { location_id: loc.id, resource_type: resourceType === "all" ? undefined : resourceType }
            })

            if (resource.data.items.length === 0) return null;

            return {
              ...loc,
              resources: resource.data.items
            }
          })
        )
        if (!cancelled) {
          setFilteredVenues(filteredVenue.filter(Boolean));
        }
      }
      catch (error) {
      }
      finally {
        if (!cancelled) {
          setLoading(false);
        }

      }
    }
    loadVenues();
  }, [resourceType, token]);

  return (
    <div className="homepage">
      <Navbar />
      <Loading isLoading={loading} text={t("載入場地資料中...")} />
      <div className="flex flex-col md:flex-row justify-center items-center m-4 gap-4">
        <div className="flex text-xl font-semibold">
          {t("預約日期 :")}
        </div>
        <Calendar onDayPicked={({ date }) => {
          setSelectedDate(date);
        }} />
      </div>

      <div className="w-full flex justify-center flex-wrap gap-5 my-4">
        {["全部", "球場", "教室", "自習室", "大草地"].map(type => (
          <button
            type="button"
            key={type}
            onClick={() => setResourceType(type)}
            className={`px-4 py-2 mt-3 rounded-md text-white transition ${resourceType === type ? "bg-blue-700" : "bg-blue-400 hover:bg-blue-600"
              }`}
          >
            {t(type)}
          </button>
        ))}
      </div>

      <div>
        <SelectVenueSection token={token} venues={filteredVenues} selectedDate={selectedDate} />
      </div>
    </div>
  );
}

export default Homepage;
