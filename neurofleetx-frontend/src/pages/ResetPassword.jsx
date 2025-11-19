import React, { useState, useEffect } from "react";
import authApi from "../api/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const cardControls = useAnimation();

  // Verify token on mount
  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setTokenValid(false);
      setError("No reset token provided");
    }
  }, [token]);

  // Password strength calculator
  useEffect(() => {
    if (password) {
      let strength = 0;
      if (password.length >= 6) strength += 25;
      if (password.length >= 10) strength += 25;
      if (/[A-Z]/.test(password)) strength += 25;
      if (/[0-9]/.test(password)) strength += 25;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  const verifyToken = async () => {
    try {
      const response = await authApi.verifyResetToken(token);
      setTokenValid(response.data.valid);
      if (!response.data.valid) {
        setError("Invalid or expired reset token");
      }
    } catch (err) {
      console.error("Token verification error:", err);
      setTokenValid(false);
      setError("Invalid or expired reset token");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");

      // Shake animation
      cardControls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 },
      });
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);

      // Success animation
      await cardControls.start({
        scale: 1.05,
        opacity: 0.9,
        transition: { duration: 0.3 },
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Reset error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again."
      );

      // Shake animation
      cardControls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength >= 75) return "bg-green-500";
    if (passwordStrength >= 50) return "bg-yellow-500";
    if (passwordStrength >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStrengthLabel = () => {
    if (passwordStrength >= 75) return "Strong 💪";
    if (passwordStrength >= 50) return "Good 👍";
    if (passwordStrength >= 25) return "Weak ⚠️";
    return "Very Weak 🔓";
  };

  // Invalid token screen
  if (tokenValid === false) {
    return (
      <div
        className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
        style={{
          background:
            "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center"
        >
          <div className="text-7xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Invalid Reset Link
          </h2>
          <p className="text-white/80 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/forgot-password")}
            className="px-8 py-3 rounded-xl bg-white/20 border border-white/30 text-white font-semibold hover:bg-white/30 transition-all"
          >
            Request New Link
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Main card */}
      <motion.div animate={cardControls} className="relative w-full max-w-md">
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
                  🔑
                </motion.div>
                <h1 className="text-3xl font-black text-white mb-2">
                  Reset Password
                </h1>
                <p className="text-white/70 text-sm">
                  Enter your new password below
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
                {/* Password input */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full px-6 py-4 pl-12 pr-12 rounded-2xl bg-white/10 border-2 border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-all backdrop-blur-sm"
                    required
                  />

                  {/* Lock icon */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-xl">
                    🔒
                  </div>

                  {/* Toggle visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Password Strength:</span>
                      <span className="text-white font-semibold">
                        {getStrengthLabel()}
                      </span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength}%` }}
                        className={`h-full ${getStrengthColor()} transition-all duration-500`}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Confirm password input */}
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full px-6 py-4 pl-12 pr-12 rounded-2xl bg-white/10 border-2 border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-all backdrop-blur-sm"
                    required
                  />

                  {/* Lock icon */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-xl">
                    🔒
                  </div>

                  {/* Toggle visibility */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>

                  {/* Match indicator */}
                  {confirmPassword && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`absolute -right-2 -top-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        password === confirmPassword
                          ? "bg-green-500/30 text-green-300"
                          : "bg-red-500/30 text-red-300"
                      }`}
                    >
                      {password === confirmPassword ? "✓" : "✕"}
                    </motion.div>
                  )}
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-bold text-white relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
                  }}
                >
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
                        Resetting...
                      </span>
                    ) : (
                      "Reset Password 🔐"
                    )}
                  </span>
                </motion.button>
              </form>
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
                Password Reset Successful!
              </h2>
              <p className="text-white/80 mb-8">
                Your password has been changed successfully. Redirecting to
                login...
              </p>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto"
              />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* CSS animations */}
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
