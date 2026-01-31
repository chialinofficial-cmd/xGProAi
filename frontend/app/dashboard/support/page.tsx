"use client";

export default function SupportPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-2">Support</h1>
            <div className="bg-surface-card border border-border-subtle rounded-xl p-8 text-center py-20">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Help Center</h3>
                <p className="text-gray-400 mb-6">Need assistance? Contact our support team.</p>
                <a href="mailto:support@xgpro.ai" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium">
                    Contact Support
                </a>
            </div>
        </div>
    );
}
