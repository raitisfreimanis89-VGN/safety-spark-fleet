import { addDays, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type {
  Driver, Vehicle, MaintenanceRecord, BrakeTestRecord,
  TyreRecord, DOTInspectionRecord, MileageRecord, TyreReading
} from '@/types/fleet';

// Drivers
export const getDrivers = async (): Promise<Driver[]> => {
  const { data, error } = await supabase.from('drivers').select('*');
  if (error) { console.error('getDrivers', error); return []; }
  return (data || []).map(d => ({ id: d.id, name: d.name, createdAt: d.created_at || '' }));
};

export const addDriver = async (name: string): Promise<Driver> => {
  const { data, error } = await supabase.from('drivers').insert({ name }).select().single();
  if (error) throw error;
  return { id: data.id, name: data.name, createdAt: data.created_at || '' };
};

export const deleteDriver = async (id: string) => {
  const { error } = await supabase.from('drivers').delete().eq('id', id);
  if (error) throw error;
};

// Vehicles
export const getVehicles = async (): Promise<Vehicle[]> => {
  const { data, error } = await supabase.from('vehicles').select('*');
  if (error) { console.error('getVehicles', error); return []; }
  return (data || []).map(v => ({
    id: v.id, truckNumber: v.truck_number, trailerNumber: v.trailer_number,
    assignedDriverId: v.assigned_driver_id || undefined, createdAt: v.created_at || '',
  }));
};

export const addVehicle = async (truckNumber: string, trailerNumber: string, assignedDriverId?: string) => {
  const { data, error } = await supabase.from('vehicles').insert({
    truck_number: truckNumber, trailer_number: trailerNumber,
    assigned_driver_id: assignedDriverId || null,
  }).select().single();
  if (error) throw error;
  return { id: data.id, truckNumber: data.truck_number, trailerNumber: data.trailer_number, assignedDriverId: data.assigned_driver_id || undefined, createdAt: data.created_at || '' };
};

export const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
  const mapped: { truck_number?: string; trailer_number?: string; assigned_driver_id?: string | null } = {};
  if (updates.truckNumber !== undefined) mapped.truck_number = updates.truckNumber;
  if (updates.trailerNumber !== undefined) mapped.trailer_number = updates.trailerNumber;
  if (updates.assignedDriverId !== undefined) mapped.assigned_driver_id = updates.assignedDriverId || null;
  const { error } = await supabase.from('vehicles').update(mapped).eq('id', id);
  if (error) throw error;
};

export const deleteVehicle = async (id: string) => {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
};

// Maintenance
export const getMaintenanceRecords = async (vehicleId?: string): Promise<MaintenanceRecord[]> => {
  let q = supabase.from('maintenance_records').select('*');
  if (vehicleId) q = q.eq('vehicle_id', vehicleId);
  const { data, error } = await q;
  if (error) { console.error('getMaintenanceRecords', error); return []; }
  return (data || []).map(r => ({
    id: r.id, vehicleId: r.vehicle_id || '', serviceDate: r.service_date,
    nextInspectionDate: r.next_inspection_date, notes: r.notes || undefined,
  }));
};

export const addMaintenanceRecord = async (vehicleId: string, serviceDate: string, notes?: string) => {
  const nextInspectionDate = addDays(parseISO(serviceDate), 60).toISOString();
  const { data, error } = await supabase.from('maintenance_records').insert({
    vehicle_id: vehicleId, service_date: serviceDate, next_inspection_date: nextInspectionDate, notes: notes || null,
  }).select().single();
  if (error) throw error;
  return { id: data.id, vehicleId: data.vehicle_id || '', serviceDate: data.service_date, nextInspectionDate: data.next_inspection_date, notes: data.notes || undefined };
};

// Brake Tests
export const getBrakeTests = async (vehicleId?: string): Promise<BrakeTestRecord[]> => {
  let q = supabase.from('brake_tests').select('*');
  if (vehicleId) q = q.eq('vehicle_id', vehicleId);
  const { data, error } = await q;
  if (error) { console.error('getBrakeTests', error); return []; }
  return (data || []).map(r => ({
    id: r.id, vehicleId: r.vehicle_id || '', testDate: r.test_date,
    result: (r.result as 'pass' | 'fail') || 'pass', notes: r.notes || undefined,
  }));
};

export const addBrakeTest = async (vehicleId: string, testDate: string, result: 'pass' | 'fail', notes?: string) => {
  const { data, error } = await supabase.from('brake_tests').insert({
    vehicle_id: vehicleId, test_date: testDate, result, notes: notes || null,
  }).select().single();
  if (error) throw error;
  return data;
};

// Tyre Records
export const getTyreRecords = async (vehicleId?: string): Promise<TyreRecord[]> => {
  let q = supabase.from('tyre_records').select('*');
  if (vehicleId) q = q.eq('vehicle_id', vehicleId);
  const { data, error } = await q;
  if (error) { console.error('getTyreRecords', error); return []; }
  return (data || []).map(r => ({
    id: r.id, vehicleId: r.vehicle_id || '', date: r.created_at || '',
    photoDate: r.photo_date, readings: (r.readings as unknown as TyreReading[]) || [],
  }));
};

export const addTyreRecord = async (record: Omit<TyreRecord, 'id'>) => {
  const { data, error } = await supabase.from('tyre_records').insert({
    vehicle_id: record.vehicleId, photo_date: record.photoDate, readings: record.readings as unknown as Record<string, unknown>,
  }).select().single();
  if (error) throw error;
  return data;
};

// DOT Inspections
export const getDOTInspections = async (vehicleId?: string): Promise<DOTInspectionRecord[]> => {
  let q = supabase.from('dot_inspections').select('*');
  if (vehicleId) q = q.eq('vehicle_id', vehicleId);
  const { data, error } = await q;
  if (error) { console.error('getDOTInspections', error); return []; }
  return (data || []).map(r => ({
    id: r.id, vehicleId: r.vehicle_id || '', driverId: r.driver_id || undefined,
    inspectionDate: r.inspection_date, result: (r.result as 'pass' | 'violation' | 'oos') || 'pass',
    notes: r.notes || undefined,
  }));
};

export const addDOTInspection = async (vehicleId: string, driverId: string | undefined, inspectionDate: string, result: 'pass' | 'violation' | 'oos', notes?: string) => {
  const { data, error } = await supabase.from('dot_inspections').insert({
    vehicle_id: vehicleId, driver_id: driverId || null, inspection_date: inspectionDate, result, notes: notes || null,
  }).select().single();
  if (error) throw error;
  return data;
};

// Mileage
export const getMileageRecords = async (vehicleId?: string): Promise<MileageRecord[]> => {
  let q = supabase.from('mileage_records').select('*');
  if (vehicleId) q = q.eq('vehicle_id', vehicleId);
  const { data, error } = await q;
  if (error) { console.error('getMileageRecords', error); return []; }
  return (data || []).map(r => ({
    id: r.id, vehicleId: r.vehicle_id || '', driverId: r.driver_id || '',
    date: r.date || '', mileage: r.mileage,
  }));
};

export const addMileageRecord = async (vehicleId: string, driverId: string, mileage: number) => {
  const { data, error } = await supabase.from('mileage_records').insert({
    vehicle_id: vehicleId, driver_id: driverId, mileage,
  }).select().single();
  if (error) throw error;
  return data;
};
