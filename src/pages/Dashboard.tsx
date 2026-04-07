import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Truck, Users, CheckCircle, XCircle, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVehicles, getDrivers, getMaintenanceRecords, getBrakeTests, getTyreRecords } from '@/lib/store';
import { differenceInDays, parseISO, addDays, isAfter, isBefore } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Dashboard() {
  const [, setTick] = useState(0);
  useEffect(() => { setTick(t => t + 1); }, []);

  const vehicles = getVehicles();
  const drivers = getDrivers();
  const allMaintenance = getMaintenanceRecords();
  const allBrakeTests = getBrakeTests();
  const allTyreRecords = getTyreRecords();
  const now = new Date();

  const vehicleStatuses = useMemo(() => vehicles.map(v => {
    const maintenance = allMaintenance.filter(m => m.vehicleId === v.id);
    const brakeTests = allBrakeTests.filter(b => b.vehicleId === v.id);
    const tyreRecords = allTyreRecords.filter(t => t.vehicleId === v.id);

    const lastMaintenance = maintenance.sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))[0];
    const lastBrake = brakeTests.sort((a, b) => b.testDate.localeCompare(a.testDate))[0];
    const lastTyre = tyreRecords.sort((a, b) => b.photoDate.localeCompare(a.photoDate))[0];

    // 6-week (42 days) brake inspection check
    const brakeOverdue = lastBrake
      ? differenceInDays(now, parseISO(lastBrake.testDate)) > 42
      : true;
    const brakeWithin7Days = lastBrake
      ? differenceInDays(addDays(parseISO(lastBrake.testDate), 42), now) <= 7 && !brakeOverdue
      : false;

    // Tyre photo > 14 days
    const tyreCheckOverdue = lastTyre
      ? differenceInDays(now, parseISO(lastTyre.photoDate)) > 14
      : true;

    // Vicious circle: service without brake test on same day
    const viciousCircle = maintenance.some(m => {
      const sameDayBrake = brakeTests.find(b =>
        b.testDate.substring(0, 10) === m.serviceDate.substring(0, 10)
      );
      return !sameDayBrake;
    });

    const highPriority = brakeOverdue || brakeWithin7Days;

    return {
      vehicle: v,
      lastMaintenance,
      lastBrake,
      lastTyre,
      brakeOverdue,
      brakeWithin7Days,
      tyreCheckOverdue,
      viciousCircle: viciousCircle && maintenance.length > 0,
      highPriority,
    };
  }), [vehicles, allMaintenance, allBrakeTests, allTyreRecords]);

  const roadworthy = vehicleStatuses.filter(s => !s.highPriority && !s.tyreCheckOverdue).length;
  const pending = vehicles.length - roadworthy;
  const chartData = [
    { name: 'Roadworthy', value: roadworthy },
    { name: 'Pending', value: pending },
  ];
  const COLORS = ['hsl(142, 72%, 35%)', 'hsl(0, 72%, 51%)'];

  const highPriorityVehicles = vehicleStatuses.filter(s => s.highPriority);
  const viciousCircleAlerts = vehicleStatuses.filter(s => s.viciousCircle);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{vehicles.length}</p>
                <p className="text-sm text-muted-foreground">Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{drivers.length}</p>
                <p className="text-sm text-muted-foreground">Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{roadworthy}</p>
                <p className="text-sm text-muted-foreground">Roadworthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vicious Circle Alerts */}
      {viciousCircleAlerts.length > 0 && (
        <Card className="border-warning border-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-warning">
              <Bell className="h-5 w-5 animate-pulse-warning" />
              Vicious Circle Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Service visit recorded WITHOUT a brake test on the same day:
            </p>
            {viciousCircleAlerts.map(s => (
              <Link key={s.vehicle.id} to={`/vehicles/${s.vehicle.id}`} className="block">
                <Badge variant="outline" className="mr-2 mb-1 border-warning text-warning">
                  Truck #{s.vehicle.truckNumber}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* High Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              High Priority – Brake Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {highPriorityVehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">All vehicles are within inspection schedule.</p>
            ) : (
              <div className="space-y-2">
                {highPriorityVehicles.map(s => {
                  const daysInfo = s.lastBrake
                    ? `${differenceInDays(now, parseISO(s.lastBrake.testDate))} days since last test`
                    : 'No brake test on record';
                  return (
                    <Link key={s.vehicle.id} to={`/vehicles/${s.vehicle.id}`}
                      className="block p-3 rounded-lg priority-card hover:bg-destructive/10 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">Truck #{s.vehicle.truckNumber}</p>
                          <p className="text-xs text-muted-foreground">{daysInfo}</p>
                        </div>
                        <span className="status-badge-red">
                          {s.brakeOverdue ? 'OVERDUE' : 'DUE SOON'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fleet Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add vehicles to see fleet status.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tyre Overdue */}
      {vehicleStatuses.filter(s => s.tyreCheckOverdue && vehicles.length > 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Tyre Check Overdue (&gt;14 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {vehicleStatuses.filter(s => s.tyreCheckOverdue).map(s => (
              <Link key={s.vehicle.id} to={`/vehicles/${s.vehicle.id}`}>
                <Badge variant="outline" className="border-warning text-warning">
                  Truck #{s.vehicle.truckNumber}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
