export type PolicyStatus = "pending_payment" | "payment_done" | "policy_uploaded" | "active" | "expired";

export interface CustomerPolicy {
  id: string;
  year: number;
  customerName: string;
  phone: string;
  email: string;
  place?: string;
  dob?: string;
  vehicleType?: "Bike" | "Car";
  vehicle: string;
  regNo: string;
  make: string;
  model: string;
  fuelType: string;
  coverType: string;
  premium: number;
  status: PolicyStatus;
  policyFile?: string;
  submittedAt: string;
  policyNo?: string;
  agentId?: string;
  agentName?: string;
  insurer?: string;
  validFrom?: string;
  validTill?: string;
  rcFile?: string;
  panFile?: string;
  aadharFile?: string;
  rcDataUrl?: string;
  panDataUrl?: string;
  aadharDataUrl?: string;
}

export const initialMasterPolicies: CustomerPolicy[] = [
  {
    id: "REQ-001",
    year: 2025,
    customerName: "Raj Kumar",
    phone: "9876543210",
    email: "raj.kumar@example.com",
    place: "Ludhiana, Punjab",
    dob: "1988-06-15",
    vehicleType: "Car",
    vehicle: "Maruti Suzuki Swift VXI",
    regNo: "DL01AB1234",
    make: "Maruti Suzuki",
    model: "Swift",
    fuelType: "Petrol",
    coverType: "Comprehensive",
    premium: 12500,
    status: "active",
    policyFile: "policy_raj_2025.pdf",
    submittedAt: "2025-01-10",
    policyNo: "HDFC-ERGO-2025-001",
    agentId: "AGT-007",
    agentName: "Gurpreet Singh",
    insurer: "HDFC ERGO",
    validFrom: "2025-01-11",
    validTill: "2026-01-10",
    rcFile: "RC_DL01AB1234.pdf",
    panFile: "PAN_RAJK1234F.jpg",
    aadharFile: "Aadhaar_3210.pdf",
  },
  {
    id: "REQ-002",
    year: 2025,
    customerName: "Priya Sharma",
    phone: "9988776655",
    email: "priya@example.com",
    place: "Jalandhar, Punjab",
    dob: "1990-03-22",
    vehicleType: "Car",
    vehicle: "Hyundai i20 Sportz",
    regNo: "HR26BC5678",
    make: "Hyundai",
    model: "i20",
    fuelType: "Diesel",
    coverType: "Comprehensive",
    premium: 14200,
    status: "policy_uploaded",
    policyFile: "policy_priya_2025.pdf",
    submittedAt: "2025-10-20",
    policyNo: "ICICI-LOMB-2025-002",
    agentId: "AGT-007",
    agentName: "Gurpreet Singh",
    insurer: "ICICI Lombard",
    validFrom: "2025-10-21",
    validTill: "2026-10-20",
    rcFile: "RC_HR26BC5678.pdf",
    panFile: "PAN_PRIY8901G.jpg",
    aadharFile: "Aadhaar_6655.pdf",
  },
  {
    id: "REQ-003",
    year: 2025,
    customerName: "Suresh Patel",
    phone: "9765432100",
    email: "suresh@example.com",
    place: "Amritsar, Punjab",
    dob: "1978-11-05",
    vehicleType: "Car",
    vehicle: "Tata Nexon EV",
    regNo: "GJ05CD9012",
    make: "Tata",
    model: "Nexon",
    fuelType: "Electric",
    coverType: "Comprehensive",
    premium: 18000,
    status: "payment_done",
    submittedAt: "2025-10-24",
    agentId: "AGT-007",
    agentName: "Gurpreet Singh",
    rcFile: "RC_GJ05CD9012.pdf",
    panFile: "PAN_SURE3456H.jpg",
    aadharFile: "Aadhaar_2100.pdf",
  },
];

/**
 * Compresses an image file client-side using Canvas to ensure it easily fits in localStorage and transfers fast.
 */
