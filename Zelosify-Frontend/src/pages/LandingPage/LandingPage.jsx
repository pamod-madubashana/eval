import Link from "next/link";
import LandingNavbar from "@/components/LandingPage/navbar/LandingNavbar";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden">
      <LandingNavbar />

      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/8 blur-[100px]" />
        <div className="absolute top-1/2 left-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/6 blur-[80px]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Hero content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        {/* Subtitle */}
        <p className="mt-6 max-w-4xl text-5xl font-bold text-white leading-tight sm:text-6xl md:text-7xl">
          The operating system for every vendor you pay.
        </p>

      </main>
    </div>
  );
}
