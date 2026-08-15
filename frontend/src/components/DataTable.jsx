import { useEffect, useState } from "react";

const PAGE_SIZES = [10, 20, 50];

function fmt(v) {
  return v === null || v === undefined ? "—" : v;
}

export default function DataTable({ rows, unit }) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [rows, pageSize]);

  if (rows.length === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = page * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <div className="bg-white rounded-lg border border-ink/10 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Daily values</h2>
        <label className="text-xs text-ink/60 flex items-center gap-1.5">
          Rows
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-ink/20 rounded px-1.5 py-0.5 text-xs"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink/50 border-b border-ink/10">
              <th className="py-1.5 pr-3">Date</th>
              <th className="py-1.5 pr-3 text-right">Max ({unit})</th>
              <th className="py-1.5 pr-3 text-right">Min ({unit})</th>
              <th className="py-1.5 pr-3 text-right">Feels max</th>
              <th className="py-1.5 text-right">Feels min</th>
            </tr>
          </thead>
          <tbody className="[font-variant-numeric:tabular-nums]">
            {pageRows.map((row) => (
              <tr key={row.date} className="border-b border-ink/5">
                <td className="py-1.5 pr-3">{row.date}</td>
                <td className="py-1.5 pr-3 text-right">{fmt(row.tempMax)}</td>
                <td className="py-1.5 pr-3 text-right">{fmt(row.tempMin)}</td>
                <td className="py-1.5 pr-3 text-right">{fmt(row.feelsMax)}</td>
                <td className="py-1.5 text-right">{fmt(row.feelsMin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-ink/60">
        <span>
          {start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-2 py-1 rounded border border-ink/20 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 rounded border border-ink/20 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
