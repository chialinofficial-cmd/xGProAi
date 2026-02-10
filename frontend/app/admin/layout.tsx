"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!user) {
            // Wait for auth to initialize or redirect if definitely not logged in
            // For now, just wait. AuthContext handles initial load.
            return;
        }

        const verifyAdmin = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                // Try to hit an admin endpoint to verify access
                const res = await fetch(`${apiUrl}/admin/stats`, {
                    headers: { 'X-User-ID': user.uid }
                });

                if (res.ok) {
                    setAuthorized(true);
                } else {
                    router.push('/dashboard'); // Kick back to normal dashboard
                }
            } catch (error) {
                console.error("Admin verification failed", error);
                router.push('/dashboard');
            } finally {
                setChecking(false);
            }
        };

        verifyAdmin();
    }, [user, router]);

    if (checking) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gold font-bold animate-pulse">Verifying Admin Access...</div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-gold selection:text-black">
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 glass-panel border-r border-white/10 flex flex-col">
                    <div className="p-6 border-b border-white/10">
                        <Link href="/dashboard" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-600 rounded-lg flex items-center justify-center text-black font-bold text-xl shadow-[0_0_15px_rgba(212,175,55,0.4)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all">
                                X
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight group-hover:text-gold transition-colors">
                                xGPro<span className="text-gold">Admin</span>
                            </span>
                        </Link>
                    </div>

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-white bg-white/10 border border-white/5 shadow-inner">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            Overview
                        </Link>
                        <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            User Management
                        </Link>
                    </nav>

                    <div className="p-4 border-t border-white/10">
                        <Link href="/dashboard" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                            &larr; Back to App
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 relative">
                    {/* Background Effects */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>

                    <div className="relative z-10 p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
