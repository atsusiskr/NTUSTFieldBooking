import { render, waitFor } from "@testing-library/react";
import LineLoginPage from "./lineLoginPage";
import { loginWithLineService } from "../service/authService";
import { consumeLineTransaction } from "../service/lineAuthorization";
import { getUserProfile } from "../service/userService";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock("@line/liff", () => ({ isInClient: () => false }));
jest.mock("../service/authService", () => ({ loginWithLineService: jest.fn() }));
jest.mock("../service/lineAuthorization", () => ({
  consumeLineTransaction: jest.fn(),
  getLineRedirectUri: jest.fn(),
  startLineAuthorization: jest.fn(),
}));
jest.mock("../service/userService", () => ({ getUserProfile: jest.fn() }));
jest.mock("../components/loading", () => () => <div>Loading</div>);

const renderCallback = () => render(<LineLoginPage />);

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState({}, "", "/line/callback?code=one-time-code&state=returned-state");
  consumeLineTransaction.mockReturnValue({
    redirectUri: "http://localhost:5713/line/callback",
    codeVerifier: "verifier",
    nonce: "nonce",
  });
});

test("a new LINE account opens profile completion", async () => {
  loginWithLineService.mockResolvedValue({ is_new_user: true });

  renderCallback();

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/external/user", {
    replace: true,
    state: { completeLineProfile: true },
  }));
  expect(getUserProfile).not.toHaveBeenCalled();
});

test("an existing LINE account missing required details opens profile completion", async () => {
  loginWithLineService.mockResolvedValue({ is_new_user: false });
  getUserProfile.mockResolvedValue({ gender: null, birth_date: null });

  renderCallback();

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/external/user", {
    replace: true,
    state: { completeLineProfile: true },
  }));
});

test("an existing complete LINE account opens the group page", async () => {
  loginWithLineService.mockResolvedValue({ is_new_user: false });
  getUserProfile.mockResolvedValue({ gender: "female", birth_date: "2000-01-01" });

  renderCallback();

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/external/group", {
    replace: true,
    state: null,
  }));
});
