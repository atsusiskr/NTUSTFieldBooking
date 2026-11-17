import { useState } from "react";
import { useTranslation } from "../../locale/i18n";
import { describeRequestError } from "../../utils/requestError";

const inputClass = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100";

function SetPasswordForm({ existingEmail, onSubmit, onCancel, submitLabel }) {
  const t = useTranslation();
  const [email, setEmail] = useState(existingEmail || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const newEmail = email.trim();
    if (!existingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError(t("userPage.passwordForm.errors.pleaseEnterValidEmail"));
      return;
    }
    if (password.length < 8) {
      setError(t("userPage.passwordForm.errors.passwordAtLeastNeed"));
      return;
    }
    if (password !== confirmation) {
      setError(t("userPage.passwordForm.errors.enterPassword"));
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ email: existingEmail ? undefined : newEmail, password });
    } catch (reason) {
      const failure = describeRequestError(reason, {
        400: { message: t("userPage.passwordForm.errors.pleaseConfirmAndPassword") },
        409: { message: t("userPage.passwordForm.errors.thisAccountAlreadySettingsPasswordCannotSettings") },
      });
      setError(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <label className="block text-sm font-semibold text-slate-700">
        {t("userPage.passwordForm.labels.login")}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          disabled={Boolean(existingEmail) || submitting}
          required={!existingEmail}
          className={inputClass}
        />
      </label>
      {existingEmail && <p className="text-xs text-slate-500">{t("userPage.passwordForm.messages.thisAccountAlready")}</p>}
      <label className="block text-sm font-semibold text-slate-700">
        {t("userPage.passwordForm.labels.settingsPassword")}
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          disabled={submitting}
          required
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        {t("userPage.passwordForm.labels.confirmPassword")}
        <input
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          disabled={submitting}
          required
          className={inputClass}
        />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={submitting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">{t("common.actions.cancel")}</button>
        <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? t("common.actions.saving") : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default SetPasswordForm;
