import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../api/axiosInstance";

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/users");
      console.log("👥 Users loaded:", res.data);
      setUsers(res.data);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      filterRole === "all" ||
      user.roles?.some(
        (r) => r.name?.toLowerCase() === filterRole.toLowerCase()
      );
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: "from-red-500/20 to-pink-500/10 text-red-400 border-red-500/30",
      MANAGER:
        "from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30",
      DRIVER:
        "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/30",
      CUSTOMER:
        "from-green-500/20 to-emerald-500/10 text-green-400 border-green-500/30",
    };
    return colors[role] || colors.CUSTOMER;
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 flex items-center justify-center">
        <div className="text-white text-xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              👥 User Management
            </h2>
            <p className="text-white/60 text-sm mt-1">
              {filteredUsers.length} of {users.length} users
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <span className="mr-2">➕</span>
            Add User
          </motion.button>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <input
              type="text"
              placeholder="🔍 Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl focus:outline-none focus:border-blue-500 placeholder-white/50 transition-all"
            />
          </div>
          <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
            {[
              { value: "all", label: "All" },
              { value: "admin", label: "Admins" },
              { value: "manager", label: "Managers" },
              { value: "driver", label: "Drivers" },
              { value: "customer", label: "Customers" },
            ].map((filter) => (
              <motion.button
                key={filter.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterRole(filter.value)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterRole === filter.value
                    ? "bg-white/20 text-white shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {filter.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center"
          >
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Users Found
            </h3>
            <p className="text-white/60">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Get started by adding your first user"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {user.fullName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {user.fullName || "Unnamed User"}
                      </h3>
                      <p className="text-white/60 text-sm">{user.email}</p>
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="flex gap-2 flex-wrap">
                    {user.roles?.map((role) => (
                      <span
                        key={role.id}
                        className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r border ${getRoleBadgeColor(
                          role.name
                        )}`}
                      >
                        {role.name}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingUser(user)}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-semibold hover:bg-blue-500/30 transition-all"
                    >
                      ✏️ Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold hover:bg-red-500/30 transition-all"
                    >
                      🗑️ Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default UserManager;
