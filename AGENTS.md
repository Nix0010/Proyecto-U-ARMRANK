# Tournament Management System - Agent Guide

## Project Overview

Full-stack tournament management system with double elimination brackets.

**Stack:**
- Frontend: React 19 + Vite + TypeScript (Port 5173)
- Backend: Express + Prisma + PostgreSQL (Port 3001)
- Database: PostgreSQL (Port 5432)

## Architecture Changes

### Migrated from localStorage to PostgreSQL
- Old: Zustand store with localStorage persistence
- New: Zustand store with API calls to Express backend

## Key Files

### Frontend
- `app/src/store/apiStore.ts` - API communication layer
- `app/src/components/participant/ParticipantManager.tsx` - Participant management UI
- `app/src/components/tournament/TournamentView.tsx` - Tournament view with optimized bracket
- `app/src/components/bracket/DoubleEliminationBracket.tsx` - Optimized bracket component

### Backend
- `backend/src/index.ts` - Express server setup
- `backend/src/routes/tournaments.ts` - API routes
- `backend/prisma/schema.prisma` - Database schema

## Development Setup

### Prerequisites
1. PostgreSQL running on port 5432
2. Database `tournament_db` created
3. Both frontend and backend servers running

### Quick Start (Windows)
Run `iniciar-todo.bat` to start both servers automatically.

### Manual Start
```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd app
npm run dev
```

## Recent Fixes & Optimizations

### 1. Critical Performance Fix - Bracket Rendering
**Problem:** Page froze when starting tournament due to expensive bracket rendering

**Root Causes:**
- No memoization in bracket components
- `buildBracketFromMatches` called on every render
- Heavy re-renders of MatchCard components

**Solutions Implemented:**
1. **React.memo** on all bracket sub-components (MatchCard, RoundColumn, ParticipantLabel)
2. **useCallback** for all event handlers
3. **Optimized buildBracketFromMatches** - single pass algorithm, O(n) complexity
4. **Memoized bracket reconstruction** with useMemo
5. **Component splitting** - TournamentHeader, InfoCards as separate memoized components

**Before:**
```typescript
// Re-rendered everything on every state change
function DoubleEliminationBracket({ bracket }) {
  return bracket.winnersBracket.map(round => 
    round.matches.map(match => <MatchCard match={match} />)  // Always new reference
  )
}
```

**After:**
```typescript
// Only re-renders when props actually change
const MatchCard = memo(function MatchCard({ match }) {
  // Memoized component
})
```

### 2. Validation Error Fix
**Problem:** "Error en los datos" when adding participants

**Cause:** Zod schema rejected empty strings for optional email field

**Fix:** Updated schema to accept empty strings and transform to null:
```typescript
email: z.union([
  z.string().email(),
  z.literal(''),
  z.null(),
  z.undefined(),
]).optional().transform(val => val === '' ? null : val)
```

### 3. API Error Handling
- Added proper error propagation
- Better error messages from backend
- Frontend shows specific error details

### 4. Backend Logging
- Added request/response logging for debugging
- Better error messages in development

## Performance Optimizations Applied

### Frontend
1. **React.memo** on all expensive components
2. **useMemo** for expensive calculations (bracket building)
3. **useCallback** for all callbacks passed to children
4. **Component decomposition** - smaller, focused components
5. **Single-pass algorithms** - O(n) bracket building

### State Management
1. **Selective updates** - Only update changed tournament in list
2. **Error isolation** - Errors don't crash the whole app
3. **Loading states** - Proper feedback during operations

## Code Patterns

### Optimized Component Pattern
```typescript
// Memoized sub-component
const MatchCard = memo(function MatchCard({ match, onUpdate }) {
  const handleClick = useCallback(() => {
    onUpdate(match.id);
  }, [match.id, onUpdate]);
  
  return <div onClick={handleClick}>...</div>;
});

// Main component with memoized data
function TournamentView({ tournament }) {
  const bracket = useMemo(() => 
    buildBracketFromMatches(tournament.matches),
    [tournament.matches]  // Only rebuild when matches change
  );
  
  const handleUpdate = useCallback((id) => {
    // handler
  }, []);
  
  return <MatchCard match={match} onUpdate={handleUpdate} />;
}
```

### Optimized Bracket Building
```typescript
function buildBracketFromMatches(matches) {
  // Single pass O(n) instead of multiple filters
  for (const match of matches) {
    if (match.bracket === 'winners') {
      // classify
    } else if (match.bracket === 'losers') {
      // classify
    }
  }
  // Sort and name once
}
```

## Documentation Files
- `COMO-EJECUTAR.md` - Complete setup guide (Spanish)
- `SOLUCION-PROBLEMAS.md` - Troubleshooting guide (Spanish)
- `iniciar-todo.bat` - Auto-start script for Windows

## Debugging Tips

### Bracket Freezing
If bracket still freezes:
1. Open React DevTools Profiler
2. Check which components are re-rendering
3. Look for unnecessary parent re-renders

### Database Issues
1. Check PostgreSQL service: `services.msc`
2. Verify database exists: `psql -U postgres -c "\l"`
3. Check migrations: `npm run db:migrate` in backend

### API Connection
1. Test health: http://localhost:3001/api/health
2. Check browser console for CORS errors
3. Verify .env files have correct URLs
