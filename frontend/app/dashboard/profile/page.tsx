"use client";

import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">

            {/* Header Section */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">My Profile</h1>
                <p className="text-gray-400">Manage your account information and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Profile Form */}
                <div className="lg:col-span-2 bg-surface-card border border-border-subtle rounded-xl p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-lg font-bold text-white">Profile Information</h2>
                        <button className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-lg text-white text-sm hover:bg-white/5 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Complete Profile
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-full bg-blue-600 overflow-hidden relative group cursor-pointer">
                            {/* Placeholder for user avatar - using a gradient/initials fallback or image if available */}
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white uppercase">
                                {user?.displayName ? user.displayName.substring(0, 2) : "U"}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">{user?.displayName || "User"}</h3>
                            <p className="text-gray-500 text-sm">Full Stack Trader</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-medium uppercase">Name</label>
                            <input
                                type="text"
                                defaultValue={user?.displayName || ""}
                                className="w-full bg-[#1a1d24] border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                readOnly
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-medium uppercase">Email</label>
                            <input
                                type="email"
                                defaultValue={user?.email || ""}
                                className="w-full bg-[#1a1d24] border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                readOnly
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-medium uppercase">Mobile</label>
                            <input
                                type="tel"
                                placeholder="Add phone number"
                                className="w-full bg-[#1a1d24] border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-medium uppercase">Country</label>
                            <input
                                type="text"
                                placeholder="Add Country"
                                className="w-full bg-[#1a1d24] border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-medium uppercase">Gender</label>
                            <select className="w-full bg-[#1a1d24] border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none">
                                <option>Select Gender</option>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-xs font-medium uppercase">Age Group</label>
                            <select className="w-full bg-[#1a1d24] border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none">
                                <option>Select Age Group</option>
                                <option>18-25</option>
                                <option>26-39</option>
                                <option>40-60</option>
                                <option>60+</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Right: Account Details */}
                <div className="bg-surface-card border border-border-subtle rounded-xl p-8 h-fit">
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
                            <span className="bg-[#1a1d24] text-gray-400 text-xs px-2 py-1 rounded border border-border-subtle">(no active plan)</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-sm">Next Billing</span>
                            </div>
                            <span className="text-white font-medium text-sm">N/A</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                <span className="text-sm">Credits Left</span>
                            </div>
                            <span className="bg-blue-600/10 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-600/20">0</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
