import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  getVehicles, getDrivers, getMaintenanceRecords, addMaintenanceRecord,
  getBrakeTests, addBrakeTest, getTyreRecords, addTyreRecord,
  getDOTInspections, addDOTInspection
} from '@/lib/store';
import { AXLE_CONFIG, type TyreReading, type TreadStatus } from '@/types/fleet';
import type { Vehicle, Driver, MaintenanceRecord, BrakeTestRecord, TyreRecord, DOTInspectionRecord } from '@/types/fleet';
import { CalendarIcon, ArrowLeft, Wrench, Shield, Circle, FileCheck } from 'lucide-react';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [brakeTests, setBrakeTests] = useState<BrakeTestRecord[]>([]);
  const [tyreRecords, setTyreRecords] = useState<TyreRecord[]>([]);
  const [dotInspections, setDotInspections] = useState<DOTInspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [serviceDate, setServiceDate] = useState<Date>();
  const [serviceNotes, setServiceNotes] = useState('');
  const [brakeDate, setBrakeDate] = useState<Date>();
  const [brakeResult, setBrakeResult] = useState<'pass' | 'fail'>('pass');
  const [brakeNotes, setBrakeNotes] = useState('');
  const [tyrePhotoDate, setTyrePhotoDate] = useState<Date>();
  const [tyreReadings, setTyreReadings] = useState<TyreReading[]>(() =>
    AXLE_CONFIG.flatMap((_, axleIndex) =>
      (['left', 'right'] as const).map(pos => ({ axleIndex, position: pos, status: 'good' as TreadStatus }))
    )
  );
  const [dotDate, setDotDate] = useState<Date>();
  const [dotDriver, setDotDriver] = useState('');
  const [dotResult, setDotResult] = useState<'pass' | 'violation' | 'oos'>('pass');
  const [dotNotes, setDotNotes] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    const [vehicles, d, m, b, t, dot] = await Promise.all([
      getVehicles(), getDrivers(),
      getMaintenanceRecords(id), getBrakeTests(id), getTyreRecords(id), getDOTInspections(id)
    ]);
    setVehicle(vehicles.find(v => v.id === id) || null);
    setDrivers(d);
    setMaintenanceRecords(m.sort((a, b) => b.serviceDate.localeCompare(a.serviceDate)));
    setBrakeTests(b.sort((a, b) => b.testDate.localeCompare(a.testDate)));
    setTyreRecords(t.sort((a, b) => b.photoDate.localeCompare(a.photoDate)));
    setDotInspections(dot.sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate)));
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  if (!vehicle) return <div className="p-6"><p>Vehicle not found.</p><Link to="/vehicles" className="text-primary underline">Back</Link></div>;

  const handleAddMaintenance = async () => {
    if (!serviceDate) return;
    await addMaintenanceRecord(vehicle.id, serviceDate.toISOString(), serviceNotes || undefined);
    setServiceDate(undefined); setServiceNotes('');
    await fetchData();
  };

  const handleAddBrake = async () => {
    if (!brakeDate) return;
    await addBrakeTest(vehicle.id, brakeDate.toISOString(), brakeResult, brakeNotes || undefined);
    setBrakeDate(undefined); setBrakeNotes('');
    await fetchData();
  };

  const handleAddTyre = async () => {
    if (!tyrePhotoDate) return;
    await addTyreRecord({ vehicleId: vehicle.id, date: new Date().toISOString(), photoDate: tyrePhotoDate.toISOString(), readings: tyreReadings });
    setTyrePhotoDate(undefined);
    await fetchData();
  };

  const handleAddDOT = async () => {
    if (!dotDate) return;
    await addDOTInspection(vehicle.id, dotDriver || undefined, dotDate.toISOString(), dotResult, dotNotes || undefined);
    setDotDate(undefined); setDotNotes('');
    await fetchData();
  };

  const statusColors: Record<TreadStatus, string> = { good: 'bg-success', bad: 'bg-destructive', uneven: 'bg-warning' };
  const dotColors = { pass: 'status-badge-green', violation: 'status-badge-yellow', oos: 'status-badge-red' };

  const DatePickerField = ({ date, setDate, label }: { date?: Date; setDate: (d?: Date) => void; label: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start text-left font-normal w-full", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/vehicles"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
       <div>
  <h2 className="text-2xl font-bold">Truck #{vehicle.truckNumber}</h2>
  <p className="text-sm text-muted-foreground">Trailer #{vehicle.trailerNumber}</p>
  {drivers.find(d => d.id === vehicle.assignedDriverId) && (
    <p className="text-sm text-muted-foreground">
      Driver: {drivers.find(d => d.id === vehicle.assignedDriverId)?.name}
    </p>
  )}
</div>

      <Tabs defaultValue="maintenance">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="maintenance">Service</TabsTrigger>
          <TabsTrigger value="brakes">Brakes</TabsTrigger>
          <TabsTrigger value="tyres">Tyres</TabsTrigger>
          <TabsTrigger value="dot">DOT</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" />Record Service</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-w-md">
              <DatePickerField date={serviceDate} setDate={setServiceDate} label="Last Service Date" />
              {serviceDate && (
                <p className="text-sm text-muted-foreground">
                  Next Inspection: <strong>{format(new Date(serviceDate.getTime() + 60 * 24 * 60 * 60 * 1000), 'PPP')}</strong> (60 days)
                </p>
              )}
              <Textarea placeholder="Notes (optional)" value={serviceNotes} onChange={e => setServiceNotes(e.target.value)} />
              <Button onClick={handleAddMaintenance}>Save Service Record</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Service History</CardTitle></CardHeader>
            <CardContent>
              {maintenanceRecords.length === 0 ? <p className="text-sm text-muted-foreground">No records.</p> : (
                <div className="space-y-2">
                  {maintenanceRecords.map(r => (
                    <div key={r.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">Service: {format(parseISO(r.serviceDate), 'PP')}</span>
                        <span className="text-sm text-muted-foreground">Next: {format(parseISO(r.nextInspectionDate), 'PP')}</span>
                      </div>
                      {r.notes && <p className="text-sm text-muted-foreground mt-1">{r.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brakes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Record Brake Test</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-w-md">
              <DatePickerField date={brakeDate} setDate={setBrakeDate} label="Brake Test Date" />
              <div className="flex gap-2">
                <Button variant={brakeResult === 'pass' ? 'default' : 'outline'} onClick={() => setBrakeResult('pass')}
                  className={brakeResult === 'pass' ? 'bg-success hover:bg-success/90' : ''}>Pass</Button>
                <Button variant={brakeResult === 'fail' ? 'default' : 'outline'} onClick={() => setBrakeResult('fail')}
                  className={brakeResult === 'fail' ? 'bg-destructive hover:bg-destructive/90' : ''}>Fail</Button>
              </div>
              <Textarea placeholder="Notes (optional)" value={brakeNotes} onChange={e => setBrakeNotes(e.target.value)} />
              <Button onClick={handleAddBrake}>Save Brake Test</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Brake Test History</CardTitle></CardHeader>
            <CardContent>
              {brakeTests.length === 0 ? <p className="text-sm text-muted-foreground">No records.</p> : (
                <div className="space-y-2">
                  {brakeTests.map(r => (
                    <div key={r.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                      <span>{format(parseISO(r.testDate), 'PP')}</span>
                      <span className={r.result === 'pass' ? 'status-badge-green' : 'status-badge-red'}>{r.result.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tyres" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Circle className="h-5 w-5 text-primary" />Record Tyre Check</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <DatePickerField date={tyrePhotoDate} setDate={setTyrePhotoDate} label="Photo Submission Date" />
              <div className="space-y-3">
                {AXLE_CONFIG.map((axle, axleIdx) => (
                  <div key={axleIdx} className="p-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm mb-2">{axle.name} ({axle.tyreCount} tyres)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['left', 'right'] as const).map(pos => {
                        const reading = tyreReadings.find(r => r.axleIndex === axleIdx && r.position === pos);
                        return (
                          <div key={pos} className="flex items-center gap-2">
                            <span className="text-xs capitalize w-10">{pos}</span>
                            <Select value={reading?.status || 'good'} onValueChange={(val: TreadStatus) => {
                              setTyreReadings(prev => prev.map(r => r.axleIndex === axleIdx && r.position === pos ? { ...r, status: val } : r));
                            }}>
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="good">✅ Good</SelectItem>
                                <SelectItem value="bad">🔴 Bad</SelectItem>
                                <SelectItem value="uneven">🟡 Uneven</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className={cn("w-3 h-3 rounded-full", statusColors[reading?.status || 'good'])} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleAddTyre}>Save Tyre Record</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Tyre History</CardTitle></CardHeader>
            <CardContent>
              {tyreRecords.length === 0 ? <p className="text-sm text-muted-foreground">No records.</p> : (
                <div className="space-y-3">
                  {tyreRecords.map(r => (
                    <div key={r.id} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-sm">Photo: {format(parseISO(r.photoDate), 'PP')}</p>
                      <div className="grid grid-cols-5 gap-1 mt-2">
                        {AXLE_CONFIG.map((axle, idx) => (
                          <div key={idx} className="text-center">
                            <p className="text-[10px] text-muted-foreground">{axle.name.split(' ').pop()}</p>
                            <div className="flex justify-center gap-0.5">
                              {(['left', 'right'] as const).map(pos => {
                                const reading = r.readings.find(rd => rd.axleIndex === idx && rd.position === pos);
                                return <div key={pos} className={cn("w-2.5 h-2.5 rounded-full", statusColors[reading?.status || 'good'])} />;
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dot" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary" />Record DOT Inspection</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-w-md">
              <DatePickerField date={dotDate} setDate={setDotDate} label="Inspection Date" />
              <Select value={dotDriver} onValueChange={setDotDriver}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant={dotResult === 'pass' ? 'default' : 'outline'} onClick={() => setDotResult('pass')}
                  className={dotResult === 'pass' ? 'bg-success hover:bg-success/90' : ''}>Pass</Button>
                <Button variant={dotResult === 'violation' ? 'default' : 'outline'} onClick={() => setDotResult('violation')}
                  className={dotResult === 'violation' ? 'bg-warning hover:bg-warning/90' : ''}>Violation</Button>
                <Button variant={dotResult === 'oos' ? 'default' : 'outline'} onClick={() => setDotResult('oos')}
                  className={dotResult === 'oos' ? 'bg-destructive hover:bg-destructive/90' : ''}>OOS</Button>
              </div>
              <Textarea placeholder="Notes (optional)" value={dotNotes} onChange={e => setDotNotes(e.target.value)} />
              <Button onClick={handleAddDOT}>Save DOT Inspection</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>DOT Inspection History</CardTitle></CardHeader>
            <CardContent>
              {dotInspections.length === 0 ? <p className="text-sm text-muted-foreground">No records.</p> : (
                <div className="space-y-2">
                  {dotInspections.map(r => {
                    const driver = drivers.find(d => d.id === r.driverId);
                    return (
                      <div key={r.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-medium">{format(parseISO(r.inspectionDate), 'PP')}</span>
                          {driver && <span className="text-sm text-muted-foreground ml-2">({driver.name})</span>}
                        </div>
                        <span className={dotColors[r.result]}>{r.result.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
