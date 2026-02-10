"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        mobile: '',
        country: '',
        gender: '',
        age_group: ''
    });

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/stats`, {
                    headers: { 'X-User-ID': user.uid }
                });

                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                    // Pre-fill form
                    setFormData({
                        mobile: data.mobile || '',
                        country: data.country || '',
                        gender: data.gender || '',
                        age_group: data.age_group || ''
                    });
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': user?.uid || ''
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to update profile.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse text-center p-12">Loading Profile...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <h1 className="text-3xl font-bold text-white mb-6">User Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left: Subscription & Stats */}
                <div className="glass-panel p-8 rounded-xl space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-2xl font-bold text-black">
                            {user?.displayName?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{user?.displayName || 'User'}</h2>
                            <p className="text-gray-400 text-sm">{user?.email}</p>
                            <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded ${stats?.plan_tier === 'pro' ? 'bg-gold text-black' : 'bg-gray-700 text-gray-300'}`}>
                                {stats?.plan_tier} Plan
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-gray-400 text-xs uppercase">Credits</p>
                            <p className="text-2xl font-bold text-white">{stats?.credits_remaining}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-gray-400 text-xs uppercase">Analyses</p>
                            <p className="text-2xl font-bold text-white">{stats?.total_analyses}</p>
                        </div>
                    </div>

                    {stats?.subscription_ends_at && (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                            <p className="text-blue-200 text-sm">
                                <strong>Subscription Active</strong><br />
                                Renews on {new Date(stats.subscription_ends_at).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Edit Details */}
                <div className="glass-panel p-8 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Personal Details</h3>

                    {message && (
                        <div className={`p-3 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-xs uppercase font-bold mb-2">Full Name (Read Only)</label>
                            <input
                                type="text"
                                value={user?.displayName || ''}
                                disabled
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-xs uppercase font-bold mb-2">Mobile Number</label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                placeholder="+1234567890"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-xs uppercase font-bold mb-2">Country</label>
                            <select
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold outline-none transition-colors"
                            >
                                <option value="">Select Country</option>
                                <option value="USA">United States</option>
                                <option value="UK">United Kingdom</option>
                                <option value="CA">Canada</option>
                                <option value="AU">Australia</option>
                                <option value="ZA">South Africa</option>
                                <option value="NG">Nigeria</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-xs uppercase font-bold mb-2">Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold outline-none transition-colors"
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs uppercase font-bold mb-2">Age Group</label>
                                <select
                                    value={formData.age_group}
                                    onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold outline-none transition-colors"
                                >
                                    <option value="">Select</option>
                                    <option value="18-24">18-24</option>
                                    <option value="25-34">25-34</option>
                                    <option value="35-44">35-44</option>
                                    <option value="45+">45+</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-gold hover:bg-gold-light text-black font-bold py-3 rounded-lg transition-all mt-4 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
