import { auth } from "@/auth";
import Link from "next/link";
import Dashboard from '@/components/Dashboard';
import Image from 'next/image';
import { Sparkles, MousePointerClick, Kanban, Brain, Rocket } from 'lucide-react';
import HeroPreview from '@/components/HeroPreview';
import ExtensionDownloadButton from '@/components/ExtensionDownloadButton';

export const metadata = {
  title: 'Job Tracker',
  description: 'AI-Powered Job Application Tracking',
};

export default async function Home() {
  const session = await auth();

  if (session) {
    // If user is logged in, show the Dashboard rather than a redirect
    // to keep URL as root and keep it smooth
    return <Dashboard session={session} />;
  }

  // If user is not logged in, show the Intro Landing Page
  return (
    <div className="min-h-screen bg-[#060608] text-gray-200 overflow-x-hidden font-sans selection:bg-purple-500/30">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#060608]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="HuntIQ Logo" width={32} height={32} className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-purple-500/20" />
            <span className="text-lg font-bold text-white tracking-tight">HuntIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/login" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all">
              Try the Beta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section — Devin-style Split Banner */}
      <section className="relative pt-28 pb-12 md:pt-40 md:pb-20 overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[400px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* —— Left Column: Text + CTA + Steps —— */}
            <div className="flex-1 max-w-xl text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300 mb-6 backdrop-blur-sm">
                <Sparkles className="w-3 h-3" />
                Public Beta v0.9
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-black text-white tracking-tight mb-5 leading-[1.1]">
                I built this because the job hunt is chaos.
              </h1>

              {/* Subtitle */}
              <p className="text-base md:text-lg text-gray-400 mb-8 font-light leading-relaxed">
                Track the interview process in every single step. Get AI support using the models you choose to get a real edge.
              </p>

              {/* CTA Button */}
              <div className="mb-10">
                <ExtensionDownloadButton buttonType="primary" />
              </div>

              {/* Numbered Step List */}
              <div className="space-y-5 text-left">
                {[
                  { num: '1', icon: MousePointerClick, title: 'Capture', desc: 'Click the extension on any job board.' },
                  { num: '2', icon: Kanban, title: 'Track', desc: 'Visual pipeline. No spreadsheets.' },
                  { num: '3', icon: Brain, title: 'AI Prep', desc: 'Battle cards, SWOT, interview coaching.' },
                  { num: '4', icon: Rocket, title: 'Dominate', desc: "You're ready to hunt." },
                ].map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.num} className="flex items-start gap-4 group">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-purple-400 shrink-0 mt-0.5 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-colors duration-300">
                        {step.num}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Icon className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors duration-300" />
                          <span className="text-sm font-semibold text-white">{step.title}</span>
                        </div>
                        <p className="text-sm text-gray-500 leading-snug">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* —— Right Column: Interactive Preview —— */}
            <div className="flex-1 w-full max-w-2xl lg:max-w-none">
              <HeroPreview />
            </div>

          </div>
        </div>
      </section>

      {/* Vertical Timeline Journey */}
      <section id="how-it-works" className="py-16 relative">
        <div className="container mx-auto px-6 max-w-4xl">

          <div className="text-center mb-20 relative z-10 bg-[#060608] inline-block px-4 mx-auto left-1/2 -translate-x-1/2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">How I use it</h2>
          </div>

          <div className="relative">
            {/* The Central Line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-blue-500/50 to-transparent -translate-x-1/2" />

            {/* Step 1 */}
            <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-24 group">
              {/* Timeline Node */}
              <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full bg-[#060608] border-2 border-purple-500 -translate-x-1/2 shadow-[0_0_15px_rgba(168,85,247,0.5)] z-10" />

              {/* Content - Left side on desktop */}
              <div className="w-full md:w-1/2 pl-16 md:pl-0 md:pr-16 text-left md:text-right">
                <div className="text-purple-400 font-mono text-sm mb-2">01 / CAPTURE</div>
                <h3 className="text-2xl font-bold text-white mb-4">Click and done.</h3>
                <p className="text-gray-400 leading-relaxed">
                  No manual data entry. Click the extension on any job board. The core purpose is to instantly scrape the title, company, and hidden requirements to get organized fast.
                </p>
              </div>

              {/* Visual - Right side on desktop */}
              <div className="w-full md:w-1/2 pl-16 md:pl-0 mt-8 md:mt-0">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0f] p-4 shadow-2xl shadow-purple-900/20 group-hover:-translate-y-2 transition-transform duration-500">
                  <Image src="/assets/nano_step_1_capture.png" alt="Capture UI Illustration" width={400} height={400} className="w-full h-auto rounded-xl" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16 mb-24 group">
              {/* Timeline Node */}
              <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full bg-[#060608] border-2 border-blue-500 -translate-x-1/2 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10" />

              {/* Content - Right side on desktop */}
              <div className="w-full md:w-1/2 pl-16 md:pl-16 text-left">
                <div className="text-blue-400 font-mono text-sm mb-2">02 / ORGANIZE</div>
                <h3 className="text-2xl font-bold text-white mb-4">Track every step.</h3>
                <p className="text-gray-400 leading-relaxed">
                  The entire reason I built this. Your applications live in a visual command center. Track your exact progress through the interview pipeline without messy spreadsheets.
                </p>
              </div>

              {/* Visual - Left side on desktop */}
              <div className="w-full md:w-1/2 pl-16 md:pl-0 mt-8 md:mt-0">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0f] p-4 shadow-2xl shadow-blue-900/20 group-hover:-translate-y-2 transition-transform duration-500">
                  <Image src="/assets/live_kanban_overview.png" alt="Live Kanban Tracker Flow" width={600} height={400} className="w-full h-auto rounded-xl border border-white/5" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16 group">
              {/* Timeline Node */}
              <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full bg-[#060608] border-2 border-emerald-500 -translate-x-1/2 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10" />

              {/* Content - Left side on desktop */}
              <div className="w-full md:w-1/2 pl-16 md:pl-0 md:pr-16 text-left md:text-right">
                <div className="text-emerald-400 font-mono text-sm mb-2">03 / DOMINATE</div>
                <h3 className="text-2xl font-bold text-white mb-4">AI Prep on your terms.</h3>
                <p className="text-gray-400 leading-relaxed">
                  Once organized, get an unfair advantage. Enriched job offers with AI battle cards. The best part? Smart API key pooling means you bring your own keys. Choose the model that works best for you (like Claude) for superior preparation.
                </p>
              </div>

              {/* Visual - Right side on desktop */}
              <div className="w-full md:w-1/2 pl-16 md:pl-0 mt-8 md:mt-0">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0f] p-4 shadow-2xl shadow-emerald-900/20 group-hover:-translate-y-2 transition-transform duration-500">
                  <Image src="/assets/live_job_details_swot.png" alt="Live AI Prep SWOT Analysis" width={600} height={400} className="w-full h-auto rounded-xl border border-white/5" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Beta CTA Footer */}
      <section className="py-20 border-t border-white/5 bg-gradient-to-b from-[#060608] to-[#0a0a0f]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to join the beta?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">Get early access to the minimalist career tool built by a solo developer to solve the job hunt chaos.</p>
          <Link href="/login" className="inline-flex px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-base font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-[#0a0a0f]">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm tracking-tight">HuntIQ <span className="text-gray-500 font-normal">Beta</span></span>
          </div>
          <div className="flex gap-6 text-xs text-gray-500 hover:text-white transition-colors">
            <Link href="/about" className="hover:text-gray-300">Story</Link>
            <Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
