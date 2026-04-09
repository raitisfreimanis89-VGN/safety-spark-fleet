export interface Driver {
  id: string;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  truckNumber: string;
  trailerNumber: string;
  assignedDriverId?: string;
  createdAt: string;
}

export type TreadStatus = 'good' | 'bad' | 'uneven';
export type BrakeResult = 'pass' | 'fail';
export type DOTResult = 'pass' | 'violation' | 'oos';

// Axle mapping for 5-axle US commercial truck
export const AXLE_CONFIG = [
  { name: 'Steer Axle', tyreCount: 2 },
  { name: 'Drive Axle 1', tyreCount: 4 },
  { name: 'Drive Axle 2', tyreCount: 4 },
  { name: 'Trailer Axle 1', tyreCount: 4 },
  { name: 'Trailer Axle 2', tyreCount: 4 },
] as const;

export interface TyreReading {
  axleIndex: number;
  position: 'left' | 'right';
  status: TreadStatus;
}

export interface TyreRecord {
  id: string;
  vehicleId: string;
  date: string;
  photoDate: string;
  photoUrl?: string;
  readings: TyreReading[];
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceDate: string;
  nextInspectionDate: string; // serviceDate + 60 days
  notes?: string;
}

export interface BrakeTestRecord {
  id: string;
  vehicleId: string;
  testDate: string;
  result: BrakeResult;
  notes?: string;
}

export interface DOTInspectionRecord {
  id: string;
  vehicleId: string;
  driverId?: string;
  inspectionDate: string;
  result: DOTResult;
  notes?: string;
}

export interface MileageRecord {
  id: string;
  vehicleId: string;
  driverId: string;
  date: string;
  mileage: number;
}
