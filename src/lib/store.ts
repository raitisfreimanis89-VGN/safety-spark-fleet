import { addDays, parseISO } from 'date-fns';
import type {
  Driver, Vehicle, MaintenanceRecord, BrakeTestRecord,
  TyreRecord, DOTInspectionRecord, MileageRecord
} from '@/types/fleet';

const KEYS = {
  drivers: 'fleet_drivers',
  vehicles: 'fleet_vehicles',
  maintenance: 'fleet_maintenance',
  brakeTests: 'fleet_brake_tests',
  tyreRecords: 'fleet_tyre_records',
  dotInspections: 'fleet_dot_inspections',
  mileageRecords: 'fleet_mileage_records',
} as const;

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function genId() {
  return crypto.randomUUID();
}

// Drivers
export const getDrivers = () => load<Driver>(KEYS.drivers);
export const addDriver = (name: string) => {
  const drivers = getDrivers();
  const driver: Driver = { id: genId(), name, createdAt: new Date().toISOString() };
  drivers.push(driver);
  save(KEYS.drivers, drivers);
  return driver;
};
export const deleteDriver = (id: string) => {
  save(KEYS.drivers, getDrivers().filter(d => d.id !== id));
};

// Vehicles
export const getVehicles = () => load<Vehicle>(KEYS.vehicles);
export const addVehicle = (truckNumber: string, trailerNumber: string, assignedDriverId?: string) => {
  const vehicles = getVehicles();
  const vehicle: Vehicle = { id: genId(), truckNumber, trailerNumber, assignedDriverId, createdAt: new Date().toISOString() };
  vehicles.push(vehicle);
  save(KEYS.vehicles, vehicles);
  return vehicle;
};
export const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
  const vehicles = getVehicles().map(v => v.id === id ? { ...v, ...updates } : v);
  save(KEYS.vehicles, vehicles);
};
export const deleteVehicle = (id: string) => {
  save(KEYS.vehicles, getVehicles().filter(v => v.id !== id));
};

// Maintenance
export const getMaintenanceRecords = (vehicleId?: string) => {
  const all = load<MaintenanceRecord>(KEYS.maintenance);
  return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
};
export const addMaintenanceRecord = (vehicleId: string, serviceDate: string, notes?: string) => {
  const records = load<MaintenanceRecord>(KEYS.maintenance);
  const nextInspectionDate = addDays(parseISO(serviceDate), 60).toISOString();
  const record: MaintenanceRecord = { id: genId(), vehicleId, serviceDate, nextInspectionDate, notes };
  records.push(record);
  save(KEYS.maintenance, records);
  return record;
};

// Brake Tests
export const getBrakeTests = (vehicleId?: string) => {
  const all = load<BrakeTestRecord>(KEYS.brakeTests);
  return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
};
export const addBrakeTest = (vehicleId: string, testDate: string, result: 'pass' | 'fail', notes?: string) => {
  const records = load<BrakeTestRecord>(KEYS.brakeTests);
  const record: BrakeTestRecord = { id: genId(), vehicleId, testDate, result, notes };
  records.push(record);
  save(KEYS.brakeTests, records);
  return record;
};

// Tyre Records
export const getTyreRecords = (vehicleId?: string) => {
  const all = load<TyreRecord>(KEYS.tyreRecords);
  return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
};
export const addTyreRecord = (record: Omit<TyreRecord, 'id'>) => {
  const records = load<TyreRecord>(KEYS.tyreRecords);
  const newRecord = { ...record, id: genId() };
  records.push(newRecord);
  save(KEYS.tyreRecords, records);
  return newRecord;
};

// DOT Inspections
export const getDOTInspections = (vehicleId?: string) => {
  const all = load<DOTInspectionRecord>(KEYS.dotInspections);
  return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
};
export const addDOTInspection = (vehicleId: string, driverId: string | undefined, inspectionDate: string, result: 'pass' | 'violation' | 'oos', notes?: string) => {
  const records = load<DOTInspectionRecord>(KEYS.dotInspections);
  const record: DOTInspectionRecord = { id: genId(), vehicleId, driverId, inspectionDate, result, notes };
  records.push(record);
  save(KEYS.dotInspections, records);
  return record;
};

// Mileage
export const getMileageRecords = (vehicleId?: string) => {
  const all = load<MileageRecord>(KEYS.mileageRecords);
  return vehicleId ? all.filter(r => r.vehicleId === vehicleId) : all;
};
export const addMileageRecord = (vehicleId: string, driverId: string, mileage: number) => {
  const records = load<MileageRecord>(KEYS.mileageRecords);
  const record: MileageRecord = { id: genId(), vehicleId, driverId, date: new Date().toISOString(), mileage };
  records.push(record);
  save(KEYS.mileageRecords, records);
  return record;
};
