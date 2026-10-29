import { translate } from "../locale/i18n";

export const isValidBirthDate = (birthDate) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;
  const [year, month, day] = birthDate.split("-").map(Number);
  const parsedBirthDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsedBirthDate.getFullYear() === year
    && parsedBirthDate.getMonth() === month - 1
    && parsedBirthDate.getDate() === day
    && parsedBirthDate <= today;
};

export const normalizePhoneNumber = (phone) => phone.trim().replace(/[\s()-]/g, "");

export const isValidPhoneNumber = (phone) => {
  if (typeof phone !== "string") return false;
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return true;
  return /^(?:09\d{8}|\+8869\d{8}|0[2-8]\d{7,8})$/.test(normalized);
};

export const validateRegister = ({ name, username, gender, birth_date, email, password, confirmPassword }, t = translate) => {
  const error = (key) => t(`registerPage.errorMessage.${key}`);
  if (!name || !username || !gender || !birth_date || !email || !password || !confirmPassword) return error("requiredFields");
  if (!/^[a-zA-Z0-9]+$/.test(username)) return error("usernameInvalid");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("emailInvalid");
  if (!["male", "female", "other"].includes(gender)) return error("genderInvalid");
  if (!isValidBirthDate(birth_date)) return error("birthDateInvalid");
  if (password !== confirmPassword) return error("passwordMismatch");
  if (password.length < 8) return error("passwordTooShort");
  return null;
};

export const validateLineRegistration = ({ name, username, gender, birth_date, email }, t = translate) => {
  const error = (key) => t(`registerPage.errorMessage.${key}`);
  if (!name || !username || !gender || !birth_date) return error("requiredFields");
  if (!/^[a-zA-Z0-9]+$/.test(username)) return error("usernameInvalid");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("emailInvalid");
  if (!["male", "female", "other"].includes(gender)) return error("genderInvalid");
  if (!isValidBirthDate(birth_date)) return error("birthDateInvalid");
  return null;
};
