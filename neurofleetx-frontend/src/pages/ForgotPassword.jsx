import React, { useState, useRef, useEffect } from "react";
import authApi from "../api/auth";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
} from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [emailValid, setEmailValid] = useState(null);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const cardControls = useAnimation();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Email validation
  useEffect(() => {
    if (email) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      setEmailValid(isValid);
    } else {
      setEmailValid(null);
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!emailValid) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);

      // Success animation
      await cardControls.start({
        scale: 1.05,
        opacity: 0.9,
        transition: { duration: 0.3 },
      });
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to send reset email. Please try again.");

      // Shake animation
      cardControls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      }}
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Main card */}
      <motion.div
        animate={cardControls}
        className="relative w-full max-w-md"
        style={{ perspective: 1000 }}
      >
        <motion.div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {!success ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-block text-6xl mb-4"
                >
                  🔐
                </motion.div>
                <h1 className="text-3xl font-black text-white mb-2">
                  Forgot Password?
                </h1>
                <p className="text-white/70 text-sm">
                  No worries! Enter your email and we'll send you a reset link.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center gap-3"
                >
                  <span className="text-2xl">⚠️</span>
                  <p className="text-red-100 text-sm flex-1">{error}</p>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email input */}
                <div className="relative">
                  <motion.input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-6 py-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-all backdrop-blur-sm"
                    required
                  />

                  {/* Email icon */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none">
                    📧
                  </div>

                  {/* Validation indicator */}
                  {emailValid !== null && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        emailValid
                          ? "bg-green-500/30 text-green-300"
                          : "bg-red-500/30 text-red-300"
                      }`}
                    >
                      {emailValid ? "✓" : "⚠"}
                    </motion.div>
                  )}
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !emailValid}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-bold text-white relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
                  }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    animate={{
                      x: [-1000, 1000],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "linear",
                    }}
                    className="absolute inset-0 w-20 h-full bg-white/30 skew-x-12"
                  />

                  <span className="relative z-10">
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                          }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Sending...
                      </span>
                    ) : (
                      "Send Reset Link 📤"
                    )}
                  </span>
                </motion.button>
              </form>

              {/* Back to login */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={() => navigate("/login")}
                  className="text-white/70 hover:text-white transition-colors text-sm font-semibold"
                >
                  ← Back to Login
                </button>
              </motion.div>
            </>
          ) : (
            /* Success message */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="text-7xl mb-6"
              >
                ✅
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Email Sent!
              </h2>
              <p className="text-white/80 mb-6 leading-relaxed">
                We've sent a password reset link to <br />
                <span className="font-semibold text-white">{email}</span>
              </p>
              <p className="text-white/60 text-sm mb-8">
                Please check your inbox and follow the instructions to reset
                your password. The link will expire in 1 hour.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="px-8 py-3 rounded-xl bg-white/20 border border-white/30 text-white font-semibold hover:bg-white/30 transition-all"
              >
                Back to Login
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }
        .animate-blob {
          animation: blob 20s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
