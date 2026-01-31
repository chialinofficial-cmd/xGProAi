"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaymentSuccessToast() {
    const searchParams = useSearchParams();
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (searchParams.get('payment') === 'success' || searchParams.get('mock_payment') === 'success') {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 5000); // Hide after 5s

            // Remove params from URL without reload
            window.history.replaceState({}, '', '/dashboard');

            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    if (!showSuccess) return null;

    return (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <span className="text-2xl">🎉</span>
            <div>
                <h4 className="font-bold">Upgrade Successful!</h4>
                <p className="text-sm">You are now a Gold Pro member.</p>
            </div>
        </div>
    );
}
