import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getVehicles, getMaintenanceRecords, getBrakeTests } from '@/lib/store';
import { parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Vehicle, MaintenanceRecord, BrakeTestRecord } from '@/types/fleet';

export default function CalendarPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allMaintenance, setAllMaintenance] = useState<MaintenanceRecord[]>([]);
  const [allBrakeTests, setAllBrakeTests] = useState<BrakeTestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [v, m, b] = await Promise.all([getVehicles(), getMaintenanceRecords(), getBrakeTests()]);
      setVehicles(v); setAllMaintenance(m); setAllBrakeTests(b); setLoading(false);
    };
    load();
  }, []);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const events = useMemo(() => {
    const evts: { date: Date; label: string; type: 'maintenance' | 'brake' }[] = [];
    vehicles.forEach(v => {
      const mRecords = allMaintenance.filter(m => m.vehicleId === v.id);
      const lastM = mRecords.sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))[0];
      if (lastM) {
        evts.push({ date: parseISO(lastM.nextInspectionDate), label: `Truck #${v.truckNumber} - Next Inspection`, type: 'maintenance' });
      }
      const bRecords = allBrakeTests.filter(b => b.vehicleId === v.id);
      const lastB = bRecords.sort((a, b) => b.testDate.localeCompare(a.testDate))[0];
      if (lastB) {
        evts.push({ date: addDays(parseISO(lastB.testDate), 42), label: `Truck #${v.truckNumber} - Brake Test Due`, type: 'brake' });
      }
    });
    return evts;
  }, [vehicles, allMaintenance, allBrakeTests]);

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Upcoming Inspections – {format(now, 'MMMM yyyy')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`e-${i}`} />)}
            {days.map(day => {
              const dayEvents = events.filter(e => isSameDay(e.date, day));
              const isToday = isSameDay(day, now);
              return (
                <div key={day.toISOString()} className={cn("min-h-[60px] p-1 rounded-md border text-xs", isToday && "border-primary bg-primary/5", dayEvents.length > 0 && "bg-warning/10")}>
                  <p className={cn("font-medium", isToday && "text-primary")}>{format(day, 'd')}</p>
                  {dayEvents.map((e, i) => (
                    <p key={i} className={cn("truncate text-[10px] mt-0.5 px-1 rounded", e.type === 'brake' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary')}>{e.label.split(' - ')[0]}</p>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
        <CardContent>
          {events.filter(e => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime()).length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          ) : (
            <div className="space-y-2">
              {events.filter(e => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime()).map((e, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">{e.label}</span>
                  <span className="text-sm font-medium">{format(e.date, 'PP')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
