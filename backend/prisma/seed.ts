import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra de la base de datos (Database Seeding)...');

  // 1. Limpiar base de datos (orden correcto respetando relaciones)
  await prisma.systemConfig.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.participantStats.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Base de datos limpiada.');

  // 2. Crear configuración global
  await prisma.systemConfig.create({
    data: {
      id: 'global',
      registrationsEnabled: true,
      maintenanceMode: false,
    },
  });
  console.log('⚙️ Configuración global creada.');

  // 3. Crear usuarios de prueba con contraseñas hasheadas
  const saltRounds = 12;
  const adminPasswordHash = await bcrypt.hash('password123', saltRounds);
  const organizerPasswordHash = await bcrypt.hash('password123', saltRounds);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin de ARMRANK',
      email: 'admin@armrank.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      active: true,
      country: 'España',
      team: 'Team Elite',
    },
  });

  const organizerUser = await prisma.user.create({
    data: {
      name: 'Organizador Oficial',
      email: 'organizer@armrank.com',
      passwordHash: organizerPasswordHash,
      role: 'organizer',
      active: true,
      country: 'México',
      team: 'NetFlow Pulso',
    },
  });

  console.log('👥 Usuarios creados:', {
    admin: adminUser.email,
    organizer: organizerUser.email,
  });

  // 4. Crear Torneo 1 (Copa Nacional de Pulso - Doble Eliminación)
  const tournament1 = await prisma.tournament.create({
    data: {
      name: 'Copa Nacional de Pulso ARMRANK 2026',
      description: 'Gran torneo nacional con sistema de doble eliminación para todas las categorías senior.',
      type: 'double_elimination',
      status: 'draft',
      sport: 'armwrestling',
      maxParticipants: 16,
      currentParticipants: 0,
      location: 'Ciudad de México, Centro Deportivo',
      organizerName: organizerUser.name,
      startDate: new Date('2026-07-15T09:00:00Z'),
      endDate: new Date('2026-07-16T18:00:00Z'),
      bestOf: 1,
      createdById: organizerUser.id,
      isPublic: true,
    },
  });

  // Crear Categorías para Torneo 1
  const catRight80 = await prisma.category.create({
    data: {
      name: 'Senior Derecha -80kg',
      weightClass: '80',
      arm: 'right',
      sortOrder: 1,
      tournamentId: tournament1.id,
    },
  });

  const catLeft80 = await prisma.category.create({
    data: {
      name: 'Senior Izquierda -80kg',
      weightClass: '80',
      arm: 'left',
      sortOrder: 2,
      tournamentId: tournament1.id,
    },
  });

  console.log('🏆 Torneo de Doble Eliminación creado con 2 categorías.');

  // Crear Participantes para Torneo 1 - Categoría Derecha -80kg
  const participantsData1 = [
    { name: 'John "The Iron" Smith', country: 'Estados Unidos', team: 'Texas Pulso', weight: 78.5, seed: 1 },
    { name: 'Ivan "The Russian" Petrov', country: 'Rusia', team: 'Moscow Bears', weight: 79.2, seed: 2 },
    { name: 'Carlos "El Toro" Gómez', country: 'España', team: 'Madrid Armwrestling', weight: 77.8, seed: 3 },
    { name: 'Pedro "Mano de Piedra" Juárez', country: 'México', team: 'NetFlow Pulso', weight: 79.8, seed: 4 },
  ];

  for (const p of participantsData1) {
    await prisma.participant.create({
      data: {
        name: p.name,
        country: p.country,
        team: p.team,
        weight: p.weight,
        seed: p.seed,
        status: 'active',
        tournamentId: tournament1.id,
        categoryId: catRight80.id,
        stats: {
          create: {
            wins: 0,
            losses: 0,
            draws: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            matchesPlayed: 0,
          },
        },
      },
    });
  }

  // Crear Participantes para Torneo 1 - Categoría Izquierda -80kg
  const participantsData2 = [
    { name: 'Mike "Steel Wrist" Johnson', country: 'Canadá', team: 'Toronto Pullers', weight: 76.9, seed: 1 },
    { name: 'Hiroshi "The Grip" Tanaka', country: 'Japón', team: 'Tokyo Armwrestling', weight: 78.1, seed: 2 },
    { name: 'Dimitri "Volk" Smirnov', country: 'Ucrania', team: 'Kiev Pulso', weight: 79.5, seed: 3 },
    { name: 'Juan "El Rayo" Martínez', country: 'Colombia', team: 'Bogotá Pullers', weight: 75.4, seed: 4 },
  ];

  for (const p of participantsData2) {
    await prisma.participant.create({
      data: {
        name: p.name,
        country: p.country,
        team: p.team,
        weight: p.weight,
        seed: p.seed,
        status: 'active',
        tournamentId: tournament1.id,
        categoryId: catLeft80.id,
        stats: {
          create: {
            wins: 0,
            losses: 0,
            draws: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            matchesPlayed: 0,
          },
        },
      },
    });
  }

  // Actualizar contador del torneo
  await prisma.tournament.update({
    where: { id: tournament1.id },
    data: { currentParticipants: 8 },
  });

  // 5. Crear Torneo 2 (Vendetta Match Especial - 2 competidores, BO5)
  const tournament2 = await prisma.tournament.create({
    data: {
      name: 'Super Match Vendetta: Heavyweight Showdown',
      description: 'Enfrentamiento super match al mejor de 5 asaltos (Best of 5) entre dos gigantes del brazo derecho.',
      type: 'vendetta',
      status: 'draft',
      sport: 'armwrestling',
      maxParticipants: 2,
      currentParticipants: 0,
      location: 'Las Vegas, Orleans Arena',
      organizerName: adminUser.name,
      startDate: new Date('2026-08-20T21:00:00Z'),
      endDate: new Date('2026-08-20T23:00:00Z'),
      bestOf: 5,
      createdById: adminUser.id,
      isPublic: true,
    },
  });

  const catOpen = await prisma.category.create({
    data: {
      name: 'Heavyweight Open',
      weightClass: '100+',
      arm: 'right',
      sortOrder: 1,
      tournamentId: tournament2.id,
    },
  });

  // Competidores Vendetta
  const v1 = await prisma.participant.create({
    data: {
      name: 'Marcus "The Mountain" Vane',
      country: 'Reino Unido',
      team: 'London Giants',
      weight: 120.4,
      seed: 1,
      status: 'active',
      tournamentId: tournament2.id,
      categoryId: catOpen.id,
      stats: {
        create: { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, matchesPlayed: 0 },
      },
    },
  });

  const v2 = await prisma.participant.create({
    data: {
      name: 'Alexey "The Titan" Volkov',
      country: 'Rusia',
      team: 'Siberian Power',
      weight: 118.9,
      seed: 2,
      status: 'active',
      tournamentId: tournament2.id,
      categoryId: catOpen.id,
      stats: {
        create: { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, matchesPlayed: 0 },
      },
    },
  });

  await prisma.tournament.update({
    where: { id: tournament2.id },
    data: { currentParticipants: 2 },
  });

  console.log('🔥 Torneo Vendetta creado con 2 competidores de peso pesado.');

  console.log('✅ Base de datos sembrada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la siembra de la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
