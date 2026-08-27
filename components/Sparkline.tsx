/**
 * 단색 스파크라인. 언급 추이와 낙찰가 추이가 같이 쓴다.
 * 상승·하락을 색으로 칠하지 않는다 — 가격을 빨강/파랑으로 물들이는 순간
 * 이 화면이 투기 도구가 된다.
 */
export default function Sparkline({
  values,
  width = 96,
  height = 26,
  label,
}: {
  values: number[];
  width?: number;
  height?: number;
  label?: string;
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 2;

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path className="sparkArea" d={area} />
      <path className="sparkLine" d={line} />
      <circle className="sparkDot" cx={last[0]} cy={last[1]} r={2} />
    </svg>
  );
}
