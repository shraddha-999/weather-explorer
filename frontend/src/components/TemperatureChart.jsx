const WIDTH = 640;
const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

function buildPath(values, xFor, yFor) {
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(v)}`)
    .join(" ");
}

export default function TemperatureChart({ rows, unit }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-ink/10 p-6 text-sm text-ink/50 text-center">
        Select a stored file to plot daily temperatures.
      </div>
    );
  }

  const maxes = rows.map((r) => r.tempMax).filter((v) => v !== null);
  const mins = rows.map((r) => r.tempMin).filter((v) => v !== null);
  const allValues = [...maxes, ...mins];
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const yPad = (dataMax - dataMin) * 0.1 || 1;
  const scaleMin = dataMin - yPad;
  const scaleMax = dataMax + yPad;

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const xFor = (i) =>
    PAD.left + (rows.length === 1 ? plotWidth / 2 : (i / (rows.length - 1)) * plotWidth);
  const yFor = (v) => PAD.top + plotHeight - ((v - scaleMin) / (scaleMax - scaleMin)) * plotHeight;

  const maxPath = buildPath(rows.map((r) => r.tempMax), xFor, yFor);
  const minPath = buildPath(rows.map((r) => r.tempMin), xFor, yFor);

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => scaleMin + t * (scaleMax - scaleMin));

  // Thin out x-axis labels so they don't overlap on longer ranges.
  const labelEvery = Math.ceil(rows.length / 6);
  const xLabels = rows.filter((_, i) => i % labelEvery === 0 || i === rows.length - 1);

  return (
    <div className="bg-white rounded-lg border border-ink/10 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
          Daily temperature ({unit})
        </h2>
        <div className="flex items-center gap-3 text-xs text-ink/60">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-accent" /> Max
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-ink/40" /> Min
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Daily max and min temperature line chart">
        {gridLines.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yFor(v)}
              y2={yFor(v)}
              stroke="currentColor"
              className="text-ink/10"
              strokeWidth="1"
            />
            <text x={PAD.left - 6} y={yFor(v) + 3} textAnchor="end" fontSize="9" className="fill-ink/40">
              {v.toFixed(0)}
            </text>
          </g>
        ))}

        {xLabels.map((row) => {
          const i = rows.indexOf(row);
          return (
            <text
              key={row.date}
              x={xFor(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize="9"
              className="fill-ink/40"
            >
              {row.date.slice(5)}
            </text>
          );
        })}

        <path d={maxPath} fill="none" stroke="#146b5e" strokeWidth="2" />
        <path d={minPath} fill="none" stroke="#16232a66" strokeWidth="2" />

        {rows.map((r, i) => (
          <g key={r.date}>
            {r.tempMax !== null && <circle cx={xFor(i)} cy={yFor(r.tempMax)} r="2.2" fill="#146b5e" />}
            {r.tempMin !== null && <circle cx={xFor(i)} cy={yFor(r.tempMin)} r="2.2" fill="#16232a66" />}
          </g>
        ))}
      </svg>
    </div>
  );
}
