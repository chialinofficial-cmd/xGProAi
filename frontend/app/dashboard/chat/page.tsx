"use client";

import { useState } from 'react';

export default function ChatPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-24 h-24 bg-surface-card rounded-full flex items-center justify-center border border-border-subtle mb-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gold/10 blur-xl"></div>
                <span className="text-4xl">🤖</span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">AI Trading Assistant</h1>
            <p className="text-gray-400 max-w-md mb-8">
                Our advanced AI Chat feature is currently in final testing.
                Soon you'll be able to ask questions about market trends, strategy, and more.
            </p>

            <button className="bg-surface-card border border-gold/30 text-gold px-6 py-3 rounded-lg font-medium hover:bg-gold hover:text-black transition-all">
                Notify Me When Ready
            </button>
        </div>
    );
}
