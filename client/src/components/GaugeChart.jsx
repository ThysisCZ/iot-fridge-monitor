import { cn } from "@/lib/utils";

const START_DEG = 210;
const SWEEP_DEG = 240;

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

// Clockwise arc (decreasing angle in math convention = clockwise on screen)
function arcPath(cx, cy, r, startDeg, sweepDeg) {
  if (sweepDeg <= 0) return "";
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, startDeg - sweepDeg);
  const large = sweepDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function GaugeChart({
  value,
  min,
  max,
  unit,
  label,
  ticks = [],
  isAlert = false,
  className,
}) {
  const CX = 85,
    CY = 76,
    R = 54,
    SW = 10;

  const valid = Number.isFinite(value);
  const ratio = valid
    ? Math.max(0, Math.min(1, (value - min) / (max - min)))
    : 0;

  const color = isAlert ? "#EF4444" : "#3B82F6";

  const trackPath = arcPath(CX, CY, R, START_DEG, SWEEP_DEG);
  const fillPath =
    ratio > 0.001 ? arcPath(CX, CY, R, START_DEG, ratio * SWEEP_DEG) : null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg viewBox="0 0 170 122" className="w-full max-w-[160px]">
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={SW}
          strokeLinecap="round"
        />

        {/* Fill */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={SW}
            strokeLinecap="round"
          />
        )}

        {/* Tick marks + labels */}
        {ticks.map((tick) => {
          const tr = (tick - min) / (max - min);
          const deg = START_DEG - tr * SWEEP_DEG;
          const inn = polar(CX, CY, R - SW / 2, deg);
          const out = polar(CX, CY, R + SW / 2, deg);
          const lp = polar(CX, CY, R + SW / 2 + 12, deg);
          const cosVal = Math.cos((deg * Math.PI) / 180);
          const anchor =
            cosVal < -0.25 ? "start" : cosVal > 0.25 ? "end" : "middle";
          return (
            <g key={tick}>
              <line
                x1={inn.x}
                y1={inn.y}
                x2={out.x}
                y2={out.y}
                stroke="#D1D5DB"
                strokeWidth={1.5}
              />
              <text
                x={lp.x}
                y={lp.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize="8"
                fill="#9CA3AF"
              >
                {tick}
                {unit}
              </text>
            </g>
          );
        })}

        {/* Current value */}
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="21"
          fontWeight="700"
          fill={valid ? color : "#9CA3AF"}
        >
          {valid
            ? `${value.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} ${unit}`
            : `— ${unit}`}
        </text>
      </svg>

      <p className="text-xs text-muted-foreground -mt-3">{label}</p>
    </div>
  );
}
