"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Skip check on login page itself
        if (pathname === '/admin/login') {
            setChecking(false);
            setAuthorized(true); // Allow rendering the login page
            return;
        }

        const verifyAdmin = async () => {
            const token = localStorage.getItem('admin_token');

            if (!token) {
                router.push('/admin/login');
                setChecking(false);
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                // Use token to hit a protected admin endpoint
                const res = await fetch(`${apiUrl}/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    setAuthorized(true);
                } else {
                    localStorage.removeItem('admin_token');
                    router.push('/admin/login');
                }
            } catch (error) {
                console.error("Admin verification failed", error);
                router.push('/admin/login');
            } finally {
                setChecking(false);
            }
        };

        verifyAdmin();
    }, [router, pathname]);

    if (checking) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gold font-bold text-sm tracking-widest uppercase">Initializing Security Protocol</div>
                </div>
            </div>
        );
    }

    // Render children directly if on login page, otherwise wrap in dashboard
    if (pathname === '/admin/login') {
        return <>{children}</>;
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
                        <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${pathname === '/admin' ? 'text-white bg-white/10 border border-white/5 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            Overview
                        </Link>

                        <Link href="/admin/users" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/users' ? 'text-white bg-white/10 border border-white/5 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            User Management
                        </Link>

                        <div className="pt-4 mt-4 border-t border-white/10">
                            <span className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">System</span>
                        </div>

                        {/* Placeholder for future expansion */}
                        <button disabled className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 cursor-not-allowed">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Settings (Coming Soon)
                        </button>
                    </nav>

                    <div className="p-4 border-t border-white/10 space-y-4">
                        <button
                            onClick={() => {
                                localStorage.removeItem('admin_token');
                                router.push('/admin/login');
                            }}
                            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors w-full"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Sign Out
                        </button>
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
