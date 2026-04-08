import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getVehicles, getMaintenanceRecords, getBrakeTests, getTyreRecords, getDOTInspections } from '@/lib/store';
import { differenceInDays, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Vehicle, MaintenanceRecord, BrakeTestRecord, TyreRecord, DOTInspectionRecord } from '@/types/fleet';

export default function ReportsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allMaintenance, setAllMaintenance] = useState<MaintenanceRecord[]>([]);
  const [allBrakeTests, setAllBrakeTests] = useState<BrakeTestRecord[]>([]);
  const [allTyreRecords, setAllTyreRecords] = useState<TyreRecord[]>([]);
  const [allDOT, setAllDOT] = useState<DOTInspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [v, m, b, t, d] = await Promise.all([
        getVehicles(), getMaintenanceRecords(), getBrakeTests(), getTyreRecords(), getDOTInspections()
      ]);
      setVehicles(v); setAllMaintenance(m); setAllBrakeTests(b); setAllTyreRecords(t); setAllDOT(d);
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date();

  let roadworthy = 0;
  let pending = 0;
  vehicles.forEach(v => {
    const brakes = allBrakeTests.filter(b => b.vehicleId === v.id);
    const lastBrake = brakes.sort((a, b) => b.testDate.localeCompare(a.testDate))[0];
    const tyres = allTyreRecords.filter(t => t.vehicleId === v.id);
    const lastTyre = tyres.sort((a, b) => b.photoDate.localeCompare(a.photoDate))[0];
    const brakeOk = lastBrake && differenceInDays(now, parseISO(lastBrake.testDate)) <= 42;
    const tyreOk = lastTyre && differenceInDays(now, parseISO(lastTyre.photoDate)) <= 14;
    if (brakeOk && tyreOk) roadworthy++; else pending++;
  });

  const fleetData = [{ name: 'Roadworthy', value: roadworthy }, { name: 'Pending', value: pending }];
  const COLORS = ['hsl(142, 72%, 35%)', 'hsl(0, 72%, 51%)'];

  const dotPass = allDOT.filter(d => d.result === 'pass').length;
  const dotViolation = allDOT.filter(d => d.result === 'violation').length;
  const dotOOS = allDOT.filter(d => d.result === 'oos').length;
  const dotData = [{ name: 'Pass', value: dotPass }, { name: 'Violation', value: dotViolation }, { name: 'OOS', value: dotOOS }];
  const DOT_COLORS = ['hsl(142, 72%, 35%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

  const brakePass = allBrakeTests.filter(b => b.result === 'pass').length;
  const brakeFail = allBrakeTests.filter(b => b.result === 'fail').length;
  const brakeData = [{ name: 'Pass', count: brakePass }, { name: 'Fail', count: brakeFail }];

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Fleet Status</CardTitle></CardHeader>
          <CardContent>
            {vehicles.length === 0 ? <p className="text-sm text-muted-foreground">Add vehicles to see reports.</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={fleetData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label>{fleetData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>DOT Inspection Results</CardTitle></CardHeader>
          <CardContent>
            {allDOT.length === 0 ? <p className="text-sm text-muted-foreground">No DOT inspections recorded.</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={dotData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label>{dotData.map((_, i) => <Cell key={i} fill={DOT_COLORS[i]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Brake Test Results</CardTitle></CardHeader>
          <CardContent>
            {allBrakeTests.length === 0 ? <p className="text-sm text-muted-foreground">No brake tests recorded.</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={brakeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="hsl(215, 80%, 45%)" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg"><p className="text-2xl font-bold">{vehicles.length}</p><p className="text-xs text-muted-foreground">Total Vehicles</p></div>
            <div className="p-3 bg-muted rounded-lg"><p className="text-2xl font-bold">{allMaintenance.length}</p><p className="text-xs text-muted-foreground">Service Records</p></div>
            <div className="p-3 bg-muted rounded-lg"><p className="text-2xl font-bold">{allBrakeTests.length}</p><p className="text-xs text-muted-foreground">Brake Tests</p></div>
            <div className="p-3 bg-muted rounded-lg"><p className="text-2xl font-bold">{allDOT.length}</p><p className="text-xs text-muted-foreground">DOT Inspections</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
