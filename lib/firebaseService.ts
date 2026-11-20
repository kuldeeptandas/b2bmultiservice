import { firebaseConfig, isFirebaseConfigured } from "./firebase";
import { B2BApplication, B2BUser, INITIAL_APPLICATIONS, PRESET_USERS } from "./b2bStore";

const STORAGE_KEY_APPS = "b2b_multi_services_apps_v2";
const STORAGE_KEY_USER = "b2b_multi_services_active_user_v2";

// Firebase Auth REST API: Sign In
export async function firebaseSignIn(email: string, password: string, requestedRole?: 'customer' | 'agent' | 'admin'): Promise<{ user?: B2BUser; error?: string }> {
  // If matched preset demo
  if (email.includes("admin")) {
    setStoredUser(PRESET_USERS.admin);
    return { user: PRESET_USERS.admin };
  }
  if (email.includes("agent")) {
    setStoredUser(PRESET_USERS.agent);
    return { user: PRESET_USERS.agent };
  }
  if (email.includes("customer")) {
    setStoredUser(PRESET_USERS.customer);
    return { user: PRESET_USERS.customer };
  }

  if (!isFirebaseConfigured()) {
    const role = requestedRole || (email.includes("admin") ? "admin" : email.includes("agent") ? "agent" : "customer");
    const localUser: B2BUser = {
      uid: `usr-${role}-${Date.now().toString().slice(-4)}`,
      name: email.split("@")[0],
      email,
      phone: "+91 98765-43210",
      role,
      agentCode: role === "agent" ? `AG-PB-${Math.floor(100 + Math.random()*900)}` : undefined,
      commissionBalance: role === "agent" ? "₹0" : undefined,
      createdAt: new Date().toISOString()
    };
    setStoredUser(localUser);
    return { user: localUser };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error?.message || "Firebase sign in failed" };
    }

    const role = requestedRole || (email.includes("admin") ? "admin" : email.includes("agent") ? "agent" : "customer");
    const user: B2BUser = {
      uid: data.localId,
      name: data.displayName || email.split("@")[0],
      email: data.email,
      phone: "+91 98765-43210",
      role,
      agentCode: role === "agent" ? `AG-PB-${Math.floor(100 + Math.random()*900)}` : undefined,
      commissionBalance: role === "agent" ? "₹0" : undefined,
      createdAt: new Date().toISOString()
    };
    setStoredUser(user);
    return { user };
  } catch (err: any) {
    return { error: err.message || "Network error during Firebase login" };
  }
}

// Firebase Auth REST API: Sign Up
export async function firebaseSignUp(
  email: string,
  password: string,
  name: string,
  phone: string,
  role: 'customer' | 'agent' | 'admin' = 'customer',
  businessName?: string
): Promise<{ user?: B2BUser; error?: string }> {
  const localUser: B2BUser = {
    uid: `usr-${role}-${Date.now().toString().slice(-4)}`,
    name: name || email.split("@")[0],
    email,
    phone: phone || "+91 98765-43210",
    role,
    businessName: businessName || (role === 'agent' ? "Partner Agency" : "Client"),
    agentCode: role === 'agent' ? `AG-PB-${Math.floor(100 + Math.random() * 900)}` : undefined,
    commissionBalance: role === 'agent' ? "₹0" : undefined,
    createdAt: new Date().toISOString()
  };

  if (!isFirebaseConfigured()) {
    setStoredUser(localUser);
    return { user: localUser };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error?.message || "Firebase sign up failed" };
    }

    localUser.uid = data.localId;
    setStoredUser(localUser);
    return { user: localUser };
  } catch (err: any) {
    return { error: err.message || "Network error during Firebase registration" };
  }
}

// Master raw applications getter
function getAllRawApplications(): B2BApplication[] {
  if (typeof window === "undefined") return INITIAL_APPLICATIONS;
  const saved = localStorage.getItem(STORAGE_KEY_APPS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_APPLICATIONS;
    }
  }
  localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(INITIAL_APPLICATIONS));
  return INITIAL_APPLICATIONS;
}

