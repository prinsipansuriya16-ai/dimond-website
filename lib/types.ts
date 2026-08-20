export type Role = "buyer" | "seller";

export type AccountStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface KycDocument {
  id?: string;
  label: string;
  fileName: string;
  storagePath: string;
  uploadedAt: string;
}

export interface Account {
  id: string;
  role: Role | "admin";
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  status: AccountStatus;
  kycDocuments: KycDocument[];
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export type DiamondShape =
  | "Round"
  | "Princess"
  | "Emerald"
  | "Oval"
  | "Pear"
  | "Cushion"
  | "Marquise"
  | "Radiant";

export type DiamondClarity =
  | "FL"
  | "IF"
  | "VVS1"
  | "VVS2"
  | "VS1"
  | "VS2"
  | "SI1"
  | "SI2";

export type DiamondColor = "D" | "E" | "F" | "G" | "H" | "I" | "J";

export type DiamondCut = "Excellent" | "Very Good" | "Good" | "Fair";

export type CertLab = "GIA" | "IGI" | "HRD" | "FGA";

export interface DiamondListing {
  id: string;
  sellerId: string;
  sellerCompany: string;
  sellerPhone: string;
  stockNumber: string;
  shape: DiamondShape;
  carat: number;
  clarity: DiamondClarity;
  color: DiamondColor;
  cut: DiamondCut;
  certLab: CertLab;
  certNumber: string;
  pricePerCarat: number;
  location: string;
  fluorescence: string;
  measurements: string;
  imageUrl: string;
  status: "AVAILABLE" | "ON_HOLD" | "SOLD";
  createdAt: string;
}

export interface SessionUser {
  id: string;
  role: Role;
  companyName: string;
  email: string;
  status: AccountStatus;
}
