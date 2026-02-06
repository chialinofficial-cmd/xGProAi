'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop (stub for now)
    alert("Upload functionality coming in next step!");
  };

  const { user } = useAuth();
  const router = useRouter();

  const handlePayment = async (amount: number) => {
    if (!user) {
      router.push('/signup');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/paystack/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.uid
        },
        body: JSON.stringify({
          amount: amount,
          email: user.email
        })
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert("Payment creation failed");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating payment");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border-subtle bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="xGProAi" className="w-24 h-auto rounded-lg" />
          </div>

          {/* Centered Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
            <Link href="#about" className="hover:text-white transition-colors">About</Link>
          </div>

          {/* Right CTA */}
          <div className="flex gap-4 items-center">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              Start Analysis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface-end to-background relative overflow-hidden">

        {/* Powered By Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-blue-400 font-medium opacity-80">
          <span>✨ Powered by FarNorth Advanced AI</span>
        </div>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10">

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Institutional Gold Analysis <br />
            <span className="text-gold">Made Simple</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            AI-powered gold chart analysis that highlights market structure, liquidity, and directional bias from your chart in seconds.
          </p>

          <p className="text-sm text-gray-500 max-w-2xl mx-auto mt-4 font-medium">
            No signals. No guessing. No indicators overload. Just clear Institutional insight for XAUUSD traders.
          </p>

          {/* No Credit Card Badge */}
          <div className="flex justify-center my-6">
            <div className="border border-gold text-gold bg-gold/5 px-6 py-2 rounded-full text-sm font-bold tracking-wide uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <span>💳</span> NO CREDIT CARD REQUIRED
            </div>
          </div>

          <p className="text-xs text-gray-400 font-medium">
            Trusted by Top traders across 100+ countries
          </p>

          {/* CTA Button */}
          <div>
            <Link href="/signup" className="inline-block bg-gold hover:bg-gold-light text-black text-lg px-10 py-4 rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transform hover:-translate-y-1">
              ✨ Start Free Trial
            </Link>
          </div>

          {/* Dashboard Preview Image */}
          <div className="mt-16 relative mx-auto max-w-4xl">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl -z-10 rounded-full opacity-20" />
            <div className="rounded-xl border border-border-subtle bg-surface-card/50 backdrop-blur-sm p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-gray-500">See exactly what AI shows before you sign up</span>
              </div>
              {/* Generated Dashboard Preview */}
              <img
                src="/dashboard_analysis_preview.png"
                alt="xGProAi Dashboard Preview"
                className="w-full rounded-lg border border-border-subtle"
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-20">
            {[
              { label: "Countries Supported", val: "171+", color: "text-blue-400", border: "border-blue-500/30" },
              { label: "Active Gold Traders", val: "80K+", color: "text-pink-400", border: "border-pink-500/30" },
              { label: "Gold Charts Analyzed", val: "4M+", color: "text-yellow-400", border: "border-yellow-500/30" },
              { label: "Avg Win Rate **", val: "56%", color: "text-green-400", border: "border-green-500/30" },
              { label: "Avg Risk / Reward **", val: "1 : 1.68", color: "text-purple-400", border: "border-purple-500/30" },
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-xl bg-surface-card border ${stat.border} flex flex-col items-center justify-center text-center`}>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{stat.label}</p>
                <h4 className={`text-2xl font-bold ${stat.color}`}>{stat.val}</h4>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-gray-600 mt-8 max-w-3xl mx-auto">
            ** Past performance does not guarantee future results. The win rate and risk/reward ratios are based on historical data and are for informational purposes only. Trading involves risk.
          </p>

        </div>
      </main>

      {/* Problem Section (New) */}
      <section className="py-20 bg-background border-b border-border-subtle relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-red-900/5 blur-3xl rounded-full -mr-20 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Most Traders Lose Not Because of Entries But <span className="text-red-500">Because of Bias</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed max-w-3xl mx-auto">
            Gold doesn't just move randomly. It moves to liquidity, reacts to structure, and punishes retail bias.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10 text-left">
            <div className="bg-surface-card border border-red-500/20 p-6 rounded-xl hover:border-red-500/40 transition-colors">
              <span className="text-red-500 text-xl font-bold block mb-3">❌ Chase Breakouts</span>
              <p className="text-gray-400 text-sm">Entering trades after the move has already happened, becoming exit liquidity for institutions.</p>
            </div>
            <div className="bg-surface-card border border-red-500/20 p-6 rounded-xl hover:border-red-500/40 transition-colors">
              <span className="text-red-500 text-xl font-bold block mb-3">❌ Lagging Indicators</span>
              <p className="text-gray-400 text-sm">Relying on RSI or MACD divergence that paints the picture only after the candle closes.</p>
            </div>
            <div className="bg-surface-card border border-red-500/20 p-6 rounded-xl hover:border-red-500/40 transition-colors">
              <span className="text-red-500 text-xl font-bold block mb-3">❌ Institutional Blindness</span>
              <p className="text-gray-400 text-sm">Entering the market without understanding where the real money (Smart Money) is positioning.</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gold/10 to-transparent border-l-4 border-gold p-6 rounded-r-xl inline-block text-left">
            <p className="text-white text-lg">
              <span className="text-gold font-bold">xGProAi Fixes That:</span> We show you what the market is <span className="italic">really</span> doing—revealing the bias before you click buy or sell.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-surface-card border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful AI Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our Vision-Language Model is fine-tuned on <span className="text-gold">XAU/USD</span> behavior to deliver institutional-grade insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Gold-Specific AI",
                desc: "Unlike generic models, our AI understands Gold's unique volatility and manipulation patterns.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                )
              },
              {
                title: "Universal Chart Upload",
                desc: "Upload candlestick charts from TradingView, MetaTrader, or any other platform.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )
              },
              {
                title: "Instant Analysis",
                desc: "Get immediate insights on trend direction, momentum, and key price levels.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                title: "Support & Resistance",
                desc: "Identify critical supply and demand zones with institutional precision.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                )
              },
              {
                title: "Liquidity Analysis",
                desc: "Spot 'Wicks' and liquidity grabs where retail traders often get stopped out.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              {
                title: "Any Timeframe",
                desc: "Analyze charts from any timeframe - from 1-minute scalping to weekly swings.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                title: "Macro Context",
                desc: "Our Pro models checks DXY & Yields correlation to validate Gold moves.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                title: "Trade Insights",
                desc: "Receive clear bias (Bullish/Bearish) and invalidation levels.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                )
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-xl bg-background border border-border-subtle hover:border-gold/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.05)] transition-all duration-300 group text-center flex flex-col items-center">
                <div className="mb-4 p-3 rounded-full bg-surface-card border border-border-subtle text-gold group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-dark/5 to-transparent opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Get AI-powered chart analysis in just 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Signup",
                desc: "Get started with simple email allow-list access for the beta period.",
                icon: (
                  <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                )
              },
              {
                step: "02",
                title: "Upload Chart",
                desc: "Upload any candlestick chart image from TradingView or MetaTrader.",
                icon: (
                  <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )
              },
              {
                step: "03",
                title: "AI Analysis",
                desc: "Our Specialist Gold AI analyzes structure, liquidity wicks, and bias.",
                icon: (
                  <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )
              },
              {
                step: "04",
                title: "Get Results",
                desc: "Receive comprehensive analysis, trading levels, and bias instantly.",
                icon: (
                  <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )
              }
            ].map((item, i) => (
              <div key={i} className="relative pt-8 group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-surface-card border border-gold/30 text-gold text-sm font-bold w-10 h-10 flex items-center justify-center rounded-full z-20 shadow-[0_0_15px_rgba(212,175,55,0.2)] group-hover:bg-gold group-hover:text-black transition-colors duration-300">
                  {item.step}
                </div>
                <div className="bg-surface-card border border-border-subtle p-8 pt-12 rounded-xl text-center h-full hover:border-gold/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <div className="mb-6 inline-flex p-3 rounded-full bg-background border border-border-subtle group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-background border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-16">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Tier 1: Monthly */}
            <div className="p-8 rounded-2xl bg-surface-card border border-border-subtle flex flex-col">
              <h3 className="text-xl font-bold text-gray-300">Monthly Pro</h3>
              <div className="my-6">
                <span className="text-4xl font-bold text-white">$20</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 text-left flex-grow mb-8 text-gray-400 text-sm">
                <li className="flex items-center gap-2"><span className="text-gold">✓</span> Unlimited Analysis Uploads</li>
                <li className="flex items-center gap-2"><span className="text-gold">✓</span> Standard Processing Speed</li>
                <li className="flex items-center gap-2"><span className="text-gold">✓</span> Cancel Anytime</li>
              </ul>
              <button
                onClick={() => handlePayment(20)}
                className="w-full py-3 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-colors font-semibold"
              >
                Get Monthly
              </button>
            </div>

            {/* Tier 2: Yearly */}
            <div className="relative p-8 rounded-2xl bg-surface-card border border-gold-dark shadow-[0_0_30px_rgba(212,175,55,0.1)] flex flex-col transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold text-black text-xs font-bold px-3 py-1 rounded-full uppercase">
                Best Value (Save 15%)
              </div>
              <h3 className="text-xl font-bold text-white">Yearly Pro</h3>
              <div className="my-6">
                <span className="text-4xl font-bold text-gradient-gold">$204</span>
                <span className="text-gray-500">/yr</span>
                <p className="text-xs text-green-400 mt-2">Billed at $17/mo</p>
              </div>
              <ul className="space-y-4 text-left flex-grow mb-8 text-gray-300 text-sm">
                <li className="flex items-center gap-2"><span className="text-gold">✓</span> Unlimited Analysis Uploads</li>
                <li className="flex items-center gap-2"><span className="text-gold">✓</span> Priority Server Processing</li>
                <li className="flex items-center gap-2"><span className="text-gold">✓</span> Macro Context (DXY Correlation)</li>
                <li className="flex items-center gap-2"><span className="text-gold">✓</span> 2 Months Free</li>
              </ul>
              <button
                onClick={() => handlePayment(204)}
                className="w-full py-3 rounded-lg bg-gold hover:bg-gold-light text-black font-bold transition-all shadow-lg shadow-gold/20"
              >
                Get Yearly Pro
              </button>
            </div>

          </div>

          <p className="text-center text-xs text-gray-500 mt-8">
            **All plans use the same FarNorth Advanced AI engine and provide identical analysis output quality.
          </p>

        </div>
      </section>

      {/* Who Uses Section */}
      <section className="py-24 bg-surface-card border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Who Uses xGProAi?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">From individual traders to large institutions, our AI-powered analysis helps traders of all levels make better decisions.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            {[
              {
                title: "Retail Traders",
                desc: "Individual traders looking to improve their chart analysis skills and make better trading decisions.",
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                )
              },
              {
                title: "Technical Analysts",
                desc: "Professional analysts who need quick, accurate chart analysis for Gold and DXY correlations.",
                icon: (
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                )
              },
              {
                title: "Fund Managers",
                desc: "Portfolio managers seek data-driven insights for investment decisions.",
                icon: (
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                )
              },
              {
                title: "Prop Traders",
                desc: "Needs a 'second opinion' to avoid blowing funded accounts during high volatility.",
                icon: (
                  <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )
              },
              {
                title: "Institutions",
                desc: "Banks, hedge funds, and financial institutions requiring scalable chart analysis solutions.",
                icon: (
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                )
              },
              {
                title: "Trading Teams",
                desc: "Collaborative trading groups and signal providers looking for consistent analysis methodology.",
                icon: (
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                )
              }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-xl bg-background border border-border-subtle flex flex-col items-center text-center hover:border-gold/30 transition-all duration-300">
                <div className="mb-4 p-3 rounded-full bg-surface-card border border-border-subtle">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA Banner */}
          <div className="rounded-2xl bg-surface-card border border-border-subtle p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-dark/10 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Trading?</h2>
              <p className="text-gray-400 mb-8">Join thousands of traders who trust xGProAi for accurate, AI-powered chart analysis.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20">
                  Start Free Trial
                </button>
                <button className="bg-surface-card hover:bg-background border border-border-subtle text-white px-8 py-3 rounded-lg font-medium transition-all">
                  View Pricing Plans
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-background border-t border-border-subtle relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              About <span className="text-gradient-gold">xGProAi</span>
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
              <strong className="text-white block mb-2 text-xl">To Demystify the Gold Market with Institutional-Grade Intelligence.</strong>
              Our mission is to arm the everyday Gold trader with a specialized AI companion that cuts through the noise, identifies liquidity traps, and reveals the true bias of the XAU/USD market in seconds.
            </p>
          </div>

          {/* Problem & Solution Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-24">
            <div className="bg-surface-card border border-red-900/30 p-8 rounded-2xl relative overflow-hidden group hover:border-red-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-red-500">⚠</span> The Problem: "Generalist AI"
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                The financial world is flooded with generic AI tools that try to analyze everything from Bitcoin to Apple stock using the same logic. But <strong>Gold (XAU/USD) is different</strong>. It has its own personality, reacts violently to geopolitical news, hunts liquidity, and respects specific psychological zones that other assets ignore. Using a generic analyzer for Gold is like bringing a knife to a gunfight.
              </p>
            </div>

            <div className="bg-surface-card border border-gold/20 p-8 rounded-2xl relative overflow-hidden group hover:border-gold/50 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-gold">⚡</span> The Solution: xGold Neural Engine
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                We built xGProAi on a simple premise: <strong>Specialization equals Accuracy.</strong> Our proprietary xGold Neural Engine was trained exclusively on decades of Gold commodity data. It detects Liquidity Grabs (fake-outs), Market Structure Shifts, and News Sensitivity (DXY/Volatility). We didn't just build an image scanner; we built a digital commodities trader.
              </p>
            </div>
          </div>

          {/* Who We Are Story */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs font-semibold tracking-wide uppercase mb-2">
                Who We Are
              </div>
              <h3 className="text-3xl font-bold text-white">From Accra to the Global Stage</h3>
              <p className="text-gray-400 leading-relaxed">
                xGProAi is the flagship financial technology product of <strong className="text-white">Kamakat Holdings</strong>, a forward-thinking investment group based in Accra, Ghana.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Founded by <strong className="text-white">Michael Tintant Chialin</strong>, our team combines deep expertise in Trading, strategic investment, and artificial intelligence. We are proud to be an African-led innovation hub, building world-class tools that compete on the global stage.
              </p>
              <p className="text-gray-400 leading-relaxed italic border-l-2 border-gold pl-4">
                "We don't want to trade for you. We want to make you a better trader. Our AI acts as your second set of eyes, confirming your bias or saving you from a bad entry."
              </p>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden border border-border-subtle shadow-2xl shadow-gold/5 group">
              <div className="absolute inset-0 bg-gold/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
              <img
                src="/trading_team_working.png"
                alt="xGProAi Team - Kamakat Holdings"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Our Core Values */}
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white">Our Core Values</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Precision Over Volume",
                desc: "We don't care about analyzing 500 different crypto coins. We care about analyzing one asset (Gold) with 99% focus.",
                icon: (
                  <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )
              },
              {
                title: "Transparency",
                desc: "We never claim to predict the future. We provide probabilities, not certainties. We are transparent about the risks of trading and the limitations of AI.",
                icon: (
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )
              },
              {
                title: "Empowerment",
                desc: "The days of drawing manual trendlines and guessing are over. We empower smart traders to upgrade their workflow with institutional speed.",
                icon: (
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )
              }
            ].map((val, i) => (
              <div key={i} className="p-8 rounded-xl bg-surface-card border border-border-subtle flex flex-col items-center text-center hover:border-gold/30 transition-all duration-300 group">
                <div className="mb-6 p-4 rounded-full bg-background border border-border-subtle group-hover:scale-110 transition-transform shadow-lg">
                  {val.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-3">{val.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>

          {/* Join Evolution CTA */}
          <div className="mt-20 text-center">
            <h3 className="text-2xl font-bold text-white mb-6">Join the Evolution of Trading</h3>
            <Link href="/signup" className="inline-block bg-gold hover:bg-gold-light text-black text-lg px-10 py-4 rounded-lg font-bold transition-all shadow-lg hover:shadow-gold/20 transform hover:-translate-y-1">
              Start Your Free Analysis
            </Link>
          </div>

        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-surface-card border-t border-border-subtle relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Contact Us</h2>
            <p className="text-gray-400">
              Have questions or need support? Get in touch with our team, we're here to help.
            </p>
          </div>

          <div className="bg-background border border-border-subtle rounded-2xl p-8 shadow-2xl">
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                <input
                  type="text"
                  id="name"
                  className="w-full bg-surface-card border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Your Email</label>
                <input
                  type="email"
                  id="email"
                  className="w-full bg-surface-card border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">Your Message</label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full bg-surface-card border border-border-subtle rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="How can we help you?"
                />
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Detailed Footer */}
      <footer className="bg-background border-t border-border-subtle pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">

            {/* Brand Column */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="xGProAi" className="w-24 h-auto rounded-lg" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
                AI-powered chart analysis for smarter trading decisions across all markets.
              </p>
              <div className="flex gap-4">
                {/* Social Icons Placeholder */}
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg></a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg></a>
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-gold transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-gold transition-colors">Pricing</Link></li>
                <li><Link href="#how-it-works" className="hover:text-gold transition-colors">How It Works</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#about" className="hover:text-gold transition-colors">About Us</Link></li>
                <li><Link href="#contact" className="hover:text-gold transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-gold transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/refund" className="hover:text-gold transition-colors">Refund Policy</Link></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-border-subtle pt-8 text-center sm:text-left">
            <p className="text-gray-500 text-xs leading-relaxed mb-4 text-center">
              Disclaimer: xGProAi is an AI-based analytical tool designed to assist with market analysis. It does not offer investment advice or trading signals. All information provided is for educational and informational purposes only. Users are responsible for their own trading decisions and risk management.
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-600">
              <p>© 2026 - Copyright reserved by Kamakat Holdings</p>
              <p>Powered by FarNorth Advanced AI</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

