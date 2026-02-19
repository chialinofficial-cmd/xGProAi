import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="bg-gold/5 border border-gold/20 p-8 rounded-2xl max-w-md w-full text-center relative overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gold/10 blur-3xl rounded-full pointer-events-none"></div>

                <h2 className="text-6xl font-black text-gold mb-2 drop-shadow-lg">404</h2>
                <h3 className="text-xl font-bold text-white mb-4">Signal Lost</h3>

                <p className="text-gray-400 mb-8 z-10 relative">
                    The market data you are looking for does not exist or has been moved.
                    Return to the trading floor.
                </p>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-light text-black font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] z-10 relative"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
