import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useApiStore } from '@/store/apiStore';
import type { Tournament } from '@/types/tournament';
import { TournamentList } from '@/components/tournament/TournamentList';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
import { Toaster } from '@/components/ui/sonner';
import { Plus, Trophy, Users, Calendar, Loader2, RefreshCw, LogIn, LogOut, User, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CreateTournamentDialog = lazy(() => import('@/components/tournament/CreateTournamentDialog').then((module) => ({ default: module.CreateTournamentDialog })));
const TournamentView = lazy(() => import('@/components/tournament/TournamentView').then((module) => ({ default: module.TournamentView })));
const AuthPage = lazy(() => import('@/pages/AuthPage').then((module) => ({ default: module.AuthPage })));
const AdminPanel = lazy(() => import('@/pages/AdminPanel').then((module) => ({ default: module.AdminPanel })));
const RankingsPage = lazy(() => import('@/pages/RankingsPage').then((module) => ({ default: module.RankingsPage })));
const TournamentPublicView = lazy(() => import('@/pages/TournamentPublicView').then((module) => ({ default: module.TournamentPublicView })));

function ArmrankLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="18" width="28" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
      <path d="M5 18 C5 14 8 10 11 8 L13 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M27 18 C27 14 24 10 21 8 L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="7" r="4" fill="currentColor" />
      <path d="M12 7 L20 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3 L16 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

function UserMenu({ onAdminClick }: { onAdminClick: () => void }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAuth(false)}>
        <div onClick={(event) => event.stopPropagation()}>
          <Suspense fallback={<LoadingBlock label="Cargando acceso..." />}>
            <AuthPage />
          </Suspense>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowAuth(true)}>
        <LogIn className="h-4 w-4 mr-2" />
        Iniciar sesion
      </Button>
    );
  }

  const initials = user?.name.split(' ').map((name) => name[0]).join('').toUpperCase().slice(0, 2) ?? 'AR';
  const roleColors: Record<string, string> = {
    admin: 'bg-red-500',
    organizer: 'bg-primary',
    athlete: 'bg-green-500',
    spectator: 'bg-gray-400',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${roleColors[user?.role || 'organizer'] || 'bg-primary'}`}>
            {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" /> : initials}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <span className="inline-flex items-center gap-1 text-xs mt-1">
            <ShieldCheck className="h-3 w-3" />
            {user?.role === 'admin' ? 'Administrador' : user?.role === 'organizer' ? 'Organizador' : user?.role === 'athlete' ? 'Atleta' : 'Espectador'}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toast.info('Perfil de atleta - proximamente')}>
          <User className="h-4 w-4 mr-2" />
          Mi Perfil
        </DropdownMenuItem>
        {user?.role === 'admin' && (
          <DropdownMenuItem onClick={onAdminClick}>
            <ShieldAlert className="h-4 w-4 mr-2 text-destructive" />
            Panel de Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => {
            logout();
            toast.success('Sesion cerrada');
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppContent() {
  const { tournaments, setCurrentTournament, currentTournament, fetchTournaments, isLoading, error, clearError } = useApiStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [view, setView] = useState<'list' | 'detail' | 'admin' | 'rankings'>('list');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchTournaments().finally(() => setInitialLoading(false));
  }, [fetchTournaments]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const stats = useMemo(() => ({
    total: tournaments.length,
    inProgress: tournaments.filter((tournament) => tournament.status === 'in_progress').length,
    completed: tournaments.filter((tournament) => tournament.status === 'completed').length,
    participants: tournaments.reduce((sum, tournament) => sum + (tournament.currentParticipants || 0), 0),
  }), [tournaments]);

  const handleViewClick = async (tournament: Tournament) => {
    await useApiStore.getState().fetchTournament(tournament.id);
    setView('detail');
  };

  const handleBackToList = () => {
    setCurrentTournament(null);
    setView('list');
    void fetchTournaments();
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-primary p-3 rounded-xl">
            <ArmrankLogo className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando ARMRANK...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={handleBackToList}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => event.key === 'Enter' && handleBackToList()}
            >
              <div className="bg-primary p-2 rounded-lg">
                <ArmrankLogo className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-widest">ARMRANK</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Plataforma de Torneos de Armwrestling</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setView('rankings')} className="hidden sm:flex">
                <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                Rankings
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setView('rankings')} className="sm:hidden">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => fetchTournaments()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <ModeToggle />
              <UserMenu onAdminClick={() => setView('admin')} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        {view === 'list' && (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border md:p-10 p-6 shadow-sm">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-5">
                  <Trophy className="h-4 w-4" />
                  Software Profesional de Armwrestling
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-foreground leading-tight">
                  El control total de tus torneos con <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">ARMRANK</span>
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
                  Crea torneos en <strong>4 formatos</strong> distintos, inscribe participantes por <strong>categorias de peso y brazo</strong>, y gestiona resultados profesionalmente.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="w-full sm:w-auto font-semibold shadow-md hover:scale-[1.02] transition-transform">
                    <Plus className="h-5 w-5 mr-2" />
                    Crear Torneo
                  </Button>
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-5 dark:opacity-10 pointer-events-none hidden md:block">
                <ArmrankLogo className="w-[450px] h-[450px]" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { icon: <Trophy className="h-4 w-4 text-muted-foreground" />, label: 'Total Torneos', value: stats.total, color: '' },
                { icon: <Calendar className="h-4 w-4 text-green-500" />, label: 'En Curso', value: stats.inProgress, color: 'text-green-600' },
                { icon: <Trophy className="h-4 w-4 text-red-500" />, label: 'Finalizados', value: stats.completed, color: 'text-red-600' },
                { icon: <Users className="h-4 w-4 text-slate-500" />, label: 'Competidores', value: stats.participants, color: 'text-slate-700 dark:text-slate-300' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="bg-card border rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1">{icon}<p className="text-xs text-muted-foreground">{label}</p></div>
                  <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="w-full sm:w-auto">
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Torneo
              </Button>
              {tournaments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center sm:text-left">Crea tu primer torneo para comenzar</p>
              )}
            </div>

            <TournamentList
              onCreateClick={() => setIsCreateDialogOpen(true)}
              onEditClick={(tournament) => setCurrentTournament(tournament)}
              onViewClick={handleViewClick}
            />
          </div>
        )}

        {view === 'detail' && currentTournament && (
          <ErrorBoundary
            onError={() => setTimeout(handleBackToList, 1500)}
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
                <div className="text-5xl">X</div>
                <h2 className="text-xl font-bold">Procesando torneo...</h2>
                <p className="text-muted-foreground text-sm">Recargando la vista actualizada</p>
                <Button onClick={handleBackToList} variant="outline" size="sm">Volver a la lista</Button>
              </div>
            }
          >
            <Suspense fallback={<LoadingBlock label="Cargando vista del torneo..." />}>
              <TournamentView tournament={currentTournament} onBack={handleBackToList} />
            </Suspense>
          </ErrorBoundary>
        )}

        {view === 'admin' && (
          <Suspense fallback={<LoadingBlock label="Cargando panel de administrador..." />}>
            <AdminPanel onBack={() => setView('list')} />
          </Suspense>
        )}

        {view === 'rankings' && (
          <Suspense fallback={<LoadingBlock label="Cargando clasificaciones..." />}>
            <RankingsPage onBack={() => setView('list')} />
          </Suspense>
        )}
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ArmrankLogo className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-semibold tracking-widest">ARMRANK</span>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-right">
              Plataforma profesional de torneos de Armwrestling
            </p>
          </div>
        </div>
      </footer>

      <Suspense fallback={null}>
        <CreateTournamentDialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              void fetchTournaments();
            }
          }}
        />
      </Suspense>

      <Toaster position="top-center" toastOptions={{ style: { fontSize: '14px' } }} />
    </div>
  );
}

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const [publicTournamentId, setPublicTournamentId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('tournament');
    if (id) {
      setPublicTournamentId(id);
    }
  }, []);

  if (publicTournamentId) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="armrank-theme">
        <Suspense fallback={null}>
          <TournamentPublicView 
            tournamentId={publicTournamentId} 
            onBack={() => {
              window.history.pushState({}, '', '/');
              setPublicTournamentId(null);
            }} 
          />
        </Suspense>
        <Toaster position="top-center" />
      </ThemeProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-mock.apps.googleusercontent.com'}>
      <ThemeProvider defaultTheme="dark" storageKey="armrank-theme">
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
