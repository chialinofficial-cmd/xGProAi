"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            alert("Login failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            alert("Google Login failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md p-8 relative z-10">

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <img src="/logo.png" alt="xGProAi" className="w-32 h-auto rounded-xl" />
                    </Link>
                </div>

                <div className="bg-surface-card border border-border-subtle rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h2>
                    <p className="text-gray-400 text-center mb-8 text-sm">Sign in to access your dashboard</p>

                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                className="w-full bg-background border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-400">Password</label>
                                <Link href="#" className="text-xs text-gold hover:text-gold-light">Forgot Password?</Link>
                            </div>
                            <input
                                type="password"
                                id="password"
                                className="w-full bg-background border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gold hover:bg-gold-light text-black font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-gold/20 mt-2"
                            disabled={loading}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border-subtle"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-surface-card text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3">
                            <button
                                onClick={handleGoogleLogin}
                                className="flex items-center justify-center gap-3 w-full bg-surface-start hover:bg-surface-end border border-border-subtle text-white py-2.5 rounded-lg transition-colors"
                                disabled={loading}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                <span className="text-sm font-medium">Google</span>
                            </button>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-gold hover:text-gold-light font-medium">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
