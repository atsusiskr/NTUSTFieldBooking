import { useState, useEffect, useRef } from "react";

import Navbar from "../components/navbar";
import Loading from "../../components/loading";
import GroupNearbyMap from "../components/pickUp/pickUpNearbyMap";
import PickUpFilterSection from "../components/pickUp/pickUpFilterSection";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { errorPopup, successPopup } from "../../components/pop-up";
import PickUpDetailPopUp from "../components/pickUp/pickUpDetailPopUp";
import SkillLevelPrompt from "../components/pickUp/SkillLevelPrompt";
import JoinGroupDialog from "../components/pickUp/JoinGroupDialog";
import CreatePickUpDialog from "../components/pickUp/CreatePickUpDialog";
import { isGroupExpired, isRegistrationClosed } from "../pickUpTiming";
import { describePickUpJoinError } from "../pickUpJoinError";
import { getUpcomingConfirmedOrders } from "../orderDisplay";

import { facilityMap, functionIconMap, InfoIconMap, sportIconMap } from "../../constant/IconMap";
import { statusMap } from "../../constant/statusMap";
import { zhTWDictionary } from "../../locale/zh-TW/translate";
import { pickUpService } from "../../service/pickUpService";
import { skillLevelService } from "../../service/skillLevelService";
import { useSportStore } from "../../store/sportStore";
import { describeRequestError } from "../../utils/requestError";

const isMissingSkillLevelError = (error) => error?.response?.status === 400
    && /^skill level not set for this sport\b/i.test(String(error?.response?.data?.error || ""));
const PAGE_SIZES = [10, 20, 50];


export default function PickUpPage() {
    const sportTypeId = useSportStore((state) => state.sportId);
    if (!sportTypeId) return <div className="app-page text-slate-900"><Navbar /><Loading isLoading text="載入球類資料中..." /></div>;
    // 切換球類時重設頁碼、程度篩選與報名狀態，舊請求由各 effect 清理。
    return <PickUpPageContent key={sportTypeId} sportTypeId={sportTypeId} />;
}

