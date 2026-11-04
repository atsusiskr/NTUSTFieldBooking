import { useTranslation } from "../../locale/i18n";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoPersonCircle } from "react-icons/io5";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { logoutService } from "../../service/authService";
import { errorPopup } from "../../components/pop-up";
import { describeRequestError } from "../../utils/requestError";
import { getUserProfile } from "../../service/userService";
import { notificationService } from "../../service/notificationService";
import { sportService } from "../../service/sportService";
import { useSportStore } from "../../store/sportStore";
import { findVenueSport } from "../utils/venueSportFilter";
import SportSwitcher from "./SportSwitcher";
import './navbar.css';

function Navbar() {
  const t = useTranslation();
  const { sportType, id: locationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sportId = useSportStore((state) => state.sportId);
  const setSportId = useSportStore((state) => state.setSportId);
  const [sports, setSports] = useState([]);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unread, setUnread] = useState({ count: 0, exact: true });
  const dropdownRef = useRef(null);

  const currentType = sportId || (sportType && sportType !== "all" ? sportType : null) || "badminton";
  const selectedSport = findVenueSport(sports, currentType);
  const pathname = location.pathname;
  const activeSection = pathname === "/external/pickup" ? "pickup"
    : pathname === "/external/venue" || pathname.startsWith("/external/venue/") || locationId || pathname === "/external/pay" ? "venue"
      : pathname === "/external/notification" ? "notification"
        : pathname.startsWith("/external/order") ? "orders" : null;
  const isActive = (section) => activeSection === section;

  useEffect(() => {
    let active = true;
    sportService.getSportList()
      .then((response) => {
        if (active) setSports(Array.isArray(response?.items) ? response.items : []);
      })
      .catch(() => {
        if (active) setSports([]);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedSport) return;
    if (sportId !== selectedSport.id) setSportId(selectedSport.id);
    if (sportType && sportType !== selectedSport.id) {
      navigate(`/external/venue/${selectedSport.id}`, { replace: true });
    }
  }, [sportType, navigate, selectedSport, setSportId, sportId]);

  const handleSportChange = (sport) => {
    setSportId(sport.id);
    setIsMenuOpen(false);
    if (sportType || locationId || location.pathname === "/external/pay") {
      navigate(`/external/venue/${sport.id}`);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getUserProfile()
      .then((profile) => {
        if (isMounted) setUser(profile);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const closeMenuWhenClickOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", closeMenuWhenClickOutside);
    return () => document.removeEventListener("mousedown", closeMenuWhenClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const loadUnread = async () => {
      const currentRequest = ++requestId;
      try {
        const count = await notificationService.getUnreadCount();
        if (active && currentRequest === requestId) setUnread({ count, exact: true });
      } catch {
        try {
          const list = await notificationService.getList({ page: 1, pageSize: 20 });
          const count = list.items.filter((item) => !item.is_read).length;
          if (active && currentRequest === requestId) setUnread({ count, exact: false });
        } catch {
          if (active && currentRequest === requestId) setUnread({ count: 0, exact: false });
        }
      }
    };
    loadUnread();
    const timer = window.setInterval(loadUnread, 60000);
    window.addEventListener("focus", loadUnread);
    window.addEventListener("notifications:changed", loadUnread);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", loadUnread);
      window.removeEventListener("notifications:changed", loadUnread);
    };
  }, []);

  // 安全登出流程
  const handleLogout = async (e) => {
    e.preventDefault(); 
    setIsMenuOpen(false);
    try {
      await logoutService();
      window.location.assign("/");
    } catch (error) {
      const failure = describeRequestError(error);
      errorPopup(failure.title, failure.message);
    }
  };

  const hasUnread = unread.count > 0;
  const notificationLabel = hasUnread
    ? unread.exact ? t("通知，{count} 則未讀", { count: unread.count }) : t("通知，有未讀通知")
    : t("通知");
  const badge = hasUnread && <span className="notification-badge" aria-hidden="true">{unread.exact ? unread.count > 99 ? "99+" : unread.count : ""}</span>;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2>{t("打球租與揪系統")}</h2>
      </div>
      
      {/* central menu */}
      <ul className="navbar-center">
        <li className={isActive("pickup") ? "is-active" : undefined}><Link className={isActive("pickup") ? "is-active" : undefined} aria-current={isActive("pickup") ? "page" : undefined} to="/external/pickup">{t("臨打")}</Link></li>
        <li className={isActive("venue") ? "is-active" : undefined}><Link className={isActive("venue") ? "is-active" : undefined} aria-current={isActive("venue") ? "page" : undefined} to={`/external/venue/${currentType}`}>{t("場地")}</Link></li>
        <li className={isActive("notification") ? "is-active" : undefined}><Link className={`nav-notification-link${isActive("notification") ? " is-active" : ""}`} aria-current={isActive("notification") ? "page" : undefined} aria-label={notificationLabel} to="/external/notification">{t("通知")}{badge}</Link></li>
        <li className={isActive("orders") ? "is-active" : undefined}><Link className={isActive("orders") ? "is-active" : undefined} aria-current={pathname === "/external/order" ? "page" : undefined} to="/external/order">{t("我的預約")}</Link></li>
      </ul>
      
      <div className="navbar-actions">
      <div className="navbar-sport-desktop"><SportSwitcher id="navbar-sport-desktop" sports={sports} selectedSport={selectedSport} onSelect={handleSportChange} /></div>
      <div ref={dropdownRef} className={`navbar-right dropdown ${isMenuOpen ? "is-open" : ""}`}>
        <button
          type="button"
          className="icon-container"
          aria-label={hasUnread ? t("選單，有未讀通知") : t("選單")}
          aria-expanded={isMenuOpen}
          aria-controls="user-menu"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          <GiHamburgerMenu className="menu-icon" />
          <span className="nav-avatar">
            <IoPersonCircle className="person-icon" />
            {(user?.avatar_thumbnail || user?.avatar) && (
              <img
                src={user.avatar_thumbnail || user.avatar}
                alt={t("使用者頭像")}
                onError={(event) => { event.currentTarget.style.display = "none"; }}
              />
            )}
          </span>
          {hasUnread && <span className="notification-menu-dot" aria-hidden="true" />}
        </button>
        
        {/* dropdown content */}
        <div id="user-menu" className="dropdown-content">
          <div className="dropdown-profile">
            <span className="dropdown-avatar">
              <IoPersonCircle />
              {user?.avatar && <img src={user.avatar_thumbnail || user.avatar} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            </span>
            <div>
              <p>{user?.display_name || t("使用者")}</p>
              {user?.username && <span className="dropdown-username">@{user.username}</span>}
            </div>
          </div>
          <div className="dropdown-links">
            <div className="navbar-sport-mobile"><SportSwitcher id="navbar-sport-mobile" sports={sports} selectedSport={selectedSport} onSelect={handleSportChange} restoreFocusOnSelect={false} /></div>
            <Link className={isActive("pickup") ? "is-active" : undefined} aria-current={isActive("pickup") ? "page" : undefined} onClick={() => setIsMenuOpen(false)} to="/external/pickup">{t("臨打")}</Link>
            <Link className={isActive("venue") ? "is-active" : undefined} aria-current={isActive("venue") ? "page" : undefined} onClick={() => setIsMenuOpen(false)} to={`/external/venue/${currentType}`}>{t("場地")}</Link>
            <Link className={`nav-notification-link${isActive("notification") ? " is-active" : ""}`} aria-current={isActive("notification") ? "page" : undefined} aria-label={notificationLabel} onClick={() => setIsMenuOpen(false)} to="/external/notification">{t("通知")}{badge}</Link>
            <Link className={pathname === "/external/order" ? "is-active" : undefined} aria-current={pathname === "/external/order" ? "page" : undefined} onClick={() => setIsMenuOpen(false)} to="/external/order">{t("我的預約")}</Link>
            <Link className={pathname === "/external/order/history" ? "is-active" : undefined} aria-current={pathname === "/external/order/history" ? "page" : undefined} onClick={() => setIsMenuOpen(false)} to="/external/order/history">{t("歷史預約")}</Link>
            <Link className={pathname === "/external/user" ? "is-active" : undefined} aria-current={pathname === "/external/user" ? "page" : undefined} onClick={() => setIsMenuOpen(false)} to="/external/user">{t("個人資料")}</Link>
          </div>
          <a className="logout-link" href="/" onClick={handleLogout}>{t("登出")}</a>
        </div>
      </div>
      </div>
    </nav>
  );
}

export default Navbar;
