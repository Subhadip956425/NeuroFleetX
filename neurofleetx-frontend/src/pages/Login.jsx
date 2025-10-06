import React, { useState, useRef, useEffect, useContext } from "react";
import { loginUser } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { setToken, setUserRole } from "../utils/auth";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  useSpring,
  useAnimation,
} from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { AuthActionTypes } from "../reducers/auth/authActionTypes";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailValid, setEmailValid] = useState(null);

  const { state, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef(null);
  const cardControls = useAnimation();

  // Advanced mouse tracking with parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);

        // Card tilt effect based on mouse position
        const rotateX = ((e.clientY - centerY) / rect.height) * 5;
        const rotateY = ((e.clientX - centerX) / rect.width) * 5;

        cardControls.start({
          rotateX: -rotateX,
          rotateY: rotateY,
          transition: { type: "spring", stiffness: 100, damping: 15 },
        });
      }
    };

    const handleMouseLeave = () => {
      cardControls.start({
        rotateX: 0,
        rotateY: 0,
        transition: { type: "spring", stiffness: 100, damping: 15 },
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    containerRef.current?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      containerRef.current?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mouseX, mouseY, cardControls]);

  // Email validation
  useEffect(() => {
    if (email) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      setEmailValid(isValid);
    } else {
      setEmailValid(null);
    }
  }, [email]);

  // Backend Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await loginUser({ email, password });
      const { token, roles } = res.data;
      setToken(token);
      setUserRole(roles[0]);

      dispatch({
        type: AuthActionTypes.LOGIN_SUCCESS,
        payload: { token, role: roles[0] },
      });

      // Success animation before redirect
      await cardControls.start({
        scale: 1.05,
        opacity: 0.8,
        transition: { duration: 0.3 },
      });

      navigate("/dashboard");
    } catch (err) {
      dispatch({
        type: AuthActionTypes.SET_ERROR,
        payload: err.response?.data?.message || "Login failed",
      });

      // Shake animation on error
      cardControls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced interactive particle
  const InteractiveParticle = ({ x, y, size, delay, index }) => {
    const particleX = useMotionValue(x);
    const particleY = useMotionValue(y);

    const springX = useSpring(particleX, { stiffness: 40, damping: 25 });
    const springY = useSpring(particleY, { stiffness: 40, damping: 25 });

    const distanceFromMouse = useTransform(
      [mouseX, mouseY, springX, springY],
      ([mx, my, px, py]) => {
        const dist = Math.sqrt(Math.pow(mx - px, 2) + Math.pow(my - py, 2));
        return dist;
      }
    );

    const particleScale = useTransform(distanceFromMouse, [0, 300], [2.2, 0.8]);
    const particleOpacity = useTransform(
      distanceFromMouse,
      [0, 200],
      [0.9, 0.2]
    );
    const particleBlur = useTransform(distanceFromMouse, [0, 300], [5, 2]);

    useEffect(() => {
      const interval = setInterval(() => {
        const newX = Math.random() * window.innerWidth;
        const newY = Math.random() * window.innerHeight;
        particleX.set(newX);
        particleY.set(newY);
      }, 7000 + Math.random() * 5000);
      return () => clearInterval(interval);
    }, [particleX, particleY]);

    return (
      <motion.div
        className="absolute rounded-full pointer-events-none z-0"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 2.5,
          delay: delay + index * 0.12,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        style={{
          left: springX,
          top: springY,
          width: size,
          height: size,
          background: `radial-gradient(circle, 
            rgba(59, 130, 246, 0.7) 0%, 
            rgba(147, 51, 234, 0.5) 40%, 
            rgba(103, 232, 249, 0.3) 70%, 
            transparent 100%)`,
          scale: particleScale,
          opacity: particleOpacity,
          filter: useTransform(particleBlur, (v) => `blur(${v}px)`),
        }}
      />
    );
  };

  // Floating rings animation
  const FloatingRing = ({ delay, duration, size, color }) => (
    <motion.div
      className="absolute rounded-full border-2 pointer-events-none"
      style={{
        width: size,
        height: size,
        borderColor: color,
        left: "50%",
        top: "50%",
        x: "-50%",
        y: "-50%",
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 0.2, 0.5],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );

  // Dynamic gradient background
  const backgroundX = useTransform(
    mouseX,
    [0, window.innerWidth || 1000],
    [0, 100]
  );
  const backgroundY = useTransform(
    mouseY,
    [0, window.innerHeight || 800],
    [0, 100]
  );

  // Enhanced field variants
  const fieldVariants = {
    focused: {
      scale: 1.02,
      boxShadow:
        "0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3), 0 10px 20px rgba(0, 0, 0, 0.1)",
      borderColor: "rgba(59, 130, 246, 0.8)",
    },
    unfocused: {
      scale: 1,
      boxShadow:
        "0 0 0 0px rgba(59, 130, 246, 0), 0 0 0px rgba(59, 130, 246, 0)",
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
  };

  const buttonVariants = {
    idle: {
      scale: 1,
      boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)",
    },
    hover: {
      scale: 1.03,
      boxShadow:
        "0 15px 40px rgba(59, 130, 246, 0.5), 0 0 0 4px rgba(59, 130, 246, 0.2)",
      background:
        "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    },
    tap: {
      scale: 0.97,
      boxShadow: "0 5px 15px rgba(59, 130, 246, 0.4)",
    },
    loading: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen items-center justify-center overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at ${backgroundX}% ${backgroundY}%, 
            rgba(30, 58, 138, 0.95) 0%, 
            rgba(59, 130, 246, 0.85) 20%, 
            rgba(147, 51, 234, 0.75) 40%, 
            rgba(79, 70, 229, 0.8) 60%,
            rgba(31, 41, 55, 0.95) 100%)
        `,
      }}
    >
      {/* Enhanced particle system */}
      {Array.from({ length: 15 }).map((_, i) => (
        <InteractiveParticle
          key={i}
          x={Math.random() * window.innerWidth}
          y={Math.random() * window.innerHeight}
          size={50 + Math.random() * 60}
          delay={Math.random() * 2}
          index={i}
        />
      ))}

      {/* Floating rings for depth */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <FloatingRing
          delay={0}
          duration={15}
          size={300}
          color="rgba(59, 130, 246, 0.3)"
        />
        <FloatingRing
          delay={5}
          duration={20}
          size={450}
          color="rgba(147, 51, 234, 0.2)"
        />
        <FloatingRing
          delay={10}
          duration={18}
          size={600}
          color="rgba(103, 232, 249, 0.15)"
        />
      </div>

      {/* Ambient orbs with parallax */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          x: useTransform(mouseX, [0, window.innerWidth || 1000], [-30, 30]),
          y: useTransform(mouseY, [0, window.innerHeight || 800], [-30, 30]),
        }}
      >
        <div className="absolute top-1/6 left-1/6 w-48 h-48 bg-gradient-to-br from-cyan-400/30 to-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-gradient-to-br from-purple-400/30 to-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute top-2/3 left-1/2 w-40 h-40 bg-gradient-to-br from-indigo-400/25 to-violet-600/20 rounded-full blur-2xl" />
      </motion.div>

      {/* Premium glassmorphism card */}
      <motion.div
        animate={cardControls}
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 1.2,
          type: "spring",
          stiffness: 100,
          delay: 0.2,
        }}
        className="relative z-20 backdrop-blur-3xl rounded-[2rem] shadow-2xl p-10 w-[440px] border border-white/20"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
          boxShadow: `
            0 40px 80px -20px rgba(0, 0, 0, 0.7),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 2px 0 rgba(255, 255, 255, 0.2),
            inset 0 -2px 0 rgba(0, 0, 0, 0.1)
          `,
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
      >
        {/* Animated title with stagger effect */}
        <motion.div className="text-center mb-8">
          <div className="flex justify-center items-center mb-3">
            {["N", "e", "u", "r", "o", "F", "l", "e", "e", "t", "X"].map(
              (char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 30, rotateX: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.5 + i * 0.05,
                    type: "spring",
                    stiffness: 200,
                  }}
                  whileHover={{
                    scale: 1.2,
                    color: "#60a5fa",
                    transition: { duration: 0.2 },
                  }}
                  className="inline-block text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-cyan-200 cursor-default"
                >
                  {char}
                </motion.span>
              )
            )}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="text-white/70 text-sm font-light tracking-wide"
          >
            Welcome back! Please login to continue
          </motion.p>

          {/* Animated underline */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "80%", opacity: 1 }}
            transition={{ duration: 1.5, delay: 1.5, ease: "easeOut" }}
            className="h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 mx-auto mt-4 rounded-full relative"
          >
            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
              style={{ width: "50%" }}
            />
          </motion.div>
        </motion.div>

        {/* Enhanced error message */}
        <AnimatePresence mode="wait">
          {state.error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm"
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{
                  rotate: [0, -5, 5, -5, 5, 0],
                }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center gap-3"
              >
                <motion.span
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 0.3, repeat: 2 }}
                  className="text-2xl"
                >
                  ⚠️
                </motion.span>
                <span className="text-red-400 font-semibold flex-1">
                  {state.error}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    dispatch({ type: AuthActionTypes.CLEAR_ERROR })
                  }
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  ✕
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Enhanced email input */}
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="relative"
          >
            <motion.div
              variants={fieldVariants}
              animate={focusedField === "email" ? "focused" : "unfocused"}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative"
            >
              <motion.input
                type="email"
                placeholder="Enter your email"
                className="w-full p-4 pl-12 pr-12 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl focus:outline-none placeholder-white/50 transition-all duration-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                required
              />

              {/* Email icon */}
              <motion.div
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
                animate={
                  focusedField === "email"
                    ? { scale: 1.2, color: "#60a5fa" }
                    : { scale: 1 }
                }
              >
                📧
              </motion.div>

              {/* Validation indicator */}
              <AnimatePresence>
                {emailValid !== null && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-xl ${
                      emailValid ? "text-green-400" : "text-yellow-400"
                    }`}
                  >
                    {emailValid ? "✓" : "⚠"}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Floating label */}
            <AnimatePresence>
              {focusedField === "email" && (
                <motion.label
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute -top-6 left-2 text-xs text-blue-300 font-medium"
                >
                  Email Address
                </motion.label>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Enhanced password input */}
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.0 }}
            className="relative"
          >
            <motion.div
              variants={fieldVariants}
              animate={focusedField === "password" ? "focused" : "unfocused"}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative"
            >
              <motion.input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full p-4 pl-12 pr-12 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl focus:outline-none placeholder-white/50 transition-all duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
              />

              {/* Password icon */}
              <motion.div
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
                animate={
                  focusedField === "password"
                    ? { scale: 1.2, color: "#a78bfa" }
                    : { scale: 1 }
                }
              >
                🔒
              </motion.div>

              {/* Eye icon to show/hide password */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors focus:outline-none"
              >
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                  animate={showPassword ? { opacity: 0 } : { opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ position: showPassword ? "absolute" : "relative" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </motion.svg>
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                  animate={showPassword ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ position: showPassword ? "relative" : "absolute" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </motion.svg>
              </motion.button>
            </motion.div>

            {/* Floating label */}
            <AnimatePresence>
              {focusedField === "password" && (
                <motion.label
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute -top-6 left-2 text-xs text-purple-300 font-medium"
                >
                  Password
                </motion.label>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Enhanced submit button */}
          <motion.button
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.2 }}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            animate={isLoading ? "loading" : "idle"}
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-white relative overflow-hidden transition-all duration-300"
            style={{
              background:
                "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)",
            }}
          >
            {/* Button shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "linear",
              }}
            />

            {/* Button content */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Logging in...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center gap-2"
                >
                  <span>Login to Dashboard</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            type="submit"
            disabled={isLoading}
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            animate={isLoading ? "loading" : "idle"}
            className="w-full py-4 rounded-2xl font-bold text-white relative overflow-hidden transition-all duration-300"
            style={{
              background:
                "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)",
            }}
          >
            {/* Button shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "linear",
              }}
            />

            {/* Button content */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Signing In...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="sign-in"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </form>

        {/* Enhanced footer with Sign Up button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.4 }}
          className="mt-7 space-y-4"
        >
          {/* Animated divider */}
          <div className="flex items-center justify-center gap-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              transition={{ duration: 1, delay: 2.6 }}
              className="h-px bg-gradient-to-r from-transparent via-white/30 to-white/30"
            />
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 2.8, type: "spring", stiffness: 200 }}
              className="text-white/60 text-sm font-light"
            >
              or
            </motion.span>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              transition={{ duration: 1, delay: 2.6 }}
              className="h-px bg-gradient-to-l from-transparent via-white/30 to-white/30"
            />
          </div>

          {/* Sign Up section */}
          <div className="text-center space-y-3">
            <p className="text-white/70 text-sm">Don't have an account?</p>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 3, type: "spring", stiffness: 200 }}
              whileHover={{
                scale: 1.05,
                y: -3,
                boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/register")}
              className="w-full py-3.5 rounded-2xl font-bold text-white relative overflow-hidden transition-all duration-300 border-2 border-white/20"
              style={{
                background:
                  "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)",
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "linear",
                }}
              />

              {/* Button content */}
              <motion.div className="flex items-center justify-center gap-2 relative z-10">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-blue-300 to-purple-300">
                  Create New Account
                </span>
                <motion.span
                  animate={{
                    x: [0, 5, 0],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-emerald-300"
                >
                  →
                </motion.span>
              </motion.div>
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced ambient lighting effects */}
        <div className="absolute inset-0 rounded-[2rem] pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-12 bg-white/20 blur-2xl rounded-full"
          />

          <motion.div
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-56 h-10 bg-gradient-to-r from-cyan-400/30 via-blue-400/30 to-purple-400/30 blur-3xl rounded-full"
          />

          <motion.div
            animate={{
              x: [-20, 20, -20],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-32 h-32 bg-blue-400/20 blur-3xl rounded-full"
          />
          <motion.div
            animate={{
              x: [20, -20, 20],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-purple-400/20 blur-3xl rounded-full"
          />
        </div>

        {/* Corner accents */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-white/20 rounded-tl-2xl pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-white/20 rounded-br-2xl pointer-events-none" />
      </motion.div>

      {/* Background grid overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          x: useTransform(mouseX, [0, window.innerWidth || 1000], [0, 20]),
          y: useTransform(mouseY, [0, window.innerHeight || 800], [0, 20]),
        }}
      />
    </div>
  );
}
