import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getVehicles, addVehicle, deleteVehicle, getDrivers } from '@/lib/store';
import { Plus, Trash2, Truck, ExternalLink, Phone } from 'lucide-react';
import type { Vehicle, Driver } from '@/types/fleet';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [truckNumber, setTruckNumber] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [assignedDriver, setAssignedDriver] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [v, d] = await Promise.all([getVehicles(), getDrivers()]);
    setVehicles(v);
    setDrivers(d);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!truckNumber.trim() || !trailerNumber.trim()) return;
    await addVehicle(truckNumber.trim(), trailerNumber.trim(), assignedDriver && assignedDriver !== 'none' ? assignedDriver : undefined);
    await fetchData();
    setTruckNumber('');
    setTrailerNumber('');
    setAssignedDriver('');
  };

  const handleDelete = async (id: string) => {
    await deleteVehicle(id);
    await fetchData();
  };

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Add Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Truck Number *"
              value={truckNumber}
              onChange={e => setTruckNumber(e.target.value)}
            />
            <Input
              placeholder="Trailer Number *"
              value={trailerNumber}
              onChange={e => setTrailerNumber(e.target.value)}
            />
          </div>
          <Select value={assignedDriver} onValueChange={setAssignedDriver}>
            <SelectTrigger>
              <SelectValue placeholder="Assign driver (optional)" />
            </SelectTrigger>
            <SelectContent>
              {/* ← this lets you unassign a driver */}
              <SelectItem value="none">— No driver —</SelectItem>
              {drivers.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAdd}
            disabled={!truckNumber.trim() || !trailerNumber.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />Add Vehicle
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map(v => {
          const driver = drivers.find(d => d.id === v.assignedDriverId);
          return (
            <Card key={v.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="text-lg font-bold">Truck #{v.truckNumber}</p>
                    <p className="text-sm text-muted-foreground">Trailer #{v.trailerNumber}</p>
                    {driver ? (
                      <div className="pt-1">
                        <p className="text-sm font-medium">{driver.name}</p>
                        {driver.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />{driver.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground pt-1">No driver assigned</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/vehicles/${v.id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4 text-primary" />
                      </Button>
                    </Link>
                    {/* ← confirmation dialog before delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Truck #{v.truckNumber}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this vehicle and all its records. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(v.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {vehicles.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">No vehicles added yet.</p>
        )}
      </div>
    </div>
  );
}
