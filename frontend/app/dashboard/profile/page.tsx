"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [formData, setFormData] = useState({
        mobile: '',
        country: '',
        gender: '',
        age_group: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiUrl}/stats`, {
                    headers: { 'X-User-ID': user.uid }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfileData(data);
                    setFormData({
                        mobile: data.mobile || '',
                        country: data.country || '',
                        gender: data.gender || '',
                        age_group: data.age_group || ''
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveMessage({ type: '', text: '' });

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': user.uid
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Refresh profile data to ensure sync
                const statsRes = await fetch(`${apiUrl}/stats`, {
                    headers: { 'X-User-ID': user.uid }
                });
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setProfileData(data);
                }
            } else {
                setSaveMessage({ type: 'error', text: 'Failed to update profile.' });
            }
        } catch (error) {
            console.error(error);
            setSaveMessage({ type: 'error', text: 'An error occurred.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
        }
    };

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">My Profile</h1>
                <p className="text-gray-400">Manage your account information and preferences</p>
                {saveMessage.text && (
                    <div className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium inline-block ${saveMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {saveMessage.text}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Profile Form */}
                <div className="lg:col-span-2 glass-panel rounded-xl p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-lg font-bold text-white">Profile Information</h2>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-white text-sm hover:bg-white/5 transition-colors backdrop-blur-sm ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            )}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-full bg-blue-600 overflow-hidden relative group cursor-pointer ring-4 ring-white/5">
                            {/* Placeholder for user avatar */}
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-xl font-bold text-white uppercase shadow-inner">
                                {user?.displayName ? user.displayName.substring(0, 2) : "U"}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">{user?.displayName || "User"}</h3>
                            <p className="text-gray-400 text-sm">Full Stack Trader</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Name</label>
                            <input
                                type="text"
                                defaultValue={user?.displayName || ""}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors backdrop-blur-sm opacity-50 cursor-not-allowed"
                                readOnly
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                defaultValue={user?.email || ""}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors backdrop-blur-sm opacity-50 cursor-not-allowed"
                                readOnly
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Mobile</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleInputChange}
                                placeholder="Add phone number"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600 backdrop-blur-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Country</label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                placeholder="Add Country"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600 backdrop-blur-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none backdrop-blur-sm"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Age Group</label>
                            <select
                                name="age_group"
                                value={formData.age_group}
                                onChange={handleInputChange}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none backdrop-blur-sm"
                            >
                                <option value="">Select Age Group</option>
                                <option value="18-25">18-25</option>
                                <option value="26-39">26-39</option>
                                <option value="40-60">40-60</option>
                                <option value="60+">60+</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Right: Account Details */}
                <div className="glass-card rounded-xl p-8 h-fit">
                    <h2 className="text-lg font-bold text-white mb-6">Account Details</h2>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-sm">Member Since</span>
                            </div>
                            <span className="text-white font-medium text-sm">Jan 2026</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                <span className="text-sm">Plan Type</span>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs px-2 py-1 rounded border font-bold uppercase ${profileData?.plan_tier === 'pro' ? 'bg-gold/10 text-gold border-gold/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                                    {profileData?.plan_tier || "free"}
                                </span>
                                {profileData?.trial_ends_at && profileData.plan_tier === 'trial' && (
                                    <p className="text-[10px] text-yellow-500 mt-1">
                                        Exp: {new Date(profileData.trial_ends_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-sm">Next Billing</span>
                            </div>
                            <span className="text-white font-medium text-sm">
                                {profileData?.subscription_ends_at ? new Date(profileData.subscription_ends_at).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                <span className="text-sm">Credits Left</span>
                            </div>
                            <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-500/20">
                                {profileData?.plan_tier === 'pro' ? '∞' : (profileData?.credits_remaining || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
