import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDrivers, addDriver, deleteDriver } from '@/lib/store';
import { Plus, Trash2, Users, Phone } from 'lucide-react';
import type { Driver } from '@/types/fleet';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    const data = await getDrivers();
    setDrivers(data);
    setLoading(false);
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addDriver(name.trim(), phone.trim() || undefined);
    await fetchDrivers();
    setName('');
    setPhone('');
  };

  const handleDelete = async (id: string) => {
    await deleteDriver(id);
    await fetchDrivers();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Add Driver
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Driver name *"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Input
              placeholder="Cell number (optional)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={!name.trim()}>
              <Plus className="h-4 w-4 mr-1" />Add Driver
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Drivers ({drivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drivers added yet.</p>
          ) : (
            <div className="space-y-2">
              {drivers.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{d.name}</span>
                    {d.phone && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />{d.phone}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
