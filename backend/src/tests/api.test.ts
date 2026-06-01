import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const API_URL = 'http://localhost:3001';

describe('ARMRANK Backend API Integration Tests', () => {
  let authToken = '';
  let createdTournamentId = '';
  let createdParticipantId = '';
  const testEmail = `test_${Date.now()}@armrank.com`;

  // Verificar que el servidor backend esté corriendo antes de iniciar
  beforeAll(async () => {
    try {
      const response = await request(API_URL).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    } catch (err) {
      console.warn('⚠️ ADVERTENCIA: El backend en http://localhost:3001 no responde. Asegúrate de levantarlo antes de ejecutar las pruebas.');
      throw err;
    }
  });

  // 1. Health Check
  it('GET /api/health debe retornar 200 y status ok', async () => {
    const res = await request(API_URL).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  // 2. Auth: Registro
  it('POST /api/auth/register debe registrar un usuario y retornar token', async () => {
    const res = await request(API_URL)
      .post('/api/auth/register')
      .send({
        name: 'Usuario Test',
        email: testEmail,
        password: 'password123',
        country: 'España',
        team: 'Madrid Pulso',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
  });

  // 3. Auth: Login
  it('POST /api/auth/login debe autenticar usuario registrado', async () => {
    const res = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Usuario Test');
  });

  // 4. Tournaments: Crear Torneo
  it('POST /api/tournaments debe crear un torneo para el usuario autenticado', async () => {
    const res = await request(API_URL)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Torneo Integración Test',
        description: 'Torneo de pruebas automatizadas',
        type: 'double_elimination',
        maxParticipants: 8,
        sport: 'armwrestling',
        bestOf: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Torneo Integración Test');
    createdTournamentId = res.body.id;
  });

  // 5. Tournaments: Listar Torneos
  it('GET /api/tournaments debe retornar la lista de torneos', async () => {
    const res = await request(API_URL).get('/api/tournaments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // 6. Participants: Agregar Participantes (Al menos 2 para poder generar llaves)
  it('POST /api/tournaments/:id/participants debe inscribir competidores', async () => {
    const res1 = await request(API_URL)
      .post(`/api/tournaments/${createdTournamentId}/participants`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Competidor Test Alpha',
        country: 'México',
        team: 'NetFlow',
        weight: 79.5,
      });

    expect(res1.status).toBe(201);
    expect(res1.body.id).toBeDefined();

    const res2 = await request(API_URL)
      .post(`/api/tournaments/${createdTournamentId}/participants`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Competidor Test Beta',
        country: 'Canadá',
        team: 'Toronto Pullers',
        weight: 78.2,
      });

    expect(res2.status).toBe(201);
    expect(res2.body.id).toBeDefined();
    createdParticipantId = res1.body.id;
  });

  // 7. Brackets: Generación de llaves (Maneja éxito con RPC o error amigable si está apagado)
  it('POST /api/tournaments/:id/generate-bracket debe generar llaves o fallar amigablemente si RPC está apagado', async () => {
    const res = await request(API_URL)
      .post(`/api/tournaments/${createdTournamentId}/generate-bracket`)
      .set('Authorization', `Bearer ${authToken}`);

    expect([200, 500]).toContain(res.status);
    if (res.status === 500) {
      expect(res.body.error).toContain('motor de emparejamiento');
    } else {
      expect(res.body.matches).toBeDefined();
    }
  });

  // 8. Rankings: Obtener rankings
  it('GET /api/tournaments/:id/ranking debe retornar el ranking del torneo', async () => {
    const res = await request(API_URL).get(`/api/tournaments/${createdTournamentId}/ranking`);
    expect(res.status).toBe(200);
    expect(res.body.ranking).toBeDefined();
    expect(res.body.podium).toBeDefined();
  });
});