function PickUpPageContent({ sportTypeId }) {
    const [groups, setGroups] = useState([]);
    const [myPickUpOrders, setMyPickUpOrders] = useState([]);
    const [myOrdersError, setMyOrdersError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("distance");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [pageInfo, setPageInfo] = useState({ total: 0, hasNext: false, pageSize: PAGE_SIZES[0] });
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [isDetailModalClosing, setIsDetailModalClosing] = useState(false);
    const [levels, setLevels] = useState([]);
    const [myLevelStatus, setMyLevelStatus] = useState("checking");
    const [levelDialogDismissed, setLevelDialogDismissed] = useState(false);
    const [selectedMyLevel, setSelectedMyLevel] = useState("");
    const [savingMyLevel, setSavingMyLevel] = useState(false);
    const [myLevelSaveError, setMyLevelSaveError] = useState("");
    const [pendingJoinRequest, setPendingJoinRequest] = useState(null);
    const [joinDialogGroup, setJoinDialogGroup] = useState(null);
    const [joiningGroupId, setJoiningGroupId] = useState(null);
    const joinInFlight = useRef(false);
    const [levelRange, setLevelRange] = useState(null);
    const [appliedLevelRange, setAppliedLevelRange] = useState(null);
    const [levelsLoading, setLevelsLoading] = useState(true);
    const [levelsError, setLevelsError] = useState("");
    const [levelsRetry, setLevelsRetry] = useState(0);

    let userPosition = null;
    try {
        userPosition = JSON.parse(localStorage.getItem("currentPosition") || "null");
    } catch {
        // 尚未定位或快取損壞時，仍可按時間及程度查詢。
    }
    const latitude = userPosition?.lat;
    const longitude = userPosition?.lng;
    const hasPosition = Number.isFinite(latitude) && Number.isFinite(longitude);
    const minSkillLevel = appliedLevelRange?.[0];
    const maxSkillLevel = appliedLevelRange?.[1];

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (selectedGroup && isGroupExpired(selectedGroup, now)) setSelectedGroup(null);
        if (joinDialogGroup && (isRegistrationClosed(joinDialogGroup, now) || isGroupExpired(joinDialogGroup, now))) {
            setJoinDialogGroup(null);
            errorPopup("活動報名已截止", "這個臨打團已超過報名截止時間，無法再報名。");
        }
    }, [now, selectedGroup, joinDialogGroup]);

    useEffect(() => {
        let cancelled = false;
        setMyLevelStatus("checking");
        setLevelDialogDismissed(false);
        setSelectedMyLevel("");
        setMyLevelSaveError("");

        skillLevelService.getMyLevel(sportTypeId).then(() => {
            if (!cancelled) setMyLevelStatus("ready");
        }).catch((error) => {
            if (cancelled) return;
            if (isMissingSkillLevelError(error)) {
                setMyLevelStatus("missing");
            } else {
                console.error("取得個人運動程度失敗:", error);
                setMyLevelStatus("error");
                const failure = describeRequestError(error);
                errorPopup(failure.title, failure.message);
            }
        });

        return () => { cancelled = true; };
    }, [sportTypeId]);

    useEffect(() => {
        let cancelled = false;
        setLevelsLoading(true);
        setLoading(true);
        setLevelsError("");
        setLevels([]);
        setLevelRange(null);
        setAppliedLevelRange(null);

        const request = levelsRetry > 0
            ? skillLevelService.refreshSkillLevels(sportTypeId)
            : skillLevelService.getSkillLevels(sportTypeId);
        request.then((data) => {
            if (cancelled) return;
            setLevels(data);
            const initialRange = data.length ? [data[0].level, data[data.length - 1].level] : null;
            setLevelRange(initialRange);
            setAppliedLevelRange(initialRange);
        }).catch((error) => {
            if (cancelled) return;
            console.error("取得程度表失敗:", error);
            setLevelsError(describeRequestError(error).message);
        }).finally(() => {
            if (!cancelled) setLevelsLoading(false);
        });
        return () => { cancelled = true; };
    }, [sportTypeId, levelsRetry]);

    // 拖曳時先更新顯示，停止操作一小段時間後才查詢球團。
    useEffect(() => {
        if (levelRange?.[0] === appliedLevelRange?.[0]
            && levelRange?.[1] === appliedLevelRange?.[1]) return;
        const timer = window.setTimeout(() => {
            setAppliedLevelRange(levelRange);
            setPage(1);
        }, 350);
        return () => window.clearTimeout(timer);
    }, [levelRange, appliedLevelRange]);

    useEffect(() => {
        if (levelsLoading) return;
        let cancelled = false;
        const fetchGroups = async () => {
            setLoading(true);
            try {
                const data = await pickUpService.getPickUpList({
                    sport_id: sportTypeId,
                    page,
                    page_size: pageSize,
                    latitude: hasPosition ? latitude : undefined,
                    longitude: hasPosition ? longitude : undefined,
                    sort_by: activeFilter === "distance" && !hasPosition ? "start_time" : activeFilter,
                    sort_order: "asc",
                    min_skill_level: minSkillLevel,
                    max_skill_level: maxSkillLevel,
                });
                if (cancelled) return;
                if (data.page !== page) {
                    setPage(data.page);
                    return;
                }
                const lastPage = data.total === null ? null : Math.max(1, Math.ceil(data.total / data.pageSize));
                if (lastPage !== null && page > lastPage) {
                    setPage(lastPage);
                    return;
                }
                if (data.total === null && page > 1 && data.items.length === 0) {
                    setPage(page - 1);
                    return;
                }
                setGroups(data.items);
                setPageInfo({ total: data.total, hasNext: data.hasNext, pageSize: data.pageSize });
            } catch (error) {
                if (cancelled) return;
                console.error("Error fetching groups:", error);
                setGroups([]);
                setPageInfo({ total: 0, hasNext: false, pageSize });
                const failure = describeRequestError(error);
                errorPopup(failure.title, failure.message);

            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchGroups();
        return () => { cancelled = true; };
    }, [sportTypeId, refreshTrigger, activeFilter, page, pageSize, hasPosition, latitude, longitude, minSkillLevel, maxSkillLevel, levelsLoading]);

    useEffect(() => {
        let cancelled = false;
        setMyOrdersError(false);
        pickUpService.getMyPickUpList(true).then((orders) => {
            if (!cancelled) setMyPickUpOrders(orders);
        }).catch((error) => {
            if (cancelled) return;
            console.error("取得近期臨打報名失敗:", error);
            setMyPickUpOrders([]);
            setMyOrdersError(describeRequestError(error).message);
        });
        return () => { cancelled = true; };
    }, [refreshTrigger]);

    const promptForMyLevel = (groupId, payload) => {
        setPendingJoinRequest({ groupId, payload });
        setSelectedMyLevel("");
        setMyLevelSaveError("");
        setMyLevelStatus("missing");
        setLevelDialogDismissed(false);
    };

    const handleJoinGroup = async (groupId, requestPayload = null, skipLevelCheck = false, savedLevel = null) => {
        if (joinInFlight.current) return false;
        const group = groups.find((item) => item.id === groupId) || joinDialogGroup || selectedGroup;
        if (group && (isRegistrationClosed(group) || isGroupExpired(group))) {
            errorPopup("活動報名已截止", "這個臨打團已超過報名截止時間，無法再報名。");
            setJoinDialogGroup(null);
            setNow(Date.now());
            return false;
        }
        joinInFlight.current = true;
        setJoiningGroupId(groupId);

        try {
            let myLevel = savedLevel;
            if (!skipLevelCheck) {
                try {
                    const levelData = await skillLevelService.getMyLevel(sportTypeId);
                    const rawLevel = levelData?.skill_level?.level ?? levelData?.skill_level ?? levelData?.level;
                    myLevel = rawLevel == null || rawLevel === "" ? null : Number(rawLevel);
                    setMyLevelStatus("ready");
                } catch (error) {
                    if (isMissingSkillLevelError(error)) {
                        promptForMyLevel(groupId, requestPayload);
                    } else {
                        const failure = describeRequestError(error);
                        errorPopup(failure.title, failure.message);
                    }
                    return false;
                }
            }

            const payload = requestPayload ? {
                ...requestPayload,
                members: requestPayload.members.map((member, index) => index === 0 && Number.isInteger(myLevel)
                    ? { ...member, skill_level: myLevel } : member),
            } : undefined;
            if (group && (isRegistrationClosed(group) || isGroupExpired(group))) {
                errorPopup("活動報名已截止", "這個臨打團已超過報名截止時間，無法再報名。");
                setJoinDialogGroup(null);
                setNow(Date.now());
                return false;
            }
            try {
                await pickUpService.joinPickUpGroup(groupId, payload);
            } catch (error) {
                if (isMissingSkillLevelError(error)) {
                    promptForMyLevel(groupId, requestPayload);
                    return false;
                }
                throw error;
            }

            setGroups((prevGroups) =>
                prevGroups.map((group) => group.id === groupId ? {
                    ...group, enrolledStatus: "pending",
                    current_enrolled: Number(group.current_enrolled || 0) + (payload?.party_size || 1)
                } : group)
            );

            successPopup("", payload
                ? `已送出 ${payload.party_size} 人的團體報名，請等待主揪確認。`
                : zhTWDictionary.pickUpPage.successMessage.registrationSuccess);
            return true;
        } catch (error) {
            const failure = describePickUpJoinError(error);
            errorPopup(failure.title, failure.message);
            if (failure.closeDialog) setJoinDialogGroup(null);
            if (failure.refresh) setRefreshTrigger((pre) => pre + 1);
            return false;
        } finally {
            joinInFlight.current = false;
            setJoiningGroupId(null);
        }
    };

    const confirmJoinFromDialog = async (groupId, payload) => {
        const joined = await handleJoinGroup(groupId, payload);
        if (joined) {
            setJoinDialogGroup(null);
            setSelectedGroup(null);
            setIsDetailModalClosing(false);
        }
    };

    const handleSaveMyLevel = async (event) => {
        event.preventDefault();
        const level = Number(selectedMyLevel);
        if (!levels.some((item) => item.level === level)) {
            setMyLevelSaveError("請先選擇有效的程度。");
            return;
        }

        setSavingMyLevel(true);
        setMyLevelSaveError("");
        try {
            await skillLevelService.setMyLevel(sportTypeId, level);
            setMyLevelStatus("ready");
            const request = pendingJoinRequest;
            setPendingJoinRequest(null);
            if (request?.groupId) {
                const joined = await handleJoinGroup(request.groupId, request.payload, true, level);
                if (joined) {
                    setJoinDialogGroup(null);
                    setSelectedGroup(null);
                    setIsDetailModalClosing(false);
                }
            } else {
                successPopup("設定成功", "你的運動程度已儲存。");
            }
        } catch (error) {
            setMyLevelSaveError(describeRequestError(error).message);
        } finally {
            setSavingMyLevel(false);
        }
    };

    const openDetailModal = (group) => {
        if (isGroupExpired(group)) return;
        setIsDetailModalClosing(false);
        setSelectedGroup(group);
    };

    const requestJoin = (group) => {
        if (isRegistrationClosed(group) || isGroupExpired(group)) {
            errorPopup("活動報名已截止", "這個臨打團已超過報名截止時間，無法再報名。");
            setNow(Date.now());
            return;
        }
        setJoinDialogGroup(group);
    };

    const closeDetailModal = () => {
        setIsDetailModalClosing(true);
        window.setTimeout(() => {
            setSelectedGroup(null);
            setIsDetailModalClosing(false);
        }, 200);
    };

    const handleContactHost = (host) => {
        const contactUrl = host.contact_url || host.line_url || host.lineUrl;

        if (contactUrl) {
            window.open(contactUrl, "_blank", "noopener,noreferrer");
            return;
        }

        if (host.email) {
            window.location.href = `mailto:${host.email}`;
            return;
        }

        if (host.phone) {
            window.location.href = `tel:${host.phone}`;
        }
    };

    const pageCount = pageInfo.total === null
        ? null : Math.max(1, Math.ceil(pageInfo.total / pageInfo.pageSize));
    const visibleGroups = groups.filter((group) => !isGroupExpired(group, now)
        && (!selectedDate || formatDateTime(group.start_time).date === formatDateTime(selectedDate).date));
    const upcomingOrders = getUpcomingConfirmedOrders(myPickUpOrders, now).filter((order) =>
        String(order.sport?.id || order.pickupGroup?.sport?.id || order.pickupGroup?.sport_id || "") === String(sportTypeId));
    const showPageControls = pageInfo.total === null
        ? page > 1 || pageInfo.hasNext : pageInfo.total > 0;

    return (
        <div className="app-page text-slate-900">
            <Navbar />
            <header className="relative mx-auto my-8 w-[95%] max-w-7xl">
                <h1 className="px-12 text-center text-3xl font-bold">{zhTWDictionary.pickUpPage.title}</h1>
                <button
                    type="button"
                    aria-label="篩選球團"
                    aria-expanded={isMobileFilterOpen}
                    aria-controls="mobile-pickup-filters"
                    onClick={() => setIsMobileFilterOpen((isOpen) => !isOpen)}
                    className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg border border-blue-200 bg-white text-blue-700 shadow-sm transition-opacity duration-300 hover:bg-blue-50 lg:hidden"
                >
                    {functionIconMap.filter.icon}
                </button>
            </header>
            <Loading isLoading={loading || levelsLoading} text={zhTWDictionary.pickUpPage.loadingMessage} />

            {upcomingOrders.length > 0 && <section role="status" aria-label="即將開始的已報名活動" className="mx-auto mb-6 w-[95%] max-w-7xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm sm:p-5">
                <h2 className="text-lg font-bold">提醒：你報名的臨打團將在兩天內開始</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {upcomingOrders.map((order) => <article key={order.id} className="rounded-xl border border-amber-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-bold text-slate-900">{order.title}</h3>
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">已報名</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{formatDateTime(order.start_time).date}・{formatDateTime(order.start_time).time} 至 {formatDateTime(order.end_time).time}</p>
                        <p className="mt-1 text-sm text-slate-600">地點：{order.location?.name || "未指定"}</p>
                        {order.pickupGroup && <button type="button" onClick={() => openDetailModal(order.pickupGroup)} className="mt-3 min-h-10 rounded-lg border border-amber-300 px-3 text-sm font-semibold text-amber-900 hover:bg-amber-100">查看活動資訊</button>}
                    </article>)}
                </div>
            </section>}
            {myOrdersError && <p role="alert" className="mx-auto mb-4 w-[95%] max-w-7xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">近期已報名活動載入失敗：{myOrdersError}<button type="button" onClick={() => setRefreshTrigger((value) => value + 1)} className="ml-2 font-semibold underline">重新載入</button></p>}

            {myLevelStatus === "missing" && levelDialogDismissed && (
                <div className="mx-auto mb-4 flex w-[95%] max-w-7xl items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900" role="status">
                    <span>你還沒有設定這個球類的程度。</span>
                    <button type="button" onClick={() => setLevelDialogDismissed(false)} className="shrink-0 font-bold text-blue-700 underline">設定程度</button>
                </div>
            )}
            {myLevelStatus === "missing" && !levelDialogDismissed && !loading && !levelsLoading && (
                <SkillLevelPrompt
                    levels={levels}
                    levelsError={levelsError}
                    value={selectedMyLevel}
                    onChange={(value) => { setSelectedMyLevel(value); setMyLevelSaveError(""); }}
                    onSave={handleSaveMyLevel}
                    onClose={() => { setPendingJoinRequest(null); setLevelDialogDismissed(true); }}
                    onRetry={() => setLevelsRetry((previous) => previous + 1)}
                    saving={savingMyLevel}
                    saveError={myLevelSaveError}
                />
            )}
            <div className="mx-auto mb-8 w-[95%] max-w-7xl lg:flex lg:items-start lg:gap-6">
                <PickUpFilterSection
                    isMobileOpen={isMobileFilterOpen}
                    onMobileClose={() => setIsMobileFilterOpen(false)}
                    levels={levels}
                    levelRange={levelRange}
                    onLevelChange={setLevelRange}
                    levelsLoading={levelsLoading}
                    levelsError={levelsError}
                    onRetryLevels={() => setLevelsRetry((previous) => previous + 1)}
                    activeFilter={activeFilter}
                    onFilterChange={(filter) => { setActiveFilter(filter); setPage(1); }}
                    selectedDate={selectedDate}
                    onDatePicked={(date) => { setSelectedDate(date); setPage(1); }}
                    onClearDate={() => { setSelectedDate(null); setPage(1); }}
                />

                <main className="min-w-0 flex-1">
                    <GroupNearbyMap groups={visibleGroups} onSelectGroup={openDetailModal} />

                    {/* {顯示臨打團清單} */}
                    {!loading && visibleGroups.length === 0 && (
                        <p className="text-center text-gray-500">
                            {selectedDate ? "此頁沒有符合所選日期的臨打團，請切換頁面查看。" : zhTWDictionary.pickUpPage.groupEmpty}
                        </p>
                    )}
                    <div>
                        {visibleGroups.map((group) => {
                            const isFull = Number(group.current_enrolled || 0) >= Number(group.capacity || 0);
                            const registrationClosed = isRegistrationClosed(group, now);
                            const status = group.enrolledStatus;

                            return (
                                <div key={group.id} className="mx-auto mb-4 p-5 border border-gray-200 rounded-xl shadow-sm bg-white">

                                    {/* 標題與人數狀態 */}
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                <h2 className="min-w-0 max-w-[8em] break-words text-xl font-bold text-gray-900 sm:max-w-96">{group.title}</h2>
                                                <p className="flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-600">
                                                    {sportIconMap[group.sport?.code]?.icon}
                                                    {group.sport?.name || "-"}
                                                </p>
                                                {registrationClosed && <span className="shrink-0 rounded-md bg-red-100 px-2 py-1 text-sm font-semibold text-red-700">報名已截止</span>}
                                            </div>
                                            <p className="break-words text-sm font-semibold text-gray-400">{zhTWDictionary.pickUpPage.label.hostName} {group.host?.display_name || "-"}</p>
                                        </div>

                                        <div className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${isFull ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                            {group.current_enrolled || 0}/{group.capacity || 0} 人
                                        </div>
                                    </div>


                                    {/* 詳細資訊與位置資訊*/}
                                    <div className="my-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                        <div className="flex min-h-20 items-center gap-3 rounded-xl bg-gray-50 px-3 py-3 text-gray-700">
                                            <span className="shrink-0 text-blue-600">{InfoIconMap.time?.icon}</span>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500">{zhTWDictionary.pickUpPage.label.time}</p>
                                                <p className="mt-1 font-semibold text-gray-800">
                                                    {formatDateTime(group.start_time).date}・{formatDateTime(group.start_time).time}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex min-h-20 items-center gap-3 rounded-xl bg-gray-50 px-3 py-3 text-gray-700">
                                            <span className="shrink-0 text-blue-600">{InfoIconMap.location?.icon}</span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-500">{zhTWDictionary.pickUpPage.label.location}</p>
                                                <p className="mt-1 truncate font-semibold text-gray-800">{group.location?.name || "-"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 展示設施*/}
                                    <div className="mb-5">
                                        <p className="text-sm font-medium text-gray-700 mb-2">{zhTWDictionary.pickUpPage.label.facilities}:</p>

                                        <div className="w-fit flex flex-wrap gap-2 p-1 border border-gray-200 rounded-md bg-white relative ">

                                            {group.facilities?.map((facilityKey, index) => {
                                                const facility = facilityMap[facilityKey];
                                                return (
                                                    <span
                                                        key={index}
                                                        className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm border border-gray-200"
                                                    >
                                                        <span className="opacity-60">{facility?.icon}</span>
                                                        <span className="font-medium">{facility?.name}</span>
                                                    </span>
                                                )
                                            })}

                                        </div>
                                    </div>

                                    {/*費用程度標籤與報名按鈕 */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100 gap-4">
                                        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
                                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-base font-medium">{zhTWDictionary.pickUpPage.label.level}: {group.min_skill_level.label || zhTWDictionary.pickUpPage.label.levelNull} {(Number(group.max_skill_level?.level) === Number(group.min_skill_level.level) || !group.max_skill_level?.label) ? "" : "- " + group.max_skill_level?.label}</span>
                                            <span className={`px-3 py-1 my-[auto] rounded-md text-base font-bold border ${(group.fee !== 0) ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-700'}`} >$ {group.fee}</span>

                                        </div>


                                        <div className="flex w-full gap-2 sm:w-auto">
                                            <button
                                                type="button"
                                                onClick={() => openDetailModal(group)}
                                                className="min-h-11 w-2/5 rounded-lg border border-blue-300 px-4 py-2 font-semibold text-blue-600 transition hover:bg-blue-50 sm:w-auto"
                                            >
                                                顯示詳細
                                            </button>

                                            {/* 報名按鈕 */}
                                            <button
                                                disabled={status !== null || isFull || joiningGroupId === group.id}
                                                onClick={() => requestJoin(group)}
                                                className={`min-h-11 flex-1 rounded-lg px-6 py-2 font-bold tracking-wide text-white transition sm:flex-none
                                                    ${(status !== null || isFull || joiningGroupId === group.id) ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}
                                                    ${registrationClosed && status === null && !isFull ? "bg-gray-500" : isFull && status === null ? statusMap.full.class : (statusMap[status]?.class || statusMap.default.class)}`}
                                            >
                                                {status !== null
                                                    ? (statusMap[status]?.label || statusMap.default.label)
                                                    : registrationClosed && !isFull
                                                        ? "報名已截止"
                                                    : isFull
                                                        ? statusMap.full.label
                                                        : statusMap.default.label}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {!loading && (
                        <nav aria-label="臨打團分頁" className="mt-6 mb-22 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                                <label htmlFor="pickup-page-size" className="font-medium">每頁顯示</label>
                                <select
                                    id="pickup-page-size"
                                    value={pageSize}
                                    onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
                                    className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-gray-800"
                                >
                                    {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} 筆</option>)}
                                </select>
                            </div>
                            {showPageControls && (
                                <div className="flex items-center gap-2">
                                    <span className="whitespace-nowrap text-gray-500">
                                        第 {page}{pageCount === null ? "" : ` / ${pageCount}`} 頁
                                        {pageInfo.total === null ? "" : ` · 共 ${pageInfo.total} 筆`}
                                    </span>
                                    <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="min-h-10 rounded-lg border border-gray-300 px-3 font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40">上一頁</button>
                                    <button type="button" onClick={() => setPage((current) => current + 1)} disabled={!pageInfo.hasNext} className="min-h-10 rounded-lg border border-gray-300 px-3 font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40">下一頁</button>
                                </div>
                            )}
                        </nav>
                    )}
                </main>

                {/* 臨打團詳細資訊浮動視窗 */}
                {selectedGroup && (
                    <div
                        className={`fixed inset-0 z-[60] flex items-end bg-black/45 p-0 sm:items-center sm:justify-center sm:p-6 transition-opacity duration-300`}
                        role="presentation"
                        onMouseDown={closeDetailModal}
                    >
                        <PickUpDetailPopUp
                            selectedGroup={selectedGroup}
                            onRequestJoin={requestJoin}
                            joining={joiningGroupId === selectedGroup.id}
                            registrationClosed={isRegistrationClosed(selectedGroup, now)}
                            closeDetailModal={closeDetailModal}
                            isClosing={isDetailModalClosing}
                            onContactHost={handleContactHost}
                        />
                    </div>
                )}

                {joinDialogGroup && <JoinGroupDialog
                    key={joinDialogGroup.id}
                    group={joinDialogGroup}
                    levels={levels}
                    levelsLoading={levelsLoading}
                    levelsError={levelsError}
                    onRetryLevels={() => setLevelsRetry((previous) => previous + 1)}
                    joining={joiningGroupId === joinDialogGroup.id}
                    onClose={() => setJoinDialogGroup(null)}
                    onConfirm={confirmJoinFromDialog}
                />}

                {/* 重新載入按鈕 */}
                <button
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                    className="fixed bottom-4 right-4 z-50 flex items-center justify-center gap-2 bg-gray-700 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                    <div>{functionIconMap.refresh.icon}</div>
                    <span className="font-bold tracking-wider">{zhTWDictionary.pickUpPage.button.refresh}</span>
                </button>

                {/* 開團入口 */}
                <button
                    type="button"
                    onClick={() => setShowCreateDialog(true)}
                    className="fixed bottom-4 left-4 z-50 flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                    {functionIconMap.add.icon}
                    <span className="font-bold tracking-wider">{zhTWDictionary.pickUpPage.button.hostApply}</span>
                </button>

                {showCreateDialog && <CreatePickUpDialog
                    sportId={sportTypeId}
                    levels={levels}
                    levelsLoading={levelsLoading}
                    levelsError={levelsError}
                    onRetryLevels={() => setLevelsRetry((value) => value + 1)}
                    onClose={() => setShowCreateDialog(false)}
                    onCreated={() => {
                        setShowCreateDialog(false);
                        setPage(1);
                        setRefreshTrigger((value) => value + 1);
                        successPopup("建立成功", "臨打團已建立；列表會依目前的篩選條件顯示。");
                    }}
                />}
            </div>
        </div>
    )
}
