import { Navigate, Routes, Route, useParams } from 'react-router-dom';
import VenuePage from '../external/page/VenuePage';
import BookingPage from '../external/page/BookingPage';
import PayPage from '../external/page/PayPage';
import OrderPage from '../external/page/OrderPage';
import HistoryOrderPage from '../external/page/HistoryOrderPage';
import PickUpPage from '../external/page/PickUpPage';
import ManagePickUpPage from '../external/page/ManagePickUpPage';
import { NotificationPage } from '../external/page/NotificationPage';
import { UserPage } from '../external/page/UserPage';
import HostApplyPage from "../external/page/HostApplyPage";

function LegacyVenueRedirect() {
  const { sportType } = useParams();
  return <Navigate to={`/external/venue/${sportType}`} replace />;
}

function OutsideApp() {
  return (
    <Routes>
      <Route path="/venue" element={<VenuePage />} />
      <Route path="/venue/:sportType" element={<VenuePage />} />
      <Route path="/:id/" element={<BookingPage />} />
      <Route path="/pickup" element={<PickUpPage />} />
      <Route path="/pickup/manage" element={<ManagePickUpPage />} />
      <Route path="/home" element={<Navigate to="/external/venue" replace />} />
      <Route path="/home/:sportType" element={<LegacyVenueRedirect />} />
      <Route path="/group" element={<Navigate to="/external/pickup" replace />} />
      <Route path='/pay' element={<PayPage />} />
      <Route path='/order' element={<OrderPage />} />
      <Route path='/order/history' element={<HistoryOrderPage />} />
      <Route path='/notification' element={<NotificationPage />} />
      <Route path='/announce' element={<Navigate to="/external/notification" replace />} />
      <Route path="/apply-host" element={<HostApplyPage />} />
      <Route path='/user' element={<UserPage />} />
    </Routes>
  );
}

export default OutsideApp;
