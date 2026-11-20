import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR NAV ICONS — flat, solid glyphs matching reference image style
   (Uniform warm cream/tan tone, clean corporate silhouette)
   ══════════════════════════════════════════════════════════════ */

/** Dashboard — Speedometer dial with needle (matching reference Icon 1) */
export const NavIconDashboard: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3a9 9 0 00-9 9c0 2.2.8 4.2 2.1 5.8L6.5 19h11l1.4-1.2A8.96 8.96 0 0021 12a9 9 0 00-9-9zm-4.5 9a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm3-4a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm3 0a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm3 4a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm-4.7 1.2a1.8 1.8 0 112.4-2.4l2.8-4.8-5.2 7.2z"/>
  </svg>
);

/** ITR — Document with folded corner & lines (matching reference Icon 4) */
export const NavIconITR: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM8 12h8v1.8H8V12zm0 3.2h8V17H8v-1.8zm0 3.2h5v1.8H8v-1.8z"/>
  </svg>
);

/** Loan — Banknote with circular coin emblem in center (matching reference Icon 3) */
export const NavIconLoan: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm3 1a1 1 0 000 2 1 1 0 000-2zm14 0a1 1 0 100 2 1 1 0 000-2zM5 15a1 1 0 100 2 1 1 0 000-2zm14 0a1 1 0 100 2 1 1 0 000-2zm-7-6a3 3 0 100 6 3 3 0 000-6zm0 1.2a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6z"/>
  </svg>
);

/** Insurance — Shield with checkmark */
export const NavIconInsurance: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L4 5.5v6.2c0 5.2 3.4 10.1 8 11.3 4.6-1.2 8-6.1 8-11.3V5.5L12 2zm-1.2 14.5l-3.8-3.8 1.4-1.4 2.4 2.4 5.4-5.4 1.4 1.4-6.8 6.8z"/>
  </svg>
);

/** FSSAI — Food certification badge / fork & spoon */
export const NavIconFSSAI: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-3 5.5c.6 0 1 .4 1 1V11c0 .8-.5 1.5-1.2 1.8V17H7.8v-4.2C7.1 12.5 6.6 11.8 6.6 11V8.5c0-.6.4-1 1-1h.2c.4 0 .8.3.9.7.1-.4.5-.7.9-.7h.2c.4 0 .8.3.9.7.1-.4.5-.7.9-.7h.2c.6 0 1 .4 1 1v2.5zm7.4 0c1.2 0 2.2 1.2 2.2 2.8 0 1.2-.6 2.2-1.4 2.6V17h-1.6v-4.1c-.8-.4-1.4-1.4-1.4-2.6 0-1.6 1-2.8 2.2-2.8z"/>
  </svg>
);

/** GST — Invoice tax file with seal badge */
export const NavIconGST: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-2 4h-4V5.5h4V7zm0 3.5h-4V9h4v1.5zm0 3.5h-4v-1.5h4V14zm-6-7H7V5.5h4V7zm0 3.5H7V9h4v1.5zm0 3.5H7v-1.5h4V14zm-4 4v-1.5h10v1.5H7z"/>
  </svg>
);

/** MSME — Industry Factory / Unit emblem */
export const NavIconMSME: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4 21V10l5 3V10l5 3V7l6 3v11H4zm3-2h2v-2H7v2zm5 0h2v-2h-2v2zm5 0h2v-2h-2v2zm-10-4h2v-2H7v2zm5 0h2v-2h-2v2zm5 0h2v-2h-2v2z"/>
  </svg>
);

export const IconMSME: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 20h16a2 2 0 0 0 2-2V8l-6-4-6 4v10a2 2 0 0 0 2 2z"/>
    <path d="M14 12v8"/>
    <path d="M10 12v8"/>
  </svg>
);

/** PAN — Identification ID Card with chip */
export const NavIconPAN: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM7.5 7.5a2 2 0 110 4 2 2 0 010-4zM11 16H4v-.5c0-1.7 2.3-2.5 3.5-2.5s3.5.8 3.5 2.5v.5zm7.5 0h-5.5v-1.5h5.5V16zm0-3h-5.5v-1.5h5.5V13zm0-3h-5.5V8.5h5.5V10z"/>
  </svg>
);

