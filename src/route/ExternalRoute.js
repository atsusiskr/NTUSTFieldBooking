import { Routes, Route } from 'react-router-dom';
import VenuePage from '../external/page/VenuePage';
import BookingPage from '../external/page/BookingPage';
import PayPage from '../external/page/PayPage';
import OrderPage from '../external/page/OrderPage';
import HistoryOrderPage from '../external/page/HistoryOrderPage';
import PickUpPage from '../external/page/PickUpPage';
import { NotificationPage } from '../external/page/NotificationPage';
import { UserPage } from '../external/page/UserPage';
import HostApplyPage from "../external/page/HostApplyPage";

function OutsideApp() {
  return (
    <Routes>
      <Route path="/home/:sportType" element={<VenuePage />} />
      <Route path="/:id/" element={<BookingPage />} />
      <Route path="/group" element={<PickUpPage />} />
      <Route path='/pay' element={<PayPage />} />
      <Route path='/order' element={<OrderPage />} />
      <Route path='/order/history' element={<HistoryOrderPage />} />
      <Route path='/announce' element={<NotificationPage />} />
      <Route path="/apply-host" element={<HostApplyPage />} />
      <Route path='/user' element={<UserPage />} />
    </Routes>
  );
}

export default OutsideApp;
