import { useTranslation } from "../../locale/i18n";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoPersonCircle } from "react-icons/io5";
import { Link } from "react-router-dom";
import { logoutService } from "../../service/authService";
import { errorPopup } from "../../components/pop-up";
import { describeRequestError } from "../../utils/requestError";
import './navbar.css';

function Navbar() {
  const t = useTranslation();
  const handleLogout = async (event) => {
    event.preventDefault();
    try {
      await logoutService();
      window.location.assign("/");
    } catch (error) {
      const failure = describeRequestError(error);
      errorPopup(failure.title, failure.message);
    }
  };
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2>{t("common.internalNavigation.headings.ntustVenueBooking")}</h2>
      </div>
      <ul className="navbar-center">
        <li><Link to="/ntust/home/">{t("common.actions.venue")}</Link></li>
        <li><Link to="/ntust/order">{t("common.actions.myBookings")}</Link></li>
      </ul>
      <div className="navbar-right dropdown">
        <div className="icon-container">
          <GiHamburgerMenu className="menu-icon" />
          <IoPersonCircle className="person-icon" />
        </div>
        <div className="dropdown-content">
          <Link to="/ntust/home/">{t("common.actions.venue")}</Link>
          <Link to="/ntust/order">{t("common.actions.myBookings")}</Link>
          <a href="/" onClick={handleLogout}>{t("common.internalNavigation.messages.logout")}</a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
