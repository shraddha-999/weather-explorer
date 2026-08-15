function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function FileList({ files, loading, error, selected, onSelect, onRefresh }) {
  return (
    <div className="bg-white rounded-lg border border-ink/10 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Stored files</h2>
        <button
          onClick={onRefresh}
          className="text-xs text-accent hover:underline"
          type="button"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-ink/50">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{error}</p>
      )}
      {!loading && !error && files.length === 0 && (
        <p className="text-sm text-ink/50">No files stored yet — fetch some weather data first.</p>
      )}

      <ul className="max-h-64 overflow-y-auto divide-y divide-ink/10">
        {files.map((file) => (
          <li key={file.name}>
            <button
              type="button"
              onClick={() => onSelect(file.name)}
              className={`w-full text-left px-2 py-2 rounded text-sm transition-colors ${
                selected === file.name ? "bg-accent/10 text-accent" : "hover:bg-ink/5"
              }`}
            >
              <div className="font-mono text-xs break-all">{file.name}</div>
              <div className="text-xs text-ink/50 mt-0.5">
                {formatBytes(file.size)} · {formatDate(file.created_at)}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
