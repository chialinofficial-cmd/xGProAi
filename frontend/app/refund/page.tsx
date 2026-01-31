import Link from 'next/link';

export default function RefundPolicy() {
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
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Refund and Cancellation Policy</h1>
                    <p className="text-gold mb-8">Last Updated: January 29, 2026</p>

                    <div className="space-y-8 text-gray-300 leading-relaxed">

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">1. Overview</h2>
                            <p>
                                At xGProAi, we are committed to providing high-quality, AI-powered market analysis. Because our product is a digital service that provides immediate access to proprietary data and analysis, our Refund Policy is strictly governed by the terms below.
                            </p>
                            <p className="mt-2">
                                By subscribing to xGProAi, you acknowledge that you have read, understood, and agreed to this policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">2. No Refunds on Digital Services</h2>
                            <p className="mb-2">
                                Due to the nature of our service where intellectual property and data analysis are consumed instantly upon viewing all sales are final.
                            </p>
                            <p className="mb-2">We do not offer refunds for:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-white">"Change of Mind":</strong> If you decide trading is not for you after subscribing.</li>
                                <li><strong className="text-white">Market Performance:</strong> If the analysis provided did not result in a profitable trade. (As stated in our Terms and Conditions, we are an educational tool, not a financial advisor).</li>
                                <li><strong className="text-white">Unused Features:</strong> If you subscribed but did not use the service during the billing period.</li>
                                <li><strong className="text-white">Forgetting to Cancel:</strong> If you failed to cancel your subscription before the renewal date.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">3. The "Free Trial" & Automatic Renewal</h2>
                            <p className="mb-2">If you sign up for a Free Trial (e.g., 3-Day or 7-Day Access):</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li><strong className="text-white">Zero Charge:</strong> You will not be charged if you cancel before the trial period ends.</li>
                                <li><strong className="text-white">Transition to Paid:</strong> If you do not cancel before the trial expires, the system will automatically convert your account to a paid subscription.</li>
                                <li><strong className="text-white">Responsibility:</strong> It is your sole responsibility to manage your subscription. We cannot refund charges incurred because you forgot to cancel a trial.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">4. Exceptions (When We WILL Refund)</h2>
                            <p className="mb-2">We are fair. We will issue a full refund under the following specific technical circumstances:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li><strong className="text-white">Double Billing:</strong> If a technical error resulted in your card being charged twice for the same billing period.</li>
                                <li><strong className="text-white">Service Unavailability:</strong> If the xGProAi platform was fully down/inaccessible for more than 24 consecutive hours during your active subscription.</li>
                                <li><strong className="text-white">Unauthorized Use:</strong> If you can prove fraud or unauthorized use of your card (subject to verification by your bank and our payment processor).</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">5. How to Cancel Your Subscription</h2>
                            <p className="mb-2">You may cancel your subscription at any time to prevent future charges.</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Log in to your xGProAi Dashboard.</li>
                                <li>Navigate to <strong className="text-white">Settings &gt; Billing</strong>.</li>
                                <li>Click <strong className="text-white">"Cancel Subscription."</strong></li>
                            </ol>
                            <p className="mt-4 bg-surface-start border border-gold/20 p-4 rounded-lg text-sm">
                                <strong className="text-gold">Effect of Cancellation:</strong> You will retain access to the "Gold Pro" features until the end of your current paid billing cycle. After that, your account will revert to the free tier.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">6. Contacting Support</h2>
                            <p className="mb-4">
                                If you believe you qualify for a refund based on the Exceptions listed in Section 4, please contact our support team within 7 days of the charge.
                            </p>
                            <div className="bg-surface-start border border-border-subtle rounded-lg p-6">
                                <ul className="space-y-2">
                                    <li><strong className="text-white">Email:</strong> <a href="mailto:billing@xgpro.ai" className="text-blue-400 hover:text-blue-300">billing@xgpro.ai</a></li>
                                    <li><strong className="text-white">Subject Line:</strong> "Refund Request - [Your Username]"</li>
                                </ul>
                                <p className="mt-4 text-sm text-gray-400">Please include your transaction ID and a description of the issue.</p>
                            </div>
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
