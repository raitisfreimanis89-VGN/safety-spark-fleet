import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getVehicles, addVehicle, deleteVehicle, getDrivers } from '@/lib/store';
import { Plus, Trash2, Truck, ExternalLink } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState(getVehicles());
  const [truckNumber, setTruckNumber] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [assignedDriver, setAssignedDriver] = useState('');
  const drivers = getDrivers();

  const handleAdd = () => {
    if (!truckNumber.trim() || !trailerNumber.trim()) return;
    addVehicle(truckNumber.trim(), trailerNumber.trim(), assignedDriver || undefined);
    setVehicles(getVehicles());
    setTruckNumber('');
    setTrailerNumber('');
    setAssignedDriver('');
  };

  const handleDelete = (id: string) => {
    deleteVehicle(id);
    setVehicles(getVehicles());
  };

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
            <Input placeholder="Truck Number" value={truckNumber} onChange={e => setTruckNumber(e.target.value)} />
            <Input placeholder="Trailer Number" value={trailerNumber} onChange={e => setTrailerNumber(e.target.value)} />
          </div>
          <Select value={assignedDriver} onValueChange={setAssignedDriver}>
            <SelectTrigger>
              <SelectValue placeholder="Assign driver (optional)" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />Add Vehicle</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map(v => {
          const driver = drivers.find(d => d.id === v.assignedDriverId);
          return (
            <Card key={v.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-bold">Truck #{v.truckNumber}</p>
                    <p className="text-sm text-muted-foreground">Trailer #{v.trailerNumber}</p>
                    {driver && <p className="text-sm mt-1">Driver: {driver.name}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/vehicles/${v.id}`}>
                      <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4 text-primary" /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
