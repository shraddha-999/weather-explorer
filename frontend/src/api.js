const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function parseOrThrow(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function storeWeatherData({ latitude, longitude, startDate, endDate }) {
  const response = await fetch(`${API_BASE_URL}/store-weather-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      latitude: Number(latitude),
      longitude: Number(longitude),
      start_date: startDate,
      end_date: endDate,
    }),
  });
  return parseOrThrow(response);
}

export async function listWeatherFiles() {
  const response = await fetch(`${API_BASE_URL}/list-weather-files`);
  const data = await parseOrThrow(response);
  return data.files;
}

export async function getWeatherFileContent(fileName) {
  const response = await fetch(`${API_BASE_URL}/weather-file-content/${encodeURIComponent(fileName)}`);
  return parseOrThrow(response);
}
