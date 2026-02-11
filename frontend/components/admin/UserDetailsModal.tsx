"use client";

import { useState } from 'react';

interface User {
    id: number;
    email: string;
    full_name: string;
    plan_tier: string;
    credits_balance: number;
    subscription_ends_at: string;
    trial_ends_at: string;
    created_at: string;
    is_admin: boolean;
    firebase_uid: string;
}

interface UserDetailsModalProps {
    user: User | null;
    onClose: () => void;
    onUpdate: () => void; // Trigger refresh
    adminUid: string;
}

export function UserDetailsModal({ user, onClose, onUpdate, adminUid }: UserDetailsModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    if (!user) return null;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': adminUid
    };

    const handleAction = async (action: string, endpoint: string, body: any) => {
        setIsLoading(true);
        setMessage("");
        try {
            const res = await fetch(`${apiUrl}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setMessage(`${action} successful!`);
                onUpdate();
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch (e) {
            setMessage("Network error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const updateTier = (tier: string) => {
        handleAction("Tier Upgrade", `/admin/users/${user.id}/tier`, { tier });
    };

    const addCredits = (amount: number) => {
        // We set absolute balance for now based on backend API
        const newBalance = user.credits_balance + amount;
        handleAction("Added Credits", `/admin/users/${user.id}/credits`, { amount: newBalance });
    };

    const extendTrial = (days: number) => {
        handleAction("Extended Trial", `/admin/users/${user.id}/extend-trial`, { days });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-[#333] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative animate-fade-in shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b border-[#333] pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{user.full_name || "Unknown User"}</h2>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">UID: {user.firebase_uid}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#222] rounded-full transition-colors text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Plan Tier</p>
                        <p className="text-gold font-bold text-lg capitalize">{user.plan_tier}</p>
                    </div>
                    <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Credits</p>
                        <p className="text-white font-bold text-lg">{user.credits_balance}</p>
                    </div>
                    <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Since</p>
                        <p className="text-gray-300 text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Status</p>
                        <p className="text-green-500 text-sm">Active</p>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="space-y-6">

                    {/* Message Area */}
                    {message && (
                        <div className={`p-3 rounded text-sm font-bold text-center ${message.includes("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                            {message}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Quick Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => updateTier('trial')}
                                disabled={isLoading}
                                className="px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#444] rounded text-xs font-bold text-gray-300 transition-colors"
                            >
                                Reset to Trial
                            </button>
                            <button
                                onClick={() => updateTier('starter')}
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-800 rounded text-xs font-bold text-blue-400 transition-colors"
                            >
                                Set Starter
                            </button>
                            <button
                                onClick={() => updateTier('pro')}
                                disabled={isLoading}
                                className="px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/40 rounded text-xs font-bold text-gold transition-colors"
                            >
                                Set Pro
                            </button>
                            <button
                                onClick={() => extendTrial(3)}
                                disabled={isLoading}
                                className="px-4 py-2 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-800 rounded text-xs font-bold text-purple-400 transition-colors"
                            >
                                +3 Days Trial
                            </button>
                            <button
                                onClick={() => addCredits(5)}
                                disabled={isLoading}
                                className="px-4 py-2 bg-green-900/20 hover:bg-green-900/40 border border-green-800 rounded text-xs font-bold text-green-400 transition-colors"
                            >
                                +5 Credits
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-6 border-t border-[#333]">
                        <h3 className="text-sm font-bold text-red-500 uppercase mb-3">Danger Zone</h3>
                        <p className="text-xs text-gray-500 mb-4">Actions here are irreversible. Be careful.</p>
                        <div className="flex gap-3">
                            <button
                                disabled={true}
                                className="px-4 py-2 bg-red-900/10 border border-red-900/30 text-red-700 rounded text-xs font-bold cursor-not-allowed"
                            >
                                Ban User (Coming Soon)
                            </button>
                            <button
                                disabled={true}
                                className="px-4 py-2 bg-red-900/10 border border-red-900/30 text-red-700 rounded text-xs font-bold cursor-not-allowed"
                            >
                                Delete Account (Coming Soon)
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