/** Wallet — Passbook / Ledger book with lines (matching reference Icon 5) */
export const NavIconWallet: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M18 2H7a3 3 0 00-3 3v14a3 3 0 003 3h11a2 2 0 002-2V4a2 2 0 00-2-2zm-1 5H9V5.5h8V7zm0 3H9V8.5h8V10zm-3 3H9v-1.5h5V13zm3 6.5H7a1.5 1.5 0 010-3h10v3z"/>
  </svg>
);

/** Track — Gift / Delivery package or file tracker (matching reference Icon 2) */
export const NavIconTrack: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 7h-2.1a3.5 3.5 0 00-5.9-2.5c-.3.4-.6.8-.8 1.3-.2-.5-.5-.9-.8-1.3a3.5 3.5 0 00-5.9 2.5H2.5A1.5 1.5 0 001 8.5v3A1.5 1.5 0 002.5 13H3v7a2 2 0 002 2h14a2 2 0 002-2v-7h.5a1.5 1.5 0 001.5-1.5v-3A1.5 1.5 0 0020 7zM11 6.3a1.7 1.7 0 012.3 0c.5.5.7 1.2.7 1.9h-3.7c0-.7.2-1.4.7-1.9zm-4.7 0a1.7 1.7 0 012.4 0c.4.5.6 1.2.6 1.9H5.6c0-.7.2-1.4.7-1.9zM11 20H5v-7h6v7zm8 0h-6v-7h6v7zm1.5-9H13V9h7.5v2zm-15 0H2V9h7.5v2H5.5z"/>
  </svg>
);

/** Admin — Super Admin Master Hub badge */
export const NavIconAdmin: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3 3 0 110 6 3 3 0 010-6zm4.5 12.5a5.9 5.9 0 00-9 0v.5h9v-.5z"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   SERVICE BRAND LOGO ICONS  (colored, recognisable)
   ══════════════════════════════════════════════════════════════ */

/** Income Tax India – blue Ashoka chakra + "IT" */
export const LogoITR: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="8" fill="#003580"/>
    <circle cx="18" cy="18" r="10" fill="#003580" stroke="#f7a800" strokeWidth="2"/>
    <circle cx="18" cy="18" r="6" fill="none" stroke="#f7a800" strokeWidth="1"/>
    {/* spokes */}
    {[0,45,90,135,180,225,270,315].map((deg,i)=>(
      <line key={i}
        x1={18 + 6*Math.cos(deg*Math.PI/180)}
        y1={18 + 6*Math.sin(deg*Math.PI/180)}
        x2={18 + 10*Math.cos(deg*Math.PI/180)}
        y2={18 + 10*Math.sin(deg*Math.PI/180)}
        stroke="#f7a800" strokeWidth="1.2"/>
    ))}
    <text x="18" y="22" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="8" fill="#ffffff">IT</text>
  </svg>
);

/** Bank Loan – SBI-style building columns */
export const LogoLoan: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="8" fill="#1a3a6b"/>
    {/* pediment */}
    <polygon points="4,14 18,5 32,14" fill="#f7c948"/>
    {/* columns */}
    <rect x="6"  y="14" width="3.5" height="13" fill="#ffffff"/>
    <rect x="12" y="14" width="3.5" height="13" fill="#ffffff"/>
    <rect x="18" y="14" width="3.5" height="13" fill="#ffffff"/>
    <rect x="24" y="14" width="3.5" height="13" fill="#ffffff"/>
    {/* base */}
    <rect x="4" y="27" width="28" height="3" rx="1" fill="#f7c948"/>
    <text x="18" y="34.5" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="4.5" fill="#f7c948">BANK</text>
  </svg>
);

