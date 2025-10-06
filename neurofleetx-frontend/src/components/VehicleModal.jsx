import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VehicleModal({ show, onClose, onSubmit, vehicle }) {
  const [form, setForm] = useState({
    name: "",
    typeId: "",
    statusId: "",
    batteryLevel: "",
    fuelLevel: "",
    speed: 0,
    latitude: "",
    longitude: "",
  });

  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [step, setStep] = useState(1); // Multi-step form

  // Lock body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px"; // Prevent layout shift
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [show]);

  useEffect(() => {
    if (vehicle) {
      setForm({
        ...vehicle,
        typeId: vehicle.typeId || "",
        statusId: vehicle.statusId || "",
        batteryLevel: vehicle.batteryLevel || "",
        fuelLevel: vehicle.fuelLevel || "",
        latitude: vehicle.latitude || "",
        longitude: vehicle.longitude || "",
      });
    } else {
      resetForm();
    }
  }, [vehicle, show]);

  const resetForm = () => {
    setForm({
      name: "",
      typeId: "",
      statusId: "",
      batteryLevel: "",
      fuelLevel: "",
      speed: 0,
      latitude: "",
      longitude: "",
    });
    setErrors({});
    setSubmitError("");
    setSubmitSuccess(false);
    setStep(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    if (submitError) {
      setSubmitError("");
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!form.name || !form.name.trim()) {
        newErrors.name = "Vehicle name is required";
      }
      if (!form.typeId) {
        newErrors.typeId = "Vehicle type is required";
      }
      if (!form.statusId) {
        newErrors.statusId = "Status is required";
      }
    } else if (currentStep === 2) {
      if (form.batteryLevel === "" || form.batteryLevel === null) {
        newErrors.batteryLevel = "Battery level is required";
      } else if (form.batteryLevel < 0 || form.batteryLevel > 100) {
        newErrors.batteryLevel = "Battery must be between 0-100";
      }

      if (form.fuelLevel === "" || form.fuelLevel === null) {
        newErrors.fuelLevel = "Fuel level is required";
      } else if (form.fuelLevel < 0 || form.fuelLevel > 100) {
        newErrors.fuelLevel = "Fuel must be between 0-100";
      }

      if (form.latitude === "" || form.latitude === null) {
        newErrors.latitude = "Latitude is required";
      }

      if (form.longitude === "" || form.longitude === null) {
        newErrors.longitude = "Longitude is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (validateStep(step)) {
      setIsSubmitting(true);
      setSubmitError("");

      try {
        await onSubmit({
          id: form.id,
          name: form.name.trim(),
          typeId: parseInt(form.typeId),
          statusId: parseInt(form.statusId),
          batteryLevel: Number(form.batteryLevel),
          fuelLevel: Number(form.fuelLevel),
          speed: Number(form.speed),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        });

        setSubmitSuccess(true);

        setTimeout(() => {
          setIsSubmitting(false);
          resetForm();
          onClose();
          setSubmitSuccess(false);
        }, 2000);
      } catch (error) {
        setIsSubmitting(false);
        setSubmitError(
          error.message || "Failed to save vehicle. Please try again."
        );
      }
    }
  };

  const vehicleTypes = [
    { id: 1, name: "Car", icon: "🚗", color: "from-blue-500 to-cyan-500" },
    { id: 2, name: "Van", icon: "🚐", color: "from-purple-500 to-pink-500" },
    { id: 3, name: "Truck", icon: "🚚", color: "from-orange-500 to-red-500" },
    { id: 4, name: "EV", icon: "⚡", color: "from-green-500 to-emerald-500" },
    { id: 5, name: "Bike", icon: "🏍️", color: "from-yellow-500 to-orange-500" },
  ];

  const vehicleStatuses = [
    {
      id: 1,
      name: "Available",
      icon: "✅",
      color: "from-green-400 to-emerald-500",
    },
    {
      id: 2,
      name: "In Use",
      icon: "🚦",
      color: "from-yellow-400 to-orange-500",
    },
    {
      id: 3,
      name: "Needs Maintenance",
      icon: "🔧",
      color: "from-red-400 to-pink-500",
    },
    { id: 4, name: "Offline", icon: "⭕", color: "from-gray-400 to-gray-600" },
  ];

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 0.8,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 50,
      transition: { duration: 0.2 },
    },
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (direction) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    }),
  };

  if (!show) return null;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[9999] flex justify-center items-center p-4"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, 
                rgba(59, 130, 246, 0.4) 0%, 
                transparent 50%),
              radial-gradient(circle at 80% 50%, 
                rgba(147, 51, 234, 0.4) 0%, 
                transparent 50%),
              radial-gradient(circle at 50% 50%, 
                rgba(16, 185, 129, 0.3) 0%, 
                transparent 70%),
              rgba(15, 23, 42, 0.95)
            `,
            backdropFilter: "blur(20px)",
          }}
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl"
          >
            {/* Success Overlay */}
            <AnimatePresence>
              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-br from-green-500/95 to-emerald-600/95 backdrop-blur-2xl z-50 flex items-center justify-center rounded-3xl"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="text-9xl mb-6"
                    >
                      ✓
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-4xl font-black text-white mb-2"
                    >
                      Success!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-white/90 text-lg"
                    >
                      Vehicle {vehicle ? "updated" : "added"} successfully
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium Glass Card */}
            <div
              className="relative backdrop-blur-3xl rounded-3xl border border-white/20 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
                boxShadow: `
                  0 50px 100px -20px rgba(0, 0, 0, 0.5),
                  0 0 0 1px rgba(255, 255, 255, 0.1),
                  inset 0 2px 0 rgba(255, 255, 255, 0.2)
                `,
              }}
            >
              {/* Header */}
              <div className="relative border-b border-white/10 px-8 py-6 bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg"
                    >
                      🚗
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        {vehicle ? "Edit Vehicle" : "Add New Vehicle"}
                      </h2>
                      <p className="text-white/60 text-sm mt-1">
                        Step {step} of 2 • Fill in the details
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/30 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.button>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${(step / 2) * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  />
                </div>
              </div>

              {/* Error Banner */}
              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border-b border-red-500/20 px-8 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <h4 className="text-red-400 font-bold">Error</h4>
                        <p className="text-red-300 text-sm">{submitError}</p>
                      </div>
                      <button
                        onClick={() => setSubmitError("")}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Content - No Scroll */}
              <div className="px-8 py-8 min-h-[400px]">
                <AnimatePresence mode="wait" custom={step}>
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      custom={1}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-6"
                    >
                      {/* Vehicle Name */}
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3">
                          Vehicle Name <span className="text-red-400">*</span>
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("name")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Enter vehicle name (e.g., Tesla Model 3)"
                          className={`w-full p-4 bg-white/10 backdrop-blur-sm text-white border-2 ${
                            errors.name
                              ? "border-red-500"
                              : focusedField === "name"
                              ? "border-blue-500"
                              : "border-white/20"
                          } rounded-2xl focus:outline-none placeholder-white/40 transition-all font-medium text-lg`}
                        />
                        {errors.name && (
                          <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                            <span>⚠️</span> {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Vehicle Type - Cards */}
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3">
                          Vehicle Type <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                          {vehicleTypes.map((type) => (
                            <motion.button
                              key={type.id}
                              type="button"
                              whileHover={{ scale: 1.05, y: -5 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                handleChange({
                                  target: { name: "typeId", value: type.id },
                                });
                                setErrors({ ...errors, typeId: "" });
                              }}
                              className={`relative p-4 rounded-2xl backdrop-blur-sm border-2 transition-all ${
                                form.typeId === type.id
                                  ? `bg-gradient-to-br ${type.color} border-white/40 shadow-lg`
                                  : "bg-white/5 border-white/10 hover:border-white/30"
                              }`}
                            >
                              <div className="text-4xl mb-2">{type.icon}</div>
                              <div
                                className={`text-xs font-bold ${
                                  form.typeId === type.id
                                    ? "text-white"
                                    : "text-white/70"
                                }`}
                              >
                                {type.name}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        {errors.typeId && (
                          <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                            <span>⚠️</span> {errors.typeId}
                          </p>
                        )}
                      </div>

                      {/* Vehicle Status - Cards */}
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3">
                          Status <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          {vehicleStatuses.map((status) => (
                            <motion.button
                              key={status.id}
                              type="button"
                              whileHover={{ scale: 1.05, y: -5 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                handleChange({
                                  target: {
                                    name: "statusId",
                                    value: status.id,
                                  },
                                });
                                setErrors({ ...errors, statusId: "" });
                              }}
                              className={`relative p-4 rounded-2xl backdrop-blur-sm border-2 transition-all ${
                                form.statusId === status.id
                                  ? `bg-gradient-to-br ${status.color} border-white/40 shadow-lg`
                                  : "bg-white/5 border-white/10 hover:border-white/30"
                              }`}
                            >
                              <div className="text-3xl mb-2">{status.icon}</div>
                              <div
                                className={`text-xs font-bold ${
                                  form.statusId === status.id
                                    ? "text-white"
                                    : "text-white/70"
                                }`}
                              >
                                {status.name}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        {errors.statusId && (
                          <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                            <span>⚠️</span> {errors.statusId}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      custom={2}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-6"
                    >
                      {/* Battery & Fuel */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                            <span className="text-xl">🔋</span>
                            Battery Level (%){" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="number"
                            name="batteryLevel"
                            value={form.batteryLevel}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("batteryLevel")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="0-100"
                            min="0"
                            max="100"
                            className={`w-full p-4 bg-white/10 backdrop-blur-sm text-white border-2 ${
                              errors.batteryLevel
                                ? "border-red-500"
                                : focusedField === "batteryLevel"
                                ? "border-blue-500"
                                : "border-white/20"
                            } rounded-2xl focus:outline-none placeholder-white/40 transition-all font-medium text-lg`}
                          />
                          {errors.batteryLevel && (
                            <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                              <span>⚠️</span> {errors.batteryLevel}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                            <span className="text-xl">⛽</span>
                            Fuel Level (%){" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="number"
                            name="fuelLevel"
                            value={form.fuelLevel}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("fuelLevel")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="0-100"
                            min="0"
                            max="100"
                            className={`w-full p-4 bg-white/10 backdrop-blur-sm text-white border-2 ${
                              errors.fuelLevel
                                ? "border-red-500"
                                : focusedField === "fuelLevel"
                                ? "border-blue-500"
                                : "border-white/20"
                            } rounded-2xl focus:outline-none placeholder-white/40 transition-all font-medium text-lg`}
                          />
                          {errors.fuelLevel && (
                            <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                              <span>⚠️</span> {errors.fuelLevel}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Latitude & Longitude */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                            <span className="text-xl">📍</span>
                            Latitude <span className="text-red-400">*</span>
                          </label>
                          <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="number"
                            name="latitude"
                            value={form.latitude}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("latitude")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="e.g., 37.7749"
                            step="0.0001"
                            className={`w-full p-4 bg-white/10 backdrop-blur-sm text-white border-2 ${
                              errors.latitude
                                ? "border-red-500"
                                : focusedField === "latitude"
                                ? "border-blue-500"
                                : "border-white/20"
                            } rounded-2xl focus:outline-none placeholder-white/40 transition-all font-medium text-lg`}
                          />
                          {errors.latitude && (
                            <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                              <span>⚠️</span> {errors.latitude}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                            <span className="text-xl">🌐</span>
                            Longitude <span className="text-red-400">*</span>
                          </label>
                          <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="number"
                            name="longitude"
                            value={form.longitude}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("longitude")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="e.g., -122.4194"
                            step="0.0001"
                            className={`w-full p-4 bg-white/10 backdrop-blur-sm text-white border-2 ${
                              errors.longitude
                                ? "border-red-500"
                                : focusedField === "longitude"
                                ? "border-blue-500"
                                : "border-white/20"
                            } rounded-2xl focus:outline-none placeholder-white/40 transition-all font-medium text-lg`}
                          />
                          {errors.longitude && (
                            <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                              <span>⚠️</span> {errors.longitude}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-white/10 px-8 py-6 bg-gradient-to-r from-transparent to-white/5">
                <div className="flex justify-between gap-4">
                  {step > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.02, x: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
                    >
                      ← Back
                    </motion.button>
                  )}

                  <div className="flex gap-4 ml-auto">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </motion.button>

                    {step < 2 ? (
                      <motion.button
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                        <span className="relative z-10 flex items-center gap-2">
                          Next <span>→</span>
                        </span>
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden group disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span>✓</span>
                            {vehicle ? "Update" : "Save"} Vehicle
                          </span>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
