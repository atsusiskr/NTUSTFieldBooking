import { useTranslation } from "../../locale/i18n";
import Navbar from "../components/navbar";
import { FaArrowLeft } from "react-icons/fa";
import "./bookingpage.css";
import Calendar from "../../components/dayPicker/dayPick";
import { useState } from "react";
import { useParams } from "react-router-dom";
import VenuePicker from "../../components/venuePicker";
import { formatDateTime } from "../../utils/dateTimeFormat";

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

function Bookpage() {
  const t = useTranslation();
    const { name, isSchool, pict } = useParams();
    const imgUrl = '/venue_img/' + pict;
    const [activeTab, setActiveTab] = useState("info");
    const [isOpen, setIsOpen] = useState(true);
    const [selectedVenue, setSelectedVenue] = useState(null);

    const [selectedSlots, setSelectedSlots] = useState({ venueKey: null, times: [] });

    const courts = [1, 2, 3];

    const toggleSlot = (venueKey, timeIndex) => {
        setSelectedSlots((prev) => {
            const { venueKey: prevKey, times } = prev;

            if (!prevKey || prevKey !== venueKey) {
                return { venueKey, times: [timeIndex] };
            }

            if (times.includes(timeIndex)) {
                return { venueKey, times: times.filter((t) => t !== timeIndex) };
            }

            const min = Math.min(...times);
            const max = Math.max(...times);
            const isAdjacent = timeIndex === min - 1 || timeIndex === max + 1;

            if (!isAdjacent) {
                return { venueKey, times: [timeIndex] };
            }

            return { venueKey, times: [...times, timeIndex].sort((a, b) => a - b) };
        });
    };

    return (

        <div className="booking-page">
            <Navbar />
            <div className="flex w-[150px] gap-2.5 items-end m-5 md:ml-[50px]">
                <button onClick={() => window.history.back()} className="flex items-center gap-2.5 text-xl text-gray-500 hover:text-black transition-colors duration-300">
                    <FaArrowLeft />
                    {t("common.actions.backToVenues")}
                </button>
            </div>

            <div className="main-container px-4">

                {/* 左側 */}
                <div className="left-panel">
                    <div className="venue-board flex justify-center">
                        {isSchool === 'true' ? (
                            <img src={imgUrl} alt={t("internalBookingPage.images.venue")} className="venue-image" />
                        ) : (
                            <VenuePicker
                                venueName={name}
                                selectedId={selectedVenue}
                                onSelectVenue={({ id }) => setSelectedVenue(id)}
                            />
                        )}
                    </div>
                    <div className="md:px-[50px]">
                        <h2 className="flex justify-self-start text-3xl font-medium">{name}</h2>
                        <p className="venue-description">{t("internalBookingPage.messages.yourTennisBasketballBadminton")}
                        </p>
                    </div>
                    {/* Tabs */}
                    <div className="tab-container w-full min-width 260px max-w-[450px] mx-auto m-3 flex justify-center gap-7 border border-gray-200 rounded-lg">
                        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>{t("internalBookingPage.actions.venueInfo")}</button>
                        <button className={`tab ${activeTab === 'rule' ? 'active' : ''}`} onClick={() => setActiveTab('rule')}>{t("internalBookingPage.actions.items")}</button>
                        <button className={`tab ${activeTab === 'facility' ? 'active' : ''}`} onClick={() => setActiveTab('facility')}>{t("internalBookingPage.actions.facilities")}</button>
                    </div>

                    {/* Info */}
                    {activeTab === 'info' && (
                        <div className="info-section">
                            <div className="info-card">
                                <div className="icon">👥</div>
                                <div className="text">
                                    <div className="label">{t("internalBookingPage.messages.peopleCount")}</div>
                                    <div className="value">{t("internalBookingPage.messages.people")}</div>
                                </div>
                            </div>
                            <div className="info-card">
                                <div className="icon">🕒</div>
                                <div className="text">
                                    <div className="label">{t("common.messages.openingHours")}</div>
                                    <div className="value">08:10 - 22:00</div>
                                </div>
                            </div>
                            <div className="info-card">
                                <div className="icon">📍</div>
                                <div className="text">
                                    <div className="label">{t("internalBookingPage.messages.location")}</div>
                                    <div className="value">{t("internalBookingPage.messages.t4")}</div>
                                </div>
                            </div>
                            <div className="info-card">
                                <div className="icon">ℹ️</div>
                                <div className="text">
                                    <div className="label">{t("internalBookingPage.messages.venueStatus")}</div>
                                    <div
                                        className={`value ${isOpen ? 'status-open' : 'status-closed'}`}
                                        onClick={() => setIsOpen(!isOpen)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {isOpen ? t("internalBookingPage.messages.open") : t("common.messages.close")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'rule' && (
                        <div className="rule-section">
                            <ol className="rule-list">
                                <li>{t("internalBookingPage.messages.venue")}</li>
                                <li>{t("internalBookingPage.messages.pleaseVenuePeople")}</li>
                                <li>{t("internalBookingPage.messages.bookingPlease")}</li>
                                <li>{t("internalBookingPage.messages.dayOrVenueVenueClose")}</li>
                            </ol>
                        </div>
                    )}

                    {activeTab === 'facility' && (
                        <div className="facility-section">
                            <div className="facility-list">
                                <div className="facility-card">{t("internalBookingPage.messages.basketballX2")}</div>
                                <div className="facility-card">{t("internalBookingPage.messages.spectatorSeats")}</div>
                                <div className="facility-card">{t("internalBookingPage.messages.lockerRoom")}</div>
                                <div className="facility-card">{t("internalBookingPage.messages.showerRoom")}</div>
                                <div className="facility-card">{t("internalBookingPage.messages.noneFacilities")}</div>
                            </div>
                        </div>
                    )}
                </div>
                {/* 預約section */}
                <div className="right-panel">
                    <h4>{t("internalBookingPage.headings.venueTimeSlotAmount")}</h4>
                    <p>{t("internalBookingPage.messages.selectDateAndTimeBooking")}</p>
                    <div class="w-full mt-5 flex justify-center items-center">
                        <Calendar />
                    </div>

                    <div className="overflow-x-auto xl:overflow-visible mt-[20px] mb-[100px] border border-gray-100 rounded-lg shadow-neutral-800 w-full xl:w-auto mx-auto">
                        <table className="w-full min-w-[900px] md:w-full rounded-lg border-collapse shadow-sm text-center text-sm mx-auto">
                            <thead className="bg-blue-100 text-gray-700 text-lg">
                                <tr>
                                    <th className="px-2 py-2 font-semibold sticky left-0 bg-blue-100 min-w-[80px] text-sm">
                                        {t("internalBookingPage.labels.time")}
                                    </th>

                                    {Array.from({ length: 7 }).map((_, i) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() + i);
                                        return (
                                            <th
                                                key={i}
                                                className="px-3 py-2 border border-gray-300 whitespace-nowrap"
                                            >
                                                {formatDateTime(d).shortDate}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>

                            <tbody>
                                {HOURS.map((hour) => {
                                    const timeIndex = hour - OPEN_HOUR;
                                    return (
                                        <tr key={hour} className="hover:bg-gray-50 transition">
                                            <td className="px-2 py-2 border border-gray-300 sticky left-0 bg-blue-50 text-sm z-50">
                                                {`${formatDateTime(hour, { input: "hour" }).time} - ${formatDateTime(hour + 1, { input: "hour" }).time}`}
                                            </td>

                                            {Array.from({ length: 7 }).map((_, i) => {
                                                const date = new Date();
                                                date.setDate(date.getDate() + i);
                                                const dateKey = date.toISOString().split("T")[0];

                                                // 你原本的示範：12 點那格滿
                                                const isFull = hour === 12;

                                                return (
                                                    <td key={i} className="px-2 py-2 border border-gray-300">
                                                        <div className="flex justify-center gap-2">
                                                            {/* 桌機版：顯示每面球場按鈕 */}
                                                            {courts.map((court) => {
                                                                const venueKey = `${court}-${name}-${dateKey}`;
                                                                const isSelected =
                                                                    selectedSlots.venueKey === venueKey &&
                                                                    selectedSlots.times.includes(timeIndex);

                                                                return (
                                                                    <button
                                                                        key={court}
                                                                        disabled={isFull}
                                                                        onClick={() => !isFull && toggleSlot(venueKey, timeIndex)}
                                                                        className={`hidden md:table-cell w-8 h-10 rounded-full font-medium transition
                                                                            ${isFull
                                                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                                                : isSelected
                                                                                    ? "bg-blue-600 text-white"
                                                                                    : "bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white"}
                                                                        `}
                                                                    >
                                                                        {court}
                                                                    </button>
                                                                );
                                                            })}

                                                            {/* 手機版：跟單日多場地一致，用一顆按鈕確認此時段 */}
                                                            {(
                                                                <button
                                                                    disabled={isFull}
                                                                    onClick={() => {
                                                                        const venueKey = `${name}-${dateKey}`;
                                                                        if (!isFull) toggleSlot(venueKey, timeIndex);
                                                                    }}
                                                                    className={`md:hidden text-xs font-semibold px-2 py-1 rounded-md shadow transition
                                                                        ${isFull
                                                                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                                            : (selectedSlots.venueKey === `${name}-${dateKey}` && selectedSlots.times.includes(timeIndex))
                                                                                ? "bg-blue-600 text-gray-100"
                                                                                : "bg-blue-100 text-blue-600"}
                                                                    `}
                                                                >
                                                                    {isFull ? t("internalBookingPage.actions.full") : t("internalBookingPage.actions.confirmThisTimeSlot")}
                                                                </button>
                                                            )}
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
                </div>
            </div>
        </div>
    );
}

export default Bookpage;
