import Link from 'next/link';
import { Award, ShieldAlert, Cpu, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/30">
              S
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Solvekar <span className="text-indigo-400">AI</span></span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition">
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition shadow-md shadow-indigo-600/20"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Subtle background glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="container mx-auto px-6 text-center max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
              <Cpu className="w-3.5 h-3.5" /> Next-Generation Assessment Suite
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Assess Smarter with <br />
              <span className="title-gradient-rainbow">AI-Powered Evaluations</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Create, proctor, and evaluate exams effortlessly. Features include automated question generation from notes/PDFs, instant grading, and AI performance reports.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/35 hover:-translate-y-0.5"
              >
                Join as Student <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-800 hover:border-indigo-500/30 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold rounded-xl transition hover:-translate-y-0.5"
              >
                Teacher Portal
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="py-20 bg-slate-950 border-t border-slate-900">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Features Designed for the Future</h2>
              <p className="text-slate-400">Everything needed to run secure, transparent, and intelligent examinations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">AI Test Generator</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Teachers provide a subject, topic, and difficulty to generate comprehensive, structured MCQs and detailed answers instantly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">PDF / PYQ Ingestion</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Upload study notes or past papers. AI automatically extracts questions and maps them with difficulty tags, marks, and explanations.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">Proctoring Safeguards</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Enforces focus: includes full-screen locks, tab-switch counts, copy-paste restrictions, and window blur detection.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">Performance Analytics</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Provides students with dynamic dashboards: subject strengths, weakness analytics, time utilization, and revision advice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Roles walk through */}
        <section className="py-20 bg-slate-900/40 border-t border-slate-900">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-indigo-400 text-sm font-semibold tracking-wider uppercase">Adaptive Platform</span>
                <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-6">Designed for Both Educators & Students</h2>
                
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5.5 h-5.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white">Students</h4>
                      <p className="text-sm text-slate-400">Attempt practice exams, review answers with detailed AI analysis, and receive tailored revision strategies.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5.5 h-5.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white">Teachers</h4>
                      <p className="text-sm text-slate-400">Build manual tests or upload PDFs for AI extraction. Schedule timed tests and track student participation.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5.5 h-5.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white">Administrators</h4>
                      <p className="text-sm text-slate-400">Oversee student credentials, audit AI token consumption logs, organize curriculum subject fields, and fetch system metrics.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="glass-panel p-8 rounded-2xl relative border-indigo-500/20">
                <div className="absolute -inset-1 rounded-2xl bg-indigo-500/10 blur-xl -z-10" />
                <h4 className="text-lg font-bold mb-4 border-b border-slate-800 pb-2 text-indigo-400">System Dashboard Preview</h4>
                <div className="flex flex-col gap-3">
                  <div className="h-6 w-3/4 bg-slate-800/80 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-800/40 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-slate-800/40 rounded animate-pulse" />
                  <div className="grid grid-cols-3 gap-3 my-2">
                    <div className="h-12 bg-indigo-600/10 border border-indigo-500/25 rounded-lg flex flex-col justify-center items-center">
                      <span className="text-xs text-slate-500">Avg Score</span>
                      <span className="font-bold text-sm text-indigo-400">82.4%</span>
                    </div>
                    <div className="h-12 bg-emerald-600/10 border border-emerald-500/25 rounded-lg flex flex-col justify-center items-center">
                      <span className="text-xs text-slate-500">Accuracy</span>
                      <span className="font-bold text-sm text-emerald-400">91%</span>
                    </div>
                    <div className="h-12 bg-amber-600/10 border border-amber-500/25 rounded-lg flex flex-col justify-center items-center">
                      <span className="text-xs text-slate-500">Tests</span>
                      <span className="font-bold text-sm text-amber-400">12</span>
                    </div>
                  </div>
                  <div className="h-32 bg-slate-800/20 border border-slate-800/60 rounded-xl flex items-center justify-center">
                    <span className="text-xs text-slate-500 font-mono">[Recharts Interactive Chart Loading]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-sm text-slate-500">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} Solvekar AI Inc. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-slate-300">Login</Link>
            <Link href="/register" className="hover:text-slate-300">Register</Link>
            <span className="text-slate-700">|</span>
            <span className="text-indigo-400 font-semibold">Production Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
