"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { B2BApplication, B2BUser, ServiceItem, ALL_SERVICES } from "@/lib/b2bStore";
import { getStoredUser, setStoredUser } from "@/lib/firebaseService";
import { fetchApplicationsFromSupabase, updateApplicationStatusInSupabase, fetchServicesFromSupabase } from "@/lib/supabaseService";

export default function AdminPortalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<B2BUser | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Data
  const [applications, setApplications] = useState<B2BApplication[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeAdminTab, setActiveAdminTab] = useState<"applications" | "services">("applications");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [remarksDrafts, setRemarksDrafts] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const user = getStoredUser();
    if (user && user.role === "admin") {
      setCurrentUser(user);
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [apps, srvs] = await Promise.all([
        fetchApplicationsFromSupabase(),
        fetchServicesFromSupabase()
      ]);
      setApplications(apps || []);
      setServices(srvs && srvs.length > 0 ? srvs : ALL_SERVICES);
    } catch (e) {
      console.error("Admin data load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    // Admin Authentication Check
    if (adminEmail.trim().toLowerCase() === "admin@b2bmultiservice.in" && adminPassword === "admin123") {
      const adminUser: B2BUser = {
        uid: "admin-master-001",
        name: "Super Administrator",
        email: "admin@b2bmultiservice.in",
        phone: "+91 98000-00000",
        role: "admin",
        businessName: "Tanda B2B Head Office",
        createdAt: new Date().toISOString()
      };
      setCurrentUser(adminUser);
      setStoredUser(adminUser);
      showToast("Welcome to Admin Master Hub");
      loadAdminData();
    } else {
      setLoginError("Invalid Admin credentials. (Default: admin@b2bmultiservice.in / admin123)");
    }
  };

  const handleAdminLogout = () => {
    setCurrentUser(null);
    setStoredUser(null);
    router.push("/");
  };

  const handleStatusChange = async (appId: string, newStatus: B2BApplication["status"]) => {
    setUpdatingId(appId);
    const remark = remarksDrafts[appId] || `Status updated to ${newStatus} by Admin`;
    await updateApplicationStatusInSupabase(appId, newStatus, remark);
    await loadAdminData();
    setUpdatingId(null);
    showToast(`Application ${appId} updated to ${newStatus}`);
  };

  const handleSaveRemark = async (appId: string) => {
    const remark = remarksDrafts[appId];
    if (!remark) return;
    const currentApp = applications.find(a => a.id === appId);
    if (!currentApp) return;
    setUpdatingId(appId);
    await updateApplicationStatusInSupabase(appId, currentApp.status, remark);
    await loadAdminData();
    setUpdatingId(null);
    showToast(`Remark saved for ${appId}`);
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesStatus = statusFilter === "all" || app.status.toLowerCase() === statusFilter.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        app.applicantName.toLowerCase().includes(q) ||
        app.applicantPhone.toLowerCase().includes(q) ||
        app.trackingNumber.toLowerCase().includes(q) ||
        app.serviceTitle.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [applications, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === "Pending" || a.status === "In Process").length;
    const completed = applications.filter(a => a.status === "Completed" || a.status === "Approved").length;
    const verification = applications.filter(a => a.status === "Document Verification" || a.status === "Action Required").length;
    return { total, pending, completed, verification };
  }, [applications]);

  // IF NOT LOGGED IN AS ADMIN -> SHOW SECURE ADMIN LOGIN
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <span className="text-2xl">🛡️</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">Super Admin Hub</h1>
            <p className="text-xs text-slate-400">Restricted Master Management Portal • Tanda Enterprises</p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Admin Email ID
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@b2bmultiservice.in"
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Admin Master Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-[1.01]"
            >
              Sign In to Admin Hub
            </button>
          </form>

          <div className="pt-4 border-t border-slate-700/60 text-center">
            <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition">
              ← Return to Public Customer / Agent Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN AS ADMIN -> RENDER FULL ADMIN MANAGEMENT SUITE
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
          <span>✅</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-lg shadow">
            🛡️
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide leading-tight">Super Admin Master Hub</h1>
            <p className="text-xs text-amber-400 font-medium">B2B Multi Service Operations Center</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700"
          >
            <span>🌐</span>
            <span>View Public Website</span>
          </Link>
          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold rounded-xl transition border border-rose-500/30"
          >
            Logout Admin
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Applications</span>
            <div className="text-3xl font-black text-slate-900 mt-2">{stats.total}</div>
            <span className="text-[11px] text-blue-600 font-semibold mt-1 block">Live in Supabase DB</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pending / In Process</span>
            <div className="text-3xl font-black text-blue-600 mt-2">{stats.pending}</div>
            <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Needs Scrutiny / Review</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Completed / Approved</span>
            <div className="text-3xl font-black text-emerald-600 mt-2">{stats.completed}</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Certificate Issued</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Services</span>
            <div className="text-3xl font-black text-purple-600 mt-2">{services.length}</div>
            <span className="text-[11px] text-purple-600 font-semibold mt-1 block">GST, MSME, ITR, Loans, PAN</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveAdminTab("applications")}
            className={`px-4 py-2 rounded-xl text-sm font-extrabold transition ${
              activeAdminTab === "applications"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            📋 Live Applications Management ({applications.length})
          </button>
          <button
            onClick={() => setActiveAdminTab("services")}
            className={`px-4 py-2 rounded-xl text-sm font-extrabold transition ${
              activeAdminTab === "services"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            ⚙️ Portal Services Catalog ({services.length})
          </button>
        </div>

        {/* TAB 1: LIVE APPLICATIONS */}
        {activeAdminTab === "applications" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Applicant Submissions</h2>
                <p className="text-xs text-slate-500">Real-time status updates sync directly to customer & agent dashboards</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search applicant / phone / track..."
                  className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 w-60"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Process">In Process</option>
                  <option value="Document Verification">Document Verification</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="Action Required">Action Required</option>
                </select>

                <button
                  onClick={loadAdminData}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  title="Reload from Supabase"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-semibold text-sm">
                Fetching latest submissions from Supabase...
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <span className="text-3xl block">📭</span>
                <p className="font-bold text-slate-700">No applications found.</p>
                <p className="text-xs text-slate-500">New applications submitted by customers or agents will appear here in real-time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Tracking & Date</th>
                      <th className="py-3 px-4">Applicant & Contact</th>
                      <th className="py-3 px-4">Service & Amount</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4">Change Status</th>
                      <th className="py-3 px-4">Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block w-max">
                            {app.trackingNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            {app.appliedDate || "Today"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{app.applicantName}</span>
                          <span className="text-[11px] text-slate-500 block">{app.applicantPhone}</span>
                          {app.businessName && (
                            <span className="text-[10px] text-slate-400 block italic">({app.businessName})</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{app.serviceTitle}</span>
                          <span className="text-[11px] text-emerald-700 font-bold font-mono">{app.amount}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            app.status === "Approved" || app.status === "Completed"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : app.status === "Action Required"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : app.status === "Document Verification"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-blue-100 text-blue-800 border border-blue-300"
                          }`}>
                            {app.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            disabled={updatingId === app.id}
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value as any)}
                            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Process">In Process</option>
                            <option value="Document Verification">Document Verification</option>
                            <option value="Approved">Approved</option>
                            <option value="Completed">Completed</option>
                            <option value="Action Required">Action Required</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={remarksDrafts[app.id] ?? (app.remarks || "")}
                              onChange={(e) => setRemarksDrafts({ ...remarksDrafts, [app.id]: e.target.value })}
                              placeholder="Add instructions / remarks..."
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-48 focus:outline-none focus:bg-white"
                            />
                            <button
                              disabled={updatingId === app.id}
                              onClick={() => handleSaveRemark(app.id)}
                              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PORTAL SERVICES */}
        {activeAdminTab === "services" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Portal Services & Pricing Catalog</h2>
              <p className="text-xs text-slate-500">Live service offerings configured in Supabase portal_services</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((srv) => (
                <div key={srv.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">{srv.title}</span>
                    <span className="text-[10px] uppercase font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {srv.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{srv.tagline}</p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">Points Cost: <strong className="text-slate-900">{srv.basePointsCost} Pts</strong></span>
                    <span className="text-emerald-700">Commission: <strong>{srv.baseAgentCommission} Pts</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
