export interface ServiceCustomFieldOption {
  label: string;
  value: string;
  pointCost?: number;         // Overrides or sets the service point cost
  commissionPoints?: number;  // Overrides or sets the agent commission points
}

export interface ServiceCustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: ServiceCustomFieldOption[];
}

export interface ServiceItem {
  id: string;
  category: 'itr' | 'loan' | 'insurance' | 'fssai' | 'gst' | 'msme' | 'pan';
  title: string;
  tagline: string;
  icon: string;
  color: string;
  badge?: string;
  govtFee?: string;
  consultationFee?: string;
  basePointsCost: number;       // 1 Rupee = 1 Point
  baseAgentCommission: number;  // Auto-distributed to agent in points
  processingTime: string;
  requiredDocs: string[];
  description: string;
  customFields?: ServiceCustomField[];
}

export interface B2BApplication {
  id: string;
  userId: string;
  userRole: 'customer' | 'agent' | 'admin';
  agentId?: string;
  agentName?: string;
  agentCode?: string;
  agentCommission?: string;
  serviceId: string;
  serviceCategory: 'itr' | 'loan' | 'insurance' | 'fssai' | 'gst' | 'msme' | 'pan';
  serviceTitle: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  businessName?: string;
  appliedDate: string;
  createdAt?: string;
  updatedAt?: string;
  status: 'Pending' | 'Document Verification' | 'In Process' | 'Approved' | 'Completed' | 'Action Required';
  statusColor: string;
  amount?: string;
  pointsPaid?: number;
  trackingNumber: string;
  details: Record<string, any>;
  documents: { name: string; type: string; uploadedAt: string }[];
  remarks?: string;
  adminNotes?: string;
}

export interface B2BUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'agent' | 'admin';
  agentCode?: string;
  commissionBalance?: string;
  businessName?: string;
  gstNumber?: string;
  createdAt: string;
}

export const PRESET_USERS: Record<string, B2BUser> = {
  customer: {
    uid: "cust-harman-101",
    name: "Harman Preet (Customer)",
    email: "customer@b2bmultiservice.in",
    phone: "+91 98765-11223",
    role: "customer",
    businessName: "Harman Dairy & Retail",
    createdAt: "2026-11-01T10:00:00Z"
  },
  agent: {
    uid: "agent-jaspreet-202",
    name: "Jaspreet Singh (Punjab Partner)",
    email: "agent@b2bmultiservice.in",
    phone: "+91 98140-55667",
    role: "agent",
    agentCode: "AG-PB-104",
    commissionBalance: "₹18,450",
    businessName: "Doaba Financial & Insurance Point",
    createdAt: "2026-10-15T09:30:00Z"
  },
  admin: {
    uid: "admin-master-001",
    name: "Super Admin (Tanda Enterprises)",
    email: "admin@b2bmultiservice.in",
    phone: "+91 98000-00000",
    role: "admin",
    businessName: "Tanda B2B Head Office",
    createdAt: "2026-09-01T08:00:00Z"
  }
};

