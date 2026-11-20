"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ALL_SERVICES,
  B2BApplication,
  B2BUser,
  ServiceItem,
  ServiceCustomField,
  ServiceCustomFieldOption,
  getPortalServices,
  savePortalServices,
  addPortalService,
  updatePortalService,
} from "@/lib/b2bStore";
import {
  getUserWalletPoints,
  getUserWalletTransactions,
  addPointsToWallet,
  autoCutServicePoints,
  SERVICE_COMMISSION_RULES,
  WalletTransaction
} from "@/lib/walletStore";
import { 
  getApplications, 
  submitApplication, 
  updateApplicationStatus, 
  getStoredUser, 
  setStoredUser,
  firebaseSignIn,
  firebaseSignUp
} from "@/lib/firebaseService";
import {
  fetchApplicationsFromSupabase,
  saveApplicationToSupabase,
  updateApplicationStatusInSupabase,
  fetchServicesFromSupabase,
  syncServicesToSupabase,
} from "@/lib/supabaseService";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  IconDashboard,
  IconITR,
  IconLoan,
  IconInsurance,
  IconFSSAI,
  IconGST,
  IconMSME,
  IconPAN,
  IconTrack,
  IconAdmin,
  IconUser,
  IconCheck,
  IconSearch,
  IconPhone,
  IconWhatsApp,
  IconArrowRight,
  IconUpload,
  IconShield,
  IconMenu,
  IconX,
  NavIconDashboard,
  NavIconITR,
  NavIconLoan,
  NavIconInsurance,
  NavIconFSSAI,
  NavIconGST,
  NavIconMSME,
  NavIconPAN,
  NavIconWallet,
  NavIconTrack,
  NavIconAdmin,
} from "@/components/Icons";

