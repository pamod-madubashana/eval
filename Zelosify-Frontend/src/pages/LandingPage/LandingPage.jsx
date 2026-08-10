import Link from "next/link";
import LandingNavbar from "@/components/LandingPage/navbar/LandingNavbar";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: "AI-Powered Matching",
    description: "Groq and Gemini LLM agents with tool-calling parse resumes, extract features, and score candidates deterministically.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "Strict RBAC & Tenancy",
    description: "Keycloak-authenticated roles with tenant isolation. Vendors see their uploads, managers see their openings. No bypass.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Deterministic Scoring",
    description: "Transparent formula: 50% skills, 30% experience, 20% location. Explainable decisions, not black-box AI.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Sub-5ms Scoring",
    description: "Performance-first architecture. 100 profiles scored in under 500ms. Timeout middleware, rate limiting, async execution.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Injection Hardened",
    description: "Sanitized LLM inputs, keyword blocklists, prompt injection detection. Resume content never reaches raw system prompts.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    title: "Multi-Tenant S3",
    description: "MinIO-compatible presigned uploads. Files stored under tenant/opening paths. Direct S3 access, no backend bottleneck.",
  },
];

const steps = [
  {
    number: "01",
    title: "Vendor Uploads",
    description: "IT Vendor browses openings, uploads candidate PDFs/PPTX via presigned S3 URLs. Profiles auto-trigger AI scoring.",
  },
  {
    number: "02",
    title: "AI Agent Scores",
    description: "LLM agent orchestrates resume parsing, feature extraction, skill normalization, and deterministic scoring in milliseconds.",
  },
  {
    number: "03",
    title: "Manager Decides",
    description: "Hiring Manager views ranked candidates with scores, confidence, and explanations. Shortlist or reject with one click.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden">
      <LandingNavbar />

      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/8 blur-[100px]" />
        <div className="absolute top-1/2 left-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/6 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-gray-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          AI-Powered Hiring Platform
        </div>

        <p className="max-w-4xl text-5xl font-bold text-white leading-tight sm:text-6xl md:text-7xl">
          The AI engine for<br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent text-5xl sm:text-6xl md:text-7xl">
            contract hiring decisions.
          </span>
        </p>

        <p className="mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed">
          Multi-tenant contract hiring with AI recommendation agents, deterministic scoring,
          and production-grade security. Built for teams that move fast.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            Get Started
          </Link>
          <a
            href="https://github.com/pamod-madubashana/eval-3ee6ea906a5c"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 font-semibold text-base hover:bg-white/10 transition-all duration-300"
          >
            View on GitHub
          </a>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl">
          {[
            { value: "158", label: "Tests Passing" },
            { value: "<5ms", label: "Scoring Latency" },
            { value: "4", label: "AI Agent Tools" },
            { value: "0", label: "TS Errors" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Features */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Built for production, not prototypes
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Every feature designed around security, performance, and clean architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400 group-hover:text-blue-300 transition-colors mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-32 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              How it works
            </h2>
            <p className="mt-4 text-gray-400">
              Three steps from resume to decision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="text-8xl font-black text-[rgba(255,255,255,0.49)] absolute -top-14 left-0 select-none">
                  {step.number}
                </div>
                <div className="relative pt-10 pl-4">
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to hire smarter?
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Open source, MIT licensed, built with clean architecture.
            Deploy today or contribute on GitHub.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Sign In
            </Link>
            <a
              href="https://github.com/pamod-madubashana/eval-3ee6ea906a5c"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 font-semibold text-base hover:bg-white/10 transition-all duration-300"
            >
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/assets/logos/zelosify_Dark.png"
              alt="Zelosify"
              className="h-6 w-auto invert"
            />
            <span className="text-sm text-gray-500">MIT License. Built by P A M O D.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="https://github.com/pamod-madubashana/eval-3ee6ea906a5c" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
              GitHub
            </a>
            <span>2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
