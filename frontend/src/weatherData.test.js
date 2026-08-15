import { describe, expect, it } from "vitest";
import { temperatureUnit, toDailyRows } from "./weatherData.js";

describe("toDailyRows", () => {
  it("reshapes parallel daily arrays into one row per date", () => {
    const weatherJson = {
      daily: {
        time: ["2024-01-01", "2024-01-02"],
        temperature_2m_max: [20, 22],
        temperature_2m_min: [10, 11],
        apparent_temperature_max: [21, 23],
        apparent_temperature_min: [9, 10],
      },
    };

    expect(toDailyRows(weatherJson)).toEqual([
      { date: "2024-01-01", tempMax: 20, tempMin: 10, feelsMax: 21, feelsMin: 9 },
      { date: "2024-01-02", tempMax: 22, tempMin: 11, feelsMax: 23, feelsMin: 10 },
    ]);
  });

  it("fills missing values with null instead of throwing", () => {
    const weatherJson = { daily: { time: ["2024-01-01"] } };

    expect(toDailyRows(weatherJson)).toEqual([
      { date: "2024-01-01", tempMax: null, tempMin: null, feelsMax: null, feelsMin: null },
    ]);
  });

  it("returns an empty array when there is no daily data", () => {
    expect(toDailyRows({})).toEqual([]);
    expect(toDailyRows(null)).toEqual([]);
  });
});

describe("temperatureUnit", () => {
  it("reads the unit Open-Meteo reports", () => {
    expect(temperatureUnit({ daily_units: { temperature_2m_max: "°F" } })).toBe("°F");
  });

  it("falls back to celsius when units are missing", () => {
    expect(temperatureUnit({})).toBe("°C");
  });
});
