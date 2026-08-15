// Open-Meteo returns parallel arrays under `daily` (one entry per date, same
// index across variables). This reshapes that into one row per day, which is
// what both the chart and the table want to render.
export function toDailyRows(weatherJson) {
  const daily = weatherJson?.daily;
  if (!daily?.time) return [];

  return daily.time.map((date, i) => ({
    date,
    tempMax: daily.temperature_2m_max?.[i] ?? null,
    tempMin: daily.temperature_2m_min?.[i] ?? null,
    feelsMax: daily.apparent_temperature_max?.[i] ?? null,
    feelsMin: daily.apparent_temperature_min?.[i] ?? null,
  }));
}

export function temperatureUnit(weatherJson) {
  return weatherJson?.daily_units?.temperature_2m_max || "°C";
}
