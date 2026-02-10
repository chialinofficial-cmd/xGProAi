'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, CandlestickSeries } from 'lightweight-charts';

interface AdvancedChartProps {
    data: CandlestickData[];
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
        areaTopColor?: string;
        areaBottomColor?: string;
    };
    aiZones?: {
        entry: number;
        sl: number;
        tp: number;
    };
}

export const AdvancedChart: React.FC<AdvancedChartProps> = ({ data, colors, aiZones }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: colors?.backgroundColor || 'transparent' },
                textColor: colors?.textColor || '#d1d5db',
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
            },
            crosshair: {
                mode: 1, // Magnet mode
                vertLine: {
                    width: 1,
                    color: 'rgba(224, 227, 235, 0.1)',
                    style: 0,
                },
                horzLine: {
                    width: 1,
                    color: 'rgba(224, 227, 235, 0.1)',
                    style: 0,
                },
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.1)',
            },
        });

        chartRef.current = chart;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        candlestickSeries.setData(data);

        // Add AI Zones if provided
        if (aiZones) {
            // Entry Line
            const entryPriceLine = {
                price: aiZones.entry,
                color: '#3b82f6', // Blue
                lineWidth: 2 as const,
                lineStyle: 2, // Dashed
                axisLabelVisible: true,
                title: 'ENTRY',
            };
            candlestickSeries.createPriceLine(entryPriceLine);

            // Stop Loss Line
            const slPriceLine = {
                price: aiZones.sl,
                color: '#ef4444', // Red
                lineWidth: 2 as const,
                lineStyle: 1, // Solid
                axisLabelVisible: true,
                title: 'SL',
            };
            candlestickSeries.createPriceLine(slPriceLine);

            // Take Profit Line
            const tpPriceLine = {
                price: aiZones.tp,
                color: '#22c55e', // Green
                lineWidth: 2 as const,
                lineStyle: 1, // Solid
                axisLabelVisible: true,
                title: 'TP',
            };
            candlestickSeries.createPriceLine(tpPriceLine);
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, colors, aiZones]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full h-[400px] relative"
        />
    );
};
