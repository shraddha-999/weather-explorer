import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { getWeatherFileContent, listWeatherFiles, storeWeatherData } from "./api.js";

vi.mock("./api.js", () => ({
  storeWeatherData: vi.fn(),
  listWeatherFiles: vi.fn(),
  getWeatherFileContent: vi.fn(),
}));

function fillAndSubmitForm() {
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2024-01-01" } });
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: "2024-01-05" } });
  fireEvent.click(screen.getByRole("button", { name: /fetch & store data/i }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("App", () => {
  it("shows the empty state when no files are stored yet", async () => {
    listWeatherFiles.mockResolvedValue([]);

    render(<App />);

    expect(await screen.findByText(/no files stored yet/i)).toBeInTheDocument();
  });

  it("runs the full store → list → visualize flow on submit", async () => {
    listWeatherFiles.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { name: "weather_new.json", size: 100, created_at: "2024-01-01T00:00:00Z" },
    ]);
    storeWeatherData.mockResolvedValue({ status: "ok", file: "weather_new.json" });
    getWeatherFileContent.mockResolvedValue({
      daily: { time: ["2024-01-01"], temperature_2m_max: [25], temperature_2m_min: [15] },
      daily_units: { temperature_2m_max: "°C" },
    });

    render(<App />);
    await screen.findByText(/no files stored yet/i);

    fillAndSubmitForm();

    await waitFor(() => expect(storeWeatherData).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/stored as/i)).toBeInTheDocument();
    expect(await screen.findAllByText("weather_new.json")).not.toHaveLength(0);
    expect(await screen.findByText("2024-01-01")).toBeInTheDocument();
  });

  it("shows an error message when storing fails", async () => {
    listWeatherFiles.mockResolvedValue([]);
    storeWeatherData.mockRejectedValue(new Error("date range must not exceed 31 days"));

    render(<App />);
    await screen.findByText(/no files stored yet/i);

    fillAndSubmitForm();

    expect(await screen.findByText(/date range must not exceed 31 days/i)).toBeInTheDocument();
  });
});
