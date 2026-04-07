import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getVehicles, getDrivers, addTyreRecord, addMileageRecord } from '@/lib/store';
import { AXLE_CONFIG, type TyreReading, type TreadStatus } from '@/types/fleet';
import { CalendarIcon, Camera, Gauge, CheckCircle } from 'lucide-react';

export default function DriverPortalPage() {
  const drivers = getDrivers();
  const vehicles = getVehicles();

  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [mileage, setMileage] = useState('');
  const [photoDate, setPhotoDate] = useState<Date>();
  const [submitted, setSubmitted] = useState(false);

  const [tyreReadings, setTyreReadings] = useState<TyreReading[]>(() =>
    AXLE_CONFIG.flatMap((_, axleIndex) =>
      (['left', 'right'] as const).map(pos => ({ axleIndex, position: pos, status: 'good' as TreadStatus }))
    )
  );

  const statusColors: Record<TreadStatus, string> = { good: 'bg-success', bad: 'bg-destructive', uneven: 'bg-warning' };

  const handleSubmit = () => {
    if (!selectedDriver || !selectedVehicle) return;

    if (mileage) {
      addMileageRecord(selectedVehicle, selectedDriver, parseInt(mileage));
    }
    if (photoDate) {
      addTyreRecord({
        vehicleId: selectedVehicle,
        date: new Date().toISOString(),
        photoDate: photoDate.toISOString(),
        readings: tyreReadings,
      });
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setMileage('');
    setPhotoDate(undefined);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center py-4">
        <Camera className="h-10 w-10 mx-auto text-primary mb-2" />
        <h2 className="text-xl font-bold">Driver Portal</h2>
        <p className="text-sm text-muted-foreground">Submit tyre photos & mileage</p>
      </div>

      {submitted && (
        <Card className="border-success bg-success/10">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="font-medium text-success">Submitted successfully!</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger><SelectValue placeholder="Select your name" /></SelectTrigger>
            <SelectContent>
              {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
            <SelectContent>
              {vehicles.map(v => (
                <SelectItem key={v.id} value={v.id}>Truck #{v.truckNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Gauge className="h-5 w-5 text-primary" />Current Mileage</CardTitle></CardHeader>
        <CardContent>
          <Input type="number" placeholder="Enter current mileage" value={mileage} onChange={e => setMileage(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Camera className="h-5 w-5 text-primary" />Tyre Photo Submission</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start", !photoDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {photoDate ? format(photoDate, 'PPP') : 'Photo date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={photoDate} onSelect={setPhotoDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {AXLE_CONFIG.map((axle, axleIdx) => (
            <div key={axleIdx} className="p-2 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">{axle.name}</p>
              <div className="grid grid-cols-2 gap-2">
                {(['left', 'right'] as const).map(pos => {
                  const reading = tyreReadings.find(r => r.axleIndex === axleIdx && r.position === pos);
                  return (
                    <div key={pos} className="flex items-center gap-1">
                      <span className="text-[10px] w-6 capitalize">{pos}</span>
                      <Select
                        value={reading?.status || 'good'}
                        onValueChange={(val: TreadStatus) => {
                          setTyreReadings(prev => prev.map(r =>
                            r.axleIndex === axleIdx && r.position === pos ? { ...r, status: val } : r
                          ));
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">✅ Good</SelectItem>
                          <SelectItem value="bad">🔴 Bad</SelectItem>
                          <SelectItem value="uneven">🟡 Uneven</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className={cn("w-2.5 h-2.5 rounded-full", statusColors[reading?.status || 'good'])} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!selectedDriver || !selectedVehicle}>
        Submit Report
      </Button>
    </div>
  );
}
