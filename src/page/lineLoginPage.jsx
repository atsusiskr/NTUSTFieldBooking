import { useTranslation } from "../locale/i18n";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
import Loading from "../components/loading";
import { loginWithLineService } from "../service/authService";
import { consumeLineTransaction, getLineRedirectUri, startLineAuthorization } from "../service/lineAuthorization";
import { describeRequestError } from "../utils/requestError";
import { useSportStore } from "../store/sportStore";

export function LineAuthorizationPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const started = useRef(false);
  const sportId = useSportStore((state) => state.sportId);
  const setSportId = useSportStore((state) => state.setSportId);
  const [error, setError] = useState("");
  const [externalOpened, setExternalOpened] = useState(false);

  useEffect(() => {
    // React StrictMode may run this effect twice; the authorization code is single use.
    if (started.current) return;
    started.current = true;

    const completeLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const returnedState = params.get("state");
      const lineError = params.get("error");

      if (!code && !lineError) {
        if (liff.isInClient()) {
          const liffId = process.env.REACT_APP_LIFF_ID;
          if (!liffId) throw new Error(t("lineLoginPage.messages.reactAppLiffIdSettings"));
          await liff.init({ liffId });
          liff.openWindow({ url: getLineRedirectUri(), external: true });
          setExternalOpened(true);
          return;
        }
        await startLineAuthorization();
        return;
      }

      // Remove the one-time code from browser history before calling the backend.
      window.history.replaceState(window.history.state, "", window.location.pathname);
      if (lineError) {
        consumeLineTransaction(returnedState);
        throw new Error(t("lineLoginPage.errors.cancelledLineLoginPleaseRetry"));
      }

      const { redirectUri, codeVerifier, nonce } = consumeLineTransaction(returnedState);
      await loginWithLineService({ code, redirectUri, codeVerifier, nonce });
      if (!sportId) setSportId("badminton");
      navigate("/external/pickup", { replace: true });
    };

    completeLogin().catch((reason) => {
      const failure = reason.response
        ? describeRequestError(reason, {
          401: { title: t("lineLoginPage.errors.lineLoginFailed"), message: t("lineLoginPage.errors.lineFailed") },
          404: { title: t("lineLoginPage.errors.lineLoginFailed"), message: t("lineLoginPage.errors.lineLoginNotYetSettings") },
        })
        : { message: reason.message || t("lineLoginPage.errors.currentCannotLineLoginPleaseLater") };
      setError(failure.message);
    });
  }, [navigate, setSportId, sportId, t]);

  if (!error && !externalOpened) return <Loading isLoading text={t("lineLoginPage.messages.line")} />;

  if (externalOpened) return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-100 to-blue-300 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-xl font-bold text-gray-800">{t("lineLoginPage.headings.pleaseLineLogin")}</h1>
        <a href={getLineRedirectUri()} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block rounded-lg bg-[#06C755] px-5 py-2 font-semibold text-white">
          {t("lineLoginPage.messages.openLineLogin")}
        </a>
      </div>
    </main>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-100 to-blue-300 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-xl font-bold text-gray-800">{t("lineLoginPage.headings.lineLoginFailed")}</h1>
        <p role="alert" className="mt-3 text-sm text-gray-600">{error}</p>
        <button type="button" onClick={() => navigate("/", { replace: true })} className="mt-6 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700">
          {t("lineLoginPage.actions.backToLogin")}
        </button>
      </div>
    </main>
  );
}

export default LineAuthorizationPage;
