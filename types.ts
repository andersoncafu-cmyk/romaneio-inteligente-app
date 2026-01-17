
export interface Invoice {
  id: string;
  number: string;
  companyName: string;
  value: number;
  freight: number;
}

export interface Manifest {
  id: string;
  date: string;
  freightRate: number; // The percentage value (e.g., 2 for 2%)
  invoices: Invoice[];
  createdAt: number;
}

export interface AppSettings {
  defaultFreightRate: number;
}
