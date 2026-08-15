import { useState } from "react";

const DEFAULTS = {
  latitude: "12.9716",
  longitude: "77.5946",
  startDate: "",
  endDate: "",
};

export default function InputPanel({ onSubmit, loading, error, lastStoredFile }) {
  const [values, setValues] = useState(DEFAULTS);

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-ink/10 p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60 mb-3">
        Fetch &amp; store
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Latitude
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            required
            value={values.latitude}
            onChange={(e) => update("latitude", e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Longitude
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            required
            value={values.longitude}
            onChange={(e) => update("longitude", e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Start date
          <input
            type="date"
            required
            value={values.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          End date
          <input
            type="date"
            required
            value={values.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      <p className="text-xs text-ink/50 mt-2">Range is capped at 31 days.</p>

      <button
        type="submit"
        disabled={loading}
        className="mt-3 w-full rounded bg-accent text-white text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
      >
        {loading ? "Fetching…" : "Fetch & Store Data"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
          {error}
        </p>
      )}
      {lastStoredFile && !error && (
        <p className="mt-3 text-sm text-accent bg-accent/10 border border-accent/20 rounded px-2 py-1.5 break-all">
          Stored as <span className="font-mono">{lastStoredFile}</span>
        </p>
      )}
    </form>
  );
}
