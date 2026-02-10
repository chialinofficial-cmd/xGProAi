"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function UserManagement() {
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!user) return;
        fetchUsers();
    }, [user, search]); // Re-fetch on search

    const fetchUsers = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const url = search
                ? `${apiUrl}/admin/users?search=${search}`
                : `${apiUrl}/admin/users`;

            const res = await fetch(url, {
                headers: { 'X-User-ID': user?.uid || '' }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGrantCredits = async (userId: number, currentCredits: number) => {
        const amount = prompt("Enter new credit balance:", currentCredits.toString());
        if (!amount) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/admin/users/${userId}/credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': user?.uid || ''
                },
                body: JSON.stringify({ amount: parseInt(amount) })
            });

            if (res.ok) {
                alert("Credits updated!");
                fetchUsers(); // Refresh
            } else {
                alert("Failed to update credits.");
            }
        } catch (error) {
            alert("Error updating credits.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">User Management</h1>
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-gold transition-colors"
                />
            </div>

            <div className="glass-panel rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">User</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Tier</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Credits</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Usage (Daily)</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Joined</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div>
                                            <p className="font-bold text-white">{u.full_name}</p>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${u.plan_tier === 'pro' ? 'bg-gold text-black' :
                                                u.plan_tier === 'active' ? 'bg-green-500/20 text-green-500' :
                                                    'bg-gray-700 text-gray-300'
                                            }`}>
                                            {u.plan_tier}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-300">{u.credits_balance}</td>
                                    <td className="p-4 text-gray-300">{u.daily_usage_count}</td>
                                    <td className="p-4 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleGrantCredits(u.id, u.credits_balance)}
                                            className="text-gold hover:text-white text-xs font-bold mr-2"
                                        >
                                            Edit Credits
                                        </button>
                                        {/* Future: View Details */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
