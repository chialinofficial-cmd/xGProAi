'use client';

import { useState } from 'react';

export default function ContactForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !message.trim()) {
            setStatus('error');
            setErrorMsg('Please fill in all fields.');
            return;
        }

        setStatus('loading');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to send message');
            }

            setStatus('success');
            setName('');
            setEmail('');
            setMessage('');
        } catch (err: unknown) {
            setStatus('error');
            setErrorMsg(err instanceof Error ? err.message : 'An error occurred. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="cf-name" className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                <input
                    type="text"
                    id="cf-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-card border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                    placeholder="Enter your name"
                    disabled={status === 'loading'}
                />
            </div>
            <div>
                <label htmlFor="cf-email" className="block text-sm font-medium text-gray-400 mb-2">Your Email</label>
                <input
                    type="email"
                    id="cf-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-card border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                    placeholder="Enter your email"
                    disabled={status === 'loading'}
                />
            </div>
            <div>
                <label htmlFor="cf-message" className="block text-sm font-medium text-gray-400 mb-2">Your Message</label>
                <textarea
                    id="cf-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-surface-card border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors resize-none"
                    placeholder="How can we help you?"
                    disabled={status === 'loading'}
                />
            </div>

            {/* Feedback Messages */}
            {status === 'success' && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Message sent! We'll get back to you soon.
                </div>
            )}
            {status === 'error' && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                    {errorMsg}
                </div>
            )}

            <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-gold hover:bg-gold-light text-black font-bold py-3 rounded-lg transition-colors shadow-lg shadow-gold/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {status === 'loading' ? (
                    <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Sending...
                    </>
                ) : (
                    'Send Message'
                )}
            </button>
        </form>
    );
}
