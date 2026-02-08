'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reference = searchParams.get('reference');
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        if (!reference) {
            setStatus('failed');
            setMessage('No payment reference found.');
            return;
        }

        const verifyTransaction = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiUrl}/paystack/verify/${reference}`);
                const data = await res.json();

                if (res.ok && data.status === 'success') {
                    setStatus('success');
                    setMessage('Payment successful! Your plan has been upgraded.');
                    // Redirect after a few seconds
                    setTimeout(() => router.push('/dashboard'), 3000);
                } else {
                    setStatus('failed');
                    setMessage(data.message || 'Payment verification failed.');
                }
            } catch (error) {
                console.error("Verification Error:", error);
                setStatus('failed');
                setMessage('An error occurred while connecting to the server.');
            }
        };

        verifyTransaction();
    }, [reference, router]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-surface-card border border-border-subtle rounded-xl p-8 text-center shadow-2xl relative overflow-hidden">

                {/* Background Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${status === 'success' ? 'from-green-500/10' : status === 'failed' ? 'from-red-500/10' : 'from-blue-500/10'} to-transparent opacity-50`}></div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="mb-6 flex justify-center">
                        {status === 'verifying' && (
                            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        )}
                        {status === 'success' && (
                            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-3xl animate-bounce">
                                ✅
                            </div>
                        )}
                        {status === 'failed' && (
                            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-3xl">
                                ❌
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        {status === 'verifying' ? 'Verifying Payment' : status === 'success' ? 'Payment Successful' : 'Verification Failed'}
                    </h1>

                    <p className="text-gray-400 mb-8">{message}</p>

                    {status === 'success' && (
                        <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
                    )}

                    {status === 'failed' && (
                        <Link href="/" className="inline-block bg-surface-card hover:bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg transition-colors">
                            Return to Home
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyPaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