/** IRDAI Insurance – shield with car */
export const LogoInsurance: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="8" fill="#c0392b"/>
    {/* shield */}
    <path d="M18 4 L30 8 L30 20 Q30 30 18 34 Q6 30 6 20 L6 8 Z" fill="#e74c3c" stroke="#fff" strokeWidth="1.5"/>
    {/* car body */}
    <rect x="9" y="20" width="18" height="7" rx="2" fill="#ffffff"/>
    <path d="M11 20 L14 14 L22 14 L25 20" fill="#ffffff"/>
    <circle cx="13" cy="27" r="2" fill="#c0392b"/>
    <circle cx="23" cy="27" r="2" fill="#c0392b"/>
  </svg>
);

/** FSSAI – green circle with fork+spoon */
export const LogoFSSAI: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="8" fill="#138808"/>
    <circle cx="18" cy="18" r="12" fill="#138808" stroke="#ffffff" strokeWidth="2"/>
    {/* fork */}
    <line x1="13" y1="8"  x2="13" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
    <line x1="11" y1="8"  x2="11" y2="14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="15" y1="8"  x2="15" y2="14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round"/>
    {/* spoon */}
    <ellipse cx="23" cy="12" rx="3" ry="4.5" fill="none" stroke="#ffffff" strokeWidth="1.8"/>
    <line x1="23" y1="16.5" x2="23" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
    <text x="18" y="35" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="4" fill="#ffffff">FSSAI</text>
  </svg>
);

/** GST India – orange gear with GSTIN text */
export const LogoGST: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="8" fill="#ff6600"/>
    {/* outer ring */}
    <circle cx="18" cy="17" r="11" fill="#e65c00" stroke="#ffffff" strokeWidth="1.5"/>
    {/* gear teeth */}
    {[0,45,90,135,180,225,270,315].map((deg,i)=>{
      const r1=11, r2=14, mid=deg*Math.PI/180;
      const spread=12*Math.PI/180;
      return <polygon key={i} points={
        `${18+r1*Math.cos(mid-spread)},${17+r1*Math.sin(mid-spread)} ` +
        `${18+r2*Math.cos(mid-spread)},${17+r2*Math.sin(mid-spread)} ` +
        `${18+r2*Math.cos(mid+spread)},${17+r2*Math.sin(mid+spread)} ` +
        `${18+r1*Math.cos(mid+spread)},${17+r1*Math.sin(mid+spread)}`
      } fill="#ff6600" stroke="#fff" strokeWidth="0.5"/>;
    })}
    <circle cx="18" cy="17" r="7" fill="#ff6600"/>
    <text x="18" y="19.5" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="7" fill="#ffffff">GST</text>
  </svg>
);

/** PAN Card – NSDL blue card with PAN text */
export const LogoPAN: React.FC<IconProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="8" fill="#003366"/>
    {/* card */}
    <rect x="4" y="9" width="28" height="18" rx="2.5" fill="#1565c0" stroke="#90caf9" strokeWidth="1"/>
    {/* chip */}
    <rect x="7" y="13" width="6" height="5" rx="1" fill="#f7c948" stroke="#b8960c" strokeWidth="0.5"/>
    {/* PAN text */}
    <text x="18" y="20" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="8" fill="#ffffff">PAN</text>
    {/* lines */}
    <line x1="7" y1="22.5" x2="29" y2="22.5" stroke="#90caf9" strokeWidth="0.8"/>
    <line x1="7" y1="24.5" x2="20" y2="24.5" stroke="#90caf9" strokeWidth="0.8"/>
    <text x="18" y="33" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="4" fill="#90caf9">NSDL / UTI</text>
  </svg>
);

export const IconLogo: React.FC<IconProps> = ({ className = "w-6 h-6", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export const IconDashboard: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

export const IconITR: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const IconLoan: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export const IconInsurance: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const IconFSSAI: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

export const IconGST: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M7 7h10" />
    <path d="M7 12h10" />
    <path d="M7 17h6" />
  </svg>
);

export const IconPAN: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

export const IconTrack: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const IconAdmin: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const IconUser: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const IconPhone: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const IconWhatsApp: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export const IconArrowRight: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const IconUpload: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const IconShield: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const IconMenu: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

export const IconX: React.FC<IconProps> = ({ className = "w-5 h-5", size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
