'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '../../context/ToastContext';

interface AdminStats {
    total_users: number;
    pro_users: number;
    total_analyses: number;
    revenue_estimated: number;
}

interface User {
    id: number;
    email: string;
    full_name: string;
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
    image_url?: string;
    user_email?: string;
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
    const [aiStats, setAiStats] = useState<any>(null);
    const [finStats, setFinStats] = useState<any>(null);
    const [charts, setCharts] = useState<any[]>([]); // Charts Content
    const [users, setUsers] = useState<User[]>([]);
    const [activity, setActivity] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const { showToast } = useToast();

    // Tabs State
    const [activeTab, setActiveTab] = useState('overview');

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

            // 1b. AI Stats
            const aiRes = await fetch(`${apiUrl}/admin/ai/stats`, { headers });
            if (aiRes.ok) setAiStats(await aiRes.json());

            // 1c. Financial Stats
            const finRes = await fetch(`${apiUrl}/admin/finance/stats`, { headers });
            if (finRes.ok) setFinStats(await finRes.json());

            // 1d. Content Stats
            const chartsRes = await fetch(`${apiUrl}/admin/content/charts`, { headers });
            if (chartsRes.ok) setCharts(await chartsRes.json());

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

    const handleSearch = () => {
        fetchData(accessCode);
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
                showToast("Action successful!", 'success');
                fetchData(accessCode);
            } else {
                showToast("Action failed.", 'error');
            }
        } catch (e) {
            showToast("Error executing action", 'error');
        }
    };

    const handleUpgrade = async (userId: number) => {
        if (!confirm("Grant Pro access to this user?")) return;
        // Fixed: Use correct /tier endpoint instead of non-existent /upgrade
        performAction(`/admin/users/${userId}/tier`, 'POST', { tier: 'pro' });
    };

    const handleDelete = async (userId: number) => {
        if (!confirm("ARE YOU SURE? This will delete the user and their analyses.")) return;
        performAction(`/admin/users/${userId}`, 'DELETE');
    };

    const openCreditModal = (user: User) => {
        setSelectedUser(user);
        setCreditAmount(user.credits_balance);
        setIsCreditModalOpen(true);
    };

    // Render Helpers
    const renderOverview = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    <p className="text-gray-400 text-xs uppercase">Analysis Vol</p>
                    <p className="text-3xl font-bold text-blue-400 mt-2">{stats?.total_analyses || 0}</p>
                </div>
                <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                    <p className="text-gray-400 text-xs uppercase">Revenue (Est)</p>
                    <p className="text-3xl font-bold text-green-400 mt-2">${stats?.revenue_estimated || 0}</p>
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-surface-card border border-white/10 p-6 rounded-xl h-[400px]">
                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">Popular Assets</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={assetData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {assetData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={GRAF_COLORS[index % GRAF_COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-surface-card border border-white/10 rounded-xl overflow-hidden h-[400px] flex flex-col">
                    <div className="p-4 border-b border-white/10"><h3 className="font-bold text-white">Live Activity Feed</h3></div>
                    <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                        {activity.map(a => (
                            <div key={a.id} className="p-4 hover:bg-white/5 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-white text-sm">{a.asset}</span>
                                    <span className="text-[10px] text-gray-500">{new Date(a.created_at).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs px-2 py-0.5 rounded ${a.bias === 'Bullish' ? 'bg-green-500/20 text-green-400' : a.bias === 'Bearish' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>{a.bias}</span>
                                    <Link href={`/dashboard/analysis/${a.id}`} target="_blank" className="text-xs text-gold hover:underline">View</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="bg-surface-card border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 border-b border-white/10 flex justify-between items-center flex-wrap gap-4">
                <h3 className="font-bold text-white">User Management</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search email..."
                        className="bg-black border border-white/10 rounded px-3 py-1 text-sm text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm text-white">Search</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-xs uppercase font-medium text-gray-400">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Credits</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                                            {(u.full_name?.[0] || u.email?.[0] || 'T').toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white mb-0.5">{u.full_name || 'Trader'}</div>
                                            <div className="text-xs text-gray-400">{u.email || 'No Email'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider 
                                        ${u.plan_tier === 'pro' || u.plan_tier === 'active' || u.plan_tier === 'advanced' ? 'bg-gold/10 text-gold border border-gold/20' :
                                            u.plan_tier === 'trial' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                'bg-white/5 text-gray-400 border border-white/10'}`}>
                                        {u.plan_tier}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${u.credits_balance > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-white font-mono">{u.credits_balance}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono">
                                    {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openCreditModal(u)}
                                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-white rounded-lg border border-white/10 transition-colors"
                                        >
                                            Manage
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                                            title="Delete User"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAI = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                    <p className="text-gray-400 text-xs uppercase">AI Latency (Avg)</p>
                    <p className="text-3xl font-bold text-blue-400 mt-2">{aiStats?.avg_latency_ms || 0}<span className="text-sm text-gray-500">ms</span></p>
                </div>
                <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                    <p className="text-gray-400 text-xs uppercase">Avg Confidence</p>
                    <p className="text-3xl font-bold text-gold mt-2">{aiStats?.avg_confidence || 0}%</p>
                </div>
                <div className="bg-surface-card border border-white/10 p-6 rounded-xl">
                    <p className="text-gray-400 text-xs uppercase">Win Rate (Est)</p>
                    <p className="text-3xl font-bold text-green-400 mt-2">{aiStats?.win_rate || 0}%</p>
                </div>
            </div>
            <div className="bg-surface-card border border-white/10 p-6 rounded-xl h-[400px]">
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">AI Latency Trend (Last 50 Requests)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aiStats?.latency_history || []}>
                        <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f1115', borderColor: '#333' }} itemStyle={{ color: '#fff' }} />
                        <Bar dataKey="ms" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const renderFinance = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-gradient-to-br from-gold/20 to-black border border-gold/30 p-6 rounded-xl flex flex-col justify-center">
                    <p className="text-gold text-sm uppercase tracking-wider mb-2">Monthly Recurring Revenue</p>
                    <p className="text-5xl font-bold text-white"><span className="text-2xl text-gray-400 mr-1">GHS</span>{finStats?.mrr_ghs?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-500 mt-2">Estimated based on active plans</p>
                </div>
                <div className="md:col-span-2 bg-surface-card border border-white/10 p-6 rounded-xl h-[300px]">
                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">Revenue by Tier</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={finStats?.revenue_breakdown || []} layout="vertical">
                            <XAxis type="number" stroke="#4b5563" fontSize={10} hide />
                            <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} width={100} />
                            <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f1115', borderColor: '#333' }} formatter={(value: any) => [`GHS ${value}`, 'Revenue']} />
                            <Bar dataKey="value" fill="#d4af37" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderContent = () => (
        <div className="bg-surface-card border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 border-b border-white/10 flex justify-between items-center"><h3 className="font-bold text-white">Recent Uploads</h3><span className="text-xs text-gray-500">Live Repository</span></div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[70vh] overflow-y-auto">
                {charts.map(chart => (
                    <Link href={`/dashboard/analysis/${chart.id}`} target="_blank" key={chart.id} className="group block relative aspect-[16/9] bg-black rounded-lg overflow-hidden border border-white/10 hover:border-gold transition-all">
                        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-xs text-gray-600">Img</div>
                        <img src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${chart.image_url}`} alt={chart.asset} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                            <div className="flex justify-between items-end">
                                <div><p className="text-[10px] font-bold text-white leading-tight">{chart.asset}</p><p className={`text-[9px] ${chart.bias === 'Bullish' ? 'text-green-400' : 'text-red-400'}`}>{chart.bias}</p></div>
                                <div className="text-[9px] text-gray-400 text-right"><p>{new Date(chart.created_at).toLocaleDateString()}</p></div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );

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
        <div className="min-h-screen bg-background text-white">
            <nav className="border-b border-white/10 bg-surface-card p-4 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-gold">Admin</span> Panel <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">V3</span>
                        </h1>
                        <div className="hidden md:flex gap-1 bg-black/30 p-1 rounded-lg">
                            {['overview', 'users', 'ai', 'finance', 'content'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => { localStorage.removeItem('adminKey'); window.location.reload(); }} className="text-xs text-red-400 hover:text-red-300">
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6">
                {errorMsg && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-center font-mono text-sm">
                        ⚠️ Limit Error: {errorMsg}
                    </div>
                )}

                {/* Mobile Tab Select */}
                <div className="md:hidden mb-6">
                    <select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value)}
                        className="w-full bg-surface-card border border-white/10 text-white p-3 rounded-lg"
                    >
                        {['overview', 'users', 'ai', 'finance', 'content'].map(tab => (
                            <option key={tab} value={tab}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'ai' && renderAI()}
                {activeTab === 'finance' && renderFinance()}
                {activeTab === 'content' && renderContent()}
            </main>

            {/* User Detail Modal (V3) */}
            {isCreditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-surface-card border border-white/20 p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    {selectedUser.full_name || 'Trader'}
                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${selectedUser.plan_tier === 'pro' ? 'border-gold text-gold' : 'border-gray-600 text-gray-400'}`}>
                                        {selectedUser.plan_tier.toUpperCase()}
                                    </span>
                                </h3>
                                <p className="text-sm text-gray-400">{selectedUser.email}</p>
                                <p className="text-xs text-gray-500 font-mono mt-1">ID: {selectedUser.firebase_uid}</p>
                            </div>
                            <button onClick={() => setIsCreditModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Actions Column */}
                            <div className="space-y-6">
                                {/* Credit Management */}
                                <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                                    <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase">Credits</h4>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setCreditAmount(Math.max(0, creditAmount - 1))} className="p-2 bg-white/10 rounded hover:bg-white/20">-</button>
                                        <input
                                            type="number"
                                            className="bg-black border border-white/10 rounded p-2 text-center text-white w-20"
                                            value={creditAmount}
                                            onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                                        />
                                        <button onClick={() => setCreditAmount(creditAmount + 1)} className="p-2 bg-white/10 rounded hover:bg-white/20">+</button>
                                        <button
                                            onClick={() => performAction(`/admin/users/${selectedUser.id}/credits`, 'POST', { amount: creditAmount })}
                                            className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>

                                {/* Tier Management */}
                                <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                                    <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase">Plan Tier</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {['free', 'starter', 'active', 'advanced'].map(tier => (
                                            <button
                                                key={tier}
                                                onClick={() => performAction(`/admin/users/${selectedUser.id}/tier`, 'POST', { tier })}
                                                className={`px-3 py-1.5 rounded text-xs font-bold border ${selectedUser.plan_tier === tier ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}
                                            >
                                                {tier.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Trial Extension */}
                                <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                                    <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase">Extend Access</h4>
                                    <div className="flex gap-2">
                                        <button onClick={() => performAction(`/admin/users/${selectedUser.id}/extend-trial`, 'POST', { days: 3 })} className="flex-1 py-2 bg-green-900/30 text-green-400 border border-green-500/30 rounded text-xs hover:bg-green-900/50">+3 Days</button>
                                        <button onClick={() => performAction(`/admin/users/${selectedUser.id}/extend-trial`, 'POST', { days: 7 })} className="flex-1 py-2 bg-green-900/30 text-green-400 border border-green-500/30 rounded text-xs hover:bg-green-900/50">+7 Days</button>
                                        <button onClick={() => performAction(`/admin/users/${selectedUser.id}/extend-trial`, 'POST', { days: 30 })} className="flex-1 py-2 bg-green-900/30 text-green-400 border border-green-500/30 rounded text-xs hover:bg-green-900/50">+30 Days</button>
                                    </div>
                                </div>
                            </div>

                            {/* Info Column */}
                            <div className="space-y-4 text-sm">
                                <div className="bg-black/40 p-4 rounded-lg border border-white/5 h-full">
                                    <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase">Subscription Details</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Created At:</span>
                                            <span className="text-gray-300">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-bold text-gray-300 mt-6 mb-3 uppercase">Recent User Activity</h4>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                        {/* We filter the global activity list for this user as a quick hack until we wire up the full details endpoint */}
                                        {activity.filter(a => a.user_id === selectedUser.firebase_uid).length > 0 ? (
                                            activity.filter(a => a.user_id === selectedUser.firebase_uid).map(a => (
                                                <div key={a.id} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                                                    <span className="text-gold">{a.asset}</span>
                                                    <span className="text-gray-500">{new Date(a.created_at).toLocaleDateString()}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-600 italic">No recent activity recorded.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 text-center">
                            <span className="text-xs text-gray-600">Changes are applied immediately.</span>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
