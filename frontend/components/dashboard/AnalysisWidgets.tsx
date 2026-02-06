import React from 'react';

// --- Types ---
export interface QuantContext {
    trend: string;
    volatility_alert: boolean;
    rsi: number;
}

export interface SentimentContext {
    score: number; // -100 to 100
    label: string;
    summary: string;
}

export interface SMCContext {
    fair_value_gap: string;
    order_block: string;
    liquidity_sweep: string;
    market_structure_break: string;
}

// --- Helper Components ---

const CardBase = ({ title, icon, children, className = "" }: { title: string, icon: React.ReactNode, children: React.ReactNode, className?: string }) => (
    <div className={`bg-surface-card border border-white/5 rounded-xl p-5 ${className}`}>
        <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            {icon}
            {title}
        </h4>
        {children}
    </div>
);

// --- WIDGET 1: SENTIMENT GAUGE ---
export const SentimentWidget = ({ data }: { data?: SentimentContext }) => {
    if (!data) return <CardBase title="News Sentiment" icon={<span>📰</span>}><div>No Data</div></CardBase>;

    // Normalize score -100 to 100 -> 0 to 100% for gauge
    const percentage = ((data.score + 100) / 200) * 100;
    
    let colorClass = "bg-gray-500";
    if (data.score > 25) colorClass = "bg-green-500";
    if (data.score < -25) colorClass = "bg-red-500";

    return (
        <CardBase title="Market Sentiment" icon={<svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}>
            <div className="flex flex-col items-center">
                {/* Gauge Visual */}
                <div className="w-full h-3 bg-gray-700 rounded-full mb-2 relative overflow-hidden">
                    <div 
                        className={`h-full ${colorClass} transition-all duration-1000`} 
                        style={{ width: `${percentage}%` }}
                    />
                    {/* Center Marker */}
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white opacity-50"></div>
                </div>
                
                <div className="flex justify-between w-full text-[10px] text-gray-500 font-mono mb-2">
                    <span>BEARISH</span>
                    <span>NEUTRAL</span>
                    <span>BULLISH</span>
                </div>

                <div className="text-center mt-2">
                    <span className={`text-2xl font-bold ${data.score > 0 ? "text-green-400" : data.score < 0 ? "text-red-400" : "text-gray-300"}`}>
                        {data.label.toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {data.summary}
                    </p>
                </div>
            </div>
        </CardBase>
    );
};

// --- WIDGET 2: QUANT METRICS ---
export const QuantWidget = ({ data }: { data?: QuantContext }) => {
    if (!data) return <CardBase title="Quant Engine" icon={<span>🧮</span>}><div>No Data</div></CardBase>;

    const isRsiHigh = data.rsi > 70;
    const isRsiLow = data.rsi < 30;
    
    return (
        <CardBase title="Quant Stats" icon={<svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}>
            <div className="space-y-4">
                {/* Trend */}
                <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                    <span className="text-gray-400 text-xs">Trend (EMA)</span>
                    <span className={`text-sm font-bold ${data.trend === 'Bullish' ? 'text-green-400' : 'text-red-400'}`}>
                        {data.trend}
                    </span>
                </div>

                {/* RSI */}
                <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                    <span className="text-gray-400 text-xs">RSI (14)</span>
                    <div className="text-right">
                        <span className={`text-sm font-bold block ${isRsiHigh || isRsiLow ? 'text-yellow-400' : 'text-white'}`}>
                            {data.rsi.toFixed(1)}
                        </span>
                        {(isRsiHigh || isRsiLow) && (
                            <span className="text-[10px] text-yellow-500 font-mono">
                                {isRsiHigh ? "OVERBOUGHT" : "OVERSOLD"}
                            </span>
                        )}
                    </div>
                </div>

                {/* Volatility */}
                <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                    <span className="text-gray-400 text-xs">Volatility</span>
                    {data.volatility_alert ? (
                         <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded animate-pulse">
                            HIGH ALERT
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-gray-500">Normal</span>
                    )}
                </div>
            </div>
        </CardBase>
    );
};

// --- WIDGET 3: SMC CONTEXT ---
export const SMCWidget = ({ data }: { data?: SMCContext }) => {
    if (!data) return <CardBase title="SMC Confluence" icon={<span>🏛️</span>}><div>No Data</div></CardBase>;

    return (
        <CardBase title="Smart Money Concepts" icon={<svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            <ul className="space-y-3 text-sm">
                 <li className="flex gap-3 items-start">
                    <span className="text-gray-500 min-w-[30px] text-[10px] uppercase mt-0.5">MSS</span>
                    <span className={`${data.market_structure_break ? 'text-white' : 'text-gray-600 italic'}`}>
                        {data.market_structure_break || "None Detected"}
                    </span>
                </li>
                <li className="flex gap-3 items-start">
                    <span className="text-gray-500 min-w-[30px] text-[10px] uppercase mt-0.5">LIQ</span>
                    <span className={`${data.liquidity_sweep ? 'text-white' : 'text-gray-600 italic'}`}>
                        {data.liquidity_sweep || "No Sweeps"}
                    </span>
                </li>
                <li className="flex gap-3 items-start">
                    <span className="text-gray-500 min-w-[30px] text-[10px] uppercase mt-0.5">OB</span>
                    <span className={`${data.order_block ? 'text-gold' : 'text-gray-600 italic'}`}>
                        {data.order_block || "No Valid OB"}
                    </span>
                </li>
                <li className="flex gap-3 items-start">
                    <span className="text-gray-500 min-w-[30px] text-[10px] uppercase mt-0.5">FVG</span>
                    <span className={`${data.fair_value_gap ? 'text-blue-300' : 'text-gray-600 italic'}`}>
                        {data.fair_value_gap || "Balanced"}
                    </span>
                </li>
            </ul>
        </CardBase>
    );
};
