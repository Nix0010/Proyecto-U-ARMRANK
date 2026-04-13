import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Users, Trophy, Settings, BarChart3, Activity, ShieldAlert, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tournaments' | 'config'>('dashboard');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({ registrationsEnabled: true, maintenanceMode: false });

  const fetchAdminData = async (endpoint: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Error loading ${endpoint}`);
      return await res.json();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const patchAdminData = async (endpoint: string, body: any) => {
    try {
      const res = await fetch(`${API_URL}/admin/${endpoint}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`Error updating data`);
      return await res.json();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      throw err;
    }
  };

  useEffect(() => {
    if (!token) return;
    
    if (activeTab === 'dashboard') {
      fetchAdminData('stats').then(data => data && setStats(data));
    } else if (activeTab === 'users') {
      fetchAdminData('users').then(data => data && setUsers(data));
    } else if (activeTab === 'tournaments') {
      fetchAdminData('tournaments').then(data => data && setTournaments(data));
    } else if (activeTab === 'config') {
      fetchAdminData('config').then(data => data && setConfig(data));
    }
  }, [activeTab, token]);

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Acceso denegado</div>;
  }

  const handleUpdateUserStatus = async (id: string, active: boolean) => {
    try {
      await patchAdminData(`users/${id}/status`, { active });
      setUsers(users.map(u => u.id === id ? { ...u, active } : u));
      toast.success('Estado actualizado');
    } catch {}
  };

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      await patchAdminData(`users/${id}/role`, { role });
      setUsers(users.map(u => u.id === id ? { ...u, role } : u));
      toast.success('Rol actualizado');
    } catch {}
  };

  const handleConfigChange = async (key: string, value: boolean) => {
    try {
      const updated = await patchAdminData('config', { [key]: value });
      setConfig(updated);
      toast.success('Configuración guardada');
    } catch {}
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[80vh]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 space-y-2">
        <div className="mb-6 flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Panel Admin</h2>
        </div>
        
        {[
          { id: 'dashboard', icon: <BarChart3 className="h-4 w-4" />, label: 'Dashboard' },
          { id: 'users', icon: <Users className="h-4 w-4" />, label: 'Usuarios' },
          { id: 'tournaments', icon: <Trophy className="h-4 w-4" />, label: 'Torneos Globales' },
          { id: 'config', icon: <Settings className="h-4 w-4" />, label: 'Configuración' },
        ].map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab(item.id as any)}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </Button>
        ))}

        <div className="pt-8">
          <Button variant="outline" className="w-full" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la App
          </Button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-card rounded-xl border p-6 shadow-sm overflow-hidden">
        {loading && !stats && !users.length ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight mb-2">Visión General</h3>
                  <p className="text-muted-foreground">Estadísticas globales de la plataforma.</p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-3xl font-bold">{stats.totalUsers}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Torneos Totales</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-3xl font-bold">{stats.totalTournaments}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-500">Torneos Activos</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-3xl font-bold">{stats.activeTournaments}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-3xl font-bold">{stats.completedTournaments}</div></CardContent>
                  </Card>
                </div>

                {stats.chartData && stats.chartData.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Actividad Reciente (Últimos 6 Meses)</CardTitle>
                      <CardDescription>Visualización de adopción y creación de torneos de ARMRANK.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                            <Tooltip 
                              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                              contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="Usuarios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Torneos" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h3>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Rol</th>
                        <th className="px-4 py-3">Torneos</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">{u.name}</td>
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3">
                            <select 
                              className="bg-transparent border rounded p-1 text-xs"
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              disabled={u.id === user.id} // Don't change own role
                            >
                              <option value="admin">Admin</option>
                              <option value="organizer">Organizador</option>
                              <option value="athlete">Atleta</option>
                              <option value="spectator">Espectador</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">{u._count?.tournaments || 0}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {u.active ? 'Activo' : 'Suspendido'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant={u.active ? 'destructive' : 'default'} 
                              size="sm"
                              disabled={u.id === user.id}
                              onClick={() => handleUpdateUserStatus(u.id, !u.active)}
                            >
                              {u.active ? 'Suspender' : 'Activar'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'tournaments' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold tracking-tight">Torneos Globales</h3>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Creador</th>
                        <th className="px-4 py-3">Participantes</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tournaments.map(t => (
                        <tr key={t.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">{t.name}</td>
                          <td className="px-4 py-3">{t.createdBy?.name || 'Sistema'}</td>
                          <td className="px-4 py-3">{t._count?.participants || 0}</td>
                          <td className="px-4 py-3">
                            <span className="capitalize">{t.status.replace('_', ' ')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight mb-2">Configuración del Sistema</h3>
                  <p className="text-muted-foreground mb-6">Administra las variables de entorno operativas de la plataforma.</p>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Control de Acceso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Habilitar Registros</Label>
                        <p className="text-sm text-muted-foreground">Permite que nuevos usuarios se registren de forma automática.</p>
                      </div>
                      <Switch 
                        checked={config.registrationsEnabled}
                        onCheckedChange={(v) => handleConfigChange('registrationsEnabled', v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium text-destructive">Modo Mantenimiento</Label>
                        <p className="text-sm text-muted-foreground">Muestra una página de aviso. Solo los administradores podrán entrar.</p>
                      </div>
                      <Switch 
                        checked={config.maintenanceMode}
                        onCheckedChange={(v) => handleConfigChange('maintenanceMode', v)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
