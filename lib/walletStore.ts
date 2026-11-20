// B2B Wallet & Points Store (1 Rupee = 1 Point Ratio)
import { B2BUser, PRESET_USERS } from './b2bStore';

export interface WalletTransaction {
  id: string;
  userId: string;
  userRole: 'customer' | 'agent' | 'admin';
  userName: string;
  type: 'CREDIT_TOPUP' | 'DEBIT_SERVICE' | 'CREDIT_COMMISSION' | 'DEBIT_PAYOUT';
  points: number;       // 1 Rupee = 1 Point
  amountRupees: number; // Exactly equal to points
  serviceTitle?: string;
  trackingNumber?: string;
  description: string;
  date: string;
  time: string;
  status: 'Completed' | 'Pending';
  commissionToAgentCode?: string;
}

const STORAGE_KEY_WALLET_BALANCES = 'b2b_wallet_balances_v1';
const STORAGE_KEY_WALLET_TXS = 'b2b_wallet_transactions_v1';

// Initial default balances (Genuine user accounts start fresh)
// Initial default balances (Genuine user accounts start fresh)
const DEFAULT_BALANCES: Record<string, number> = {};

// Clean transaction list for genuine live transactions
const generateMockTransactions = (): WalletTransaction[] => [];

const DEFAULT_TXS: WalletTransaction[] = [];

// Helper to get raw balances from localStorage
function getRawBalances(): Record<string, number> {
  if (typeof window === 'undefined') return DEFAULT_BALANCES;
  try {
    const data = localStorage.getItem(STORAGE_KEY_WALLET_BALANCES);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse wallet balances:', e);
  }
  localStorage.setItem(STORAGE_KEY_WALLET_BALANCES, JSON.stringify(DEFAULT_BALANCES));
  return DEFAULT_BALANCES;
}

// Helper to save balances
function saveRawBalances(balances: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_WALLET_BALANCES, JSON.stringify(balances));
  } catch (e) {
    console.error('Failed to save wallet balances:', e);
  }
}

// Helper to get transactions
export function getRawTransactions(): WalletTransaction[] {
  if (typeof window === 'undefined') return DEFAULT_TXS;
  try {
    const data = localStorage.getItem(STORAGE_KEY_WALLET_TXS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse wallet txs:', e);
  }
  localStorage.setItem(STORAGE_KEY_WALLET_TXS, JSON.stringify(DEFAULT_TXS));
  return DEFAULT_TXS;
}

// Helper to save transactions
function saveRawTransactions(txs: WalletTransaction[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_WALLET_TXS, JSON.stringify(txs));
  } catch (e) {
    console.error('Failed to save wallet txs:', e);
  }
}

// 1. Get Wallet Points for a given user (1 Rupee = 1 Point)
export function getUserWalletPoints(user: B2BUser | null): number {
  if (!user) return 0;
  const balances = getRawBalances();
  if (balances[user.uid] !== undefined) {
    return balances[user.uid];
  }
  // Initialize default if new user (Starts fresh with 0 points)
  const initBal = 0;
  balances[user.uid] = initBal;
  saveRawBalances(balances);
  return initBal;
}

// 2. Get User's Wallet Transactions
export function getUserWalletTransactions(user: B2BUser | null): WalletTransaction[] {
  if (!user) return [];
  const allTxs = getRawTransactions();
  if (user.role === 'admin') {
    return allTxs; // Admin sees all
  }
  return allTxs.filter(tx => tx.userId === user.uid);
}

// 3. Add Points to Wallet (Customer or Agent)
export function addPointsToWallet(
  user: B2BUser,
  points: number,
  paymentMethod: string = 'UPI Instant Topup'
): { success: boolean; newPoints: number; transaction: WalletTransaction } {
  if (points <= 0) throw new Error('Points must be greater than zero');

  const balances = getRawBalances();
  const current = balances[user.uid] !== undefined ? balances[user.uid] : 0;
  const updated = current + points;
  balances[user.uid] = updated;
  saveRawBalances(balances);

  const now = new Date();
  const tx: WalletTransaction = {
    id: `TX-ADD-${Date.now().toString().slice(-6)}`,
    userId: user.uid,
    userRole: user.role,
    userName: user.name,
    type: 'CREDIT_TOPUP',
    points,
    amountRupees: points,
    description: `Wallet Points Recharge via ${paymentMethod} (1 Rupee = 1 Point)`,
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    status: 'Completed',
  };

  const allTxs = getRawTransactions();
  const updatedTxs = [tx, ...allTxs];
  saveRawTransactions(updatedTxs);

  return { success: true, newPoints: updated, transaction: tx };
}

