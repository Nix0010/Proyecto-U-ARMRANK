import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Swords, Loader2, Mail, Lock, User, Globe, Users } from 'lucide-react';

type Tab = 'login' | 'register';

interface Props {
    defaultTab?: Tab;
}

export function AuthPage({ defaultTab = 'login' }: Props) {
    const [tab, setTab] = useState<Tab>(defaultTab);
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();

    // ── Login form ──
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(loginForm.email, loginForm.password);
            toast.success('¡Bienvenido de vuelta!');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    // ── Register form ──
    const [regForm, setRegForm] = useState({ name: '', email: '', password: '', country: '', team: '' });
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (regForm.password.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        setLoading(true);
        try {
            await register({
                name: regForm.name,
                email: regForm.email,
                password: regForm.password,
                country: regForm.country || undefined,
                team: regForm.team || undefined,
            });
            toast.success('¡Cuenta creada! Bienvenido a ARMRANK.');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Swords className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-black tracking-tight">ARMRANK</h1>
                    </div>
                    <p className="text-muted-foreground text-sm">Plataforma profesional de pulso</p>
                </div>

                {/* Tabs */}
                <div className="flex rounded-lg border p-1 mb-6 bg-muted/30">
                    <button
                        onClick={() => setTab('login')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === 'login' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => setTab('register')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === 'register' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Registrarse
                    </button>
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            {tab === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
                        </CardTitle>
                        <CardDescription>
                            {tab === 'login'
                                ? 'Ingresa tus credenciales para continuar'
                                : 'Únete a la comunidad de armwrestling'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tab === 'login' ? (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <Label htmlFor="login-email">Email</Label>
                                    <div className="relative mt-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder="tu@email.com"
                                            className="pl-9"
                                            value={loginForm.email}
                                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="login-password">Contraseña</Label>
                                    <div className="relative mt-1">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-9"
                                            value={loginForm.password}
                                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                    {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <Label htmlFor="reg-name">Nombre completo *</Label>
                                    <div className="relative mt-1">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="reg-name"
                                            placeholder="Tu nombre"
                                            className="pl-9"
                                            value={regForm.name}
                                            onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="reg-email">Email *</Label>
                                    <div className="relative mt-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="reg-email"
                                            type="email"
                                            placeholder="tu@email.com"
                                            className="pl-9"
                                            value={regForm.email}
                                            onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="reg-password">Contraseña * <span className="text-muted-foreground text-xs">(mín. 8 caracteres)</span></Label>
                                    <div className="relative mt-1">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="reg-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-9"
                                            value={regForm.password}
                                            onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="reg-country">País</Label>
                                        <div className="relative mt-1">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="reg-country"
                                                placeholder="Colombia"
                                                className="pl-9"
                                                value={regForm.country}
                                                onChange={(e) => setRegForm({ ...regForm, country: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="reg-team">Club/Equipo</Label>
                                        <div className="relative mt-1">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="reg-team"
                                                placeholder="Tu equipo"
                                                className="pl-9"
                                                value={regForm.team}
                                                onChange={(e) => setRegForm({ ...regForm, team: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-4">
                    También puedes usar la app sin cuenta — los torneos sin cuenta son públicos.
                </p>
            </div>
        </div>
    );
}
