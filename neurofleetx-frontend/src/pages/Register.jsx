import React, { useState, useRef, useEffect, useContext } from "react";
import { registerUser } from "../api/auth";
import { useNavigate } from "react-router-dom";
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

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [nameValid, setNameValid] = useState(null);

  const { dispatch } = useContext(AuthContext);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef(null);
  const cardControls = useAnimation();

  // Advanced mouse tracking with 3D card tilt [web:54]
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);

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

  // Validation effects [web:88]
  useEffect(() => {
    if (fullName) {
      setNameValid(fullName.length >= 2);
    } else {
      setNameValid(null);
    }
  }, [fullName]);

  useEffect(() => {
    if (email) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      setEmailValid(isValid);
    } else {
      setEmailValid(null);
    }
  }, [email]);

  useEffect(() => {
    if (password) {
      let strength = 0;
      if (password.length >= 6) strength++;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await registerUser({ fullName, email, password, role });
      setMessage(res.data.message);
      dispatch({ type: AuthActionTypes.CLEAR_ERROR });

      // Success animation
      await cardControls.start({
        scale: 1.05,
        opacity: 0.8,
        transition: { duration: 0.3 },
      });

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Registration failed";
      setMessage(errorMsg);
      dispatch({ type: AuthActionTypes.SET_ERROR, payload: errorMsg });

      // Shake animation on error
      cardControls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced particle system
  const FloatingParticle = ({ x, y, size, delay, index, color }) => {
    const particleX = useMotionValue(x);
    const particleY = useMotionValue(y);

    const springX = useSpring(particleX, { stiffness: 30, damping: 20 });
    const springY = useSpring(particleY, { stiffness: 30, damping: 20 });

    const distanceFromMouse = useTransform(
      [mouseX, mouseY, springX, springY],
      ([mx, my, px, py]) =>
        Math.sqrt(Math.pow(mx - px, 2) + Math.pow(my - py, 2))
    );

    const particleScale = useTransform(distanceFromMouse, [0, 250], [2, 0.8]);
    const particleOpacity = useTransform(
      distanceFromMouse,
      [0, 200],
      [0.8, 0.2]
    );

    useEffect(() => {
      const interval = setInterval(() => {
        particleX.set(Math.random() * window.innerWidth);
        particleY.set(Math.random() * window.innerHeight);
      }, 8000 + Math.random() * 4000);
      return () => clearInterval(interval);
    }, [particleX, particleY]);

    return (
      <motion.div
        className="absolute rounded-full pointer-events-none z-0"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 2.5,
          delay: delay + index * 0.1,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          left: springX,
          top: springY,
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color}80 0%, ${color}40 60%, transparent 100%)`,
          filter: "blur(3px)",
          scale: particleScale,
          opacity: particleOpacity,
        }}
      />
    );
  };

  // Floating rings
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
        scale: [1, 1.4, 1],
        opacity: [0.4, 0.1, 0.4],
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

  const roles = [
    {
      value: "CUSTOMER",
      label: "Customer",
      icon: "👤",
      description: "Regular user",
    },
    {
      value: "DRIVER",
      label: "Driver",
      icon: "🚗",
      description: "Vehicle operator",
    },
    {
      value: "MANAGER",
      label: "Manager",
      icon: "📊",
      description: "Team lead",
    },
    { value: "ADMIN", label: "Admin", icon: "⚙️", description: "Full access" },
  ];

  // Field variants [web:45]
  const fieldVariants = {
    focused: {
      scale: 1.02,
      boxShadow:
        "0 0 0 3px rgba(16, 185, 129, 0.4), 0 0 25px rgba(16, 185, 129, 0.3)",
      borderColor: "rgba(16, 185, 129, 0.6)",
    },
    unfocused: {
      scale: 1,
      boxShadow: "0 0 0 0px rgba(16, 185, 129, 0)",
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
  };

  // Password strength helpers
  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "#ef4444";
    if (passwordStrength <= 3) return "#f59e0b";
    return "#10b981";
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const getStatusIcon = (valid) => {
    if (valid === null) return "";
    return valid ? "✓" : "⚠";
  };

  const getStatusColor = (valid) => {
    if (valid === null) return "text-gray-400";
    return valid ? "text-green-400" : "text-yellow-400";
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen items-center justify-center overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at ${backgroundX}% ${backgroundY}%, 
            rgba(16, 185, 129, 0.9) 0%, 
            rgba(59, 130, 246, 0.8) 20%, 
            rgba(168, 85, 247, 0.7) 40%,
            rgba(79, 70, 229, 0.75) 60%, 
            rgba(15, 23, 42, 0.95) 100%)
        `,
      }}
    >
      {/* Enhanced particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <FloatingParticle
          key={i}
          x={Math.random() * window.innerWidth}
          y={Math.random() * window.innerHeight}
          size={50 + Math.random() * 50}
          delay={Math.random() * 2}
          index={i}
          color={["#10b981", "#3b82f6", "#a855f7", "#06b6d4"][i % 4]}
        />
      ))}

      {/* Floating rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <FloatingRing
          delay={0}
          duration={16}
          size={350}
          color="rgba(16, 185, 129, 0.3)"
        />
        <FloatingRing
          delay={5}
          duration={22}
          size={500}
          color="rgba(168, 85, 247, 0.2)"
        />
        <FloatingRing
          delay={10}
          duration={19}
          size={650}
          color="rgba(59, 130, 246, 0.15)"
        />
      </div>

      {/* Ambient orbs */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          x: useTransform(mouseX, [0, window.innerWidth || 1000], [-25, 25]),
          y: useTransform(mouseY, [0, window.innerHeight || 800], [-25, 25]),
        }}
      >
        <div className="absolute top-1/6 left-1/6 w-52 h-52 bg-gradient-to-br from-emerald-400/30 to-green-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/5 right-1/5 w-60 h-60 bg-gradient-to-br from-purple-400/30 to-fuchsia-600/20 rounded-full blur-3xl" />
        <div className="absolute top-2/3 left-1/2 w-44 h-44 bg-gradient-to-br from-blue-400/25 to-cyan-600/20 rounded-full blur-2xl" />
      </motion.div>

      {/* Premium glassmorphism card */}
      <motion.div
        animate={cardControls}
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 1.3,
          type: "spring",
          stiffness: 80,
          delay: 0.1,
        }}
        className="relative z-20 backdrop-blur-3xl rounded-[2rem] shadow-2xl p-10 w-[500px] max-h-[92vh] overflow-y-auto border border-white/20 custom-scrollbar"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)",
          boxShadow: `
            0 45px 90px -25px rgba(0, 0, 0, 0.75),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 2px 0 rgba(255, 255, 255, 0.18),
            inset 0 -2px 0 rgba(0, 0, 0, 0.12)
          `,
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
      >
        {/* Animated title [web:45] */}
        <motion.div className="text-center mb-8">
          <div className="flex justify-center items-center mb-3">
            {["J", "o", "i", "n", " ", "U", "s", "!"].map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 30, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.4 + i * 0.06,
                  type: "spring",
                  stiffness: 180,
                }}
                whileHover={{
                  scale: 1.3,
                  color: "#10b981",
                  transition: { duration: 0.2 },
                }}
                className="inline-block text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-blue-200 to-purple-200 cursor-default"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-white/70 text-sm font-light tracking-wide"
          >
            Create your account to get started
          </motion.p>

          {/* Animated progress line */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "75%", opacity: 1 }}
            transition={{ duration: 1.5, delay: 1.3, ease: "easeOut" }}
            className="h-0.5 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 mx-auto mt-4 rounded-full relative overflow-hidden"
          >
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
              style={{ width: "50%" }}
            />
          </motion.div>
        </motion.div>

        {/* Enhanced message display [web:88] */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`mb-6 p-4 rounded-2xl border backdrop-blur-sm ${
                message.includes("success") || message.includes("created")
                  ? "text-green-400 bg-green-500/10 border-green-500/30"
                  : "text-red-400 bg-red-500/10 border-red-500/30"
              }`}
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-3"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.3, repeat: 2 }}
                  className="text-2xl"
                >
                  {message.includes("success") ? "🎉" : "⚠️"}
                </motion.span>
                <span className="font-semibold flex-1">{message}</span>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMessage("")}
                  className="hover:opacity-80 transition-opacity"
                >
                  ✕
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Enhanced Name Input [web:45] */}
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="relative"
          >
            <motion.div
              variants={fieldVariants}
              animate={focusedField === "fullName" ? "focused" : "unfocused"}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative"
            >
              <motion.input
                type="text"
                placeholder="Full Name"
                className="w-full p-4 pl-12 pr-12 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl focus:outline-none placeholder-white/50 transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocusedField("fullName")}
                onBlur={() => setFocusedField(null)}
                required
              />
              <motion.div
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
                animate={
                  focusedField === "fullName"
                    ? { scale: 1.2, color: "#10b981" }
                    : { scale: 1 }
                }
              >
                👤
              </motion.div>
              <AnimatePresence>
                {nameValid !== null && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-xl ${getStatusColor(
                      nameValid
                    )}`}
                  >
                    {getStatusIcon(nameValid)}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <AnimatePresence>
              {focusedField === "fullName" && (
                <motion.label
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute -top-6 left-2 text-xs text-emerald-300 font-medium"
                >
                  Full Name
                </motion.label>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Enhanced Email Input */}
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.7 }}
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
                placeholder="Email Address"
                className="w-full p-4 pl-12 pr-12 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl focus:outline-none placeholder-white/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                required
              />
              <motion.div
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
                animate={
                  focusedField === "email"
                    ? { scale: 1.2, color: "#3b82f6" }
                    : { scale: 1 }
                }
              >
                📧
              </motion.div>
              <AnimatePresence>
                {emailValid !== null && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-xl ${getStatusColor(
                      emailValid
                    )}`}
                  >
                    {getStatusIcon(emailValid)}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
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

          {/* Enhanced Password Input */}
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.9 }}
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
                placeholder="Password (6+ characters)"
                className="w-full p-4 pl-12 pr-20 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl focus:outline-none placeholder-white/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
              />
              <motion.div
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
                animate={
                  focusedField === "password"
                    ? { scale: 1.2, color: "#a855f7" }
                    : { scale: 1 }
                }
              >
                🔒
              </motion.div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </motion.button>
            </motion.div>

            {/* Password strength indicator */}
            <AnimatePresence>
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <motion.div
                        key={level}
                        initial={{ scaleX: 0 }}
                        animate={{
                          scaleX: passwordStrength >= level ? 1 : 0.3,
                          backgroundColor:
                            passwordStrength >= level
                              ? getStrengthColor()
                              : "rgba(255, 255, 255, 0.2)",
                        }}
                        transition={{ duration: 0.3, delay: level * 0.05 }}
                        className="h-1 flex-1 rounded-full origin-left"
                      />
                    ))}
                  </div>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs font-medium"
                    style={{ color: getStrengthColor() }}
                  >
                    Password Strength: {getStrengthLabel()}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

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

          {/* Enhanced Role Selection [web:88] */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.1 }}
            className="space-y-3"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
              className="text-white/80 font-medium text-sm"
            >
              Select your role:
            </motion.p>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r, index) => (
                <motion.button
                  key={r.value}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 2.3 + index * 0.1,
                    type: "spring",
                    stiffness: 200,
                  }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                    role === r.value
                      ? "border-emerald-400/50 bg-emerald-500/20 shadow-lg shadow-emerald-500/20"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                >
                  {role === r.value && (
                    <motion.div
                      layoutId="role-highlight"
                      className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/10"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <div className="flex items-start gap-2 relative z-10">
                    <motion.span
                      animate={
                        role === r.value ? { scale: [1, 1.2, 1] } : { scale: 1 }
                      }
                      transition={{ duration: 0.3 }}
                      className="text-xl"
                    >
                      {r.icon}
                    </motion.span>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {r.label}
                      </div>
                      <div className="text-white/60 text-xs">
                        {r.description}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Submit Button */}
          <motion.button
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.7 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 45px rgba(16, 185, 129, 0.5)",
              background:
                "linear-gradient(135deg, #059669 0%, #0ea5e9 50%, #a855f7 100%)",
            }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-white relative overflow-hidden transition-all"
            style={{
              background:
                "linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #a855f7 100%)",
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "linear",
              }}
            />

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
                  <span>Creating Account...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center gap-2"
                >
                  <span>Create Account</span>
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🚀
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </form>

        {/* Enhanced Footer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.9 }}
          className="mt-7 space-y-5"
        >
          <div className="flex items-center justify-center gap-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              transition={{ duration: 1, delay: 3.1 }}
              className="h-px bg-gradient-to-r from-transparent via-white/30 to-white/30"
            />
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 3.3, type: "spring", stiffness: 200 }}
              className="text-white/60 text-sm font-light"
            >
              or
            </motion.span>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              transition={{ duration: 1, delay: 3.1 }}
              className="h-px bg-gradient-to-l from-transparent via-white/30 to-white/30"
            />
          </div>

          <div className="text-center space-y-3">
            <p className="text-white/70 text-sm">Already have an account?</p>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/login")}
              className="group relative inline-flex items-center gap-2"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-blue-300 font-bold relative">
                Sign In
                <motion.span
                  className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-emerald-300 to-blue-300"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-emerald-300"
              >
                →
              </motion.span>
            </motion.button>
          </div>
        </motion.div>

        {/* Ambient lighting */}
        <div className="absolute inset-0 rounded-[2rem] pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-52 h-14 bg-white/20 blur-2xl rounded-full"
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
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-60 h-12 bg-gradient-to-r from-emerald-400/30 via-blue-400/30 to-purple-400/30 blur-3xl rounded-full"
          />
        </div>

        {/* Corner accents */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-white/20 rounded-tl-2xl pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-white/20 rounded-br-2xl pointer-events-none" />
      </motion.div>

      {/* Background grid */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          x: useTransform(mouseX, [0, window.innerWidth || 1000], [0, 20]),
          y: useTransform(mouseY, [0, window.innerHeight || 800], [0, 20]),
        }}
      />
    </div>
  );
}
