import { useTranslation } from "../../../locale/i18n";
import './venuePicker.css';
import layouts from '../venueLayout.json';

function VenuePicker({ venueId, onSelectVenue, selectedId }) {
  const t = useTranslation();
    let layout = null;
    layout = layouts[String(venueId)]

    if (!layout) {
        return <div className="venue-diagram-error">{t("找不到")}{venueId}{t("場地資料")}</div>;
    }

    const vb = { w: 1000, h: 600 };

    const PRICE_RANGE_MAP = {
        "1": "$300-$500",
        "2": "$300-$500",
        "3": "$400-$600",
        "4": "$500-$700",
        "5": "$300-$500",
        "6": "$300-$500",
        "7": "$400-$600",
        "8": "$500-$700",
        "9": "$300-$500",
        "10": "$300-$500",
    };

    const areas = layout.areas;
    const fixtures = Array.isArray(layout.fixtures) && layout.fixtures.length > 0
        ? layout.fixtures
        : defaultFixtures(vb);

    const handlePick = (id) => {
        const nextId = id === selectedId ? null : id;
        onSelectVenue({ id: nextId });
    }

    const getSectorPath = (cx, cy, r, startDeg, endDeg) => {
        const toRad = (deg) => (deg * Math.PI) / 180;
        const x1 = cx + r * Math.cos(toRad(startDeg));
        const y1 = cy + r * Math.sin(toRad(startDeg));
        const x2 = cx + r * Math.cos(toRad(endDeg));
        const y2 = cy + r * Math.sin(toRad(endDeg));
        const largeArcFlag = endDeg - startDeg <= 180 ? 0 : 1;
        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    };

    return (
        <div className="venue-picker" style={{ width: '100%' }}>
            <svg
                viewBox={`0 0 ${vb.w} ${vb.h}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ width: '100%', maxWidth: '1000px', height: 'auto', display: 'block', margin: '0 auto' }}
                role="img"
            >
                {areas.map((a) => {
                    const isSelected = a.id === selectedId;
                    const isDisabled = a.status === 'blocked';
                    const fill = isDisabled ? '#7d7d7dff' : isSelected ? '#3f7cff' : '#d9d9d9';
                    const stroke = isSelected ? 'rgba(63,124,255,0.6)' : 'transparent';
                    const cardSize = (a.hori === true) ? { w: 220, h: 140 } : { w: 140, h: 220 }
                    const priceText = a.priceRange ?? PRICE_RANGE_MAP[String(a.id)] ?? null;

                    return (
                        <g key={a.id}
                            onClick={() => handlePick(a.id)}
                            style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                        >
                            <rect
                                x={a.x} y={a.y} width={cardSize.w} height={cardSize.h}
                                rx={10}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={isSelected ? 6 : 0}
                                vectorEffect="non-scaling-stroke"
                            />

                            {/* 置中文字 */}
                            <text
                                x={a.x + cardSize.w / 2}
                                y={a.y + cardSize.h / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="area-label"
                                fontSize={a.fontSize ?? 28}
                                fill={isDisabled ? '#9e9e9eff' : isSelected ? '#fff' : '#333'}
                            >
                                {a.label ?? a.id}
                            </text>
                            {priceText && (
                                <text
                                    x={a.x + cardSize.w / 2}
                                    y={a.y + cardSize.h / 2 + 34}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="area-price"
                                    fontSize={14}
                                    fill={isDisabled ? '#bdbdbd' : isSelected ? 'rgba(255,255,255,0.9)' : '#555'}
                                >
                                    {priceText}
                                </text>
                            )}

                        </g>
                    );
                })}

                <g pointerEvents="none">
                    {fixtures.map((f, idx) => {
                        const isDoor = f.type === 'door';
                        const fill = f.fill || (isDoor ? '#10c900' : '#666');
                        return (
                            <g key={idx}>
                                {(isDoor) ? (
                                    <path
                                        d={getSectorPath(
                                            f.x + f.w / 1.25,
                                            f.y + f.h / 1.25,
                                            Math.min(f.w, f.h),
                                            180,
                                            270
                                        )}
                                        fill={fill}
                                    />
                                ) : (
                                    <rect
                                        x={f.x} y={f.y} width={f.w} height={f.h}
                                        rx={f.rx ?? 6}
                                        fill={fill}
                                    />
                                )}

                                {f.text && (
                                    <text
                                        x={(f.x + f.w / 2)}
                                        y={f.y + f.h / 2}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fixture-label"
                                        fontSize={f.fontSize ?? 16}
                                        fill="#fff"
                                    >
                                        {t(f.text)}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}

function defaultFixtures(vb) {
    return [
        { type: 'door', x: vb.w - 80, y: vb.h - 180, w: 40, h: 120, text: '入口' }
    ];
}

export default VenuePicker;