// 4. Auto-Cut Service Payment from Wallet Points
export function autoCutServicePoints(
  user: B2BUser,
  pointsToCut: number,
  serviceTitle: string,
  trackingNumber: string,
  agentCommissionPoints?: number,
  assignedAgentCode: string = 'AG-PB-104'
): {
  success: boolean;
  newBalance: number;
  userTx: WalletTransaction;
  agentCommissionTx?: WalletTransaction;
  error?: string;
} {
  const balances = getRawBalances();
  const currentBal = balances[user.uid] !== undefined ? balances[user.uid] : 0;

  if (currentBal < pointsToCut) {
    return {
      success: false,
      newBalance: currentBal,
      userTx: null as any,
      error: `Insufficient Points! Required: ${pointsToCut} Pts (₹${pointsToCut}), Available: ${currentBal} Pts (₹${currentBal}). Please add points.`,
    };
  }

  // Deduct from user
  const updatedUserBal = currentBal - pointsToCut;
  balances[user.uid] = updatedUserBal;

  const now = new Date();
  const userTx: WalletTransaction = {
    id: `TX-CUT-${Date.now().toString().slice(-6)}`,
    userId: user.uid,
    userRole: user.role,
    userName: user.name,
    type: 'DEBIT_SERVICE',
    points: pointsToCut,
    amountRupees: pointsToCut,
    serviceTitle,
    trackingNumber,
    description: `Auto-cut service payment for ${serviceTitle} (${trackingNumber})`,
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    status: 'Completed',
  };

  const allTxs = getRawTransactions();
  let updatedTxs = [userTx, ...allTxs];

  // 5. AUTO COMMISSION DISTRIBUTION FOR AGENT:
  let agentCommissionTx: WalletTransaction | undefined = undefined;
  if (agentCommissionPoints && agentCommissionPoints > 0) {
    // Find agent user
    const agentUid = PRESET_USERS.agent.uid;
    const currentAgentBal = balances[agentUid] !== undefined ? balances[agentUid] : 18450;
    const updatedAgentBal = currentAgentBal + agentCommissionPoints;
    balances[agentUid] = updatedAgentBal;

    agentCommissionTx = {
      id: `TX-COMM-${Date.now().toString().slice(-6)}`,
      userId: agentUid,
      userRole: 'agent',
      userName: PRESET_USERS.agent.name,
      type: 'CREDIT_COMMISSION',
      points: agentCommissionPoints,
      amountRupees: agentCommissionPoints,
      serviceTitle,
      trackingNumber,
      description: `Auto-Commission credited for ${serviceTitle} (${trackingNumber}) - Client: ${user.name}`,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'Completed',
      commissionToAgentCode: assignedAgentCode,
    };

    updatedTxs = [agentCommissionTx, ...updatedTxs];
  }

  saveRawBalances(balances);
  saveRawTransactions(updatedTxs);

  return {
    success: true,
    newBalance: updatedUserBal,
    userTx,
    agentCommissionTx,
  };
}

// Preset Service Points & Auto Commission Table
export interface ServiceCommissionRule {
  serviceId: string;
  serviceTitle: string;
  pointsCost: number;       // In Points (1 Rupee = 1 Point)
  agentCommissionPoints: number; // In Points auto-distributed to Agent
  category: string;
}

export const SERVICE_COMMISSION_RULES: Record<string, ServiceCommissionRule> = {
  'itr-salaried': {
    serviceId: 'itr-salaried',
    serviceTitle: 'ITR-1 (Salaried Return)',
    pointsCost: 499,
    agentCommissionPoints: 100,
    category: 'itr',
  },
  'itr-business': {
    serviceId: 'itr-business',
    serviceTitle: 'ITR-3 & ITR-4 (Business & Profession)',
    pointsCost: 999,
    agentCommissionPoints: 250,
    category: 'itr',
  },
  'itr-u': {
    serviceId: 'itr-u',
    serviceTitle: 'ITR-U (Updated Tax Return)',
    pointsCost: 1499,
    agentCommissionPoints: 350,
    category: 'itr',
  },
  'loan-business': {
    serviceId: 'loan-business',
    serviceTitle: 'Business Loan (Collateral-Free)',
    pointsCost: 0, // Free assessment lead
    agentCommissionPoints: 2500, // On bank sanction
    category: 'loan',
  },
  'loan-personal': {
    serviceId: 'loan-personal',
    serviceTitle: 'Instant Personal Loan',
    pointsCost: 0,
    agentCommissionPoints: 1200,
    category: 'loan',
  },
  'loan-home-lap': {
    serviceId: 'loan-home-lap',
    serviceTitle: 'Home Loan & LAP (Loan Against Property)',
    pointsCost: 0,
    agentCommissionPoints: 5000,
    category: 'loan',
  },
  'insurance-commercial': {
    serviceId: 'insurance-commercial',
    serviceTitle: 'Commercial Vehicle Insurance (3rd Party)',
    pointsCost: 2150,
    agentCommissionPoints: 350,
    category: 'insurance',
  },
  'insurance-private': {
    serviceId: 'insurance-private',
    serviceTitle: 'Car & 2-Wheeler 3rd Party Insurance',
    pointsCost: 950,
    agentCommissionPoints: 150,
    category: 'insurance',
  },
  'fssai-registration': {
    serviceId: 'fssai-registration',
    serviceTitle: 'FSSAI Basic Food Registration',
    pointsCost: 799,
    agentCommissionPoints: 200,
    category: 'fssai',
  },
  'fssai-state-central': {
    serviceId: 'fssai-state-central',
    serviceTitle: 'FSSAI State / Central Food License',
    pointsCost: 1999,
    agentCommissionPoints: 450,
    category: 'fssai',
  },
  'gst-services': {
    serviceId: 'gst-services',
    serviceTitle: 'GST Registration & Monthly Filing',
    pointsCost: 999,
    agentCommissionPoints: 250,
    category: 'gst',
  },
  'msme-udyam': {
    serviceId: 'msme-udyam',
    serviceTitle: 'MSME Udyam Registration Certificate',
    pointsCost: 499,
    agentCommissionPoints: 150,
    category: 'msme',
  },
  'pan-dsc': {
    serviceId: 'pan-dsc',
    serviceTitle: 'PAN Card Services (New & Correction)',
    pointsCost: 199,
    agentCommissionPoints: 50,
    category: 'pan',
  },
};
