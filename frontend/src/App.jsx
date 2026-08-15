import { useCallback, useEffect, useState } from "react";
import InputPanel from "./components/InputPanel.jsx";
import FileList from "./components/FileList.jsx";
import TemperatureChart from "./components/TemperatureChart.jsx";
import DataTable from "./components/DataTable.jsx";
import { storeWeatherData, listWeatherFiles, getWeatherFileContent } from "./api.js";
import { toDailyRows, temperatureUnit } from "./weatherData.js";

export default function App() {
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState(null);
  const [lastStoredFile, setLastStoredFile] = useState(null);

  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedError, setSelectedError] = useState(null);

  const refreshFiles = useCallback(async () => {
    setFilesLoading(true);
    setFilesError(null);
    try {
      const result = await listWeatherFiles();
      setFiles(result);
    } catch (err) {
      setFilesError(err.message);
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  async function handleSelectFile(fileName) {
    setSelectedFile(fileName);
    setSelectedError(null);
    setSelectedContent(null);
    try {
      const content = await getWeatherFileContent(fileName);
      setSelectedContent(content);
    } catch (err) {
      setSelectedError(err.message);
    }
  }

  async function handleStore(values) {
    setStoreLoading(true);
    setStoreError(null);
    try {
      const result = await storeWeatherData(values);
      setLastStoredFile(result.file);
      await refreshFiles();
      await handleSelectFile(result.file);
    } catch (err) {
      setStoreError(err.message);
    } finally {
      setStoreLoading(false);
    }
  }

  const rows = selectedContent ? toDailyRows(selectedContent) : [];
  const unit = selectedContent ? temperatureUnit(selectedContent) : "°C";

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">Weather Explorer</h1>
          <p className="text-sm text-ink/50">Fetch, store, and visualize historical daily weather.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <InputPanel
            onSubmit={handleStore}
            loading={storeLoading}
            error={storeError}
            lastStoredFile={lastStoredFile}
          />
          <FileList
            files={files}
            loading={filesLoading}
            error={filesError}
            selected={selectedFile}
            onSelect={handleSelectFile}
            onRefresh={refreshFiles}
          />
        </div>

        <div className="flex flex-col gap-4">
          {selectedError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {selectedError}
            </p>
          )}
          <TemperatureChart rows={rows} unit={unit} />
          <DataTable rows={rows} unit={unit} />
        </div>
      </main>
    </div>
  );
}
