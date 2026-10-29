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
        <h2>{t("NTUST 場地預約系統")}</h2>
      </div>
      <ul className="navbar-center">
        <li><Link to="/ntust/home/">{t("場地")}</Link></li>
        <li><Link to="/ntust/order">{t("我的預約")}</Link></li>
      </ul>
      <div className="navbar-right dropdown">
        <div className="icon-container">
          <GiHamburgerMenu className="menu-icon" />
          <IoPersonCircle className="person-icon" />
        </div>
        <div className="dropdown-content">
          <Link to="/ntust/home/">{t("場地")}</Link>
          <Link to="/ntust/order">{t("我的預約")}</Link>
          <a href="/" onClick={handleLogout}>{t("登出")}</a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
