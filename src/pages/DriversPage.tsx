import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDrivers, addDriver, deleteDriver } from '@/lib/store';
import { Plus, Trash2, Users } from 'lucide-react';

export default function DriversPage() {
  const [drivers, setDrivers] = useState(getDrivers());
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addDriver(name.trim());
    setDrivers(getDrivers());
    setName('');
  };

  const handleDelete = (id: string) => {
    deleteDriver(id);
    setDrivers(getDrivers());
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
          <div className="flex gap-2">
            <Input
              placeholder="Driver name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Drivers ({drivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drivers added yet.</p>
          ) : (
            <div className="space-y-2">
              {drivers.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="font-medium">{d.name}</span>
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
