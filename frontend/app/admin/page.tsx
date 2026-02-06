'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminStats {
    total_users: number;
    pro_users: number;
    total_analyses: number;
    revenue_estimated: number;
}

interface User {
    id: number;
    email: string;
    plan_tier: string;
    created_at: string;
    credits_balance: number;
}

interface Analysis {
    id: number;
    asset: string;
    bias: string;
    created_at: string;
    user_id: string;
}

export default function AdminPage() {
    const [authorized, setAuthorized] = useState(false);
    const [accessCode, setAccessCode] = useState('');

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [activity, setActivity] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Simple Auth Check
    const checkAuth = () => {
        if (accessCode === 'admin123') {
            setAuthorized(true);
            fetchData('admin123');
            localStorage.setItem('adminKey', 'admin123');
        } else {
            alert('Invalid Access Code');
        }
    };

    useEffect(() => {
        const savedKey = localStorage.getItem('adminKey');
        if (savedKey === 'admin123') {
            setAccessCode(savedKey);
            setAuthorized(true);
            fetchData(savedKey);
        }
    }, []);

    const fetchData = async (key: string) => {
        setLoading(true);
        setErrorMsg('');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const headers = { 'x-admin-secret': key };

        try {
            // 1. Stats
            const statsRes = await fetch(`${apiUrl}/admin/stats`, { headers });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            } else {
                throw new Error(`Stats API Error: ${statsRes.status} ${statsRes.statusText}`);
            }

            // 2. Users
            const usersRes = await fetch(`${apiUrl}/admin/users?limit=20`, { headers });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                if (Array.isArray(usersData)) {
                    setUsers(usersData);
                } else {
                    console.error("Users API returned non-array:", usersData);
                    setUsers([]);
                }
            } else {
                console.warn(`Users API Error: ${usersRes.status}`);
            }

            // 3. Activity
            const actRes = await fetch(`${apiUrl}/admin/analyses`, { headers });
            if (actRes.ok) {
                const actData = await actRes.json();
                if (Array.isArray(actData)) {
                    setActivity(actData);
                } else {
                    console.error("Activity API returned non-array:", actData);
                    setActivity([]);
                }
            } else {
                console.warn(`Activity API Error: ${actRes.status}`);
            }

        } catch (e: any) {
            console.error("Fetch Error:", e);
            setErrorMsg(e.message || "Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (userId: number) => {
        if (!confirm("Grant Pro access to this user?")) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
            await fetch(`${apiUrl}/admin/users/${userId}/upgrade`, {
                method: 'POST',
                headers: { 'x-admin-secret': accessCode }
            });
            alert("User Upgraded!");
            fetchData(accessCode); // Refresh
        } catch (e) {
            alert("Error upgrading user");
        }
    };

    if (!authorized) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="bg-surface-card border border-border-subtle p-8 rounded-2xl w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold text-white mb-6">Admin Access</h1>
                    <input
                        type="password"
                        className="w-full bg-black border border-border-subtle p-3 rounded-lg text-white mb-4"
                        placeholder="Enter Access Key"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                    />
                    <button
                        onClick={checkAuth}
                        className="w-full bg-gold text-black font-bold py-3 rounded-lg hover:bg-gold-light transition-colors"
                    >
                        Enter Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="border-b border-white/10 bg-surface-card p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-gold">Admin</span> Panel
                    </h1>
                    <button
                        onClick={() => {
                            localStorage.removeItem('adminKey');
                            window.location.reload();
                        }}
                        className="text-xs text-red-400 hover:text-red-300"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 space-y-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                        <p className="text-gray-400 text-xs uppercase">Total Users</p>
                        <p className="text-3xl font-bold text-white mt-2">{stats?.total_users || 0}</p>
                    </div>
                    <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                        <p className="text-gray-400 text-xs uppercase">Pro Subscribers</p>
                        <p className="text-3xl font-bold text-gold mt-2">{stats?.pro_users || 0}</p>
                    </div>
                    <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                        <p className="text-gray-400 text-xs uppercase">Total Analyses</p>
                        <p className="text-3xl font-bold text-blue-400 mt-2">{stats?.total_analyses || 0}</p>
                    </div>
                    <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                        <p className="text-gray-400 text-xs uppercase">Est. Revenue</p>
                        <p className="text-3xl font-bold text-green-400 mt-2">${stats?.revenue_estimated || 0}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Users Table */}
                    <div className="lg:col-span-2 bg-surface-card border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Recent Users</h3>
                            <span className="text-xs text-gray-500">Last 20</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="bg-black/20 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Tier</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="px-4 py-3 text-xs font-mono">{u.id}</td>
                                            <td className="px-4 py-3">{u.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${u.plan_tier === 'pro' ? 'bg-gold/20 text-gold' : 'bg-gray-800 text-gray-400'
                                                    }`}>
                                                    {u.plan_tier.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {u.plan_tier !== 'pro' && (
                                                    <button
                                                        onClick={() => handleUpgrade(u.id)}
                                                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                                                    >
                                                        Gift Pro
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-surface-card border border-white/10 rounded-xl overflow-hidden h-fit">
                        <div className="p-4 border-b border-white/10">
                            <h3 className="font-bold text-white">Live Activity</h3>
                        </div>
                        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                            {activity.map(a => (
                                <div key={a.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-white text-sm">{a.asset}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(a.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs px-2 py-0.5 rounded ${a.bias === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                                            a.bias === 'Bearish' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {a.bias}
                                        </span>
                                        <Link
                                            href={`/dashboard/analysis/${a.id}`}
                                            target="_blank"
                                            className="text-xs text-gold hover:underline"
                                        >
                                            View &rarr;
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {activity.length === 0 && (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No analyses yet.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