export default function B2BMultiServicePortal() {
  // User Session & Role
  const [currentUser, setCurrentUser] = useState<B2BUser | null>(null);
  const [applications, setApplications] = useState<B2BApplication[]>([]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [applyModalOpen, setApplyModalOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRoleSelect, setAuthRoleSelect] = useState<'customer' | 'agent' | 'admin'>('customer');

  // Dynamic Portal Services & Custom Fields Management
  const [portalServices, setPortalServices] = useState<ServiceItem[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [adminSubTab, setAdminSubTab] = useState<'applications' | 'services'>('applications');
  const [adminServiceModalOpen, setAdminServiceModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [adminServiceForm, setAdminServiceForm] = useState<{
    id: string;
    title: string;
    category: 'itr' | 'loan' | 'insurance' | 'fssai' | 'gst' | 'msme' | 'pan';
    tagline: string;
    basePointsCost: number;
    baseAgentCommission: number;
    customFields: ServiceCustomField[];
  }>({
    id: '',
    title: '',
    category: 'itr',
    tagline: '',
    basePointsCost: 499,
    baseAgentCommission: 100,
    customFields: []
  });
  const [newFieldDraft, setNewFieldDraft] = useState<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'select';
    required: boolean;
    optionsStr: string; // "Label:Value:Points:Commission" per line
  }>({
    id: '',
    label: '',
    type: 'text',
    required: true,
    optionsStr: ''
  });

  // Tracking State
  const [trackQuery, setTrackQuery] = useState<string>("");
  const [searchedApp, setSearchedApp] = useState<B2BApplication | null>(null);
  const [trackNotFound, setTrackNotFound] = useState<boolean>(false);

  // Application Form Inputs
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; uploadedAt: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<B2BApplication | null>(null);

  // Dynamic Service Fields
  const [itrPan, setItrPan] = useState("");
  const [itrSalary, setItrSalary] = useState("");
  const [loanAmount, setLoanAmount] = useState("500000");
  const [loanTenure, setLoanTenure] = useState("3");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Commercial Goods Vehicle");
  const [fssaiTurnover, setFssaiTurnover] = useState("Below 12 Lakhs (Basic Registration)");

  // Auth Inputs
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── WALLET STATE ──────────────────────────────────────────────
  const [walletPoints, setWalletPoints] = useState<number>(0);
  const [walletPageTab, setWalletPageTab] = useState<'wallet' | 'add_points'>('wallet');
  const [txFilter, setTxFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [walletTab, setWalletTab] = useState<'add' | 'history'>('add');
  const [addPointsAmount, setAddPointsAmount] = useState<string>('500');
  const [addPointsMethod, setAddPointsMethod] = useState<string>('UPI / GPay / PhonePe');
  const [addPointsSuccess, setAddPointsSuccess] = useState<boolean>(false);
  const [walletTxs, setWalletTxs] = useState<WalletTransaction[]>([]);
  const [walletPaySuccess, setWalletPaySuccess] = useState<boolean>(false);
  const [walletPayResult, setWalletPayResult] = useState<{ newBal: number; commission?: number } | null>(null);
  const [walletPayError, setWalletPayError] = useState<string | null>(null);

  // Service Details Modal
  const [serviceDetailModalOpen, setServiceDetailModalOpen] = useState<boolean>(false);
  const [serviceDetailItem, setServiceDetailItem] = useState<ServiceItem | null>(null);

  const openServiceDetail = (serviceId: string) => {
    const srv = getActiveService(serviceId);
    if (srv) {
      setServiceDetailItem(srv);
      setServiceDetailModalOpen(true);
    }
  };

  // Refresh wallet balance from store
  const refreshWallet = (user: B2BUser | null) => {
    if (!user) { setWalletPoints(0); setWalletTxs([]); return; }
    setWalletPoints(getUserWalletPoints(user));
    setWalletTxs(getUserWalletTransactions(user));
  };

  // ── WALLET TRANSACTIONS PAGINATION (50 Per Page, 0.85rem Font) ──
  const TXS_PER_PAGE = 50;
  const [walletPassbookPage, setWalletPassbookPage] = useState<number>(1);
  const [addPointsTxPage, setAddPointsTxPage] = useState<number>(1);

  // Filtered transactions for wallet passbook
  const filteredWalletTxs = useMemo(() => {
    return walletTxs.filter(t =>
      txFilter === 'all' ? true : txFilter === 'credit' ? t.type.startsWith('CREDIT') : t.type.startsWith('DEBIT')
    );
  }, [walletTxs, txFilter]);

  const totalWalletPages = Math.max(1, Math.ceil(filteredWalletTxs.length / TXS_PER_PAGE));
  const paginatedWalletTxs = useMemo(() => {
    const start = (walletPassbookPage - 1) * TXS_PER_PAGE;
    return filteredWalletTxs.slice(start, start + TXS_PER_PAGE);
  }, [filteredWalletTxs, walletPassbookPage]);

  const totalAddPointsPages = Math.max(1, Math.ceil(walletTxs.length / TXS_PER_PAGE));
  const paginatedAddPointsTxs = useMemo(() => {
    const start = (addPointsTxPage - 1) * TXS_PER_PAGE;
    return walletTxs.slice(start, start + TXS_PER_PAGE);
  }, [walletTxs, addPointsTxPage]);

  // Reusable Pagination Bar (0.85rem font, 50 per page, Prev / Next + 1, 2, 3...)
  const renderPaginationBar = (
    currentPage: number,
    totalPages: number,
    onPageChange: (p: number) => void,
    totalCount: number
  ) => {
    if (totalCount === 0) return null;
    const pageItems: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageItems.push(i);
    } else {
      pageItems.push(1);
      if (currentPage > 3) pageItems.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pageItems.push(i);
      if (currentPage < totalPages - 2) pageItems.push('...');
      pageItems.push(totalPages);
    }

    const startIdx = (currentPage - 1) * TXS_PER_PAGE + 1;
    const endIdx = Math.min(totalCount, currentPage * TXS_PER_PAGE);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border-t border-slate-200" style={{ fontSize: '0.85rem' }}>
        <div className="text-slate-600 font-medium" style={{ fontSize: '0.85rem' }}>
          Showing <span className="font-bold text-slate-900">{startIdx} - {endIdx}</span> of <span className="font-bold text-slate-900">{totalCount}</span> records • Page <span className="font-bold text-blue-600">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span> (50 per page)
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-lg border font-bold transition flex items-center gap-1 ${
              currentPage === 1
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
            }`}
            style={{ fontSize: '0.85rem' }}
          >
            ← Previous
          </button>

          {pageItems.map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-7 px-2 rounded-lg font-bold transition ${
                  currentPage === p
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
                style={{ fontSize: '0.85rem' }}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-slate-400 font-bold select-none" style={{ fontSize: '0.85rem' }}>...</span>
            )
          )}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className={`px-3 py-1 rounded-lg border font-bold transition flex items-center gap-1 ${
              currentPage >= totalPages
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
            }`}
            style={{ fontSize: '0.85rem' }}
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  // Pay for a service using wallet points
  const handleWalletServicePay = (serviceId: string) => {
    if (!currentUser) { showToast('ਪਹਿਲਾਂ Login ਕਰੋ'); return; }
    const rule = SERVICE_COMMISSION_RULES[serviceId];
    if (!rule) { showToast('Service not found'); return; }
    if (rule.pointsCost === 0) { showToast('This service has free assessment — no points needed!'); return; }

    const result = autoCutServicePoints(
      currentUser,
      rule.pointsCost,
      rule.serviceTitle,
      `TRK-${rule.category.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      rule.agentCommissionPoints,
      'AG-PB-104'
    );

    refreshWallet(currentUser);

    if (!result.success) {
      setWalletPayError(result.error || 'Insufficient points');
      setWalletPaySuccess(false);
    } else {
      setWalletPaySuccess(true);
      setWalletPayError(null);
      setWalletPayResult({
        newBal: result.newBalance,
        commission: result.agentCommissionTx?.points
      });
      showToast(`✅ ₹${rule.pointsCost} Points auto-cut! Service booked.${result.agentCommissionTx ? ` Agent commission: ₹${result.agentCommissionTx.points} credited.` : ''}`);
    }
  };

  // Interactive Action Modals for All Synchronized Cards:
  const [activeActionModal, setActiveActionModal] = useState<
    'upload' | 'objection' | 'everify' | 'payment' | 'dispatch' | 'download' | 'processing' | null
  >(null);
  const [modalMeta, setModalMeta] = useState<{
    title: string;
    sub?: string;
    amount?: string;
    docs?: string[];
    consignment?: string;
    stage?: string;
  }>({ title: "" });

  // Interactive modal internal inputs
  const [eVerifyOtp, setEVerifyOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [eVerifySuccess, setEVerifySuccess] = useState(false);

  const [objectionReply, setObjectionReply] = useState("");
  const [objectionSent, setObjectionSent] = useState(false);

  const [paidSuccess, setPaidSuccess] = useState(false);
  const [uploadModalSuccess, setUploadModalSuccess] = useState(false);

  // Helper open functions
  const openUploadModal = (title: string, docs?: string[]) => {
    setModalMeta({ title, docs: docs || ['Document PDF/JPG'] });
    setUploadModalSuccess(false);
    setActiveActionModal('upload');
  };

  const openObjectionModal = (title: string, sub?: string) => {
    setModalMeta({ title, sub: sub || 'Department has raised a query or clarification notice.' });
    setObjectionReply('');
    setObjectionSent(false);
    setActiveActionModal('objection');
  };

  const openEVerifyModal = (title: string = 'Aadhaar e-Verification / e-Sign') => {
    setModalMeta({ title });
    setEVerifyOtp('');
    setOtpSent(false);
    setEVerifySuccess(false);
    setActiveActionModal('everify');
  };

  const openPaymentModal = (title: string, amount: string = '₹499') => {
    setModalMeta({ title, amount });
    setPaidSuccess(false);
    setActiveActionModal('payment');
  };

  const openDispatchModal = (title: string = 'India Post SpeedPost Tracking', consignment: string = 'EM918237461IN') => {
    setModalMeta({ title, consignment });
    setActiveActionModal('dispatch');
  };

  const openDownloadModal = (title: string, sub?: string) => {
    setModalMeta({ title, sub: sub || 'Official Government / Insurer Approved Document' });
    setActiveActionModal('download');
  };

  const openProcessingModal = (title: string, stage: string = 'Stage 2: Official Portal Processing') => {
    setModalMeta({ title, stage });
    setActiveActionModal('processing');
  };

  // Initial load on mount
  useEffect(() => {
    const user = getStoredUser(); // Returns null if not logged in
    if (user) {
      setCurrentUser(user);
      loadUserApplications(user);
      refreshWallet(user);
    } else {
      // No session → show login modal
      setAuthModalOpen(true);
    }

    // Load services from Supabase if configured, otherwise from local store
    fetchServicesFromSupabase().then((srvs) => {
      if (srvs && srvs.length > 0) setPortalServices(srvs);
      else setPortalServices(getPortalServices());
    });
  }, []);

  // Load applications filtered strictly for this active user
  const loadUserApplications = async (user: B2BUser | null) => {
    if (!user) {
      setApplications([]);
      return;
    }
    const allApps = isSupabaseConfigured()
      ? await fetchApplicationsFromSupabase()
      : await getApplications(user);

    if (user.role === 'admin') {
      setApplications(allApps);
    } else {
      setApplications(allApps.filter(a => a.userId === user.uid || (user.agentCode && a.agentCode === user.agentCode)));
    }
  };

  // Active services list (dynamically managed by admin or default)
  const activeServicesList = useMemo(() => {
    return portalServices.length > 0 ? portalServices : ALL_SERVICES;
  }, [portalServices]);

  const getActiveService = (idOrIndex: string | number): ServiceItem => {
    if (typeof idOrIndex === 'string') {
      const found = activeServicesList.find(s => s.id === idOrIndex);
      if (found) return found;
      const defaultFound = ALL_SERVICES.find(s => s.id === idOrIndex);
      if (defaultFound) return defaultFound;
    } else if (typeof idOrIndex === 'number') {
      if (activeServicesList[idOrIndex]) return activeServicesList[idOrIndex];
      if (ALL_SERVICES[idOrIndex]) return ALL_SERVICES[idOrIndex];
    }
    return activeServicesList[0] || ALL_SERVICES[0];
  };

  // Filter services by search box
  const filteredServices = useMemo(() => {
    return activeServicesList.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeServicesList, searchQuery]);

  // Calculate live dynamic point cost based on service + selected custom field options
  const currentPointsCost = useMemo(() => {
    if (!selectedService) return 0;
    let cost = selectedService.basePointsCost ?? 0;
    if (selectedService.customFields) {
      for (const field of selectedService.customFields) {
        if (field.type === 'select' && field.options) {
          const selectedVal = customFieldValues[field.id];
          const opt = field.options.find(o => o.value === selectedVal);
          if (opt && opt.pointCost !== undefined) {
            cost = opt.pointCost;
          }
        }
      }
    }
    return cost;
  }, [selectedService, customFieldValues]);

  // Calculate live dynamic agent commission points
  const currentAgentCommission = useMemo(() => {
    if (!selectedService) return 0;
    let comm = selectedService.baseAgentCommission ?? 0;
    if (selectedService.customFields) {
      for (const field of selectedService.customFields) {
        if (field.type === 'select' && field.options) {
          const selectedVal = customFieldValues[field.id];
          const opt = field.options.find(o => o.value === selectedVal);
          if (opt && opt.commissionPoints !== undefined) {
            comm = opt.commissionPoints;
          }
        }
      }
    }
    return comm;
  }, [selectedService, customFieldValues]);

  // handleSwitchUser removed — no demo role switching

  // Handle Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) {
      showToast("Please enter email");
      return;
    }

    if (authMode === 'login') {
      const res = await firebaseSignIn(authEmail, authPassword, authRoleSelect);
      if (res.user) {
        setCurrentUser(res.user);
        await loadUserApplications(res.user);
        setAuthModalOpen(false);
        showToast(`Welcome back, ${res.user.name}!`);
      } else {
        showToast(res.error || "Login error");
      }
    } else {
      const res = await firebaseSignUp(authEmail, authPassword, authName, authPhone, authRoleSelect);
      if (res.user) {
        setCurrentUser(res.user);
        await loadUserApplications(res.user);
        setAuthModalOpen(false);
        showToast(`Account created! Logged in as ${res.user.role.toUpperCase()}`);
      } else {
        showToast(res.error || "Signup error");
      }
    }
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setStoredUser(null);
    setApplications([]);
    showToast("Signed out. Please select a user to login.");
    setAuthModalOpen(true);
  };

  // Open Apply Modal
  const handleOpenApply = (service: ServiceItem) => {
    if (!currentUser) {
      showToast("Please login first to submit an application.");
      setAuthModalOpen(true);
      return;
    }
    // Always use the latest active/modified service from activeServicesList
    const freshService = activeServicesList.find(s => s.id === service.id) || service;
    setSelectedService(freshService);
    setSubmitSuccess(null);
    setUploadedFiles([]);
    setApplicantName(currentUser.name || "");
    setApplicantPhone(currentUser.phone || "");
    setApplicantEmail(currentUser.email || "");
    setBusinessName(currentUser.businessName || "");

    // Populate initial custom fields
    const initialVals: Record<string, any> = {};
    (service.customFields || []).forEach(f => {
      if (f.defaultValue !== undefined) {
        initialVals[f.id] = f.defaultValue;
      } else if (f.type === 'select' && f.options && f.options.length > 0) {
        initialVals[f.id] = f.options[0].value;
      } else if (f.id === 'businessName') {
        initialVals[f.id] = currentUser.businessName || "";
      } else {
        initialVals[f.id] = "";
      }
    });
    setCustomFieldValues(initialVals);
    setApplyModalOpen(true);
  };

  // File Upload Simulator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDoc = {
        name: file.name,
        type: file.type || "application/pdf",
        uploadedAt: new Date().toLocaleDateString("en-IN")
      };
      setUploadedFiles(prev => [...prev, newDoc]);
      showToast(`Uploaded: ${file.name}`);
    }
  };

  // Submit Application with Dynamic Fields & Auto-Cut Wallet Points
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantPhone || !selectedService || !currentUser) {
      showToast("Please complete required details");
      return;
    }

    // Validate required custom fields
    if (selectedService.customFields) {
      for (const f of selectedService.customFields) {
        if (f.required && (!customFieldValues[f.id] || String(customFieldValues[f.id]).trim() === "")) {
          showToast(`Please fill required field: ${f.label}`);
          return;
        }
      }
    }

    const pointsToCut = currentPointsCost;

    // Check if wallet points are sufficient
    if (walletPoints < pointsToCut) {
      showToast(`⚠️ Insufficient Points! Required: ${pointsToCut} Pts (₹${pointsToCut}), Available: ${walletPoints} Pts. Please add points.`);
      return;
    }

    setSubmitting(true);
    const serviceDetails: Record<string, any> = {
      ...customFieldValues,
      pointsPaid: pointsToCut,
      agentCommissionPoints: currentAgentCommission,
    };

    if (selectedService.category === 'itr') {
      if (!serviceDetails.panNumber) serviceDetails.panNumber = customFieldValues.panNumber || itrPan || "ABCPS1234F";
      if (!serviceDetails.assessmentYear) serviceDetails.assessmentYear = customFieldValues.assessmentYear || "AY 2026-27";
    }

    try {
      const trackingNumber = `TRK-${selectedService.category.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;

      // Execute auto-cut points from wallet
      const autoCut = autoCutServicePoints(
        currentUser,
        pointsToCut,
        selectedService.title,
        trackingNumber,
        currentAgentCommission,
        currentUser.role === 'agent' ? (currentUser.agentCode || 'AG-PB-104') : 'AG-PB-104'
      );

      if (!autoCut.success) {
        showToast(autoCut.error || "Failed to deduct points from wallet.");
        setSubmitting(false);
        return;
      }

      // Refresh wallet balance immediately
      refreshWallet(currentUser);

      const newApp = await submitApplication({
        userId: currentUser.uid,
        userRole: currentUser.role,
        serviceId: selectedService.id,
        serviceCategory: selectedService.category,
        serviceTitle: selectedService.title,
        applicantName,
        applicantPhone,
        applicantEmail: applicantEmail || currentUser.email,
        businessName: businessName || customFieldValues.businessName || applicantName,
        status: "Pending",
        statusColor: "blue",
        amount: `₹${pointsToCut}`,
        pointsPaid: pointsToCut,
        details: serviceDetails,
        documents: uploadedFiles.length > 0 ? uploadedFiles : [
          { name: "Application_Doc.pdf", type: "application/pdf", uploadedAt: new Date().toLocaleDateString("en-IN") }
        ],
        remarks: `Auto-cut ${pointsToCut} Pts. Submitted by ${currentUser.name} (${currentUser.role.toUpperCase()})`
      }, currentUser);

      // Sync to Supabase
      await saveApplicationToSupabase(newApp);

      setSubmitSuccess(newApp);
      await loadUserApplications(currentUser);
      showToast(`Application Submitted! -${pointsToCut} Pts deducted from wallet.`);
    } catch (err) {
      console.error(err);
      showToast("Error saving application");
    } finally {
      setSubmitting(false);
    }
  };

  // Search Tracking
  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    const q = trackQuery.trim().toLowerCase();
    if (!q) return;

    // Search in user's accessible applications
    const found = applications.find(
      app => app.trackingNumber.toLowerCase().includes(q) ||
             app.applicantPhone.toLowerCase().includes(q) ||
             app.applicantName.toLowerCase().includes(q)
    );

    if (found) {
      setSearchedApp(found);
      setTrackNotFound(false);
    } else {
      setSearchedApp(null);
      setTrackNotFound(true);
    }
  };

  // Admin status update
  const handleAdminStatusChange = async (appId: string, newStatus: B2BApplication['status']) => {
    if (currentUser?.role !== 'admin') {
      showToast("Permission denied: Only Admin can update status");
      return;
    }
    await updateApplicationStatusInSupabase(appId, newStatus, `Updated to ${newStatus} by Admin`);
    await loadUserApplications(currentUser);
    showToast(`Status updated to ${newStatus}`);
  };

  // Loan EMI calculations
  const P = Number(loanAmount) || 500000;
  const N = (Number(loanTenure) || 3) * 12;
  const R = (11.5 / 12) / 100;
  const emiCalc = Math.round((P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1));
  const totalPayable = emiCalc * N;
  const totalInterest = totalPayable - P;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <IconCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-72 shadow-xl border-r border-slate-800
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Brand Logo & Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <IconShield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-wide text-white">B2B Multi Service</h1>
                <p className="text-xs text-blue-400 font-medium">Govt & Business Portal</p>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <IconX className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-4 py-2 space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <NavIconDashboard className="w-5 h-5 flex-shrink-0 text-[#e8cca8]" />
              <span>
                {currentUser?.role === 'admin' && 'Admin Master Hub'}
                {currentUser?.role === 'agent' && 'Agent Partner Desk'}
                {(!currentUser || currentUser?.role === 'customer') && 'Customer Dashboard'}
              </span>
            </button>

            <div className="pt-3 pb-1 px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              Apply Services
            </div>

            <button
              onClick={() => { setActiveTab("itr"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "itr"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <NavIconITR className="w-5 h-5 flex-shrink-0 text-[#e8cca8]" />
                <span>ITR Tax Filing</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">FY 25-26</span>
            </button>

            <button
              onClick={() => { setActiveTab("loan"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "loan"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <NavIconLoan className="w-5 h-5 flex-shrink-0 text-[#e8cca8]" />
                <span>Bank Loans & LAP</span>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">EMI Calc</span>
            </button>

            <button
              onClick={() => { setActiveTab("insurance"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "insurance"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <NavIconInsurance className="w-5 h-5 flex-shrink-0 text-[#e8cca8]" />
                <span>3rd Party Insurance</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Instant</span>
            </button>

            <button
              onClick={() => { setActiveTab("fssai"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "fssai"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <NavIconFSSAI className="w-5 h-5 flex-shrink-0 text-[#e8cca8]" />
                <span>FSSAI Food License</span>
              </div>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">FoSCoS</span>
            </button>

            <button
              onClick={() => { setActiveTab("gst"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "gst"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <NavIconGST className="w-5 h-5 flex-shrink-0 text-[#e8cca8]" />
                <span>GST Registration</span>
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">GSTIN</span>
            </button>

            <button
              onClick={() => { setActiveTab("msme"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "msme"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <NavIconMSME className="w-5 h-5 flex-shrink-0 text-[#e8cca8]" />
                <span>MSME Udyam Desk</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Udyam</span>
            </button>

            <button
              onClick={() => { setActiveTab("pan"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "pan"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <NavIconPAN className="w-5 h-5 flex-shrink-0 text-[#e8cca8]" />
                <span>PAN Card Services</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          {currentUser && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate max-w-[120px]">{currentUser.name}</p>
                  <p className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                    <span>{currentUser.role.toUpperCase()}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 p-1 hover:bg-slate-800 rounded transition font-medium"
              >
                Logout
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <a 
              href="https://wa.me/919876543210?text=Hello%20B2B%20Multi%20Service%2C%20I%20need%20assistance" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <IconWhatsApp className="w-4 h-4" />
              WhatsApp Help
            </a>
            <a href="tel:+919876543210" className="flex items-center gap-1 text-slate-300 hover:text-white">
              <IconPhone className="w-3.5 h-3.5" />
              Call Support
            </a>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <IconMenu className="w-6 h-6" />
            </button>

            {/* B2B Portal Branding in Header */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Signed in as</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${
                    currentUser?.role === 'agent' ? 'bg-indigo-600' : 'bg-emerald-500'
                  } animate-pulse`}></span>
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider leading-none">
                    {currentUser?.role === 'agent' ? 'AGENT' : 'CUSTOMER'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side Actions & Wallet */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('track')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-purple-600 text-white border-purple-600 shadow'
                  : 'bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border-slate-300'
              }`}
              title="Track Application Status"
            >
              <IconTrack className="w-4 h-4 text-purple-500" />
              <span>Track Application</span>
            </button>

            <button
              onClick={() => { setActiveTab('wallet'); setWalletPageTab('wallet'); }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow transition cursor-pointer flex items-center gap-1.5"
              title="Open Wallet Balance & Transactions"
            >
              <span>💰</span>
              <span>{walletPoints.toLocaleString('en-IN')} Pts</span>
            </button>
            <button
              onClick={() => { setActiveTab('wallet'); setWalletPageTab('add_points'); setAddPointsSuccess(false); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition"
              title="Open Add Points Recharge"
            >
              + Add Points
            </button>
          </div>
        </header>

        {/* BODY BY TAB */}
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* TAB 1: DASHBOARD (DIFFERENT FOR CUSTOMER vs AGENT vs ADMIN) */}
          {activeTab === "dashboard" && (
            <>
              {/* ── DASHBOARD HEADER ── */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
              </div>

              {/* ── Referral Banner ── */}
              <div className="flex items-center gap-2 bg-amber-400 text-slate-900 rounded-xl px-5 py-2.5 font-bold text-sm shadow-sm">
                <span>🌟</span>
                <span>
                  {currentUser?.role === 'agent'
                    ? 'Refer more clients to earn more commission!'
                    : currentUser?.role === 'admin'
                    ? 'Admin Master Control — All data visible across portal'
                    : 'Refer a friend & get ₹100 cashback on next service!'}
                </span>
              </div>

              {/* ── STAT CARDS GRID (Image-style colored cards) ── */}
              {(() => {
                const pending   = applications.filter(a => a.status === 'Pending').length;
                const objection = applications.filter(a => a.status === 'Action Required').length;
                const inProcess = applications.filter(a => a.status === 'In Process').length;
                const docVerify = applications.filter(a => a.status === 'Document Verification').length;
                const approved  = applications.filter(a => a.status === 'Approved').length;
                const completed = applications.filter(a => a.status === 'Completed').length;
                const total     = applications.length;

                // Cards definition — color, label, count, icon emoji, synced action
                const cards = currentUser?.role === 'admin' ? [
                  { color: 'bg-cyan-500',   label: 'Total Files',              count: total,     icon: '📋', onClick: () => setActiveTab('admin') },
                  { color: 'bg-amber-500',  label: 'Under Objection',          count: objection, icon: '⚠️', onClick: () => openObjectionModal('Super Admin: Files Under Objection', 'Review files requiring client response or clarification notice') },
                  { color: 'bg-blue-600',   label: 'Processing Stage-2',       count: inProcess, icon: '⚙️', onClick: () => openProcessingModal('Processing Stage 2 Status', 'Active government and bank scrutiny verification') },
                  { color: 'bg-red-500',    label: 'Upload Pending',           count: docVerify, icon: '📤', onClick: () => openUploadModal('Upload Pending Client Documents', ['Client Aadhaar & PAN', 'Income & Turnover Proof', 'Bank Statement']) },
                  { color: 'bg-slate-500',  label: 'New Orders',               count: pending,   icon: '🔒', onClick: () => setActiveTab('admin') },
                  { color: 'bg-purple-600', label: 'Tax Payment Pending',      count: 0,         icon: '💰', onClick: () => openPaymentModal('Treasury Tax Challan', '₹2,450') },
                  { color: 'bg-green-600',  label: 'Income Confirm Pending',   count: 0,         icon: '📊', onClick: () => openProcessingModal('AIS / TIS Income Confirmation', 'Comparing bank reported interest & turnover') },
                  { color: 'bg-orange-500', label: 'Additional Payment Pending',count: 0,        icon: '💳', onClick: () => openPaymentModal('Additional Government Challan', '₹500') },
                  { color: 'bg-cyan-600',   label: 'Submit Pending',           count: pending,   icon: '🚀', onClick: () => openProcessingModal('Submission Queue', 'Final e-filing submission queue') },
                  { color: 'bg-green-500',  label: 'Completed',                count: completed + approved, icon: '✅', onClick: () => openDownloadModal('Download Portal File Records', 'Official certificates and acknowledgements') },
                ] : currentUser?.role === 'agent' ? [
                  { color: 'bg-cyan-500',   label: 'New Client Orders',        count: pending,   icon: '📋', onClick: () => handleOpenApply(getActiveService('itr-salaried')) },
                  { color: 'bg-amber-500',  label: 'Under Objection',         count: objection, icon: '⚠️', onClick: () => openObjectionModal('Partner Desk: Client Objection Query', 'Provide corrected document or reply for client lead') },
                  { color: 'bg-blue-600',   label: 'Processing Stage-2',      count: inProcess, icon: '⚙️', onClick: () => openProcessingModal('Client File Processing Tracker', 'Stage 2: Official department verification in progress') },
                  { color: 'bg-red-500',    label: 'Upload Pending',          count: docVerify, icon: '📤', onClick: () => openUploadModal('Upload Pending Client Documents', ['Applicant Photo & ID', 'Bank Statement (1 Yr)', 'RC / Form 16']) },
                  { color: 'bg-slate-500',  label: 'E Verify Pending',        count: 0,         icon: '🔒', onClick: () => openEVerifyModal('Client Aadhaar OTP e-Verification') },
                  { color: 'bg-purple-600', label: 'Commission Pending',      count: 0,         icon: '💰', onClick: () => openPaymentModal('Agent Partner Commission Payout', currentUser?.commissionBalance || '₹18,450') },
                  { color: 'bg-green-600',  label: 'Client Approval Pending', count: 0,         icon: '📊', onClick: () => openProcessingModal('Client Consent Verification', 'Client verification via OTP / WhatsApp confirmation') },
                  { color: 'bg-orange-500', label: 'Additional Pay Pending',  count: 0,         icon: '💳', onClick: () => openPaymentModal('Client Premium / Statutory Balance', '₹450') },
                  { color: 'bg-cyan-600',   label: 'Submit Pending',          count: pending,   icon: '🚀', onClick: () => openProcessingModal('E-Filing Queue Status', 'Files queued for today evening server upload') },
                  { color: 'bg-green-500',  label: 'Completed',               count: completed + approved, icon: '✅', onClick: () => openDownloadModal('Download Issued Client Certificates', 'All approved policy & registration documents') },
                ] : [
                  { color: 'bg-cyan-500',   label: 'New Orders',               count: pending,   icon: '📋', onClick: () => handleOpenApply(getActiveService('itr-salaried')) },
                  { color: 'bg-amber-500',  label: 'Under Objection',         count: objection, icon: '⚠️', onClick: () => openObjectionModal('Department Clarification Required', 'A query has been raised regarding your submitted document') },
                  { color: 'bg-blue-600',   label: 'Processing Stage-2',      count: inProcess, icon: '⚙️', onClick: () => openProcessingModal('Live File Processing Tracker', 'Stage 2: Document Verification & Scrutiny in progress') },
                  { color: 'bg-red-500',    label: 'Upload Pending',          count: docVerify, icon: '📤', onClick: () => openUploadModal('Upload Pending Documents', ['Form 16 / Salary Slips', 'Bank Statement (1 Year)', 'Aadhaar / PAN Copy']) },
                  { color: 'bg-slate-500',  label: 'E Verify Pending',        count: 0,         icon: '🔒', onClick: () => openEVerifyModal('Aadhaar e-Verification / e-Sign') },
                  { color: 'bg-purple-600', label: 'Tax Payment Pending',     count: 0,         icon: '💰', onClick: () => openPaymentModal('Self Assessment Tax Challan', '₹1,490') },
                  { color: 'bg-green-600',  label: 'Income Confirm Pending',  count: 0,         icon: '📊', onClick: () => openProcessingModal('Income & AIS Verification', 'Checking interest, dividend and TDS credits with Form 26AS') },
                  { color: 'bg-orange-500', label: 'Additional Pay Pending',  count: 0,         icon: '💳', onClick: () => openPaymentModal('Additional Service / CA Fee', '₹350') },
                  { color: 'bg-cyan-600',   label: 'Submit Pending',          count: pending,   icon: '🚀', onClick: () => openProcessingModal('Final Submission Stage', 'Application ready for official department allotment') },
                  { color: 'bg-green-500',  label: 'Completed',               count: completed + approved, icon: '✅', onClick: () => openDownloadModal('Download Official Approved Document', 'Download your approved acknowledgement / certificate') },
                ];

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={card.onClick}
                        className={`${card.color} relative overflow-hidden rounded-xl text-white text-left p-4 shadow-md hover:opacity-90 transition-all group cursor-pointer`}
                      >
                        {/* Big faded icon background */}
                        <div className="absolute right-2 bottom-1 text-5xl opacity-20 select-none pointer-events-none">
                          {card.icon}
                        </div>
                        {/* Count */}
                        <div className="text-3xl font-extrabold leading-none mb-1">{card.count}</div>
                        {/* Label */}
                        <div className="text-xs font-semibold leading-tight pr-8">{card.label}</div>
                        {/* More info footer */}
                        <div className="mt-3 pt-2 border-t border-white/25 text-[11px] font-semibold flex items-center gap-1 text-white/90 group-hover:text-white">
                          More info <span>→</span>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* ── ALL SERVICES & INSTANT WALLET APPLY (FOR CUSTOMER & AGENT) ── */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                      Available Portal Services
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">Direct Service Apply & Dynamic Wallet Auto-Cut</h3>
                    <p className="text-xs text-slate-500">
                      Select any service to apply. Required custom fields and wallet point deductions (1 Rupee = 1 Point) apply automatically.
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2">
                    <span>Wallet Balance:</span>
                    <span className="text-emerald-600 font-bold">💰 {walletPoints.toLocaleString('en-IN')} Pts</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {activeServicesList.map((srv) => (
                    <div
                      key={srv.id}
                      className="border border-slate-200 hover:border-blue-400 rounded-xl p-4 flex flex-col justify-between bg-slate-50/40 hover:bg-blue-50/20 transition group shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                            {srv.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            💰 {srv.basePointsCost} Pts {srv.basePointsCost > 0 ? `(₹${srv.basePointsCost})` : '(Free)'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                          {srv.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {srv.tagline}
                        </p>

                        {currentUser?.role === 'agent' && srv.baseAgentCommission > 0 && (
                          <div className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            🎯 Agent Commission: +{srv.baseAgentCommission} Pts
                          </div>
                        )}

                        {srv.customFields && srv.customFields.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {srv.customFields.slice(0, 3).map((f) => (
                              <span key={f.id} className="text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                ✓ {f.label}
                              </span>
                            ))}
                            {srv.customFields.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">+{srv.customFields.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenApply(srv)}
                        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <span>Apply Service</span>
                        <span>→</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ITR */}
          {activeTab === "itr" && (
            <div className="space-y-6">
              {/* ITR HEADER with Wallet & Action */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Income Tax Return (ITR) Portal</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Assessment Year 2026-27 (FY 2025-26) • Max Refund Guarantee</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenApply(getActiveService('itr-salaried'))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition flex items-center gap-1.5"
                  >
                    <IconITR className="w-4 h-4" />
                    + File ITR Return
                  </button>
                </div>
              </div>

              {/* Referral / Info Banner */}
              <div className="flex items-center gap-2 bg-amber-400 text-slate-900 rounded-xl px-5 py-2.5 font-bold text-sm shadow-sm">
                <span>🌟</span>
                <span>Filing for Assessment Year 2026-27 (FY 2025-26) • Guaranteed max refund verified by CAs • Refer more to earn more!</span>
              </div>

              {/* ITR STAT & SERVICE CARDS (Converted into reference image format) */}
              {(() => {
                const itrApps = applications.filter(a => a.serviceCategory === 'itr');
                const cards = [
                  {
                    color: 'bg-cyan-500',
                    label: 'ITR-1 (Sahaj)',
                    sub: 'Salaried & Pensioners (Upto ₹50L)',
                    count: itrApps.filter(a => a.serviceId === 'itr-salaried').length,
                    icon: '📋',
                    actionLabel: 'Select ITR-1 →',
                    serviceId: 'itr-salaried',
                    onClick: () => handleOpenApply(getActiveService('itr-salaried'))
                  },
                  {
                    color: 'bg-amber-500',
                    label: 'ITR-3 & ITR-4 (Sugam)',
                    sub: 'Business & Freelancers (Sec 44AD)',
                    count: itrApps.filter(a => a.serviceId === 'itr-business').length,
                    icon: '💼',
                    actionLabel: 'Select ITR-4 →',
                    serviceId: 'itr-business',
                    onClick: () => handleOpenApply(getActiveService('itr-business'))
                  },
                  {
                    color: 'bg-blue-600',
                    label: 'ITR-U (Updated Return)',
                    sub: 'Missed or Rectified (Up to 4 Yrs)',
                    count: itrApps.filter(a => a.serviceId === 'itr-u').length,
                    icon: '⏱️',
                    actionLabel: 'Select ITR-U →',
                    serviceId: 'itr-u',
                    onClick: () => handleOpenApply(getActiveService('itr-u'))
                  },
                  {
                    color: 'bg-red-500',
                    label: 'Upload Pending',
                    sub: 'Form 16 / Bank Statements',
                    count: itrApps.filter(a => a.status === 'Document Verification').length,
                    icon: '📤',
                    actionLabel: 'Upload Documents →',
                    onClick: () => openUploadModal('Upload ITR Documents', ['Form 16 (Part A & B)', 'Salary Bank Statement (1 Year)', 'Investment Deductions (80C/80D)'])
                  },
                  {
                    color: 'bg-slate-500',
                    label: 'E Verify Pending',
                    sub: 'Aadhaar OTP / NetBanking',
                    count: 0,
                    icon: '🔒',
                    actionLabel: 'e-Verify with OTP →',
                    onClick: () => openEVerifyModal('ITR E-Verification via Aadhaar OTP')
                  },
                  {
                    color: 'bg-purple-600',
                    label: 'Tax Payment Pending',
                    sub: 'Self-Assessment Tax Challan',
                    count: 0,
                    icon: '💰',
                    actionLabel: 'Pay Tax Challan →',
                    onClick: () => openPaymentModal('Income Tax Self-Assessment Challan', '₹1,490')
                  },
                  {
                    color: 'bg-green-600',
                    label: 'Income Confirm Pending',
                    sub: 'AIS / TIS Statement Match',
                    count: 0,
                    icon: '📊',
                    actionLabel: 'Verify AIS Data →',
                    onClick: () => openProcessingModal('AIS / TIS Statement Scrutiny', 'Reconciling bank interest, dividends, and securities transactions with Form 26AS')
                  },
                  {
                    color: 'bg-orange-500',
                    label: 'Additional Payment Pending',
                    sub: 'CA Consultation & Review',
                    count: 0,
                    icon: '💳',
                    actionLabel: 'Pay Fee →',
                    onClick: () => openPaymentModal('CA Assisted Filing Consultation Fee', '₹499')
                  },
                  {
                    color: 'bg-cyan-600',
                    label: 'Submit Pending',
                    sub: 'Income Tax E-filing Queue',
                    count: itrApps.filter(a => a.status === 'Pending').length,
                    icon: '🚀',
                    actionLabel: 'View Queue →',
                    onClick: () => openProcessingModal('ITR CPC E-Filing Queue', 'Stage 3: Submitting return XML to Income Tax Department Server')
                  },
                  {
                    color: 'bg-green-500',
                    label: 'Completed / E-filed',
                    sub: 'ITR-V Acknowledgement Ready',
                    count: itrApps.filter(a => a.status === 'Completed' || a.status === 'Approved').length,
                    icon: '✅',
                    actionLabel: 'Download ITR-V →',
                    onClick: () => openDownloadModal('Download ITR-V Acknowledgement', 'Official Assessment Year 2026-27 ITR-V Receipt Form with Barcode')
                  },
                ];

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={card.onClick}
                        className={`${card.color} relative overflow-hidden rounded-xl text-white text-left p-4 shadow-md hover:opacity-90 transition-all group cursor-pointer`}
                      >
                        {/* Faded watermark icon */}
                        <div className="absolute right-2 bottom-1 text-5xl opacity-20 select-none pointer-events-none">
                          {card.icon}
                        </div>
                        {/* Count */}
                        <div className="text-3xl font-extrabold leading-none mb-1">{card.count}</div>
                        {/* Label */}
                        <div className="text-sm font-bold leading-tight pr-6">{card.label}</div>
                        {/* Subtitle */}
                        <div className="text-[11px] text-white/80 mt-0.5 leading-tight pr-6">{card.sub}</div>
                        {/* Action footer */}
                        <div className="mt-3 pt-2 border-t border-white/25 text-[11px] font-semibold flex items-center justify-between gap-1 text-white/95 group-hover:text-white">
                          <span>{card.actionLabel}</span>
                          {(card as any).serviceId && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); openServiceDetail((card as any).serviceId); }}
                              className="text-[10px] font-bold bg-white/20 hover:bg-white/35 text-white px-1.5 py-0.5 rounded transition whitespace-nowrap flex items-center gap-0.5 cursor-pointer"
                            >
                              ℹ️ Details
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: LOANS & EMI CALC */}
          {activeTab === "loan" && (
            <div className="space-y-6">
              {/* Header with Wallet */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Bank Loans & Financing Desk</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Tied with 40+ Leading Banks & NBFCs • Rates starting 8.4% p.a.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenApply(getActiveService('loan-business'))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition flex items-center gap-1.5"
                  >
                    <IconLoan className="w-4 h-4" />
                    + Apply For Loan
                  </button>
                </div>
              </div>

              {/* Referral / Info Banner */}
              <div className="flex items-center gap-2 bg-amber-400 text-slate-900 rounded-xl px-5 py-2.5 font-bold text-sm shadow-sm">
                <span>🏦</span>
                <span>Business Loan, Instant Personal Loan, Home Loan & LAP • Direct Banker Disbursal • Instant Commission!</span>
              </div>

              {/* LOAN CARDS (Reference Image Format) */}
              {(() => {
                const loanApps = applications.filter(a => a.serviceCategory === 'loan');
                const cards = [
                  {
                    color: 'bg-cyan-500',
                    label: 'Business Loan (MSME)',
                    sub: 'Collateral-free up to ₹50 Lakh',
                    count: loanApps.filter(a => a.serviceId === 'loan-business').length,
                    icon: '🏢',
                    actionLabel: 'Select Business Loan →',
                    serviceId: 'loan-business',
                    onClick: () => handleOpenApply(getActiveService('loan-business'))
                  },
                  {
                    color: 'bg-amber-500',
                    label: 'Instant Personal Loan',
                    sub: 'Salaried individuals up to ₹25 Lakh',
                    count: loanApps.filter(a => a.serviceId === 'loan-personal').length,
                    icon: '💼',
                    actionLabel: 'Select Personal Loan →',
                    serviceId: 'loan-personal',
                    onClick: () => handleOpenApply(getActiveService('loan-personal'))
                  },
                  {
                    color: 'bg-blue-600',
                    label: 'Home Loan & LAP',
                    sub: 'Property mortgage starting 8.4%',
                    count: loanApps.filter(a => a.serviceId === 'loan-home-lap').length,
                    icon: '🏠',
                    actionLabel: 'Select Home/LAP →',
                    serviceId: 'loan-home-lap',
                    onClick: () => handleOpenApply(getActiveService('loan-home-lap'))
                  },
                  {
                    color: 'bg-red-500',
                    label: 'Docs Upload Pending',
                    sub: 'Bank statement & GST/ITR returns',
                    count: loanApps.filter(a => a.status === 'Document Verification').length,
                    icon: '📤',
                    actionLabel: 'Upload Bank Docs →',
                    onClick: () => openUploadModal('Upload Bank Loan Documents', ['12 Months Bank Statement (PDF with password)', 'Latest 2 Years ITR V & Computation', 'Business Registration (Udyam/GST/Shop Act)'])
                  },
                  {
                    color: 'bg-slate-500',
                    label: 'CIBIL / Credit Scoring',
                    sub: 'Credit bureau report check',
                    count: 0,
                    icon: '🔒',
                    actionLabel: 'Check CIBIL Report →',
                    onClick: () => openProcessingModal('Live CIBIL Score Analysis', 'Bureau Score: 780 (Eligible for prime interest rate 8.4%)')
                  },
                  {
                    color: 'bg-purple-600',
                    label: 'Sanction Letter Pending',
                    sub: 'Bank credit sanction approval',
                    count: 0,
                    icon: '📜',
                    actionLabel: 'View Sanction →',
                    onClick: () => openDownloadModal('Bank Sanction Letter (HDFC/ICICI MSME)', 'Approved Loan Amount: ₹15,00,000 with 36 Months EMI Schedule')
                  },
                  {
                    color: 'bg-green-600',
                    label: 'Agreement Signing Pending',
                    sub: 'Loan agreement e-sign',
                    count: 0,
                    icon: '✍️',
                    actionLabel: 'e-Sign Agreement →',
                    onClick: () => openEVerifyModal('Loan Agreement Aadhaar e-Sign')
                  },
                  {
                    color: 'bg-orange-500',
                    label: 'Processing Fee Pending',
                    sub: 'Bank administrative processing',
                    count: 0,
                    icon: '💳',
                    actionLabel: 'Pay Bank Fee →',
                    onClick: () => openPaymentModal('Bank Administrative Processing Fee', '₹1,500')
                  },
                  {
                    color: 'bg-cyan-600',
                    label: 'Disbursal Pending',
                    sub: 'Account NEFT/RTGS transfer',
                    count: loanApps.filter(a => a.status === 'Approved').length,
                    icon: '🚀',
                    actionLabel: 'Track Disbursal →',
                    onClick: () => openProcessingModal('Bank Treasury Disbursal Queue', 'Stage 4: Fund transfer advice sent to RBI RTGS clearing house')
                  },
                  {
                    color: 'bg-green-500',
                    label: 'Loan Disbursed',
                    sub: 'Amount credited to account',
                    count: loanApps.filter(a => a.status === 'Completed').length,
                    icon: '✅',
                    actionLabel: 'Download Advice →',
                    onClick: () => openDownloadModal('Loan Disbursal Advice & Sanction Copy', 'Disbursal Reference No. TXN-HDFC-991204')
                  },
                ];

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={card.onClick}
                        className={`${card.color} relative overflow-hidden rounded-xl text-white text-left p-4 shadow-md hover:opacity-90 transition-all group cursor-pointer`}
                      >
                        <div className="absolute right-2 bottom-1 text-5xl opacity-20 select-none pointer-events-none">{card.icon}</div>
                        <div className="text-3xl font-extrabold leading-none mb-1">{card.count}</div>
                        <div className="text-sm font-bold leading-tight pr-6">{card.label}</div>
                        <div className="text-[11px] text-white/80 mt-0.5 leading-tight pr-6">{card.sub}</div>
                        <div className="mt-3 pt-2 border-t border-white/25 text-[11px] font-semibold flex items-center justify-between gap-1 text-white/95 group-hover:text-white">
                          <span>{card.actionLabel}</span>
                          {(card as any).serviceId && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); openServiceDetail((card as any).serviceId); }}
                              className="text-[10px] font-bold bg-white/20 hover:bg-white/35 text-white px-1.5 py-0.5 rounded transition whitespace-nowrap flex items-center gap-0.5 cursor-pointer"
                            >
                              ℹ️ Details
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Instant Loan EMI Calculator */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <h4 className="font-bold text-base text-slate-900">Instant Loan EMI Calculator</h4>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Loan Amount:</span>
                      <span className="text-indigo-600 font-bold text-sm">₹{Number(loanAmount).toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      type="range"
                      min="50000"
                      max="5000000"
                      step="50000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Tenure:</span>
                      <span className="text-indigo-600 font-bold text-sm">{loanTenure} Years</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      step="1"
                      value={loanTenure}
                      onChange={(e) => setLoanTenure(e.target.value)}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Estimated Monthly Installment</span>
                    <div className="text-3xl font-extrabold text-white mt-1">
                      ₹{emiCalc.toLocaleString('en-IN')}<span className="text-sm font-normal text-indigo-200">/month</span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-300 border-t border-slate-700/80 pt-3">
                      <div className="flex justify-between">
                        <span>Principal:</span>
                        <span className="font-bold text-white">₹{P.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest:</span>
                        <span className="font-bold text-amber-400">₹{totalInterest.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenApply(getActiveService('loan-business'))}
                    className="mt-6 w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    Check Eligibility & Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INSURANCE */}
          {activeTab === "insurance" && (
            <div className="space-y-6">
              {/* Header with Wallet */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">3rd Party & Motor Insurance Desk</h2>
                  <p className="text-xs text-slate-500 mt-0.5">IRDAI Approved Instant Policy Issuance • Save Heavy Traffic Fines</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenApply(getActiveService('insurance-commercial'))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition flex items-center gap-1.5"
                  >
                    <IconInsurance className="w-4 h-4" />
                    + Get Policy Quote
                  </button>
                </div>
              </div>

              {/* Referral / Info Banner */}
              <div className="flex items-center gap-2 bg-amber-400 text-slate-900 rounded-xl px-5 py-2.5 font-bold text-sm shadow-sm">
                <span>🚗</span>
                <span>Commercial Trucks, Private Cars & 2-Wheeler Instant 3rd Party Cover • Avoid ₹2,000 to ₹4,000 traffic challan!</span>
              </div>

              {/* INSURANCE CARDS (Reference Image Format) */}
              {(() => {
                const insApps = applications.filter(a => a.serviceCategory === 'insurance');
                const cards = [
                  {
                    color: 'bg-cyan-500',
                    label: 'Commercial Vehicles TP',
                    sub: 'Truck, Pickup, Tipper, Auto',
                    count: insApps.filter(a => a.serviceId === 'insurance-commercial').length,
                    icon: '🚚',
                    actionLabel: 'Apply Commercial →',
                    serviceId: 'insurance-commercial',
                    onClick: () => handleOpenApply(getActiveService('insurance-commercial'))
                  },
                  {
                    color: 'bg-amber-500',
                    label: 'Private Car Insurance',
                    sub: 'Hatchback, Sedan & SUV',
                    count: insApps.filter(a => a.serviceId === 'insurance-private').length,
                    icon: '🚗',
                    actionLabel: 'Apply Car Policy →',
                    serviceId: 'insurance-private',
                    onClick: () => handleOpenApply(getActiveService('insurance-private'))
                  },
                  {
                    color: 'bg-blue-600',
                    label: '2-Wheeler (Bike / Scooter)',
                    sub: 'Hero, Honda, Bajaj, TVS',
                    count: 0,
                    icon: '🏍️',
                    actionLabel: 'Apply Bike Policy →',
                    onClick: () => handleOpenApply(getActiveService('insurance-private'))
                  },
                  {
                    color: 'bg-red-500',
                    label: 'RC Upload Pending',
                    sub: 'Vehicle RC Copy & Previous Policy',
                    count: insApps.filter(a => a.status === 'Document Verification').length,
                    icon: '📤',
                    actionLabel: 'Upload RC Copy →',
                    onClick: () => openUploadModal('Upload Vehicle RC Documents', ['Vehicle Registration Certificate (RC Front)', 'Vehicle Registration Certificate (RC Back)', 'Previous Insurance Policy Copy'])
                  },
                  {
                    color: 'bg-slate-500',
                    label: 'Vehicle Inspection Pending',
                    sub: 'Self-inspection photo / video',
                    count: 0,
                    icon: '🔍',
                    actionLabel: 'Upload Inspection Photos →',
                    onClick: () => openUploadModal('Upload Self-Inspection Vehicle Photos', ['Vehicle Front with Clear Number Plate', 'Vehicle Odometer Reading Photo', 'Chassis Number Embossing Photo'])
                  },
                  {
                    color: 'bg-purple-600',
                    label: 'Premium Payment Pending',
                    sub: 'Direct insurer payment link',
                    count: 0,
                    icon: '💰',
                    actionLabel: 'Pay Policy Premium →',
                    onClick: () => openPaymentModal('Motor Insurance Premium Payment', '₹3,480')
                  },
                  {
                    color: 'bg-green-600',
                    label: 'Underwriting Review',
                    sub: 'IDV & NCB confirmation',
                    count: 0,
                    icon: '📋',
                    actionLabel: 'Check NCB Status →',
                    onClick: () => openProcessingModal('Insurance Underwriting Scrutiny', 'Verifying No-Claim Bonus (NCB) with IIB national database')
                  },
                  {
                    color: 'bg-orange-500',
                    label: 'Additional Payment Pending',
                    sub: 'Endorsement / Add-on covers',
                    count: 0,
                    icon: '💳',
                    actionLabel: 'Pay Endorsement Fee →',
                    onClick: () => openPaymentModal('Policy Endorsement / Add-On Fee', '₹350')
                  },
                  {
                    color: 'bg-cyan-600',
                    label: 'PDF Delivery Pending',
                    sub: 'Policy certificate issuance',
                    count: insApps.filter(a => a.status === 'Approved').length,
                    icon: '🚀',
                    actionLabel: 'Track Policy Issue →',
                    onClick: () => openProcessingModal('Policy Schedule Issuance Queue', 'IRDAI central database registration complete. Digital signature being attached.')
                  },
                  {
                    color: 'bg-green-500',
                    label: 'Policy Issued / Active',
                    sub: 'Download official policy PDF',
                    count: insApps.filter(a => a.status === 'Completed' || a.status === 'Approved').length,
                    icon: '✅',
                    actionLabel: 'Download Policy PDF →',
                    onClick: () => openDownloadModal('Download Motor Insurance Policy', 'Official Digitally Signed 3rd Party Liability Schedule with Cashless Garage List')
                  },
                ];

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={card.onClick}
                        className={`${card.color} relative overflow-hidden rounded-xl text-white text-left p-4 shadow-md hover:opacity-90 transition-all group cursor-pointer`}
                      >
                        <div className="absolute right-2 bottom-1 text-5xl opacity-20 select-none pointer-events-none">{card.icon}</div>
                        <div className="text-3xl font-extrabold leading-none mb-1">{card.count}</div>
                        <div className="text-sm font-bold leading-tight pr-6">{card.label}</div>
                        <div className="text-[11px] text-white/80 mt-0.5 leading-tight pr-6">{card.sub}</div>
                        <div className="mt-3 pt-2 border-t border-white/25 text-[11px] font-semibold flex items-center justify-between gap-1 text-white/95 group-hover:text-white">
                          <span>{card.actionLabel}</span>
                          {(card as any).serviceId && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); openServiceDetail((card as any).serviceId); }}
                              className="text-[10px] font-bold bg-white/20 hover:bg-white/35 text-white px-1.5 py-0.5 rounded transition whitespace-nowrap flex items-center gap-0.5 cursor-pointer"
                            >
                              ℹ️ Details
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 5: FSSAI FOOD LICENSE */}
          {activeTab === "fssai" && (
            <div className="space-y-6">
              {/* Header with Wallet */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">FSSAI Food License & FoSCoS Desk</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Mandatory 14-Digit Food Registration for Small Eateries, Dhabas & Restaurants</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenApply(getActiveService('fssai-registration'))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition flex items-center gap-1.5"
                  >
                    <IconFSSAI className="w-4 h-4" />
                    + Apply Food License
                  </button>
                </div>
              </div>

              {/* Referral / Info Banner */}
              <div className="flex items-center gap-2 bg-amber-400 text-slate-900 rounded-xl px-5 py-2.5 font-bold text-sm shadow-sm">
                <span>🍽️</span>
                <span>FSSAI Basic Registration (Under ₹12L) & State License (Above ₹12L) • 100% Online Verification on FoSCoS!</span>
              </div>

              {/* FSSAI CARDS (Reference Image Format) */}
              {(() => {
                const fssaiApps = applications.filter(a => a.serviceCategory === 'fssai');
                const cards = [
                  {
                    color: 'bg-cyan-500',
                    label: 'Basic Food Registration',
                    sub: 'Turnover < ₹12 Lakhs/Year (₹799)',
                    count: fssaiApps.filter(a => a.serviceId === 'fssai-registration').length,
                    icon: '🏪',
                    actionLabel: 'Select Basic (₹799) →',
                    serviceId: 'fssai-registration',
                    onClick: () => handleOpenApply(getActiveService('fssai-registration'))
                  },
                  {
                    color: 'bg-amber-500',
                    label: 'State / Central Food License',
                    sub: 'Restaurants & Units > ₹12L (₹1,999)',
                    count: fssaiApps.filter(a => a.serviceId === 'fssai-state-central').length,
                    icon: '🏭',
                    actionLabel: 'Select State (₹1,999) →',
                    serviceId: 'fssai-state-central',
                    onClick: () => handleOpenApply(getActiveService('fssai-state-central'))
                  },
                  {
                    color: 'bg-blue-600',
                    label: 'FoSCoS Dept Processing',
                    sub: 'Food Safety Officer scrutiny',
                    count: fssaiApps.filter(a => a.status === 'In Process').length,
                    icon: '⚙️',
                    actionLabel: 'Track Scrutiny →',
                    onClick: () => openProcessingModal('FoSCoS Scrutiny Status', 'Designated Officer (DO) reviewing shop declaration and hygiene norms')
                  },
                  {
                    color: 'bg-red-500',
                    label: 'Upload Pending',
                    sub: 'Shop photo & Rent/Electricity bill',
                    count: fssaiApps.filter(a => a.status === 'Document Verification').length,
                    icon: '📤',
                    actionLabel: 'Upload Food Docs →',
                    onClick: () => openUploadModal('Upload FSSAI Mandatory Documents', ['Owner Passport Size Photo', 'Aadhaar Card / Voter ID Copy', 'Shop Electricity Bill or Rent Agreement'])
                  },
                  {
                    color: 'bg-slate-500',
                    label: 'Site Inspection Pending',
                    sub: 'Food safety standard audit',
                    count: 0,
                    icon: '🔍',
                    actionLabel: 'View Inspection Status →',
                    onClick: () => openProcessingModal('Premises Inspection Status', 'District Food Safety Inspector premises verification scheduled')
                  },
                  {
                    color: 'bg-purple-600',
                    label: 'Govt Fee Payment Pending',
                    sub: 'Annual treasury challan fee',
                    count: 0,
                    icon: '💰',
                    actionLabel: 'Pay Govt Challan →',
                    onClick: () => openPaymentModal('FSSAI Annual Treasury License Fee', '₹799')
                  },
                  {
                    color: 'bg-green-600',
                    label: 'NOC / Approval Pending',
                    sub: 'Local municipality / gram panchayat',
                    count: 0,
                    icon: '📋',
                    actionLabel: 'Submit Local NOC →',
                    onClick: () => openObjectionModal('Local Authority NOC Clarification', 'Attach Gram Panchayat / Municipal Committee trade NOC or self-declaration')
                  },
                  {
                    color: 'bg-orange-500',
                    label: 'Additional Doc Pending',
                    sub: 'Water test & equipment list',
                    count: 0,
                    icon: '💳',
                    actionLabel: 'Upload Test Report →',
                    onClick: () => openUploadModal('Upload Water Test & Equipment Docs', ['Certified Lab Water Potability Report', 'Food Handling Equipment & Storage List'])
                  },
                  {
                    color: 'bg-cyan-600',
                    label: 'Certificate In Generation',
                    sub: '14-Digit number allocation',
                    count: fssaiApps.filter(a => a.status === 'Approved').length,
                    icon: '🚀',
                    actionLabel: 'Track Number →',
                    onClick: () => openProcessingModal('14-Digit Number Allotment', 'State Designated Officer has approved the file. 14-digit FoSCoS number is being generated.')
                  },
                  {
                    color: 'bg-green-500',
                    label: 'FSSAI License Issued',
                    sub: 'Download official certificate',
                    count: fssaiApps.filter(a => a.status === 'Completed' || a.status === 'Approved').length,
                    icon: '✅',
                    actionLabel: 'Download License →',
                    onClick: () => openDownloadModal('Download FSSAI Food License Certificate', 'Official 14-Digit FoSCoS Registration Certificate with QR Code and Validity')
                  },
                ];

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={card.onClick}
                        className={`${card.color} relative overflow-hidden rounded-xl text-white text-left p-4 shadow-md hover:opacity-90 transition-all group cursor-pointer`}
                      >
                        <div className="absolute right-2 bottom-1 text-5xl opacity-20 select-none pointer-events-none">{card.icon}</div>
                        <div className="text-3xl font-extrabold leading-none mb-1">{card.count}</div>
                        <div className="text-sm font-bold leading-tight pr-6">{card.label}</div>
                        <div className="text-[11px] text-white/80 mt-0.5 leading-tight pr-6">{card.sub}</div>
                        <div className="mt-3 pt-2 border-t border-white/25 text-[11px] font-semibold flex items-center justify-between gap-1 text-white/95 group-hover:text-white">
                          <span>{card.actionLabel}</span>
                          {(card as any).serviceId && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); openServiceDetail((card as any).serviceId); }}
                              className="text-[10px] font-bold bg-white/20 hover:bg-white/35 text-white px-1.5 py-0.5 rounded transition whitespace-nowrap flex items-center gap-0.5 cursor-pointer"
                            >
                              ℹ️ Details
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 6: GST REGISTRATION */}
          {activeTab === "gst" && (
            <div className="space-y-6">
              {/* Header with Wallet */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">GST Registration & Compliance Desk</h2>
                  <p className="text-xs text-slate-500 mt-0.5">New 15-Digit GSTIN Allotment & GSTR-1 / 3B Monthly Return Filing</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenApply(getActiveService('gst-services'))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition flex items-center gap-1.5"
                  >
                    <IconGST className="w-4 h-4" />
                    + Apply GST Registration
                  </button>
                </div>
              </div>

              {/* Referral / Info Banner */}
              <div className="flex items-center gap-2 bg-amber-400 text-slate-900 rounded-xl px-5 py-2.5 font-bold text-sm shadow-sm">
                <span>🧾</span>
                <span>GST Registration (Proprietorship, Partnership & Pvt Ltd) • Zero Govt Fee • Guaranteed Fast ARN Allotment!</span>
              </div>

              {/* GST STAT & SERVICE CARDS (Reference Image Format) */}
              {(() => {
                const gstApps = applications.filter(a => a.serviceCategory === 'gst');
                const cards = [
                  {
                    color: 'bg-cyan-500',
                    label: 'New GST Registration',
                    sub: 'Proprietorship / Firm (₹999)',
                    count: gstApps.filter(a => a.status === 'Pending').length,
                    icon: '📄',
                    actionLabel: 'Apply GST Reg →',
                    serviceId: 'gst-services',
                    onClick: () => handleOpenApply(getActiveService('gst-services'))
                  },
                  {
                    color: 'bg-amber-500',
                    label: 'Clarification Needed (REG-03)',
                    sub: 'Officer query on premises/business',
                    count: gstApps.filter(a => a.status === 'Action Required').length,
                    icon: '⚠️',
                    actionLabel: 'Submit Clarification →',
                    onClick: () => openObjectionModal('GST Clarification Notice (REG-03)', 'Clarification requested regarding principal place of business electricity bill')
                  },
                  {
                    color: 'bg-blue-600',
                    label: 'Tax Dept Verification',
                    sub: 'Jurisdictional officer review',
                    count: gstApps.filter(a => a.status === 'In Process').length,
                    icon: '⚙️',
                    actionLabel: 'Track Review →',
                    onClick: () => openProcessingModal('GST Officer Verification', 'Jurisdictional state tax officer reviewing Form REG-01 details')
                  },
                  {
                    color: 'bg-red-500',
                    label: 'Rent/NOC Upload Pending',
                    sub: 'Rent deed & electricity bill',
                    count: gstApps.filter(a => a.status === 'Document Verification').length,
                    icon: '📤',
                    actionLabel: 'Upload Rent Docs →',
                    onClick: () => openUploadModal('Upload Business Premises Proof', ['Rent Agreement / Lease Deed', 'Electricity Bill (not older than 2 months)', 'Landlord NOC Certificate'])
                  },
                  {
                    color: 'bg-slate-500',
                    label: 'Aadhaar Auth Pending',
                    sub: 'Signatory biometric authentication',
                    count: 0,
                    icon: '🔒',
                    actionLabel: 'e-Sign Auth →',
                    onClick: () => openEVerifyModal('GST Primary Authorized Signatory Aadhaar e-KYC')
                  },
                  {
                    color: 'bg-purple-600',
                    label: 'ARN Generated',
                    sub: 'Official application reference',
                    count: 0,
                    icon: '🔢',
                    actionLabel: 'Download ARN →',
                    onClick: () => openDownloadModal('Download GST ARN Acknowledgement', 'Application Reference Number: AA031126001928K with Barcode')
                  },
                  {
                    color: 'bg-green-600',
                    label: 'Field Visit / Approval',
                    sub: 'Site inspection verification status',
                    count: 0,
                    icon: '🏢',
                    actionLabel: 'Check Visit Status →',
                    onClick: () => openProcessingModal('Physical Verification Status', 'Physical site visit waived on successful biometric Aadhaar KYC')
                  },
                  {
                    color: 'bg-orange-500',
                    label: 'Late Fee / Challan',
                    sub: 'GST PMT-06 challan payment',
                    count: 0,
                    icon: '💳',
                    actionLabel: 'Pay PMT-06 →',
                    onClick: () => openPaymentModal('GST PMT-06 Tax Challan Payment', '₹500')
                  },
                  {
                    color: 'bg-cyan-600',
                    label: 'GSTIN Allotment Pending',
                    sub: '15-Digit GST number generation',
                    count: gstApps.filter(a => a.status === 'Approved').length,
                    icon: '🚀',
                    actionLabel: 'Track Allotment →',
                    onClick: () => openProcessingModal('15-Digit GSTIN Allotment', 'State Tax Officer final sign-off and GSTIN generation in progress')
                  },
                  {
                    color: 'bg-green-500',
                    label: 'GST Registered',
                    sub: 'Download Form REG-06 Certificate',
                    count: gstApps.filter(a => a.status === 'Completed' || a.status === 'Approved').length,
                    icon: '✅',
                    actionLabel: 'Download Certificate →',
                    onClick: () => openDownloadModal('Download GST Certificate (Form REG-06)', 'Official 15-Digit GST Registration Certificate with Annexure A & B')
                  },
                ];

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={card.onClick}
                        className={`${card.color} relative overflow-hidden rounded-xl text-white text-left p-4 shadow-md hover:opacity-90 transition-all group cursor-pointer`}
                      >
                        <div className="absolute right-2 bottom-1 text-5xl opacity-20 select-none pointer-events-none">{card.icon}</div>
                        <div className="text-3xl font-extrabold leading-none mb-1">{card.count}</div>
                        <div className="text-sm font-bold leading-tight pr-6">{card.label}</div>
                        <div className="text-[11px] text-white/80 mt-0.5 leading-tight pr-6">{card.sub}</div>
                        <div className="mt-3 pt-2 border-t border-white/25 text-[11px] font-semibold flex items-center justify-between gap-1 text-white/95 group-hover:text-white">
                          <span>{card.actionLabel}</span>
                          {(card as any).serviceId && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); openServiceDetail((card as any).serviceId); }}
                              className="text-[10px] font-bold bg-white/20 hover:bg-white/35 text-white px-1.5 py-0.5 rounded transition whitespace-nowrap flex items-center gap-0.5 cursor-pointer"
                            >
                              ℹ️ Details
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 7: MSME UDYAM DESK */}
          {activeTab === "msme" && (
            <div className="space-y-6">
              {/* Header with Wallet */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">MSME Udyam Registration Desk</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Ministry of MSME Govt. 19-Digit Certificate • Subsidies & Collateral-Free Loans</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenApply(getActiveService('msme-udyam'))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition flex items-center gap-1.5"
                  >
                    <IconMSME className="w-4 h-4" />
                    + Apply MSME Udyam
                  </button>
                </div>
              </div>

              {/* Referral / Info Banner */}
              <div className="flex items-center gap-2 bg-amber-400 text-slate-900 rounded-xl px-5 py-2.5 font-bold text-sm shadow-sm">
                <span>🏭</span>
                <span>Govt. MSME Udyam Registration (Micro, Small & Medium) • Priority Bank Credit • 50% Trademark Discount • Zero Govt Fee!</span>
              </div>

              {/* MSME STAT & SERVICE CARDS */}
              {(() => {
                const msmeApps = applications.filter(a => a.serviceCategory === 'msme');
                const cards = [
                  {
                    color: 'bg-cyan-500',
                    label: 'New Udyam Registration',
                    sub: 'Micro, Small & Medium (₹499)',
                    count: msmeApps.filter(a => a.status === 'Pending').length,
                    icon: '🏭',
                    actionLabel: 'Apply Udyam →',
                    serviceId: 'msme-udyam',
                    onClick: () => handleOpenApply(getActiveService('msme-udyam'))
                  },
                  {
                    color: 'bg-amber-500',
                    label: 'Udyog Aadhaar Migration',
                    sub: 'Upgrade old UAM to new Udyam',
                    count: 0,
                    icon: '🔄',
                    actionLabel: 'Migrate to Udyam →',
                    serviceId: 'msme-udyam',
                    onClick: () => handleOpenApply(getActiveService('msme-udyam'))
                  },
                  {
                    color: 'bg-blue-600',
                    label: 'Aadhaar OTP e-KYC',
                    sub: 'Proprietor/Partner mobile OTP',
                    count: 0,
                    icon: '🔒',
                    actionLabel: 'Verify e-KYC →',
                    onClick: () => openEVerifyModal('MSME Udyam Signatory Aadhaar e-KYC')
                  },
                  {
                    color: 'bg-red-500',
                    label: 'Plant & Machinery Proof',
                    sub: 'CA statement or self-declaration',
                    count: msmeApps.filter(a => a.status === 'Document Verification').length,
                    icon: '📤',
                    actionLabel: 'Upload Proof →',
                    onClick: () => openUploadModal('Upload MSME Enterprise Proof', ['Aadhaar Card of Applicant', 'PAN Card of Enterprise', 'Cancelled Bank Cheque Copy'])
                  },
                  {
                    color: 'bg-slate-500',
                    label: 'Ministry Scrutiny',
                    sub: 'CBDT & GSTN database check',
                    count: msmeApps.filter(a => a.status === 'In Process').length,
                    icon: '⚙️',
                    actionLabel: 'Track Scrutiny →',
                    onClick: () => openProcessingModal('Ministry of MSME Scrutiny', 'Direct verification of PAN, GSTIN & investment figures with CBDT')
                  },
                  {
                    color: 'bg-purple-600',
                    label: 'NIC Code Classification',
                    sub: '5-Digit Manufacturing / Service Code',
                    count: 0,
                    icon: '🔢',
                    actionLabel: 'Verify NIC Code →',
                    onClick: () => openProcessingModal('National Industrial Classification (NIC)', 'Allotting 5-digit NIC 2008 code for enterprise primary business activity')
                  },
                  {
                    color: 'bg-green-600',
                    label: 'Subsidies & Concessions',
                    sub: '50% patent discount & CGTMSE',
                    count: 0,
                    icon: '🎁',
                    actionLabel: 'Check Subsidies →',
                    onClick: () => openProcessingModal('MSME Government Subsidies', 'Eligible for: CGTMSE Collateral-Free Loans, 50% Trademark Discount, Public Procurement Exemption')
                  },
                  {
                    color: 'bg-orange-500',
                    label: 'Priority Sector Loan',
                    sub: 'Mudra & CGTMSE up to ₹2 Crore',
                    count: 0,
                    icon: '🏦',
                    actionLabel: 'Apply MSME Loan →',
                    onClick: () => setActiveTab('loan')
                  },
                  {
                    color: 'bg-cyan-600',
                    label: 'Udyam Number Allotment',
                    sub: 'UDYAM-PB-00-1234567 format',
                    count: msmeApps.filter(a => a.status === 'Approved').length,
                    icon: '🚀',
                    actionLabel: 'Track Number →',
                    onClick: () => openProcessingModal('19-Digit Udyam Number Allotment', 'Ministry of MSME digital signature attached. Certificate ready for instant download.')
                  },
                  {
                    color: 'bg-green-500',
                    label: 'Certificate Issued',
                    sub: 'Official Certificate with QR Code',
                    count: msmeApps.filter(a => a.status === 'Completed' || a.status === 'Approved').length,
                    icon: '✅',
                    actionLabel: 'Download Certificate →',
                    onClick: () => openDownloadModal('Download MSME Udyam Certificate', 'Official Government of India Udyam Registration Certificate with dynamic QR Code and Enterprise Details')
                  },
                ];

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={card.onClick}
                        className={`${card.color} relative overflow-hidden rounded-xl text-white text-left p-4 shadow-md hover:opacity-90 transition-all group cursor-pointer`}
                      >
                        <div className="absolute right-2 bottom-1 text-5xl opacity-20 select-none pointer-events-none">{card.icon}</div>
                        <div className="text-3xl font-extrabold leading-none mb-1">{card.count}</div>
                        <div className="text-sm font-bold leading-tight pr-6">{card.label}</div>
                        <div className="text-[11px] text-white/80 mt-0.5 leading-tight pr-6">{card.sub}</div>
                        <div className="mt-3 pt-2 border-t border-white/25 text-[11px] font-semibold flex items-center justify-between gap-1 text-white/95 group-hover:text-white">
                          <span>{card.actionLabel}</span>
                          {(card as any).serviceId && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); openServiceDetail((card as any).serviceId); }}
                              className="text-[10px] font-bold bg-white/20 hover:bg-white/35 text-white px-1.5 py-0.5 rounded transition whitespace-nowrap flex items-center gap-0.5 cursor-pointer"
                            >
                              ℹ️ Details
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 8: PAN CARD */}
          {activeTab === "pan" && (
            <div className="space-y-6">
              {/* Header with Wallet */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">PAN Card Services Portal</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Instant e-PAN Issuance & Physical PVC Card Delivery • Authorized Tax Service</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenApply(getActiveService('pan-dsc'))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition flex items-center gap-1.5"
                  >
                    <IconPAN className="w-4 h-4" />
                    + Apply PAN Card
                  </button>
                </div>
              </div>

              {/* Referral / Info Banner */}
              <div className="flex items-center gap-2 bg-amber-400 text-slate-900 rounded-xl px-5 py-2.5 font-bold text-sm shadow-sm">
                <span>🪪</span>
                <span>Instant Paperless e-PAN Generation & Physical PVC Card Doorstep Delivery • Hassle-Free 100% Online Approval!</span>
              </div>

              {/* PAN CARD METRIC & SERVICE CARDS (Reference Image Format) */}
              {(() => {
                const panApps = applications.filter(a => a.serviceCategory === 'pan');
                const cards = [
                  {
                    color: 'bg-cyan-500',
                    label: 'New PAN Card (e-KYC)',
                    sub: 'Paperless Aadhaar OTP (₹199)',
                    count: panApps.filter(a => a.status === 'Pending').length,
                    icon: '🪪',
                    actionLabel: 'Apply New PAN →',
                    serviceId: 'pan-dsc',
                    onClick: () => handleOpenApply(getActiveService('pan-dsc'))
                  },
                  {
                    color: 'bg-amber-500',
                    label: 'PAN Correction / Update',
                    sub: 'Name, DOB, Photo, Address change',
                    count: panApps.filter(a => a.status === 'Action Required').length,
                    icon: '✏️',
                    actionLabel: 'Apply Correction →',
                    onClick: () => handleOpenApply(getActiveService('pan-dsc'))
                  },
                  {
                    color: 'bg-red-500',
                    label: 'Photo/Sign Upload Pending',
                    sub: 'Passport photo & signature image',
                    count: panApps.filter(a => a.status === 'Document Verification').length,
                    icon: '📤',
                    actionLabel: 'Upload Photo & Sign →',
                    onClick: () => openUploadModal('Upload Photo & Signature for PAN', ['Passport Size Color Photo', 'Clear Signature on White Paper', 'Aadhaar Card Copy'])
                  },
                  {
                    color: 'bg-blue-600',
                    label: 'Under Processing',
                    sub: 'NSDL / Income Tax verification',
                    count: panApps.filter(a => a.status === 'In Process').length,
                    icon: '⚙️',
                    actionLabel: 'Track NSDL Status →',
                    onClick: () => openProcessingModal('NSDL & Income Tax Database Scrutiny', 'Aadhaar demographic matching and duplicate PAN check in progress')
                  },
                  {
                    color: 'bg-purple-600',
                    label: 'Dispatched by India Post',
                    sub: 'Speed Post tracking number allotted',
                    count: panApps.filter(a => a.status === 'Approved').length,
                    icon: '🚚',
                    actionLabel: 'Track SpeedPost →',
                    onClick: () => openDispatchModal('India Post SpeedPost Tracking', 'EM918237461IN')
                  },
                  {
                    color: 'bg-green-500',
                    label: 'Download PDF & Check Email ID',
                    sub: 'Official e-PAN ready / Check registered email',
                    count: panApps.filter(a => a.status === 'Completed' || a.status === 'Approved').length,
                    icon: '✅',
                    actionLabel: 'Download e-PAN PDF →',
                    onClick: () => openDownloadModal('Download Official e-PAN PDF', 'Income Tax Department Digitally Signed e-PAN Card with QR code')
                  },
                ];

                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {cards.map((card, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={card.onClick}
                        className={`${card.color} relative overflow-hidden rounded-xl text-white text-left p-4 shadow-md hover:opacity-90 transition-all group cursor-pointer`}
                      >
                        <div className="absolute right-2 bottom-1 text-5xl opacity-20 select-none pointer-events-none">{card.icon}</div>
                        <div className="text-3xl font-extrabold leading-none mb-1">{card.count}</div>
                        <div className="text-sm font-bold leading-tight pr-6">{card.label}</div>
                        <div className="text-[11px] text-white/80 mt-0.5 leading-tight pr-6">{card.sub}</div>
                        <div className="mt-3 pt-2 border-t border-white/25 text-[11px] font-semibold flex items-center justify-between gap-1 text-white/95 group-hover:text-white">
                          <span>{card.actionLabel}</span>
                          {(card as any).serviceId && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); openServiceDetail((card as any).serviceId); }}
                              className="text-[10px] font-bold bg-white/20 hover:bg-white/35 text-white px-1.5 py-0.5 rounded transition whitespace-nowrap flex items-center gap-0.5 cursor-pointer"
                            >
                              ℹ️ Details
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: WALLET & POINTS DEDICATED PAGE */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wallet & Points Hub</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    1 Rupee = 1 Point (1:1 Ratio) • Instant Auto-Cut & Partner Commission Distribution
                  </p>
                </div>

                {/* 2 Dedicated Tabs: Wallet vs Add Points */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setWalletPageTab('wallet')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      walletPageTab === 'wallet'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>💰</span>
                    <span>Wallet & Balance</span>
                  </button>
                  <button
                    onClick={() => { setWalletPageTab('add_points'); setAddPointsSuccess(false); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      walletPageTab === 'add_points'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>➕</span>
                    <span>Add Points</span>
                  </button>
                </div>
              </div>

              {/* ── SUB-TAB 1: WALLET & TRANSACTIONS ── */}
              {walletPageTab === 'wallet' && (
                <div className="space-y-6">
                  {/* Hero Balance Card */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-900 text-white p-6 md:p-8 shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-emerald-100">
                          <span>💎</span>
                          <span>
                            {currentUser?.role === 'agent'
                              ? `Agent Commission Wallet (${currentUser.agentCode || 'AG-PB-104'})`
                              : currentUser?.role === 'admin'
                              ? 'Super Admin Treasury'
                              : 'Customer Prepaid Balance'}
                          </span>
                        </div>
                        <div className="text-4xl md:text-5xl font-black tracking-tight">
                          {walletPoints.toLocaleString('en-IN')} <span className="text-2xl font-bold opacity-80">Points</span>
                        </div>
                        <div className="text-sm md:text-base font-semibold text-emerald-100 flex items-center gap-2">
                          <span>Guaranteed Value: ₹{walletPoints.toLocaleString('en-IN')}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/40 font-mono">1 Pt = ₹1</span>
                        </div>
                        <p className="text-xs text-emerald-200/90 pt-1">
                          Account: <strong>{currentUser?.name}</strong> • Direct auto-debit on service submission
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                        <button
                          onClick={() => { setWalletPageTab('add_points'); setAddPointsSuccess(false); }}
                          className="px-6 py-3 bg-white hover:bg-slate-50 text-emerald-800 rounded-xl font-bold text-sm shadow-md transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          <span>➕</span>
                          <span>Add Points to Wallet</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('itr')}
                          className="px-6 py-3 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-sm backdrop-blur-md transition flex items-center justify-center gap-2 border border-white/20"
                        >
                          <span>⚡</span>
                          <span>Apply Services</span>
                        </button>
                      </div>
                    </div>

                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  </div>

                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                        💳
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">Total Top-Ups</div>
                        <div className="text-lg font-bold text-slate-900 mt-0.5">
                          +{walletTxs.filter(t => t.type === 'CREDIT_TOPUP').reduce((a, b) => a + b.points, 0).toLocaleString('en-IN')} Pts
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
                        🎯
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">Auto-Commission Earned</div>
                        <div className="text-lg font-bold text-purple-700 mt-0.5">
                          +{walletTxs.filter(t => t.type === 'CREDIT_COMMISSION').reduce((a, b) => a + b.points, 0).toLocaleString('en-IN')} Pts
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
                        ⚡
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">Service Auto-Debited</div>
                        <div className="text-lg font-bold text-rose-600 mt-0.5">
                          -{walletTxs.filter(t => t.type === 'DEBIT_SERVICE').reduce((a, b) => a + b.points, 0).toLocaleString('en-IN')} Pts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transactions Passbook / Ledger */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Wallet Transactions & Passbook</h3>
                        <p className="text-xs text-slate-500">Complete statement of wallet points, recharge history & auto-commissions</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                        <button
                          onClick={() => { setTxFilter('all'); setWalletPassbookPage(1); }}
                          className={`px-3 py-1 rounded-md transition ${txFilter === 'all' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'}`}
                        >
                          All ({walletTxs.length})
                        </button>
                        <button
                          onClick={() => { setTxFilter('credit'); setWalletPassbookPage(1); }}
                          className={`px-3 py-1 rounded-md transition ${txFilter === 'credit' ? 'bg-white shadow text-emerald-700 font-bold' : 'text-slate-600'}`}
                        >
                          Credits (+)
                        </button>
                        <button
                          onClick={() => { setTxFilter('debit'); setWalletPassbookPage(1); }}
                          className={`px-3 py-1 rounded-md transition ${txFilter === 'debit' ? 'bg-white shadow text-rose-700 font-bold' : 'text-slate-600'}`}
                        >
                          Debits (-)
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100" style={{ fontSize: '0.85rem' }}>
                      {paginatedWalletTxs.length === 0 ? (
                        <div className="p-10 text-center text-slate-400" style={{ fontSize: '0.85rem' }}>
                          No transactions found under this filter.
                        </div>
                      ) : (
                        paginatedWalletTxs.map((tx) => (
                          <div key={tx.id} className="py-2.5 px-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-3 text-[0.85rem]" style={{ fontSize: '0.85rem' }}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                                tx.type === 'CREDIT_COMMISSION'
                                  ? 'bg-purple-100 text-purple-700'
                                  : tx.type === 'CREDIT_TOPUP'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {tx.type === 'CREDIT_COMMISSION' ? '🎯' : tx.type === 'CREDIT_TOPUP' ? '💳' : '⚡'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate leading-snug" style={{ fontSize: '0.85rem' }}>
                                  {tx.description}
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-[0.75rem] mt-0.5">
                                  <span>{tx.date} • {tx.time}</span>
                                  {tx.trackingNumber && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-blue-600 font-semibold">{tx.trackingNumber}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className={`font-extrabold leading-tight ${
                                tx.type.startsWith('CREDIT') ? 'text-emerald-600' : 'text-rose-600'
                              }`} style={{ fontSize: '0.85rem' }}>
                                {tx.type.startsWith('CREDIT') ? '+' : '-'}{tx.points.toLocaleString('en-IN')} Pts
                              </div>
                              <div className="text-slate-400 text-[0.75rem]">
                                ₹{tx.amountRupees.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pagination Bar: 50 records per page, 1, 2, 3... tabs, Prev/Next */}
                    {renderPaginationBar(walletPassbookPage, totalWalletPages, setWalletPassbookPage, filteredWalletTxs.length)}
                  </div>
                </div>
              )}

              {/* ── SUB-TAB 2: ADD POINTS & TRANSACTIONS ── */}
              {walletPageTab === 'add_points' && (
                <div className="space-y-6">
                  {/* Recharge Container Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Recharge Wallet Points</h3>
                        <p className="text-xs text-slate-500 mt-0.5">1 Rupee = 1 Point Guaranteed. Usable immediately across all portal services.</p>
                      </div>
                      <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <span>Current Balance:</span>
                        <span className="text-base font-extrabold text-emerald-700">{walletPoints.toLocaleString('en-IN')} Pts</span>
                      </div>
                    </div>

                    {/* Quick Select Presets */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">Select Top-Up Amount (₹1 = 1 Point):</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {[500, 1000, 2000, 5000, 10000, 25000].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setAddPointsAmount(String(amt))}
                            className={`py-3 px-2 rounded-xl text-xs font-bold border transition text-center ${
                              addPointsAmount === String(amt)
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            <div className="font-extrabold text-sm">{amt.toLocaleString('en-IN')} Pts</div>
                            <div className={`text-[10px] ${addPointsAmount === String(amt) ? 'text-blue-100' : 'text-slate-500'}`}>₹{amt.toLocaleString('en-IN')}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Input & Method */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Custom Amount (Rupees / Points):</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                          <input
                            type="number"
                            min="1"
                            value={addPointsAmount}
                            onChange={(e) => setAddPointsAmount(e.target.value)}
                            placeholder="Enter amount (e.g. 1500)"
                            className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">You will receive: <strong>{Number(addPointsAmount) > 0 ? Number(addPointsAmount).toLocaleString('en-IN') : 0} Points</strong></p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method:</label>
                        <select
                          value={addPointsMethod}
                          onChange={(e) => setAddPointsMethod(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option>UPI (Google Pay / PhonePe / Paytm / BHIM)</option>
                          <option>Net Banking (HDFC, SBI, ICICI, Axis, PNB)</option>
                          <option>Debit / Credit Card (Visa / MasterCard / RuPay)</option>
                          <option>Instant Partner Wallet Transfer</option>
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">Instant automatic activation upon payment confirmation</p>
                      </div>
                    </div>

                    {/* UPI QR & Payment Action */}
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white border border-blue-200 rounded-xl p-2 flex items-center justify-center shadow-xs shrink-0">
                          <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center font-mono text-[10px] text-slate-500 font-bold text-center">
                            [QR CODE]
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-extrabold text-blue-900 block">UPI Instant QR & VPA</span>
                          <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-2.5 py-1 rounded border border-blue-200 inline-block">
                            tandaenterprises@icici
                          </span>
                          <p className="text-[11px] text-slate-500">Scan via any UPI app for instant top-up confirmation</p>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto">
                        <button
                          onClick={() => {
                            if (!currentUser) { showToast('Please login first'); return; }
                            const pts = parseInt(addPointsAmount) || 0;
                            if (pts <= 0) { showToast('Please enter a valid amount'); return; }
                            addPointsToWallet(currentUser, pts, addPointsMethod);
                            refreshWallet(currentUser);
                            setAddPointsSuccess(true);
                            showToast(`Success! ${pts.toLocaleString('en-IN')} Points added to your wallet!`);
                          }}
                          className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          <span>💳</span>
                          <span>Add {Number(addPointsAmount) > 0 ? Number(addPointsAmount).toLocaleString('en-IN') : 0} Points Now</span>
                        </button>
                      </div>
                    </div>

                    {addPointsSuccess && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 text-emerald-800 font-bold">
                          <span className="text-base">✅</span>
                          <span>Recharge Successful! {Number(addPointsAmount).toLocaleString('en-IN')} Points added to your account.</span>
                        </div>
                        <button
                          onClick={() => setWalletPageTab('wallet')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                        >
                          View Passbook →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Transactions History on Add Points Tab with 50 per page & 0.85rem font */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Wallet Transactions Statement</h3>
                        <p className="text-xs text-slate-500">Statement of your point recharges, auto-debited files & commissions</p>
                      </div>
                      <button
                        onClick={() => setWalletPageTab('wallet')}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        View Full Filterable Passbook →
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100" style={{ fontSize: '0.85rem' }}>
                      {paginatedAddPointsTxs.length === 0 ? (
                        <div className="p-10 text-center text-slate-400" style={{ fontSize: '0.85rem' }}>
                          No transactions found.
                        </div>
                      ) : (
                        paginatedAddPointsTxs.map((tx) => (
                          <div key={tx.id} className="py-2.5 px-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-3 text-[0.85rem]" style={{ fontSize: '0.85rem' }}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                                tx.type === 'CREDIT_COMMISSION'
                                  ? 'bg-purple-100 text-purple-700'
                                  : tx.type === 'CREDIT_TOPUP'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {tx.type === 'CREDIT_COMMISSION' ? '🎯' : tx.type === 'CREDIT_TOPUP' ? '💳' : '⚡'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate leading-snug" style={{ fontSize: '0.85rem' }}>
                                  {tx.description}
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-[0.75rem] mt-0.5">
                                  <span>{tx.date} • {tx.time}</span>
                                  {tx.trackingNumber && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-blue-600 font-semibold">{tx.trackingNumber}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className={`font-extrabold leading-tight ${
                                tx.type.startsWith('CREDIT') ? 'text-emerald-600' : 'text-rose-600'
                              }`} style={{ fontSize: '0.85rem' }}>
                                {tx.type.startsWith('CREDIT') ? '+' : '-'}{tx.points.toLocaleString('en-IN')} Pts
                              </div>
                              <div className="text-slate-400 text-[0.75rem]">
                                ₹{tx.amountRupees.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pagination Bar: 50 records per page, 1, 2, 3... tabs, Prev/Next */}
                    {renderPaginationBar(addPointsTxPage, totalAddPointsPages, setAddPointsTxPage, walletTxs.length)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: TRACK MY FILE */}
          {activeTab === "track" && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                  <IconTrack className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Track Your Application Live</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Enter your unique Tracking ID (e.g. TRK-ITR-99812 or TRK-INS-33214).
                </p>

                <form onSubmit={handleSearchTracking} className="mt-6 flex gap-2 max-w-lg mx-auto">
                  <input
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="Enter Tracking ID (e.g. TRK-ITR-99812) or Phone"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                  >
                    <IconSearch className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </form>

                {trackNotFound && (
                  <div className="mt-4 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-200">
                    No application found matching &quot;{trackQuery}&quot; under your current account.
                  </div>
                )}
              </div>

              {searchedApp && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-purple-600 uppercase bg-purple-50 px-2 py-0.5 rounded">
                        {searchedApp.serviceCategory.toUpperCase()} Service
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 mt-1">{searchedApp.serviceTitle}</h4>
                      <p className="text-xs text-slate-500">Tracking: <span className="font-mono font-bold text-slate-800">{searchedApp.trackingNumber}</span></p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-800">
                      {searchedApp.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Applicant:</span>
                      <strong className="text-slate-800">{searchedApp.applicantName} ({searchedApp.applicantPhone})</strong>
                    </div>
                    {searchedApp.remarks && (
                      <div className="pt-2 border-t border-slate-200 text-indigo-700">
                        <span>Latest Update: </span>
                        <strong>{searchedApp.remarks}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: SUPER ADMIN PANEL (ADMIN ONLY) */}
          {activeTab === "admin" && currentUser?.role === 'admin' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded">
                    Admin Central
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">B2B Management & Operations Panel</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage client files, update statuses, or configure dynamic portal services, required custom fields & wallet pricing rules.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdminSubTab('applications')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      adminSubTab === 'applications'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    📋 Client Applications ({applications.length})
                  </button>
                  <button
                    onClick={() => setAdminSubTab('services')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      adminSubTab === 'services'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ⚙️ Services & Dynamic Pricing ({activeServicesList.length})
                  </button>
                </div>
              </div>

              {adminSubTab === 'applications' ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-3">Tracking ID</th>
                          <th className="py-3 px-3">Service</th>
                          <th className="py-3 px-3">User & Contact</th>
                          <th className="py-3 px-3">Creator Role</th>
                          <th className="py-3 px-3">Points Paid</th>
                          <th className="py-3 px-3">Current Status</th>
                          <th className="py-3 px-3 text-right">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {applications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-3 font-mono font-bold text-blue-600">
                              {app.trackingNumber}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-900">
                              {app.serviceTitle}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-800">{app.applicantName}</div>
                              <div className="text-[11px] text-slate-500">{app.applicantPhone}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                app.userRole === 'agent' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {app.userRole}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-emerald-600">
                              {app.pointsPaid ? `${app.pointsPaid} Pts` : (app.amount || '-')}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-800">{app.status}</span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <select
                                value={app.status}
                                onChange={(e) => handleAdminStatusChange(app.id, e.target.value as any)}
                                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Document Verification">Document Verification</option>
                                <option value="In Process">In Process</option>
                                <option value="Approved">Approved</option>
                                <option value="Completed">Completed</option>
                                <option value="Action Required">Action Required</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* SERVICES & DYNAMIC PRICING CONFIGURATOR */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Portal Services & Dynamic Field Rules</h4>
                      <p className="text-xs text-slate-500">
                        Admin can configure required inputs (turnover, assessment year, business name), wallet point auto-cut deductions, and agent commission payouts.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingService(null);
                        setAdminServiceForm({
                          id: `service-${Date.now().toString().slice(-4)}`,
                          title: '',
                          category: 'itr',
                          tagline: '',
                          basePointsCost: 499,
                          baseAgentCommission: 100,
                          customFields: []
                        });
                        setAdminServiceModalOpen(true);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition self-start sm:self-auto"
                    >
                      + Add New Service
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-3">Service Name</th>
                            <th className="py-3 px-3">Category</th>
                            <th className="py-3 px-3">Base Points (1 ₹ = 1 Pt)</th>
                            <th className="py-3 px-3">Agent Commission</th>
                            <th className="py-3 px-3">Dynamic Custom Fields</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeServicesList.map((srv) => (
                            <tr key={srv.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900">{srv.title}</div>
                                <div className="text-[11px] text-slate-400 line-clamp-1">{srv.tagline}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                  {srv.category}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-blue-600">
                                💰 {srv.basePointsCost} Pts (₹{srv.basePointsCost})
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                                🎯 {srv.baseAgentCommission} Pts (₹{srv.baseAgentCommission})
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {(srv.customFields || []).length > 0 ? (
                                    srv.customFields?.map((f: any) => (
                                      <span key={f.id} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                        {f.label} ({f.type})
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">No custom fields</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setEditingService(srv);
                                    setAdminServiceForm({
                                      id: srv.id,
                                      title: srv.title,
                                      category: srv.category,
                                      tagline: srv.tagline,
                                      basePointsCost: srv.basePointsCost,
                                      baseAgentCommission: srv.baseAgentCommission,
                                      customFields: srv.customFields ? [...srv.customFields] : []
                                    });
                                    setAdminServiceModalOpen(true);
                                  }}
                                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                                >
                                  ✏️ Edit Fields & Points
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADMIN SERVICE CONFIGURATOR MODAL */}
          {adminServiceModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
                <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">
                      Service Configurator
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {editingService ? `Edit Service: ${editingService.title}` : 'Add New Service & Dynamic Fields'}
                    </h3>
                  </div>
                  <button onClick={() => setAdminServiceModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                    <IconX className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Service Title *</label>
                    <input
                      type="text"
                      value={adminServiceForm.title}
                      onChange={(e) => setAdminServiceForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. ITR-3 & ITR-4 (Business & Profession)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Service Category *</label>
                    <select
                      value={adminServiceForm.category}
                      onChange={(e) => setAdminServiceForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="itr">ITR (Taxation)</option>
                      <option value="loan">Loan (Finance)</option>
                      <option value="insurance">Insurance</option>
                      <option value="fssai">FSSAI (Food License)</option>
                      <option value="gst">GST Services</option>
                      <option value="msme">MSME Udyam</option>
                      <option value="pan">PAN Card</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Tagline / Description</label>
                    <input
                      type="text"
                      value={adminServiceForm.tagline}
                      onChange={(e) => setAdminServiceForm(prev => ({ ...prev, tagline: e.target.value }))}
                      placeholder="Short summary of what this service offers"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Base Points Fee (1 ₹ = 1 Pt) *</label>
                    <input
                      type="number"
                      value={adminServiceForm.basePointsCost}
                      onChange={(e) => setAdminServiceForm(prev => ({ ...prev, basePointsCost: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Base Agent Commission Points *</label>
                    <input
                      type="number"
                      value={adminServiceForm.baseAgentCommission}
                      onChange={(e) => setAdminServiceForm(prev => ({ ...prev, baseAgentCommission: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* CONFIGURED CUSTOM FIELDS LIST */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Dynamic Service Fields ({adminServiceForm.customFields.length})</span>
                    <span className="text-[10px] text-slate-400">Required when applicant applies</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {adminServiceForm.customFields.map((f, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{f.label}</span>
                          <span className="text-[10px] text-slate-500 ml-2 font-mono">({f.id} • {f.type}{f.required ? ' • required' : ''})</span>
                          {f.options && (
                            <div className="text-[10px] text-blue-600 mt-0.5">
                              Options: {f.options.map(o => o.label).join(', ')}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminServiceForm(prev => ({
                              ...prev,
                              customFields: prev.customFields.filter((_, i) => i !== idx)
                            }));
                          }}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-0.5"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* ADD NEW CUSTOM FIELD INLINE */}
                  <div className="bg-white p-3 rounded-lg border border-dashed border-slate-300 space-y-2 text-xs">
                    <span className="font-bold text-slate-700 block text-[11px]">+ Add Custom Field to Service</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Field Label (e.g. Assessment Year)"
                        value={newFieldDraft.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          const autoId = val.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setNewFieldDraft(prev => ({ ...prev, label: val, id: autoId }));
                        }}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                      />
                      <select
                        value={newFieldDraft.type}
                        onChange={(e) => setNewFieldDraft(prev => ({ ...prev, type: e.target.value as any }))}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                      >
                        <option value="text">Text Input (e.g. Business Name / PAN)</option>
                        <option value="number">Number Input (e.g. Turnover ₹)</option>
                        <option value="select">Select Dropdown (with Point Rules)</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={newFieldDraft.required}
                          onChange={(e) => setNewFieldDraft(prev => ({ ...prev, required: e.target.checked }))}
                        />
                        Required Field
                      </label>
                    </div>

                    {newFieldDraft.type === 'select' && (
                      <div className="pt-1">
                        <input
                          type="text"
                          placeholder="Options: Plan A:499:100, Plan B:999:250 (Label:Points:Commission)"
                          value={newFieldDraft.optionsStr}
                          onChange={(e) => setNewFieldDraft(prev => ({ ...prev, optionsStr: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-[11px]"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!newFieldDraft.label) {
                          showToast("Please enter a field label");
                          return;
                        }
                        const parsedOptions: ServiceCustomFieldOption[] = [];
                        if (newFieldDraft.type === 'select' && newFieldDraft.optionsStr) {
                          const parts = newFieldDraft.optionsStr.split(',');
                          parts.forEach(p => {
                            const [optLabel, optPts, optComm] = p.trim().split(':');
                            if (optLabel) {
                              parsedOptions.push({
                                label: optLabel.trim(),
                                value: optLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
                                pointCost: optPts ? Number(optPts) : undefined,
                                commissionPoints: optComm ? Number(optComm) : undefined
                              });
                            }
                          });
                        }
                        const newField: ServiceCustomField = {
                          id: newFieldDraft.id || `field_${Date.now()}`,
                          label: newFieldDraft.label,
                          type: newFieldDraft.type,
                          required: newFieldDraft.required,
                          options: parsedOptions.length > 0 ? parsedOptions : undefined
                        };
                        setAdminServiceForm(prev => ({
                          ...prev,
                          customFields: [...prev.customFields, newField]
                        }));
                        setNewFieldDraft({ id: '', label: '', type: 'text', required: true, optionsStr: '' });
                        showToast(`Added field: ${newField.label}`);
                      }}
                      className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded text-xs border border-blue-200 transition"
                    >
                      + Save Field to List
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAdminServiceModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!adminServiceForm.title) {
                        showToast("Please enter service title");
                        return;
                      }
                      const updatedServiceItem: ServiceItem = {
                        id: adminServiceForm.id || `service-${Date.now()}`,
                        category: adminServiceForm.category,
                        title: adminServiceForm.title,
                        tagline: adminServiceForm.tagline || 'Custom verified portal service',
                        icon: 'Briefcase',
                        color: 'blue',
                        basePointsCost: Number(adminServiceForm.basePointsCost) || 0,
                        baseAgentCommission: Number(adminServiceForm.baseAgentCommission) || 0,
                        processingTime: '24-48 Hours',
                        requiredDocs: ['Aadhaar Card', 'PAN Card', 'Bank Proof'],
                        description: adminServiceForm.tagline || 'Official service handled by B2B portal professionals.',
                        customFields: adminServiceForm.customFields
                      };

                      let updatedList: ServiceItem[] = [];
                      if (editingService) {
                        updatedList = updatePortalService(updatedServiceItem);
                      } else {
                        updatedList = addPortalService(updatedServiceItem);
                      }
                      setPortalServices(updatedList);
                      syncServicesToSupabase(updatedList);
                      setAdminServiceModalOpen(false);
                      showToast(`Saved service "${updatedServiceItem.title}" successfully!`);
                    }}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    💾 Save Service Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── SERVICE DETAIL POPUP MODAL ── */}
      {serviceDetailModalOpen && serviceDetailItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setServiceDetailModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                  {serviceDetailItem.category}
                </span>
                <h3 className="text-base font-bold text-slate-900">{serviceDetailItem.title}</h3>
              </div>
              <button
                onClick={() => setServiceDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition text-xl font-bold leading-none"
              >✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tagline */}
              <p className="text-sm text-slate-600 leading-relaxed">{serviceDetailItem.tagline}</p>

              {/* Fee & Commission */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Service Fee</div>
                  <div className="text-2xl font-extrabold text-blue-700">
                    💰 {serviceDetailItem.basePointsCost > 0 ? `${serviceDetailItem.basePointsCost} Pts` : 'Free'}
                  </div>
                  {serviceDetailItem.basePointsCost > 0 && (
                    <div className="text-xs text-blue-500 mt-0.5">= ₹{serviceDetailItem.basePointsCost}</div>
                  )}
                </div>
                {currentUser?.role === 'agent' && serviceDetailItem.baseAgentCommission > 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Agent Commission</div>
                    <div className="text-2xl font-extrabold text-emerald-700">
                      🎯 +{serviceDetailItem.baseAgentCommission} Pts
                    </div>
                    <div className="text-xs text-emerald-500 mt-0.5">= ₹{serviceDetailItem.baseAgentCommission}</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Wallet Points</div>
                    <div className="text-2xl font-extrabold text-slate-700">💰 {walletPoints.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Your Balance</div>
                  </div>
                )}
              </div>

              {/* Custom Fields / Required Info */}
              {serviceDetailItem.customFields && serviceDetailItem.customFields.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">📋 Required Information</div>
                  <div className="space-y-2">
                    {serviceDetailItem.customFields.map((field) => (
                      <div key={field.id} className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <span className="text-green-500 font-bold text-xs mt-0.5">✓</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-slate-800">{field.label}</span>
                          {field.required && <span className="ml-1 text-[10px] text-red-500 font-bold">*Required</span>}
                          <span className="ml-2 text-[10px] text-slate-400 capitalize">({field.type})</span>
                          {field.options && field.options.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {field.options.map((opt) => (
                                <span key={opt.value} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                  {opt.label}{opt.pointCost && opt.pointCost > 0 ? ` (+${opt.pointCost} Pts)` : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setServiceDetailModalOpen(false); handleOpenApply(serviceDetailItem); }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow transition flex items-center justify-center gap-1.5"
                >
                  Apply Service →
                </button>
                <button
                  type="button"
                  onClick={() => setServiceDetailModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE APPLY MODAL */}
      {applyModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                  {selectedService.category.toUpperCase()} Application
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedService.title}</h3>
                <p className="text-xs text-slate-500">
                  Submitting under: <span className="font-semibold text-slate-800">{currentUser?.name} ({currentUser?.role?.toUpperCase()})</span>
                </p>
              </div>
              <button onClick={() => setApplyModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <IconCheck className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Application Registered & Auto-Paid!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Saved securely to your account. Service points deducted automatically from your wallet.
                </p>
                <div className="p-4 bg-slate-50 rounded-xl max-w-sm mx-auto border border-slate-200 space-y-2 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold">Tracking Number:</span>
                    <span className="text-sm font-mono font-bold text-blue-600">{submitSuccess.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold">Points Paid:</span>
                    <span className="text-xs font-bold text-emerald-600">💰 {submitSuccess.pointsPaid ?? currentPointsCost} Pts (₹{submitSuccess.pointsPaid ?? currentPointsCost})</span>
                  </div>
                  {submitSuccess.details && Object.keys(submitSuccess.details).length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Application Specifics:</span>
                      <div className="space-y-1 text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                        {Object.entries(submitSuccess.details)
                          .filter(([k]) => !['pointsPaid', 'pointsCost', 'agentCommissionPoints'].includes(k))
                          .map(([key, val]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="font-semibold text-slate-800">{String(val)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setApplyModalOpen(false);
                      setActiveTab("dashboard");
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    View in My Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
                {/* Applicant Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Applicant Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="+91 98765-43210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Business / Firm Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. ABC Enterprises / ABC Trading"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* DYNAMIC SERVICE-SPECIFIC CUSTOM FIELDS */}
                {selectedService.customFields && selectedService.customFields.length > 0 && (
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        📋 Required Service Details & Dynamic Options
                      </span>
                      <span className="text-[10px] text-blue-700 bg-blue-100 font-semibold px-2 py-0.5 rounded">
                        Service Configuration
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedService.customFields.map((field) => (
                        <div
                          key={field.id}
                          className={
                            field.type === 'select' && field.options && field.options.some((o: any) => o.pointCost)
                              ? 'col-span-1 md:col-span-2'
                              : ''
                          }
                        >
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>

                          {field.type === 'select' ? (
                            <select
                              value={customFieldValues[field.id] || ''}
                              onChange={(e) =>
                                setCustomFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {(field.options || []).map((opt: any) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label} {opt.pointCost !== undefined ? `• Fee: ${opt.pointCost} Pts` : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === 'number' ? 'number' : 'text'}
                              required={field.required}
                              placeholder={field.placeholder || `Enter ${field.label}`}
                              value={customFieldValues[field.id] || ''}
                              onChange={(e) =>
                                setCustomFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Upload */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Upload Documents (Aadhaar / PAN / RC / Form 16 / Bank Statement)
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition">
                    <IconUpload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">Click to attach document</span>
                    <span className="text-[10px] text-slate-400">PDF, JPG, PNG</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded flex items-center justify-between">
                          <span>📎 {f.name}</span>
                          <span className="text-emerald-600 font-semibold">Attached</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Insufficient Points Warning (Only shown if wallet balance is lower than required fee) */}
                {walletPoints < currentPointsCost && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                    <div className="flex items-start gap-2 text-rose-800">
                      <span className="text-base leading-none">⚠️</span>
                      <div>
                        <p className="font-bold">Insufficient Wallet Balance!</p>
                        <p className="text-[11px] text-rose-600 mt-0.5">
                          Required: <b>{currentPointsCost} Points</b> • Available: <b>{walletPoints} Points</b> • Shortfall: <b>{currentPointsCost - walletPoints} Points</b>
                        </p>
                      </div>
                    </div>
                    <div className="pt-0.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const shortfall = currentPointsCost - walletPoints;
                          if (currentUser) {
                            addPointsToWallet(currentUser, shortfall);
                            refreshWallet(currentUser);
                            showToast(`Added ${shortfall} Points via UPI successfully! You can now submit.`);
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow flex items-center gap-1.5 transition"
                      >
                        ⚡ Add {currentPointsCost - walletPoints} Points via UPI (1-Click)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApplyModalOpen(false);
                          setActiveTab("wallet");
                          setWalletPageTab("add_points");
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-xs hover:bg-slate-50 transition"
                      >
                        Go to Add Points Page →
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    {submitting ? "Submitting File..." : "Submit File"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMER / AGENT AUTH MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <IconUser className="w-5 h-5 text-white" />
                </div>
                {currentUser && (
                  <button onClick={() => setAuthModalOpen(false)} className="text-white/60 hover:text-white p-1">
                    <IconX className="w-5 h-5" />
                  </button>
                )}
              </div>
              <h3 className="font-black text-xl leading-tight">B2B Multi Service Portal</h3>
              <p className="text-blue-100 text-xs mt-1">Govt & Business Services for Customers & Partners</p>

              {/* Login / Signup toggle */}
              <div className="flex mt-4 bg-white/10 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${authMode === 'login' ? 'bg-white text-blue-700 shadow' : 'text-white/80 hover:text-white'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${authMode === 'register' ? 'bg-white text-blue-700 shadow' : 'text-white/80 hover:text-white'}`}
                >
                  New Account
                </button>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6">
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {/* Role Select: Customer or Agent only (Admin has /admin page) */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider">I am a:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthRoleSelect('customer')}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        authRoleSelect === 'customer'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <span>👤</span> Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthRoleSelect('agent')}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        authRoleSelect === 'agent'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <span>🤝</span> Business Agent
                    </button>
                  </div>
                </div>

                {/* Name field (Sign Up only) */}
                {authMode === 'register' && (
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Full Name *"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                )}

                {/* Phone field (Sign Up only) */}
                {authMode === 'register' && (
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="Mobile Number (10 digits) *"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                )}

                {/* Email */}
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Email Address *"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />

                {/* Password */}
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password *"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-extrabold shadow-md transition"
                >
                  {authMode === 'login' ? '→ Sign In to Portal' : '→ Create My Account'}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-100 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-blue-600 font-bold ml-1 hover:underline"
                  >
                    {authMode === 'login' ? 'Create Account' : 'Sign In'}
                  </button>
                </p>
                <p className="text-[11px] text-slate-400">
                  Admin?{' '}
                  <a href="/admin" className="text-amber-600 font-bold hover:underline">
                    Go to Admin Hub →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 1. UPLOAD PENDING DOCUMENTS MODAL ── */}
      {activeActionModal === 'upload' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <IconUpload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{modalMeta.title}</h3>
                  <p className="text-[11px] text-slate-500">Attach and submit required documents</p>
                </div>
              </div>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {uploadModalSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <IconCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900">Documents Submitted Successfully!</h4>
                <p className="text-xs text-slate-500">Your documents have been received by the scrutiny team. Verification in progress.</p>
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="mt-2 px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/60 text-xs">
                  <span className="font-bold text-red-800 block mb-1">Required Pending Documents:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-red-700 text-[11px]">
                    {modalMeta.docs?.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>

                <label className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-red-50/20 transition">
                  <IconUpload className="w-7 h-7 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Click to Select File</span>
                  <span className="text-[11px] text-slate-400">PDF, JPG, PNG (Max 10MB)</span>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        showToast(`Selected: ${e.target.files[0].name}`);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setActiveActionModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setUploadModalSuccess(true);
                      showToast("Documents uploaded and linked to application!");
                    }}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    Upload & Submit Docs
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 2. UNDER OBJECTION / CLARIFICATION RESOLUTION MODAL ── */}
      {activeActionModal === 'objection' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-base">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{modalMeta.title}</h3>
                  <p className="text-[11px] text-slate-500">Official Department Clarification Query</p>
                </div>
              </div>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {objectionSent ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <IconCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900">Clarification Reply Sent!</h4>
                <p className="text-xs text-slate-500">Your explanation and supporting document have been forwarded to the reviewing officer.</p>
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="mt-2 px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                  <span className="font-bold text-amber-800 block mb-1">Notice / Query Reason:</span>
                  <p className="text-amber-900 text-[11px] leading-relaxed">{modalMeta.sub}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Your Explanation / Justification Reply:
                  </label>
                  <textarea
                    rows={3}
                    value={objectionReply}
                    onChange={(e) => setObjectionReply(e.target.value)}
                    placeholder="Enter details clarifying the mismatch or providing corrected reference..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setActiveActionModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setObjectionSent(true);
                      showToast("Objection response submitted successfully!");
                    }}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    Submit Clarification
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. E-VERIFY / AADHAAR OTP MODAL ── */}
      {activeActionModal === 'everify' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base">
                  🔒
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{modalMeta.title}</h3>
                  <p className="text-[11px] text-slate-500">UIDAI Paperless Biometric Authentication</p>
                </div>
              </div>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {eVerifySuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <IconCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900">e-Verification Successful!</h4>
                <p className="text-xs text-slate-500">Aadhaar authentication verified with UIDAI. Digital signature attached to your file.</p>
                <div className="p-2.5 bg-emerald-50 rounded-xl max-w-xs mx-auto border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
                  Verified: AY 2026-27 • Timestamp OK
                </div>
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="mt-2 px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs space-y-1">
                  <div className="flex justify-between text-blue-900">
                    <span>Linked Aadhaar Mobile:</span>
                    <span className="font-mono font-bold">XXXX-XXXX-1223</span>
                  </div>
                  <div className="text-[11px] text-blue-700">An OTP will be sent to the registered mobile number for electronic verification.</div>
                </div>

                {!otpSent ? (
                  <button
                    onClick={() => {
                      setOtpSent(true);
                      showToast("OTP sent to linked mobile number (Simulated: 481920)");
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    Send Aadhaar OTP
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Enter 6-Digit OTP: <span className="text-blue-600 font-normal">(Demo OTP: 481920)</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={eVerifyOtp}
                        onChange={(e) => setEVerifyOtp(e.target.value)}
                        placeholder="e.g. 481920"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center text-base tracking-widest font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setEVerifySuccess(true);
                        showToast("Aadhaar OTP Verified Successfully!");
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
                    >
                      Verify & Submit OTP
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. PAYMENT / STATUTORY CHALLAN MODAL ── */}
      {activeActionModal === 'payment' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-base">
                  💰
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{modalMeta.title}</h3>
                  <p className="text-[11px] text-slate-500">Direct Government / Insurer Payment Gateway</p>
                </div>
              </div>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {paidSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <IconCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900">Payment Successfully Processed!</h4>
                <p className="text-xs text-slate-500">Challan Identification Number (CIN) generated. Receipt linked to your application.</p>
                <div className="p-3 bg-slate-50 rounded-xl max-w-xs mx-auto border border-slate-200 text-left text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-emerald-600">{modalMeta.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Challan CIN:</span>
                    <span className="font-bold text-slate-800">009281734610</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">BSR Code:</span>
                    <span className="font-bold text-slate-800">0210048</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="mt-2 px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Close Receipt
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-purple-700 font-semibold block text-[11px]">Total Payable Amount:</span>
                    <span className="text-2xl font-extrabold text-purple-900">{modalMeta.amount}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-purple-200/70 text-purple-800 rounded">Instant Receipt</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">UPI QR Code & NetBanking</span>
                  <div className="w-24 h-24 bg-white border border-slate-300 rounded-lg mx-auto flex items-center justify-center font-mono text-[10px] text-slate-400 font-bold shadow-xs">
                    [QR CODE]
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">UPI ID: tandaenterprises@icici</span>
                </div>

                <button
                  onClick={() => {
                    setPaidSuccess(true);
                    showToast(`Payment of ${modalMeta.amount} confirmed!`);
                  }}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <span>Pay Now ({modalMeta.amount})</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. INDIA POST SPEEDPOST LIVE TRACKING MODAL ── */}
      {activeActionModal === 'dispatch' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-base">
                  🚚
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">India Post SpeedPost Tracking</h3>
                  <p className="text-[11px] text-slate-500">Official Consignment Real-Time Status</p>
                </div>
              </div>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Consignment Number:</span>
                  <span className="font-mono font-bold text-blue-600 text-sm">{modalMeta.consignment || 'EM918237461IN'}</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  In Transit
                </span>
              </div>

              {/* Live Tracking Timeline */}
              <div className="border-l-2 border-emerald-500 ml-4 pl-4 space-y-4 text-xs">
                <div className="relative">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full absolute -left-[23px] top-0.5 border-2 border-white shadow"></span>
                  <div className="font-bold text-slate-900">Out for Delivery - Local Delivery Post Office</div>
                  <div className="text-[11px] text-slate-400">Today, 09:30 AM • Delivery agent assigned</div>
                </div>
                <div className="relative">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full absolute -left-[23px] top-0.5 border-2 border-white shadow"></span>
                  <div className="font-bold text-slate-900">Item Dispatched from National Sorting Hub</div>
                  <div className="text-[11px] text-slate-400">Yesterday, 04:15 PM • RMS Hoshiarpur Hub</div>
                </div>
                <div className="relative">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full absolute -left-[23px] top-0.5 border-2 border-white shadow"></span>
                  <div className="font-bold text-slate-900">Item Booked at SpeedPost Counter</div>
                  <div className="text-[11px] text-slate-400">14 Nov 2026, 11:20 AM • Consignment Created</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Close Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. DOWNLOAD CERTIFICATE / OFFICIAL PDF MODAL ── */}
      {activeActionModal === 'download' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-base">
                  ✅
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Download Approved Certificate</h3>
                  <p className="text-[11px] text-slate-500">Official Government & Insurer Signed Copy</p>
                </div>
              </div>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span className="text-emerald-600 text-base">📄</span>
                  <span>{modalMeta.title}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{modalMeta.sub}</p>
                <div className="pt-1 text-[10px] text-emerald-800 font-mono font-semibold">
                  Status: Approved & Digitally Verified • QR Code Intact
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    showToast(`Downloading: ${modalMeta.title.replace(/\s+/g, '_')}.pdf`);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-2"
                >
                  <span>📥 Download Official PDF Copy</span>
                </button>

                <button
                  onClick={() => {
                    showToast(`Sent PDF copy to ${currentUser?.email || 'registered email'}!`);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <span>📧 Email PDF to {currentUser?.email?.split('@')[0]}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. LIVE PROCESSING STAGE TRACKER MODAL ── */}
      {activeActionModal === 'processing' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{modalMeta.title}</h3>
                  <p className="text-[11px] text-slate-500">Live Stage Verification Progress</p>
                </div>
              </div>
              <button onClick={() => setActiveActionModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs">
                <span className="font-bold text-blue-900 block mb-0.5">Current Active Step:</span>
                <p className="text-blue-800 text-[11px]">{modalMeta.stage}</p>
              </div>

              {/* 4-Step Progress Steps */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">✓</span>
                  <div>
                    <div className="font-bold text-slate-800">1. Application Logged & Assigned</div>
                    <div className="text-[10px] text-slate-400">File received in operations queue</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">✓</span>
                  <div>
                    <div className="font-bold text-slate-800">2. Document Scrutiny & Compliance Check</div>
                    <div className="text-[10px] text-slate-400">Mandatory KYC and proofs matched</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] animate-pulse">3</span>
                  <div>
                    <div className="font-bold text-blue-600">3. Government / Insurer Server Processing</div>
                    <div className="text-[10px] text-blue-500 font-medium">Currently active on official department portal</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-[10px]">4</span>
                  <div>
                    <div className="font-bold text-slate-400">4. Final Certificate & Acknowledgement Allotment</div>
                    <div className="text-[10px] text-slate-400">Estimated delivery: Within 24 Hours</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
