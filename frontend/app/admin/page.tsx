'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
    firebase_uid: string;
}

interface Analysis {
    id: number;
    asset: string;
    bias: string;
    created_at: string;
    user_id: string;
}

// Analytics Interfaces
interface AnalyticsData {
    name: string;
    value: number;
}

interface UsageData {
    date: string;
    count: number;
}

export default function AdminPage() {
    const [authorized, setAuthorized] = useState(false);
    const [accessCode, setAccessCode] = useState('');

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [activity, setActivity] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // V2 Features
    const [searchQuery, setSearchQuery] = useState('');
    const [assetData, setAssetData] = useState<AnalyticsData[]>([]);
    const [usageData, setUsageData] = useState<UsageData[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null); // For Details Modal
    const [creditAmount, setCreditAmount] = useState<number>(0);
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

    // Constants
    const GRAF_COLORS = ['#d4af37', '#2563eb', '#22c55e', '#ef4444', '#a855f7'];

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
            if (statsRes.ok) setStats(await statsRes.json());

            // 2. Users (Search aware)
            const searchParam = searchQuery ? `&search=${searchQuery}` : '';
            const usersRes = await fetch(`${apiUrl}/admin/users?limit=50${searchParam}`, { headers });
            if (usersRes.ok) {
                const uData = await usersRes.json();
                setUsers(Array.isArray(uData) ? uData : []);
            }

            // 3. Activity
            const actRes = await fetch(`${apiUrl}/admin/analyses`, { headers });
            if (actRes.ok) {
                const axData = await actRes.json();
                setActivity(Array.isArray(axData) ? axData : []);
            }

            // 4. Analytics (Assets)
            const assetRes = await fetch(`${apiUrl}/admin/analytics/assets`, { headers });
            if (assetRes.ok) {
                const asData = await assetRes.json();
                setAssetData(Array.isArray(asData) ? asData : []);
            }

            // 5. Analytics (Usage)
            const usageRes = await fetch(`${apiUrl}/admin/analytics/usage`, { headers });
            if (usageRes.ok) {
                const usData = await usageRes.json();
                setUsageData(Array.isArray(usData) ? usData : []);
            }

        } catch (e: any) {
            console.error("Fetch Error:", e);
            setErrorMsg(e.message || "Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    // Debounced Search Handled via Enter Key or Button for now to be simple
    const handleSearch = () => {
        fetchData(accessCode);
    };

    // Actions
    const handleUpgrade = async (userId: number) => {
        if (!confirm("Grant Pro access to this user?")) return;
        performAction(`/admin/users/${userId}/upgrade`, 'POST');
    };

    const handleDelete = async (userId: number) => {
        if (!confirm("ARE YOU SURE? This will delete the user and their analyses.")) return;
        performAction(`/admin/users/${userId}`, 'DELETE');
    };

    const handleUpdateCredits = async () => {
        if (!selectedUser) return;
        performAction(`/admin/users/${selectedUser.id}/credits`, 'POST', { amount: creditAmount });
        setIsCreditModalOpen(false);
    };

    const performAction = async (endpoint: string, method: string, body?: any) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
            const res = await fetch(`${apiUrl}${endpoint}`, {
                method,
                headers: {
                    'x-admin-secret': accessCode,
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined
            });
            if (res.ok) {
                alert("Success!");
                fetchData(accessCode);
            } else {
                alert("Action failed.");
            }
        } catch (e) {
            alert("Error executing action");
        }
    };

    const openCreditModal = (user: User) => {
        setSelectedUser(user);
        setCreditAmount(user.credits_balance);
        setIsCreditModalOpen(true);
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
                        <span className="text-gold">Admin</span> Panel <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">V2</span>
                    </h1>
                    <button onClick={() => { localStorage.removeItem('adminKey'); window.location.reload(); }} className="text-xs text-red-400 hover:text-red-300">
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 space-y-8">
                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-center font-mono text-sm">
                        ⚠️ Connection Error: {errorMsg}
                    </div>
                )}

                {/* 1. KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                        <p className="text-gray-400 text-xs uppercase">Users</p>
                        <p className="text-3xl font-bold text-white mt-2">{stats?.total_users || 0}</p>
                    </div>
                    <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                        <p className="text-gray-400 text-xs uppercase">Pro VIPs</p>
                        <p className="text-3xl font-bold text-gold mt-2">{stats?.pro_users || 0}</p>
                    </div>
                    <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                        <p className="text-gray-400 text-xs uppercase">Volume</p>
                        <p className="text-3xl font-bold text-blue-400 mt-2">{stats?.total_analyses || 0}</p>
                    </div>
                    <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                        <p className="text-gray-400 text-xs uppercase">Revenue (Est)</p>
                        <p className="text-3xl font-bold text-green-400 mt-2">${stats?.revenue_estimated || 0}</p>
                    </div>
                </div>

                {/* 2. Visual Analytics */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-surface-card border border-white/10 p-6 rounded-xl h-[300px]">
                        <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">Analysis Volume (30D)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={usageData}>
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#666" />
                                <YAxis stroke="#666" />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                <Bar dataKey="count" fill="#d4af37" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface-card border border-white/10 p-6 rounded-xl h-[300px]">
                        <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">Popular Assets</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={assetData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {assetData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={GRAF_COLORS[index % GRAF_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. User Management */}
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-surface-card border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center flex-wrap gap-4">
                            <h3 className="font-bold text-white">User Management</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search email..."
                                    className="bg-black/50 border border-white/10 rounded px-3 py-1 text-sm text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button onClick={handleSearch} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-sm text-white">Search</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="bg-black/20 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Tier</th>
                                        <th className="px-4 py-3">Credits</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-white">{u.email}</div>
                                                <div className="text-xs text-gray-600 font-mono">{u.id}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${u.plan_tier === 'pro' ? 'bg-gold/20 text-gold' : 'bg-gray-800 text-gray-400'}`}>
                                                    {u.plan_tier.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-white font-mono">{u.credits_balance}</td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <button onClick={() => openCreditModal(u)} className="text-xs text-blue-400 hover:underline">Credits</button>
                                                {u.plan_tier !== 'pro' && <button onClick={() => handleUpgrade(u.id)} className="text-xs text-gold hover:underline">Gift Pro</button>}
                                                <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:text-red-400">Trash</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Live Feed */}
                    <div className="bg-surface-card border border-white/10 rounded-xl overflow-hidden h-fit">
                        <div className="p-4 border-b border-white/10"><h3 className="font-bold text-white">Live Feed</h3></div>
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
                                            }`}>{a.bias}</span>
                                        <Link href={`/dashboard/analysis/${a.id}`} target="_blank" className="text-xs text-gold hover:underline">View</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Credit Modal */}
            {isCreditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface-card border border-white/20 p-6 rounded-xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-4">Adjust Credits</h3>
                        <p className="text-sm text-gray-400 mb-4">User: {selectedUser.email}</p>

                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setCreditAmount(Math.max(0, creditAmount - 1))} className="p-2 bg-white/10 rounded hover:bg-white/20">-</button>
                            <input
                                type="number"
                                className="bg-black border border-white/10 rounded p-2 text-center text-white w-24"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                            />
                            <button onClick={() => setCreditAmount(creditAmount + 1)} className="p-2 bg-white/10 rounded hover:bg-white/20">+</button>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setIsCreditModalOpen(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded text-gray-300">Cancel</button>
                            <button onClick={handleUpdateCredits} className="flex-1 py-2 bg-gold hover:bg-gold-light text-black font-bold rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