export const ALL_SERVICES: ServiceItem[] = [
  {
    id: 'itr-salaried',
    category: 'itr',
    title: 'ITR-1 (Salaried Return)',
    tagline: 'Form 16 salary, single house property, other sources',
    icon: 'FileText',
    color: 'emerald',
    badge: 'Popular',
    govtFee: '₹0 (Below 5L)',
    consultationFee: '₹499',
    basePointsCost: 499,
    baseAgentCommission: 100,
    processingTime: '24-48 Hours',
    requiredDocs: ['PAN Card', 'Aadhaar Card', 'Form 16', 'Bank Statement', 'Investment Proofs'],
    description: 'Fast and accurate Income Tax Return filing for salaried employees, pensioners, and single house owners with max refund guarantee.',
    customFields: [
      {
        id: 'assessmentYear',
        label: 'Assessment Year (AY)',
        type: 'select',
        required: true,
        defaultValue: 'AY 2026-27 (FY 2025-26)',
        options: [
          { label: 'AY 2026-27 (FY 2025-26) - Current Year', value: 'AY 2026-27 (FY 2025-26)' },
          { label: 'AY 2025-26 (FY 2024-25)', value: 'AY 2025-26 (FY 2024-25)' },
        ]
      },
      {
        id: 'salarySlab',
        label: 'Annual Salary / Income Slab',
        type: 'select',
        required: true,
        defaultValue: 'upto_5L',
        options: [
          { label: 'Salary Upto ₹5 Lakhs (Single Form 16) • 499 Points', value: 'upto_5L', pointCost: 499, commissionPoints: 100 },
          { label: 'Salary ₹5 Lakhs - ₹15 Lakhs (House Property & Capital Gains) • 799 Points', value: '5L_15L', pointCost: 799, commissionPoints: 180 },
          { label: 'Salary Above ₹15 Lakhs (Multiple Form 16 & ESOPs) • 1,199 Points', value: 'above_15L', pointCost: 1199, commissionPoints: 250 },
        ]
      },
      {
        id: 'panNumber',
        label: 'PAN Card Number *',
        type: 'text',
        required: true,
        placeholder: 'e.g. ABCPS1234F',
      },
      {
        id: 'employerType',
        label: 'Employer Type',
        type: 'select',
        required: false,
        defaultValue: 'Private Sector',
        options: [
          { label: 'Private Sector Employee', value: 'Private Sector' },
          { label: 'Central / State Government', value: 'Government' },
          { label: 'Public Sector Undertaking (PSU)', value: 'PSU' },
          { label: 'Pensioner / Senior Citizen', value: 'Pensioner' },
        ]
      }
    ]
  },
  {
    id: 'itr-business',
    category: 'itr',
    title: 'ITR-3 & ITR-4 (Business & Profession)',
    tagline: 'Presumptive 44AD/ADA, traders, shops & freelancers',
    icon: 'Briefcase',
    color: 'blue',
    badge: 'High Demand',
    govtFee: 'Variable',
    consultationFee: '₹999',
    basePointsCost: 999,
    baseAgentCommission: 250,
    processingTime: '2-3 Days',
    requiredDocs: ['PAN & Aadhaar', 'Bank Statements (1 Year)', 'Sales/Turnover Details', 'GST Returns (if applicable)'],
    description: 'Comprehensive tax filing for small businesses, shopkeepers, wholesalers, commission agents, and professionals.',
    customFields: [
      {
        id: 'assessmentYear',
        label: 'Assessment Year (AY) *',
        type: 'select',
        required: true,
        defaultValue: 'AY 2026-27 (FY 2025-26)',
        options: [
          { label: 'AY 2026-27 (FY 2025-26) - Current Year', value: 'AY 2026-27 (FY 2025-26)' },
          { label: 'AY 2025-26 (FY 2024-25)', value: 'AY 2025-26 (FY 2024-25)' },
          { label: 'AY 2024-25 (FY 2023-24)', value: 'AY 2024-25 (FY 2023-24)' },
        ]
      },
      {
        id: 'businessName',
        label: 'Firm / Business Name *',
        type: 'text',
        required: true,
        placeholder: 'e.g. ABC Enterprises / ABC Trading',
      },
      {
        id: 'annualTurnover',
        label: 'Annual Business Turnover / Yearly Income (Select Plan) *',
        type: 'select',
        required: true,
        defaultValue: 'upto_20L',
        options: [
          { label: 'Turnover Upto ₹20 Lakhs (Sec 44AD Presumptive) • 999 Points', value: 'upto_20L', pointCost: 999, commissionPoints: 250 },
          { label: 'Turnover ₹20 Lakhs to ₹50 Lakhs (Sec 44AD/ADA) • 1,499 Points', value: '20L_50L', pointCost: 1499, commissionPoints: 350 },
          { label: 'Turnover Above ₹50 Lakhs (Audit & Accounts) • 2,999 Points', value: 'above_50L', pointCost: 2999, commissionPoints: 600 },
        ]
      },
      {
        id: 'turnoverAmount',
        label: 'Exact Yearly Business Gross Receipts (₹)',
        type: 'number',
        required: false,
        placeholder: 'e.g. 50000 or 1850000',
      },
      {
        id: 'panNumber',
        label: 'Business / Proprietor PAN *',
        type: 'text',
        required: true,
        placeholder: 'e.g. ABCPS1234F',
      },
      {
        id: 'businessNature',
        label: 'Nature of Business / Trade',
        type: 'select',
        required: false,
        defaultValue: 'Retail Shop & Karyana',
        options: [
          { label: 'Retail Shop & Grocery / Karyana', value: 'Retail Shop & Karyana' },
          { label: 'Wholesale / Distribution Trade', value: 'Wholesale' },
          { label: 'Commission Agent / Arhtiya', value: 'Commission Agent' },
          { label: 'Transport / Goods Carriage Operator', value: 'Transport' },
          { label: 'Freelancer / Doctor / Engineer / Consultant (44ADA)', value: 'Professional' },
          { label: 'Manufacturing & Workshop', value: 'Manufacturing' },
        ]
      }
    ]
  },
  {
    id: 'itr-u',
    category: 'itr',
    title: 'ITR-U (Updated Tax Return)',
    tagline: 'File missed or corrected returns up to 4 years back',
    icon: 'Clock',
    color: 'purple',
    badge: 'Govt Window',
    govtFee: 'As per tax slab',
    consultationFee: '₹1,499',
    basePointsCost: 1499,
    baseAgentCommission: 350,
    processingTime: '3-4 Days',
    requiredDocs: ['PAN & Aadhaar', 'AIS / TIS Statement', 'Previous ITR Acknowledgement', 'Bank Records'],
    description: 'Update past tax returns to avoid notices, clear tax mismatch, and declare omitted income safely.',
    customFields: [
      {
        id: 'updatedYear',
        label: 'Year to Update Return *',
        type: 'select',
        required: true,
        defaultValue: 'AY 2024-25',
        options: [
          { label: 'AY 2024-25 (FY 2023-24) • 1,499 Points', value: 'AY 2024-25', pointCost: 1499, commissionPoints: 350 },
          { label: 'AY 2023-24 (FY 2022-23) • 1,999 Points', value: 'AY 2023-24', pointCost: 1999, commissionPoints: 450 },
          { label: 'AY 2022-23 (FY 2021-22) • 2,499 Points', value: 'AY 2022-23', pointCost: 2499, commissionPoints: 550 },
        ]
      },
      {
        id: 'panNumber',
        label: 'PAN Card Number *',
        type: 'text',
        required: true,
        placeholder: 'e.g. ABCPS1234F',
      },
      {
        id: 'updateReason',
        label: 'Reason for Updating Return',
        type: 'select',
        required: false,
        defaultValue: 'Declared Omitted Income',
        options: [
          { label: 'Declared Omitted Income', value: 'Declared Omitted Income' },
          { label: 'Mismatch with AIS / TIS Portal', value: 'AIS/TIS Mismatch' },
          { label: 'Return Previously Not Filed', value: 'Not Filed Earlier' },
          { label: 'Reduction of Carried Forward Loss', value: 'Loss Reduction' },
        ]
      }
    ]
  },
  {
    id: 'insurance-commercial',
    category: 'insurance',
    title: 'Commercial Vehicle Insurance (3rd Party & Comp)',
    tagline: 'Truck, Pickup, Taxi, Tipper, Auto, Bus instant policy',
    icon: 'Truck',
    color: 'amber',
    badge: 'IRDAI Approved',
    govtFee: 'Govt TP Mandate',
    consultationFee: 'Instant Discount',
    basePointsCost: 2150,
    baseAgentCommission: 350,
    processingTime: '10-30 Minutes',
    requiredDocs: ['Vehicle RC (Front & Back)', 'Previous Policy Copy', 'Permit / Fitness (if required)'],
    description: 'Save penalty! Immediate 3rd Party Liability and Comprehensive motor insurance issuance with national cashless garage network.',
    customFields: [
      {
        id: 'vehicleNumber',
        label: 'Vehicle Registration Number *',
        type: 'text',
        required: true,
        placeholder: 'e.g. PB 08 CX 4812',
      },
      {
        id: 'vehicleCategory',
        label: 'Vehicle Type / Class *',
        type: 'select',
        required: true,
        defaultValue: 'truck_heavy',
        options: [
          { label: 'Goods Truck / Heavy Vehicle (>7500 kg) • 2,850 Points', value: 'truck_heavy', pointCost: 2850, commissionPoints: 450 },
          { label: 'Pickup / Mini Truck (Tata 407 / Bolero Maxi) • 2,150 Points', value: 'pickup_mini', pointCost: 2150, commissionPoints: 350 },
          { label: 'Commercial Taxi / Cab (Dzire / Innova) • 1,750 Points', value: 'taxi_cab', pointCost: 1750, commissionPoints: 250 },
          { label: 'Auto Rickshaw (3-Wheeler Passenger/Cargo) • 1,250 Points', value: 'auto_3w', pointCost: 1250, commissionPoints: 200 },
          { label: 'Tipper / Dumper / Tractor Commercial • 3,250 Points', value: 'tipper_dumper', pointCost: 3250, commissionPoints: 500 },
        ]
      },
      {
        id: 'policyCoverType',
        label: 'Policy Coverage Required',
        type: 'select',
        required: true,
        defaultValue: 'tp_only',
        options: [
          { label: '1 Year 3rd Party Liability (Mandatory TP)', value: 'tp_only', pointCost: 2150, commissionPoints: 350 },
          { label: 'Comprehensive Package (OD + TP + Zero Dep) • 4,850 Points', value: 'comprehensive', pointCost: 4850, commissionPoints: 750 },
        ]
      }
    ]
  },
  {
    id: 'insurance-private',
    category: 'insurance',
    title: 'Car & 2-Wheeler 3rd Party Insurance',
    tagline: 'Avoid ₹2,000 to ₹4,000 traffic fine with instant policy copy',
    icon: 'ShieldCheck',
    color: 'orange',
    badge: 'Instant PDF',
    govtFee: 'Standard IRDA TP Tariff',
    consultationFee: 'Best Quote',
    basePointsCost: 950,
    baseAgentCommission: 150,
    processingTime: '5 Minutes',
    requiredDocs: ['Vehicle RC Copy', 'Previous Policy (optional)'],
    description: 'Mandatory 3rd Party cover protecting against third-party bodily injury, accidental death, and third-party property damage.',
    customFields: [
      {
        id: 'vehicleNumber',
        label: 'Vehicle RC Number *',
        type: 'text',
        required: true,
        placeholder: 'e.g. PB 08 AB 1234',
      },
      {
        id: 'vehicleSegment',
        label: 'Vehicle Segment (Select Plan) *',
        type: 'select',
        required: true,
        defaultValue: 'car_hatchback',
        options: [
          { label: 'Two Wheeler (Motorcycle / Scooter) 3rd Party • 750 Points', value: 'two_wheeler', pointCost: 750, commissionPoints: 100 },
          { label: 'Private Car (Hatchback / Sedan Upto 1000cc) • 950 Points', value: 'car_hatchback', pointCost: 950, commissionPoints: 150 },
          { label: 'Private SUV / Large Car (Above 1500cc) • 1,450 Points', value: 'suv_large', pointCost: 1450, commissionPoints: 220 },
        ]
      }
    ]
  },
  {
    id: 'fssai-registration',
    category: 'fssai',
    title: 'FSSAI Basic Food Registration',
    tagline: 'Mandatory for food business with turnover below ₹12 Lakh/yr',
    icon: 'UtensilsCrossed',
    color: 'rose',
    badge: 'Govt Certified',
    govtFee: '₹100/yr (Govt)',
    consultationFee: '₹799',
    basePointsCost: 799,
    baseAgentCommission: 200,
    processingTime: '3-7 Working Days',
    requiredDocs: ['Owner Photo', 'Aadhaar / Voter ID', 'Business Address Proof (Electricity bill / Rent deed)'],
    description: '14-digit FSSAI Registration number for small eateries, dhabas, tea stalls, home bakers, canteens, and grocery stores.',
    customFields: [
      {
        id: 'foodBusinessName',
        label: 'Food Business / Outlet Name *',
        type: 'text',
        required: true,
        placeholder: 'e.g. Harman Dairy & Sweets',
      },
      {
        id: 'validityPeriod',
        label: 'Registration Validity (Select Years) *',
        type: 'select',
        required: true,
        defaultValue: '1_year',
        options: [
          { label: '1 Year Basic Registration • 799 Points', value: '1_year', pointCost: 799, commissionPoints: 200 },
          { label: '3 Years Basic Registration • 1,499 Points', value: '3_years', pointCost: 1499, commissionPoints: 350 },
          { label: '5 Years Basic Registration • 2,199 Points', value: '5_years', pointCost: 2199, commissionPoints: 500 },
        ]
      },
      {
        id: 'foodKind',
        label: 'Kind of Food Business',
        type: 'select',
        required: false,
        defaultValue: 'Dhaba / Restaurant',
        options: [
          { label: 'Dhaba / Fast Food / Restaurant', value: 'Dhaba / Restaurant' },
          { label: 'Bakery / Dairy & Milk Products', value: 'Bakery / Dairy' },
          { label: 'Retail Karyana / Grocery Store', value: 'Retail Grocery' },
          { label: 'Catering / Tiffin Service / Sweet Shop', value: 'Catering / Sweet Shop' },
        ]
      }
    ]
  },
  {
    id: 'fssai-state-central',
    category: 'fssai',
    title: 'FSSAI State / Central Food License',
    tagline: 'For manufacturers, restaurants, distributors & cloud kitchens',
    icon: 'Award',
    color: 'red',
    badge: 'Full Compliance',
    govtFee: '₹2,000 - ₹5,000 (Govt)',
    consultationFee: '₹1,999',
    basePointsCost: 1999,
    baseAgentCommission: 450,
    processingTime: '10-15 Working Days',
    requiredDocs: ['PAN & Aadhaar of Authorized Signatory', 'Layout Plan & Equipment List', 'NOC & Rent Agreement', 'Water Test Report (for manufacturing)'],
    description: 'Full statutory compliance for food manufacturers, repacking units, food exporters, and restaurants with turnover above ₹12 Lakhs.',
    customFields: [
      {
        id: 'licenseType',
        label: 'License Authority Level (Select Tier) *',
        type: 'select',
        required: true,
        defaultValue: 'state_license',
        options: [
          { label: 'FSSAI State License (Turnover ₹12 Lakh - ₹20 Crore) • 1,999 Points', value: 'state_license', pointCost: 1999, commissionPoints: 450 },
          { label: 'FSSAI Central License (Turnover > ₹20 Crore / Exporter) • 4,999 Points', value: 'central_license', pointCost: 4999, commissionPoints: 1000 },
        ]
      },
      {
        id: 'foodUnitName',
        label: 'Manufacturing Unit / Firm Name *',
        type: 'text',
        required: true,
        placeholder: 'e.g. Doaba Agro Food Products Pvt Ltd',
      }
    ]
  },
  {
    id: 'gst-services',
    category: 'gst',
    title: 'GST Registration & Monthly Filing',
    tagline: 'New 15-digit GSTIN allotment and GSTR-1 / 3B compliance',
    icon: 'Receipt',
    color: 'emerald',
    badge: 'B2B Essential',
    govtFee: 'Nil',
    consultationFee: '₹999 / Reg',
    basePointsCost: 999,
    baseAgentCommission: 250,
    processingTime: '3-5 Working Days',
    requiredDocs: ['PAN Card & Aadhaar', 'Electricity Bill / Rent Agreement', 'Bank Account Cancelled Cheque', 'Passport Size Photo'],
    description: 'Seamless GST registration for sole proprietorship, partnership, and Pvt Ltd. Guaranteed hassle-free approval.',
    customFields: [
      {
        id: 'constitution',
        label: 'Business Constitution (Select Entity Type) *',
        type: 'select',
        required: true,
        defaultValue: 'proprietor',
        options: [
          { label: 'Sole Proprietorship GST Registration • 999 Points', value: 'proprietor', pointCost: 999, commissionPoints: 250 },
          { label: 'Partnership Firm / LLP GSTIN • 1,499 Points', value: 'partnership', pointCost: 1499, commissionPoints: 350 },
          { label: 'Private Limited / OPC Registration • 1,999 Points', value: 'pvt_ltd', pointCost: 1999, commissionPoints: 450 },
        ]
      },
      {
        id: 'tradeName',
        label: 'Trade / Business Name *',
        type: 'text',
        required: true,
        placeholder: 'e.g. Gill Sanitary Store',
      },
      {
        id: 'panNumber',
        label: 'Permanent Account Number (PAN) *',
        type: 'text',
        required: true,
        placeholder: 'e.g. ABCPG1234F',
      }
    ]
  },
  {
    id: 'msme-udyam',
    category: 'msme',
    title: 'MSME Udyam Registration Certificate',
    tagline: 'Govt. 19-digit Udyam number for business subsidies & collateral-free loans',
    icon: 'Briefcase',
    color: 'amber',
    badge: 'Govt Subsidized',
    govtFee: 'Nil',
    consultationFee: '₹499',
    basePointsCost: 499,
    baseAgentCommission: 150,
    processingTime: '24-48 Hours',
    requiredDocs: ['Aadhaar Card of Owner / Partner', 'PAN Card', 'Bank Account Details', 'Business Investment & Turnover Details'],
    description: 'Get instant official Udyam Registration Certificate with QR Code from Ministry of MSME. Avail priority sector loans, 50% patent discount & tender exemptions.',
    customFields: [
      {
        id: 'enterpriseType',
        label: 'Enterprise Category *',
        type: 'select',
        required: true,
        defaultValue: 'micro',
        options: [
          { label: 'Micro Enterprise (Investment < ₹1 Cr, Turnover < ₹5 Cr) • 499 Points', value: 'micro', pointCost: 499, commissionPoints: 150 },
          { label: 'Small Enterprise (Investment < ₹10 Cr, Turnover < ₹50 Cr) • 799 Points', value: 'small', pointCost: 799, commissionPoints: 200 },
          { label: 'Medium Enterprise (Investment < ₹50 Cr, Turnover < ₹250 Cr) • 1,299 Points', value: 'medium', pointCost: 1299, commissionPoints: 300 },
        ]
      },
      {
        id: 'enterpriseName',
        label: 'Enterprise / Unit Name *',
        type: 'text',
        required: true,
        placeholder: 'e.g. Punjab Agro & Engineering Works',
      },
      {
        id: 'aadhaarNumber',
        label: 'Applicant 12-Digit Aadhaar Number *',
        type: 'text',
        required: true,
        placeholder: 'e.g. 1234 5678 9012',
      },
      {
        id: 'panNumber',
        label: 'Business / Proprietor PAN *',
        type: 'text',
        required: true,
        placeholder: 'e.g. ABCDE1234F',
      }
    ]
  },
  {
    id: 'pan-dsc',
    category: 'pan',
    title: 'PAN Card Services (New & Correction)',
    tagline: 'Instant paperless e-PAN & physical PVC card delivery at doorstep',
    icon: 'CreditCard',
    color: 'blue',
    badge: 'Fast Track',
    govtFee: 'Standard',
    consultationFee: '₹199',
    basePointsCost: 199,
    baseAgentCommission: 50,
    processingTime: 'Same Day / 24-48 Hrs',
    requiredDocs: ['Aadhaar Card with Mobile Linked', 'Passport Photo', 'Signature Copy'],
    description: 'Instant paperless new PAN generation, minor PAN, address/name/DOB corrections, and physical PVC card delivery.',
    customFields: [
      {
        id: 'panApplicationType',
        label: 'PAN Service Type (Select Plan) *',
        type: 'select',
        required: true,
        defaultValue: 'new_pan',
        options: [
          { label: 'New PAN Card (Instant e-PAN + PVC Physical Delivery) • 199 Points', value: 'new_pan', pointCost: 199, commissionPoints: 50 },
          { label: 'PAN Correction (Name / Father Name / DOB Change) • 249 Points', value: 'pan_correction', pointCost: 249, commissionPoints: 60 },
          { label: 'Minor Child PAN (Guardian Assisted) • 299 Points', value: 'minor_pan', pointCost: 299, commissionPoints: 70 },
        ]
      },
      {
        id: 'aadhaarNumber',
        label: '12-Digit Aadhaar Number *',
        type: 'text',
        required: true,
        placeholder: 'XXXX-XXXX-XXXX',
      },
      {
        id: 'fatherName',
        label: "Father's Full Name",
        type: 'text',
        required: false,
        placeholder: "Father's Name for PAN card",
      }
    ]
  },
  {
    id: 'loan-business',
    category: 'loan',
    title: 'Business Loan (Collateral-Free)',
    tagline: 'Working capital, MSME credit, shop expansion up to ₹50 Lakh',
    icon: 'Building2',
    color: 'indigo',
    badge: 'Quick Disbursal',
    govtFee: 'Nil',
    consultationFee: 'Free Lead Assessment',
    basePointsCost: 0,
    baseAgentCommission: 2500,
    processingTime: '3-5 Working Days',
    requiredDocs: ['PAN & Aadhaar of Promoters', '12 Months Bank Statement', 'GST Returns (1 Year)', 'Business Proof (Udyam/Shop Act)'],
    description: 'Instant collateral-free loans from 40+ leading Banks & NBFCs with attractive interest rates starting 11.5% p.a.',
    customFields: [
      {
        id: 'loanAmountNeeded',
        label: 'Required Loan Amount *',
        type: 'select',
        required: true,
        defaultValue: '10_lakhs',
        options: [
          { label: '₹5 Lakhs - ₹15 Lakhs (Unsecured MSME)', value: '10_lakhs' },
          { label: '₹15 Lakhs - ₹30 Lakhs (Working Capital)', value: '25_lakhs' },
          { label: '₹30 Lakhs - ₹50 Lakhs (Machinery & Expansion)', value: '45_lakhs' },
        ]
      },
      {
        id: 'businessVintage',
        label: 'Years in Business',
        type: 'select',
        required: false,
        defaultValue: '2_5_years',
        options: [
          { label: '1 - 2 Years', value: '1_2_years' },
          { label: '2 - 5 Years', value: '2_5_years' },
          { label: 'More than 5 Years', value: 'above_5_years' },
        ]
      }
    ]
  },
  {
    id: 'loan-personal',
    category: 'loan',
    title: 'Instant Personal Loan',
    tagline: 'Emergency, medical, wedding or education up to ₹25 Lakh',
    icon: 'Wallet',
    color: 'cyan',
    badge: '100% Digital',
    govtFee: 'Nil',
    consultationFee: 'Free Eligibility Check',
    basePointsCost: 0,
    baseAgentCommission: 1200,
    processingTime: '24-48 Hours',
    requiredDocs: ['PAN & Aadhaar', 'Last 3 Months Salary Slips', '6 Months Salary Bank Statement', 'Address Proof'],
    description: 'Paperless personal loan approval for private and government salaried individuals with flexible EMI tenures.',
    customFields: [
      {
        id: 'monthlySalary',
        label: 'Monthly Take-Home Salary (₹)',
        type: 'number',
        required: true,
        placeholder: 'e.g. 35000',
      },
      {
        id: 'loanTenureYears',
        label: 'Desired EMI Tenure',
        type: 'select',
        required: false,
        defaultValue: '3_years',
        options: [
          { label: '1 Year (12 EMIs)', value: '1_year' },
          { label: '2 Years (24 EMIs)', value: '2_years' },
          { label: '3 Years (36 EMIs)', value: '3_years' },
          { label: '5 Years (60 EMIs)', value: '5_years' },
        ]
      }
    ]
  },
  {
    id: 'loan-home-lap',
    category: 'loan',
    title: 'Home Loan & LAP (Loan Against Property)',
    tagline: 'Low interest rates starting 8.4% p.a. with high tenure',
    icon: 'Home',
    color: 'teal',
    badge: 'Lowest ROI',
    govtFee: 'Processing Fee by Bank',
    consultationFee: 'Expert Assisted',
    basePointsCost: 0,
    baseAgentCommission: 5000,
    processingTime: '7-10 Days',
    requiredDocs: ['Property Registry / Fard Copy', 'Income Proofs / ITR (2-3 Yrs)', 'Aadhaar & PAN', 'Bank Statement (1 Yr)'],
    description: 'Finance new home purchase, construction, or unlock commercial/residential property value with Loan Against Property.',
    customFields: [
      {
        id: 'propertyKind',
        label: 'Property Type *',
        type: 'select',
        required: true,
        defaultValue: 'residential_house',
        options: [
          { label: 'Residential House / Kothi', value: 'residential_house' },
          { label: 'Commercial Shop / Showroom / SCO', value: 'commercial_shop' },
          { label: 'Open Plot / Agricultural Land', value: 'open_plot' },
        ]
      },
      {
        id: 'estValue',
        label: 'Estimated Property Value (₹)',
        type: 'text',
        required: false,
        placeholder: 'e.g. ₹60,00,000',
      }
    ]
  }
];

// LocalStorage helpers for dynamic Admin service management
const STORAGE_KEY_SERVICES = "b2b_portal_services_v3";

export function getPortalServices(): ServiceItem[] {
  if (typeof window === "undefined") return ALL_SERVICES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SERVICES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not read portal services:", e);
  }
  return ALL_SERVICES;
}

export function savePortalServices(services: ServiceItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
  } catch (e) {
    console.error("Failed to save portal services:", e);
  }
}

export function addPortalService(newService: ServiceItem): ServiceItem[] {
  const current = getPortalServices();
  const updated = [newService, ...current];
  savePortalServices(updated);
  return updated;
}

export function updatePortalService(updatedService: ServiceItem): ServiceItem[] {
  const current = getPortalServices();
  const updated = current.map(s => s.id === updatedService.id ? updatedService : s);
  savePortalServices(updated);
  return updated;
}

// Applications start empty for genuine user submissions (No demo applications)
export const INITIAL_APPLICATIONS: B2BApplication[] = [];
