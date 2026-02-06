"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { usePayment } from '../../hooks/usePayment';

export default function UploadPage() {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(1); // 1: Uploading, 2: Analysis, 3: Generating
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { handlePayment } = usePayment();
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [equity, setEquity] = useState<string>('1000');

    // ... (keep existing simple functions)

    const uploadFile = async (file: File) => {
        if (!user) {
            alert("Please login to upload charts");
            return;
        }

        setIsUploading(true);
        // ... (keep existing progress logic) ...
        setUploadProgress(10);
        setCurrentStep(1);

        let uploadInterval: NodeJS.Timeout | null = null;
        let analysisInterval: NodeJS.Timeout | null = null;
        let analysisTimeout: NodeJS.Timeout | null = null;

        // ... (keep intervals) ...
        uploadInterval = setInterval(() => {
             setUploadProgress(prev => {
                if (prev >= 35) {
                    if (uploadInterval) clearInterval(uploadInterval);
                    return 35;
                }
                return prev + 5;
            });
        }, 200);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("equity", equity || '1000'); // Pass Equity

        try {
            // ... (keep timeout logic) ...
            analysisTimeout = setTimeout(() => {
                setCurrentStep(2);
                setUploadProgress(45);
                analysisInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 85) {
                            if (analysisInterval) clearInterval(analysisInterval);
                            return 85;
                        }
                        return prev + 2;
                    });
                }, 300);
            }, 1500);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
            
            // ... (fetch) ...
            const response = await fetch(`${apiUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'X-User-ID': user.uid,
                },
                body: formData,
                signal: controller.signal
            });

            // ... (rest of logic) ...
            clearTimeout(timeoutId);
            if (uploadInterval) clearInterval(uploadInterval);
            if (analysisInterval) clearInterval(analysisInterval);
            if (analysisTimeout) clearTimeout(analysisTimeout);

            if (response.ok) {
                const data = await response.json();
                setCurrentStep(3);
                setUploadProgress(100);
                setTimeout(() => {
                    router.push(`/dashboard/analysis/${data.id}`);
                }, 800);
            } else {
                 // ... handle error ...
                 const errorData = await response.json();
                 if (response.status === 403 && errorData.detail.includes("Daily limit reached")) {
                    setIsLimitReached(true);
                    setIsUploading(false);
                    return;
                }
                throw new Error(errorData.detail || `Status: ${response.status}`);
            }
        } catch (error: any) {
             // ... handle catch ...
             console.error("Error:", error);
            if (!isLimitReached) {
                if (error.name === 'AbortError') {
                    alert("Analysis timed out. The AI is taking longer than expected. Please try again.");
                } else {
                    alert(`Analysis failed: ${error.message}`);
                }
            }
            setIsUploading(false);
            setUploadProgress(0);
            setCurrentStep(1);
            if (uploadInterval) clearInterval(uploadInterval);
            if (analysisInterval) clearInterval(analysisInterval);
            if (analysisTimeout) clearTimeout(analysisTimeout);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Upload Chart</h1>

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
            />

            {/* ... (Loading Overlay - implied kept by not selecting it) ... */}
            {isUploading && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface-card border border-border-subtle rounded-2xl p-12 max-w-2xl w-full text-center relative overflow-hidden shadow-2xl">
                        {/* Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

                        <div className="relative z-10 transition-all duration-300">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>

                            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Your Charts</h2>
                            <p className="text-gray-400 mb-8">Processing images for comprehensive analysis</p>

                            <div className="flex justify-between items-center mb-2 px-4">
                                <span className="text-sm font-semibold text-white">Overall Progress</span>
                                <span className="text-sm font-semibold text-blue-400">{uploadProgress}%</span>
                            </div>

                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-12 mx-4">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm relative">
                                {/* Connecting Line */}
                                <div className="absolute top-4 left-[16%] right-[16%] h-0.5 bg-gray-700 -z-10"></div>

                                {/* Step 1: Uploading */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ring-4 ring-surface-card transition-colors duration-300 ${currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    </div>
                                    <span className={`font-medium transition-colors duration-300 ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>Uploading</span>
                                </div>

                                {/* Step 2: Analysis */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ring-4 ring-surface-card transition-colors duration-300 ${currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    </div>
                                    <span className={`font-medium transition-colors duration-300 ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>AI Analysis</span>
                                </div>

                                {/* Step 3: Results */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ring-4 ring-surface-card transition-colors duration-300 ${currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <span className={`font-medium transition-colors duration-300 ${currentStep >= 3 ? 'text-white' : 'text-gray-500'}`}>Results</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Split Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Left: Upload Area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={(e) => {
                        // Prevent click when clicking the input itself
                        if((e.target as HTMLElement).tagName !== 'INPUT') {
                             !isUploading && fileInputRef.current?.click();
                        }
                    }}
                    className={`
                        bg-[#0f1115] border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative group
                        ${isDragging ? 'border-gold bg-gold/5' : 'border-gray-700 hover:border-gold/50 hover:bg-surface-card'}
                        ${isUploading ? 'pointer-events-none opacity-50' : ''}
                    `}
                    style={{ minHeight: '400px' }}
                >
                    <div className="absolute top-4 left-4 flex items-center gap-2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="font-semibold text-sm">Upload Chart for AI Analysis</span>
                    </div>

                    <div className="flex flex-col items-center gap-4 mt-8 w-full max-w-sm z-20">
                    
                        {/* 💰 EQUITY INPUT 💰 */}
                        <div 
                            className="w-full bg-black/40 border border-gold/20 rounded-lg p-4 mb-4 text-left backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()} // Stop click bubbling to upload
                        >
                            <label className="text-gold text-xs font-bold uppercase tracking-wider mb-2 block">
                                Account Balance ($)
                            </label>
                            <input 
                                type="number" 
                                value={equity}
                                onChange={(e) => setEquity(e.target.value)}
                                className="w-full bg-transparent border-b border-gray-600 focus:border-gold text-white text-xl font-mono outline-none py-1 placeholder-gray-700"
                                placeholder="e.g. 1000"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                                Used for 1% Risk & Dynamic Lot Claculation
                            </p>
                        </div>
                        {/* 💰 END UNITY INPUT 💰 */}

                        <div className="w-16 h-16 rounded-full bg-surface-card border border-gray-700 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8 text-gray-400 group-hover:text-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Drop an image or click to upload</h3>
                            <button className="bg-surface-card hover:bg-[#252830] border border-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto mt-4">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Choose File
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 max-w-xs">
                            Upload a chart to get AI-powered trading insights. Supports PNG, JPG. Use Ctrl+V to paste.
                        </p>
                    </div>

                    {/* Dotted Box Outline Visual */}
                    <div className="absolute inset-4 border-2 border-dashed border-gray-800 rounded-lg pointer-events-none"></div>
                </div>

                {/* Right: Guidelines */}
                <div className="bg-[#0f1115] border border-gray-800 rounded-xl p-8">
                    <h3 className="text-lg font-bold text-white mb-6">Chart Upload Guidelines</h3>

                    <div className="space-y-6">
                        {/* Guideline 1 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded bg-green-500/20 text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Allowed Chart Type:</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">Only Candlestick Charts are accepted for accurate AI analysis.</p>
                            </div>
                        </div>

                        {/* Guideline 2 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">How to Upload:</h4>
                                <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                                    <li>Paste directly using Ctrl + V</li>
                                    <li>Upload an image file (PNG, JPG)</li>
                                </ul>
                            </div>
                        </div>

                        {/* Guideline 3 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Supported Trading Styles:</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">Scalping: 1m, 3m, 5m • Intraday: 15m, 30m • Swing: 1H, 4H • Long-Term: 1D, 1W</p>
                            </div>
                        </div>

                        {/* Guideline 4 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Chart Requirements:</h4>
                                <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                                    <li>Include clear Symbol name and Time Frame</li>
                                    <li>Remove drawing tools and indicators</li>
                                    <li>Ensure chart is zoomed in properly</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Limit Reached Modal */}
            {isLimitReached && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface-card border border-gold rounded-xl p-8 max-w-md w-full text-center relative shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                        <button
                            onClick={() => setIsLimitReached(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                            🔒
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">Daily Limit Reached</h3>
                        <p className="text-gray-400 mb-6">
                            You've used your 3 free analysis credits for today. Upgrade to <span className="text-gold font-bold">Gold Pro</span> for unlimited access.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handlePayment(19.99)}
                                className="w-full py-3 rounded-lg bg-gold hover:bg-gold-light text-black font-bold transition-all shadow-lg hover:shadow-gold/20 flex items-center justify-center gap-2"
                            >
                                <span>🚀</span> Upgrade to Pro ($19.99/mo)
                            </button>
                            <button
                                onClick={() => handlePayment(10)}
                                className="w-full py-3 rounded-lg border border-gold/30 text-gold hover:bg-gold/5 font-semibold transition-all"
                            >
                                Weekly Pass ($10/week)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
