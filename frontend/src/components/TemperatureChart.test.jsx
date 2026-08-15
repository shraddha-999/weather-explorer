import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TemperatureChart from "./TemperatureChart.jsx";

describe("TemperatureChart", () => {
  it("prompts for a file when there are no rows", () => {
    render(<TemperatureChart rows={[]} unit="°C" />);

    expect(screen.getByText(/select a stored file/i)).toBeInTheDocument();
  });

  it("shows a friendly message instead of a broken chart when every value is null", () => {
    const rows = [
      { date: "2024-01-01", tempMax: null, tempMin: null, feelsMax: null, feelsMin: null },
      { date: "2024-01-02", tempMax: null, tempMin: null, feelsMax: null, feelsMin: null },
    ];

    render(<TemperatureChart rows={rows} unit="°C" />);

    expect(screen.getByText(/no temperature data available/i)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /temperature line chart/i })).not.toBeInTheDocument();
  });

  it("renders the chart when at least some values are present", () => {
    const rows = [
      { date: "2024-01-01", tempMax: 20, tempMin: 10, feelsMax: 21, feelsMin: 9 },
      { date: "2024-01-02", tempMax: null, tempMin: null, feelsMax: null, feelsMin: null },
    ];

    render(<TemperatureChart rows={rows} unit="°C" />);

    expect(screen.getByRole("img", { name: /temperature line chart/i })).toBeInTheDocument();
  });
});
