"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../app/context/AuthContext'; // Direct import from app context
import { UserDetailsModal } from './UserDetailsModal';

interface User {
    id: number;
    email: string;
    full_name: string;
    plan_tier: string;
    credits_balance: number;
    created_at: string;
    subscription_ends_at: string;
    trial_ends_at: string;
    is_admin: boolean;
    firebase_uid: string; // Needed for modal
}

export function UserTable() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const LIMIT = 10;

    const fetchUsers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            let query = `?skip=${page * LIMIT}&limit=${LIMIT}`;
            if (search) query += `&search=${search}`;

            const res = await fetch(`${apiUrl}/admin/users${query}`, {
                headers: { 'X-User-ID': user.uid }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search or just effect on dependency
    useEffect(() => {
        fetchUsers();
    }, [user, page, search]); // Re-fetch on page/search change

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(0); // Reset to first page
    };

    return (
        <div className="glass-panel p-6 rounded-xl">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-white">User Management</h3>
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search email..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-gold/50"
                    />
                    <svg className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#333] text-gray-400 text-xs uppercase tracking-wider">
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-4">Tier</th>
                            <th className="py-3 px-4">Credits</th>
                            <th className="py-3 px-4">Joined</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500 animate-pulse">Loading Users...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">No users found.</td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className="border-b border-[#333]/50 hover:bg-white/5 transition-colors group">
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-200">{u.full_name || "Trader"}</span>
                                            <span className="text-xs text-gray-500">{u.email}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${u.plan_tier === 'pro' ? 'bg-gold/20 text-gold border-gold/30' :
                                                u.plan_tier === 'trial' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                    'bg-gray-800 text-gray-400 border-gray-700'
                                            }`}>
                                            {u.plan_tier}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-white font-mono">{u.credits_balance}</td>
                                    <td className="py-3 px-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            onClick={() => setSelectedUser(u)}
                                            className="px-3 py-1 bg-[#222] hover:bg-gold hover:text-black border border-[#444] rounded text-xs font-bold transition-all"
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6 border-t border-[#333] pt-4">
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="text-xs text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    &larr; Previous
                </button>
                <span className="text-xs text-gray-600">Page {page + 1}</span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={users.length < LIMIT}
                    className="text-xs text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next &rarr;
                </button>
            </div>

            {/* Modal */}
            {selectedUser && user && (
                <UserDetailsModal
                    user={selectedUser}
                    adminUid={user.uid}
                    onClose={() => setSelectedUser(null)}
                    onUpdate={() => {
                        fetchUsers(); // Refresh list to show new tier/credits
                        setSelectedUser(null); // Close modal
                    }}
                />
            )}
        </div>
    );
}
