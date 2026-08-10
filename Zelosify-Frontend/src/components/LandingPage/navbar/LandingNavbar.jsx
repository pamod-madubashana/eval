"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MobileMenu from "../MobileMenu";
import useAuth from "@/hooks/Auth/useAuth";
import ProfileImage from "@/components/UI/ProfileImage";

export default function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, handleOpenSignoutConfirmation, getDisplayName } = useAuth();
  const router = useRouter();

  const handleScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Floating navbar when scrolled - FIXED CENTERING */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
        >
          <nav className="bg-gray-900/80 backdrop-blur-lg shadow-2xl border border-white/10 rounded-2xl px-6 py-3 w-full max-w-4xl">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <img
                  src="/assets/logos/main-logo.png"
                  alt="Zelosify"
                  className="h-8 w-auto invert brightness-0 invert"
                />
              </Link>

              {/* Mobile Menu */}
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              {/* CTA Button or Profile */}
              {isAuthenticated() ? (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <ProfileImage className="w-8 h-8" />
                    <span className="font-medium text-sm text-gray-300">
                      {getDisplayName()}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-xl py-1 border border-white/10">
                      <div className="px-4 py-2 text-sm">
                        <p className="font-medium text-gray-200">{getDisplayName()}</p>
                        <p className="text-xs text-gray-500">@{user?.username}</p>
                      </div>
                      <div className="border-t border-white/10"></div>
                      <button
                        onClick={() => {
                          router.push("/user");
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          handleOpenSignoutConfirmation();
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden md:block"
                >
                  <Link
                    href="/login"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Sign in
                  </Link>
                </motion.div>
              )}
            </div>
          </nav>
        </motion.div>
      </AnimatePresence>

      {/* Mobile Menu */}
      <MobileMenu
        isMenuOpen={isMenuOpen}
        closeMenu={() => setIsMenuOpen(false)}
      />
    </>
  );
}
