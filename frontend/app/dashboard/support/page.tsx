"use client";

export default function SupportPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-2">Support</h1>
            <div className="glass-panel border border-white/5 rounded-xl p-8 text-center py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-500/5 blur-3xl rounded-full scale-150 pointer-events-none"></div>

                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400 backdrop-blur-md relative z-10">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h3 className="text-white font-bold text-xl mb-2 relative z-10">Help Center</h3>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto relative z-10">Need assistance? Our support team is ready to help you with any issues.</p>
                <a href="mailto:support@xgpro.ai" className="relative z-10 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-all font-bold shadow-lg hover:shadow-blue-600/20">
                    Contact Support
                </a>
            </div>
        </div>
    );
}
