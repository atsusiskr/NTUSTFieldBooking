import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import CoachGroupPage from "./CoachGroupPage";
import { courseService } from "../../service/courseService";
import { skillLevelService } from "../../service/skillLevelService";

jest.mock("../components/navbar", () => () => <nav>導覽列</nav>);
jest.mock("../../store/sportStore", () => ({ useSportStore: (selector) => selector({ sportId: "sport-demo" }) }));
jest.mock("../../service/courseService", () => ({ courseService: {
  getList: jest.fn(), getAll: jest.fn(), getDetail: jest.fn(), enroll: jest.fn(),
} }));
jest.mock("../../service/skillLevelService", () => ({ skillLevelService: { getSkillLevels: jest.fn() } }));
jest.mock("../../components/pop-up", () => ({ errorPopup: jest.fn(), successPopup: jest.fn() }));

beforeEach(() => {
  skillLevelService.getSkillLevels.mockResolvedValue(Array.from({ length: 15 }, (_, index) => ({ level: index + 1, label: `第 ${index + 1} 級` })));
});

test("demo mode renders courses and details without calling course APIs", async () => {
  await act(async () => { render(<CoachGroupPage />); });
  expect(screen.queryByText("目前顯示示範資料")).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("羽球初級入門體驗")).toBeInTheDocument());
  expect(skillLevelService.getSkillLevels).toHaveBeenCalledWith("sport-demo");
  expect(screen.queryByTestId("course-map")).not.toBeInTheDocument();
  expect(courseService.getList).not.toHaveBeenCalled();
  expect(within(screen.getByRole("region", { name: "教練介紹" })).getAllByRole("button", { name: "查看簡歷" })).toHaveLength(6);
  const firstCard = screen.getByText("羽球初級入門體驗").closest("article");
  expect(firstCard).toHaveTextContent("程度：初級・1–5 級");
  expect(within(firstCard).getByRole("button", { name: "立即報名" })).toBeInTheDocument();
  await act(async () => { fireEvent.click(within(firstCard).getByRole("button", { name: "顯示詳細" })); });
  await waitFor(() => expect(screen.getByRole("dialog", { name: "課程詳細資訊" })).toHaveTextContent("初級握拍"));
  const detail = screen.getByRole("dialog", { name: "課程詳細資訊" });
  expect(detail).toHaveTextContent("場地設施");
  expect(detail).toHaveTextContent("飲水機");
  expect(detail).toHaveTextContent("新羽力附設停車場");
  expect(detail).toHaveTextContent("適合程度");
  const coachSection = within(detail).getByRole("region", { name: "授課教練" });
  expect(coachSection).toHaveTextContent("林雅雯教練");
  expect(within(coachSection).getByRole("link", { name: "聯絡教練" })).toHaveAttribute("href", "mailto:lin.coach@example.com");
  fireEvent.click(within(coachSection).getByRole("button", { name: "查看簡歷" }));
  const bio = screen.getByRole("dialog", { name: "林雅雯教練簡歷" });
  expect(bio).toHaveTextContent("教學經驗");
  expect(bio).toHaveTextContent("初學入門");
  fireEvent.click(within(bio).getByRole("button", { name: "關閉簡歷" }));
  expect(screen.queryByRole("dialog", { name: "林雅雯教練簡歷" })).not.toBeInTheDocument();
  expect(within(detail).getByRole("link", { name: /查看停車場地圖/ })).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
  expect(courseService.getDetail).not.toHaveBeenCalled();
  expect(within(detail).queryByRole("button", { name: "確認報名" })).not.toBeInTheDocument();
  await act(async () => { fireEvent.click(within(detail).getByRole("button", { name: "立即報名" })); });
  const enrollment = screen.getByRole("dialog", { name: "確認課程報名" });
  expect(enrollment).toHaveTextContent("羽球初級入門體驗");
  await act(async () => { fireEvent.click(within(enrollment).getByRole("button", { name: "確認報名" })); });
  expect(courseService.enroll).not.toHaveBeenCalled();
  expect(within(firstCard).getByRole("button", { name: "已報名" })).toBeDisabled();
});

test("registration button opens a separate payment confirmation", async () => {
  await act(async () => { render(<CoachGroupPage />); });
  const paidCard = screen.getByText("雙打輪轉與站位").closest("article");
  fireEvent.click(within(paidCard).getByRole("button", { name: "立即報名" }));
  const enrollment = await screen.findByRole("dialog", { name: "確認課程報名" });
  expect(within(enrollment).getByLabelText("付款方式")).toBeInTheDocument();
  expect(within(enrollment).getByRole("button", { name: "確認報名" })).toBeDisabled();
  fireEvent.change(within(enrollment).getByLabelText("付款方式"), { target: { value: "onsite" } });
  expect(within(enrollment).getByRole("button", { name: "確認報名" })).toBeEnabled();
  expect(within(enrollment).queryByText("場地設施")).not.toBeInTheDocument();
});

test("course filters expand and collapse without changing their values", async () => {
  await act(async () => { render(<CoachGroupPage />); });
  const toggle = screen.getByRole("button", { name: /篩選課程/ });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(document.getElementById("coach-course-filters")).toHaveClass("md:grid-rows-[1fr]");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("篩選程度")).toBeInTheDocument();
  expect(screen.getByText("金額範圍")).toBeInTheDocument();
  await waitFor(() => expect(document.querySelectorAll("[data-hs-range-slider]")).toHaveLength(2));
  const sliders = document.querySelectorAll("[data-hs-range-slider]");
  expect(sliders).toHaveLength(2);
  act(() => {
    sliders[0].noUiSlider.set([6, 15]);
    sliders[1].noUiSlider.set([500, 5000]);
  });
  fireEvent.click(screen.getByRole("button", { name: "套用篩選" }));
  await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "false"));
  await waitFor(() => expect(screen.queryByText("羽球初級入門體驗")).not.toBeInTheDocument());
  expect(screen.getByText("羽球中級步法強化班")).toBeInTheDocument();
  expect(toggle).toHaveTextContent("2");
  fireEvent.click(toggle);
  expect(screen.getByText("第 6 級")).toBeInTheDocument();
  expect(screen.getByText("NT$ 5,000")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "重新整理" })).toHaveClass("fixed", "bottom-4", "right-4");
});

test("courses remain visible when sport level loading fails", async () => {
  skillLevelService.getSkillLevels.mockRejectedValueOnce(new Error("程度服務無法使用"));
  await act(async () => { render(<CoachGroupPage />); });
  await waitFor(() => expect(screen.getByText("羽球初級入門體驗")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "篩選課程" }));
  expect(screen.getByRole("alert")).toHaveTextContent("程度載入失敗");
  expect(screen.getByRole("button", { name: "重試" })).toBeInTheDocument();
});