// ROLE-BASED ACCESS CONTROL (Data Isolation):
// - Customer sees ONLY their own submitted applications
// - Agent sees ONLY their own client leads and submissions
// - Admin sees 100% of all applications across all users and agents
export async function getApplications(activeUser?: B2BUser | null): Promise<B2BApplication[]> {
  const all = getAllRawApplications();
  if (!activeUser) {
    // Default to customer Harman data if guest/unauthenticated
    return all.filter(a => a.userId === PRESET_USERS.customer.uid);
  }

  if (activeUser.role === 'admin') {
    // Admin sees everything
    return all;
  }

  if (activeUser.role === 'agent') {
    // Agent only sees applications they submitted as an agent or with their agentId
    return all.filter(a => a.agentId === activeUser.uid || a.userId === activeUser.uid);
  }

  // Customer only sees applications with their own userId
  return all.filter(a => a.userId === activeUser.uid);
}

// Create new application tied strictly to the creator's role & id
export async function submitApplication(
  appData: Omit<B2BApplication, 'id' | 'appliedDate' | 'trackingNumber'>,
  creator: B2BUser
): Promise<B2BApplication> {
  const trackingNumber = "TRK-" + appData.serviceCategory.toUpperCase() + "-" + Math.floor(10000 + Math.random() * 90000);
  const appliedDate = new Date().toISOString().split("T")[0];

  const newApp: B2BApplication = {
    ...appData,
    id: "APP-" + Date.now(),
    userId: creator.uid,
    userRole: creator.role,
    agentId: creator.role === 'agent' ? creator.uid : undefined,
    agentName: creator.role === 'agent' ? creator.name : undefined,
    agentCommission: creator.role === 'agent' ? `₹${Math.floor(400 + Math.random() * 1200)}` : undefined,
    appliedDate,
    trackingNumber,
  };

  // Sync to Firestore via REST if Firebase is configured
  if (isFirebaseConfigured() && firebaseConfig.projectId) {
    try {
      await fetch(
        `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/applications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              trackingNumber: { stringValue: trackingNumber },
              userId: { stringValue: creator.uid },
              userRole: { stringValue: creator.role },
              serviceTitle: { stringValue: appData.serviceTitle },
              applicantName: { stringValue: appData.applicantName },
              status: { stringValue: "Pending" },
              appliedDate: { stringValue: appliedDate }
            }
          })
        }
      );
    } catch (e) {
      console.warn("Firestore sync skipped:", e);
    }
  }

  // Save to LocalStorage
  if (typeof window !== "undefined") {
    try {
      const all = getAllRawApplications();
      const updated = [newApp, ...all];
      localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  return newApp;
}

// Update application status (Admin or Agent note)
export async function updateApplicationStatus(appId: string, newStatus: B2BApplication['status'], adminNotes?: string) {
  if (typeof window !== "undefined") {
    const all = getAllRawApplications();
    const updated = all.map(app => {
      if (app.id === appId) {
        let statusColor = "blue";
        if (newStatus === "Approved" || newStatus === "Completed") statusColor = "emerald";
        if (newStatus === "Document Verification") statusColor = "amber";
        if (newStatus === "Action Required") statusColor = "red";
        return { ...app, status: newStatus, statusColor, adminNotes: adminNotes ?? app.adminNotes };
      }
      return app;
    });
    localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(updated));
    return updated;
  }
}

// User session management
export function getStoredUser(): B2BUser | null {
  if (typeof window === "undefined") return PRESET_USERS.customer;
  const saved = localStorage.getItem(STORAGE_KEY_USER);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return PRESET_USERS.customer;
    }
  }
  // Default to customer Harman on first load
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(PRESET_USERS.customer));
  return PRESET_USERS.customer;
}

export function setStoredUser(user: B2BUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
}
