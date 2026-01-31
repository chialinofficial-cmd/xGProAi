import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-gold selection:text-black">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2">
                            <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span className="text-xl font-bold tracking-tight text-white">xGProAi</span>
                        </Link>
                    </div>
                    <div>
                        <Link href="/" className="text-sm font-medium text-gray-400 hover:text-gold transition-colors">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-surface-card border border-border-subtle rounded-2xl p-8 md:p-12 shadow-2xl">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
                    <p className="text-gold mb-8">Last Updated: January 29, 2026</p>

                    <div className="space-y-8 text-gray-300 leading-relaxed">

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
                            <p>
                                Welcome to xGProAi ("we," "our," or "us"). We are a specialized AI-powered analytics platform for Gold (XAU/USD) traders, operated by Kamakat Holdings Ltd, a company registered in the Republic of Ghana.
                            </p>
                            <p className="mt-2">
                                We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website [https://www.xgpro.ai] and use our AI chart analysis services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">2. Information We Collect</h2>
                            <p className="mb-2">We collect distinct categories of information to provide our specialized services:</p>

                            <h3 className="text-lg font-semibold text-white mt-4 mb-2">A. Information You Provide</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-white">Account Data:</strong> When you sign up (via Google or Email), we collect your name, email address, and profile picture.</li>
                                <li><strong className="text-white">User Content (The "Charts"):</strong> We collect the screenshots and images of financial charts you upload for analysis.</li>
                                <li><strong className="text-white">Payment Information:</strong> If you subscribe to our "Gold Pro" tier, our third-party payment processors (e.g., Paystack, Stripe) handle your financial details. We do not store your full credit card or mobile money details on our servers.</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white mt-4 mb-2">B. Information Collected Automatically</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-white">Technical Data:</strong> IP address, browser type, device type (Mobile/Desktop), and operating system.</li>
                                <li><strong className="text-white">Usage Data:</strong> Details of your visits, including the frequency of uploads, time spent on analysis results, and click patterns.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                            <p className="mb-2">We use your data for specific business purposes:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li><strong className="text-white">To Provide the Service:</strong> Processing your uploaded charts through our AI Vision Engine to generate technical analysis.</li>
                                <li><strong className="text-white">To Improve Our AI:</strong> Anonymized chart data may be used to refine our "xGold" algorithms to better recognize Gold-specific patterns (liquidity grabs, etc.).</li>
                                <li><strong className="text-white">Communication:</strong> Sending you analysis summaries, subscription receipts, and major platform updates.</li>
                                <li><strong className="text-white">Security:</strong> Detecting fraud or abuse of our "Fair Usage" limits.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">4. The Role of Artificial Intelligence (AI)</h2>
                            <div className="bg-surface-start border border-gold/20 rounded-lg p-6">
                                <p className="mb-4">
                                    <strong className="text-gold">Crucial Transparency:</strong> To provide our service, the chart images you upload are processed by advanced Vision-Language Models (VLMs). This may involve transmitting your image data to trusted third-party AI providers (e.g., OpenAI, Anthropic, or proprietary hosted models) solely for the purpose of analysis.
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>We do not claim ownership of your trading strategies visible in the charts.</li>
                                    <li>We instruct our AI providers not to use your specific personal data to train their public models.</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">5. Data Sharing and Disclosure</h2>
                            <p className="mb-2">We do not sell your personal data. We only share data in the following circumstances:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-white">Service Providers:</strong> With cloud hosting (e.g., AWS), AI processing partners, and payment processors (e.g., Paystack, Stripe).</li>
                                <li><strong className="text-white">Legal Compliance:</strong> If required by Ghanaian law or international regulations to comply with a subpoena or legal process.</li>
                                <li><strong className="text-white">Business Transfers:</strong> If xGProAi or its parent company is involved in a merger, acquisition, or asset sale.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">6. International Data Transfers</h2>
                            <p>
                                While we are based in Ghana, our AI processing servers and cloud infrastructure may be located in the United States or Europe. By using xGProAi, you consent to the transfer of your information to these jurisdictions, which may have different data protection laws than your country of residence.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">7. Your Rights (Ghana & Global)</h2>
                            <div className="mb-4">
                                Under the Data Protection Act, 2012 (Act 843) and international standards, you have the right to:
                            </div>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-white">Access:</strong> Request a copy of the personal data we hold about you.</li>
                                <li><strong className="text-white">Correction:</strong> Request correction of inaccurate data.</li>
                                <li><strong className="text-white">Deletion:</strong> Request that we delete your account and associated data ("Right to be Forgotten").</li>
                                <li><strong className="text-white">Withdraw Consent:</strong> You may withdraw consent for marketing communications at any time.</li>
                            </ul>
                            <p className="mt-4">
                                To exercise these rights, please contact us at: <a href="mailto:privacy@xgpro.ai" className="text-blue-400 hover:text-blue-300">privacy@xgpro.ai</a>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">8. Data Security</h2>
                            <p>
                                We implement industry-standard security measures, including SSL encryption and secure server architecture, to protect your data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">9. Third-Party Links</h2>
                            <p>
                                Our service may contain links to external sites (e.g., TradingView, MetaTrader, etc). We are not responsible for the privacy practices of these other sites.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">10. Changes to This Policy</h2>
                            <p>
                                We may update this policy specifically as AI regulations evolve. We will notify you of significant changes via email or a prominent notice on our platform.
                            </p>
                        </section>

                        <section className="border-t border-border-subtle pt-8 mt-12">
                            <h2 className="text-xl font-bold text-white mb-4">Contact Us</h2>
                            <p className="mb-4">If you have questions about this Privacy Policy, please contact us:</p>
                            <ul className="space-y-2">
                                <li>Email: <a href="mailto:support@xgpro.ai" className="text-blue-400 hover:text-blue-300">support@xgpro.ai</a></li>
                                <li>Address: 26 NII ATTOH MACLEAN AVE, GA-533-6599 Accra, Ghana</li>
                            </ul>
                        </section>

                    </div>
                </div>
            </main>

            <footer className="bg-background border-t border-border-subtle py-8 text-center">
                <p className="text-gray-500 text-sm">© 2026 FarNorth Edsulation Pvt Ltd. All rights reserved.</p>
            </footer>
        </div>
    );
}
