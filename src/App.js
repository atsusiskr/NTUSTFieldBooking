import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './page/loginPage';
import RegisterPage from './page/registerPage';
import LineLoginPage from './page/lineLoginPage';
import LineDemoPage from './page/lineDemoPage';
import { isLineDemoMode } from './config/lineMode';
import ScrollToTop from './page/scrollToTop';
import NTUSTApp from './route/InternalRoute';
import OutsideApp from './route/ExternalRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/line-login" element={isLineDemoMode ? <LineDemoPage /> : <LineLoginPage />} />
          <Route path="/ntust/*" element={<NTUSTApp />} />
          <Route path="/external/*" element={<OutsideApp />} />

          <Route path="*" element={<div>沒有這東西</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
