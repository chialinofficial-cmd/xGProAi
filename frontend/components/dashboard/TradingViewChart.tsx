"use client";
import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';

interface TradingViewChartProps {
    symbol: string;
    levels?: {
        entry?: number;
        sl?: number;
        tp1?: number;
        tp2?: number;
    };
}

export default function TradingViewChart({ symbol, levels }: TradingViewChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState("1h");

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                // Encode symbol: XAU/USD -> XAU-USD
                const safeSymbol = symbol.replace("/", "-");
                const res = await fetch(`${apiUrl}/market-data/${safeSymbol}?timeframe=${timeframe}`);
                if (!res.ok) throw new Error("Failed to fetch market data");
                const data = await res.json();

                if (data.length === 0) {
                    setError("No market data available for this asset.");
                } else {
                    // Sort by time just in case
                    data.sort((a: any, b: any) => a.time - b.time);
                    setChartData(data);
                }
            } catch (err) {
                console.error("Chart data error:", err);
                setError("Failed to load chart data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [symbol, timeframe]);

    // Render Chart
    useEffect(() => {
        if (!chartContainerRef.current || chartData.length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            timeScale: {
                borderColor: '#2a2a2a',
                timeVisible: true,
            },
            rightPriceScale: {
                borderColor: '#2a2a2a',
            },
        }) as any;

        const candleSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        candleSeries.setData(chartData);

        // Add Lines
        if (levels?.entry) {
            candleSeries.createPriceLine({
                price: levels.entry,
                color: '#3b82f6',
                lineWidth: 2,
                lineStyle: 0,
                axisLabelVisible: true,
                title: 'ENTRY',
            });
        }
        if (levels?.sl) {
            candleSeries.createPriceLine({
                price: levels.sl,
                color: '#ef4444',
                lineWidth: 2,
                lineStyle: 0,
                axisLabelVisible: true,
                title: 'SL',
            });
        }
        if (levels?.tp1) {
            candleSeries.createPriceLine({
                price: levels.tp1,
                color: '#22c55e',
                lineWidth: 2,
                lineStyle: 2, // Dashed
                axisLabelVisible: true,
                title: 'TP1',
            });
        }
        if (levels?.tp2) {
            candleSeries.createPriceLine({
                price: levels.tp2,
                color: '#22c55e',
                lineWidth: 1,
                lineStyle: 1, // Dotted
                axisLabelVisible: true,
                title: 'TP2',
            });
        }

        // Fit Content
        chart.timeScale().fitContent();

        // Resize handler
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [chartData, levels]);

    return (
        <div className="relative w-full h-[530px] glass-panel rounded-xl overflow-hidden flex flex-col">
            {/* Chart Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/20 z-20">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gold uppercase tracking-wider">{symbol}</span>
                    <div className="h-4 w-px bg-white/10 mx-2"></div>
                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                        {['15m', '1h', '4h', '1d'].map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${timeframe === tf ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {tf.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] text-gray-400 font-mono">LIVE FEED</span>
                </div>

            </div>

            <div className="relative flex-1 w-full">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm">
                        <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full"></div>
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-md">
                            <p className="text-red-400 text-sm font-bold mb-1">Data Unavailable</p>
                            <p className="text-red-300/70 text-xs">{error}</p>
                        </div>
                    </div>
                )}
                <div ref={chartContainerRef} className="w-full h-full" />
            </div>
        </div>
    );
}
