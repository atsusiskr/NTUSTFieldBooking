import { useTranslation } from "./locale/i18n";
import { useEffect, useState } from "react";
import { refreshSession } from "./baseApi";
import { useAuthStore } from "./store/authStore";
import './App.css';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import LoginPage from './page/loginPage';
import RegisterPage from './page/registerPage';
import LineLoginPage, { LineAuthorizationPage } from './page/lineLoginPage';
import LineDemoPage from './page/lineDemoPage';
import { isLineDemoMode } from './config/lineMode';
import Loading from './components/loading';
import ScrollToTop from './page/scrollToTop';
import NTUSTApp from './route/InternalRoute';
import OutsideApp from './route/ExternalRoute';

function App() {
  const t = useTranslation();
  const token = useAuthStore((state) => state.token);
  const [skipInitialRestore] = useState(() => ["/line-login", "/line/callback"].includes(window.location.pathname));
  const [sessionReady, setSessionReady] = useState(skipInitialRestore);

  useEffect(() => {
    if (skipInitialRestore) return;
    let active = true;
    refreshSession()
      .catch(() => {
        // A missing or expired session leaves the visitor signed out.
      })
      .finally(() => { if (active) setSessionReady(true); });
    return () => { active = false; };
  }, [skipInitialRestore]);

  const authenticated = sessionReady && Boolean(token);
  const loadingPage = <div className="min-h-screen"><Loading isLoading text={t("common.messages.loading")} /></div>;
  const loginPage = !sessionReady ? loadingPage
    : authenticated ? <Navigate to="/external/pickup" replace /> : <LoginPage />;
  const protectedPage = (page) => {
    if (!sessionReady) return loadingPage;
    return authenticated ? page : <Navigate to="/" replace />;
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={loginPage} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/line-login" element={isLineDemoMode ? <LineDemoPage /> : <LineLoginPage />} />
          <Route path="/line/callback" element={<LineAuthorizationPage />} />
          <Route path="/ntust/*" element={protectedPage(<NTUSTApp />)} />
          <Route path="/external/*" element={protectedPage(<OutsideApp />)} />

          <Route path="*" element={<div>{t("common.app.messages.none")}</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
