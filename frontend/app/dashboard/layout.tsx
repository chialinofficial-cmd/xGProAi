"use client";

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { usePayment } from '../hooks/usePayment';
import { Suspense } from 'react';
import PaymentSuccessToast from './components/PaymentSuccessToast';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logOut } = useAuth();
    const { handlePayment } = usePayment();
    const [credits, setCredits] = useState(0);

    // Fetch credits whenever the layout mounts or user changes
    useEffect(() => {
        if (!user) return;

        const fetchCredits = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/stats`, {
                    headers: {
                        'X-User-ID': user.uid
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCredits(data.credits_remaining);
                }
            } catch (error) {
                console.error("Failed to fetch credits", error);
            }
        };

        fetchCredits();

        const interval = setInterval(fetchCredits, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPricingOpen, setIsPricingOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#0f1115] overflow-hidden text-foreground font-sans">
            <Suspense fallback={null}>
                <PaymentSuccessToast />
            </Suspense>

            {/* UPGRADE MODAL */}
            {isPricingOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
                    <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6 max-w-5xl w-full text-center relative shadow-2xl my-8">
                        <button 
                            onClick={() => setIsPricingOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white z-10"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h3 className="text-3xl font-bold text-white mb-2">Simple, Transparent Pricing</h3>
                        <p className="text-gray-400 mb-8">Choose the perfect plan for your trading journey</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Starter Plan */}
                            <div className="bg-surface-card border border-gray-800 rounded-xl p-6 flex flex-col hover:border-gray-600 transition-all">
                                <h4 className="text-xl font-bold text-white mb-1">Starter</h4>
                                <p className="text-xs text-gray-500 mb-4">Short-term access for testing</p>
                                <div className="text-3xl font-bold text-white mb-1">GHS 45<span className="text-sm text-gray-500 font-normal">/7 Days</span></div>
                                <ul className="space-y-3 mb-8 text-left text-sm text-gray-400 mt-6 flex-1">
                                    <li className="flex gap-2"><span className="text-green-500">✓</span> AI analysis (full output)</li>
                                    <li className="flex gap-2"><span className="text-green-500">✓</span> Up to 10 uploads/day</li>
                                    <li className="flex gap-2"><span className="text-green-500">✓</span> 7-day access</li>
                                </ul>
                                <button
                                    onClick={() => { handlePayment(45); setIsPricingOpen(false); }}
                                    className="w-full py-3 rounded-lg border border-gray-600 hover:bg-white/5 text-white font-medium transition-all"
                                >
                                    Subscribe Now →
                                </button>
                            </div>

                            {/* Active Traders (Popular) */}
                            <div className="bg-surface-card border-2 border-blue-600 rounded-xl p-6 flex flex-col relative transform md:-translate-y-2 shadow-2xl shadow-blue-900/20">
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                    Most Popular
                                </div>
                                <h4 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                                    Active Traders <span className="text-gold">★</span>
                                </h4>
                                <p className="text-xs text-gray-500 mb-4">Best for consistent daily usage</p>
                                <div className="text-4xl font-bold text-white mb-1">GHS 150<span className="text-sm text-gray-500 font-normal">/30 Days</span></div>
                                <ul className="space-y-3 mb-8 text-left text-sm text-gray-300 mt-6 flex-1">
                                    <li className="flex gap-2"><span className="text-green-500">✓</span> AI analysis (full output)</li>
                                    <li className="flex gap-2"><span className="text-green-500">✓</span> Up to 20 uploads/day</li>
                                    <li className="flex gap-2"><span className="text-green-500">✓</span> 30-day access</li>
                                </ul>
                                <button
                                    onClick={() => { handlePayment(150); setIsPricingOpen(false); }}
                                    className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20"
                                >
                                    Subscribe Now →
                                </button>
                            </div>

                            {/* Advanced Traders */}
                            <div className="bg-surface-card border border-gray-800 rounded-xl p-6 flex flex-col hover:border-gray-600 transition-all">
                                <h4 className="text-xl font-bold text-white mb-1">Advanced Traders</h4>
                                <p className="text-xs text-gray-500 mb-4">Built for power users</p>
                                <div className="text-3xl font-bold text-white mb-1">GHS 300<span className="text-sm text-gray-500 font-normal">/30 Days</span></div>
                                <ul className="space-y-3 mb-8 text-left text-sm text-gray-400 mt-6 flex-1">
                                    <li className="flex gap-2"><span className="text-green-500">✓</span> AI analysis (full output)</li>
                                    <li className="flex gap-2"><span className="text-green-500">✓</span> High usage limits</li>
                                    <li className="flex gap-2"><span className="text-green-500">✓</span> Priority support</li>
                                </ul>
                                <button
                                    onClick={() => { handlePayment(300); setIsPricingOpen(false); }}
                                    className="w-full py-3 rounded-lg border border-gray-600 hover:bg-white/5 text-white font-medium transition-all"
                                >
                                    Subscribe Now →
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar Overlay (Mobile) */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50 w-64 bg-surface-card border-r border-border-subtle 
                transform transition-transform duration-300 ease-in-out md:transform-none md:translate-x-0 flex flex-col justify-between
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div>
                    <div className="h-16 flex items-center justify-between px-6 border-b border-border-subtle/50">
                        <Link href="/" className="flex items-center gap-3">
                            <img src="/logo.png" alt="xGProAi" className="w-12 h-auto rounded-lg" />
                        </Link>
                        {/* Close Button (Mobile Only) */}
                        <button
                            className="md:hidden text-gray-400 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-3 py-6 space-y-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            Dashboard
                        </Link>
                        <Link href="/dashboard/upload" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Upload Chart
                        </Link>
                        <Link href="/dashboard/history" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Chart History
                        </Link>
                        <Link href="/dashboard/chat" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            Chat with our AI
                        </Link>
                        <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Account
                        </div>
                        <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            My Profile
                        </Link>
                        <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Settings
                        </Link>
                        <Link href="/dashboard/support" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            Support
                        </Link>
                    </nav>
                </div>

                {/* Logout */}
                {/* Logout */}
                <div className="p-4 border-t border-border-subtle/50 space-y-2">
                    <button
                        onClick={() => setIsPricingOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold hover:bg-gold-light text-black font-bold shadow-lg shadow-gold/20 transition-all w-full text-sm mb-2"
                    >
                        <span>🚀</span> Upgrade to Pro
                    </button>

                    <button
                        onClick={async () => {
                            await logOut();
                            window.location.href = '/login'; // Force full refresh/redirect
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/90 hover:text-black transition-colors w-full"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                    </button>
                </div>
            </aside>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-surface-card border-b border-border-subtle/50 flex items-center justify-between px-6 z-20">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            className="block md:hidden text-white mr-4"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open Menu"
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h2 className="text-lg font-medium text-white">Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600/10 border border-blue-600/20 px-3 py-1.5 rounded-full">
                            <span className="text-xs font-semibold text-blue-400">Credits Left: {credits}</span>
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-border-subtle/50">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-white">{user?.displayName || "User"}</p>
                                <p className="text-xs text-gray-500">Gold Pro</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                {user?.displayName ? user.displayName.substring(0, 2) : "U"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-[#0f1115]">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