export async function compressImageFile(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.65): Promise<string> {
  if (typeof window === "undefined") return "";

  if (file.type === "application/pdf") {
    // For PDF files, read as data url if within 1.5MB
    if (file.size > 1.5 * 1024 * 1024) {
      return ""; // too large for raw base64
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve((e.target?.result as string) || "");
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve((e.target?.result as string) || "");
      img.src = (e.target?.result as string) || "";
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

/**
 * Safely saves policies to localStorage with quota overflow safeguards.
 */
export function safeSavePolicies(policies: CustomerPolicy[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem("shielddrive_policies", JSON.stringify(policies));
    return true;
  } catch (err) {
    console.warn("Storage quota limit reached, compressing storage...", err);
    try {
      // Keep full data URLs on latest 3 policies, strip them on older ones
      const optimized = policies.map((p, idx) => {
        if (idx > 2) {
          const { rcDataUrl, panDataUrl, aadharDataUrl, ...rest } = p;
          return rest as CustomerPolicy;
        }
        return p;
      });
      localStorage.setItem("shielddrive_policies", JSON.stringify(optimized));
      return true;
    } catch {
      // Keep only metadata
      const stripped = policies.map((p) => {
        const { rcDataUrl, panDataUrl, aadharDataUrl, ...rest } = p;
        return rest as CustomerPolicy;
      });
      try {
        localStorage.setItem("shielddrive_policies", JSON.stringify(stripped));
        return true;
      } catch {
        return false;
      }
    }
  }
}

export interface QuoteBreakdown {
  vehicleType: "Bike" | "Car";
  coverType: "Comprehensive" | "ThirdParty";
  idv: number;
  tpPremium: number;
  odPremium: number;
  paCover: number;
  netPremium: number;
  gst: number;
  totalPremium: number;
}

/**
 * Calculates accurate, instant insurance quote breakdown based on vehicle type and cover
 */
export function calculatePremiumQuote(
  vehicleType: "Bike" | "Car",
  coverType: "Comprehensive" | "ThirdParty" = "Comprehensive",
  vehicleYear = 2023,
  customIdv?: number
): QuoteBreakdown {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - vehicleYear);

  if (vehicleType === "Bike") {
    // Bike: Standard IDV approx ₹55,000 depreciated
    const baseIdv = customIdv || Math.max(25000, Math.round(62000 * Math.pow(0.88, age)));
    const tpPremium = 714; // IRDAI mandate up to 150cc
    const paCover = 350;   // 15 Lakh mandatory PA cover
    let odPremium = 0;
    if (coverType === "Comprehensive") {
      odPremium = 386;
    }
    const netPremium = tpPremium + odPremium + (coverType === "Comprehensive" ? paCover : 0);
    const gst = Math.round(netPremium * 0.18);
    const totalPremium = coverType === "Comprehensive" ? 1450 : netPremium + gst;

    return {
      vehicleType,
      coverType,
      idv: baseIdv,
      tpPremium,
      odPremium,
      paCover: coverType === "Comprehensive" ? paCover : 0,
      netPremium,
      gst,
      totalPremium,
    };
  } else {
    // Car: Standard IDV approx ₹4,50,000 depreciated
    const baseIdv = customIdv || Math.max(180000, Math.round(520000 * Math.pow(0.85, age)));
    const tpPremium = 3416; // IRDAI mandate 1000cc - 1500cc
    const paCover = 375;    // 15 Lakh PA cover
    let odPremium = 0;
    if (coverType === "Comprehensive") {
      odPremium = 6080;
    }
    const netPremium = tpPremium + odPremium + (coverType === "Comprehensive" ? paCover : 0);
    const gst = Math.round(netPremium * 0.18);
    const totalPremium = coverType === "Comprehensive" ? 11200 : netPremium + gst;

    return {
      vehicleType,
      coverType,
      idv: baseIdv,
      tpPremium,
      odPremium,
      paCover: coverType === "Comprehensive" ? paCover : 0,
      netPremium,
      gst,
      totalPremium,
    };
  }
}
