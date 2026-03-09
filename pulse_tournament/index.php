<?php
require_once 'config.php';

// Obtener torneos activos y recientes
$stmt = $pdo->query("
    SELECT t.*, 
           COUNT(DISTINCT p.id) as participant_count,
           COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as matches_completed
    FROM tournaments t
    LEFT JOIN participants p ON t.id = p.tournament_id
    LEFT JOIN matches m ON t.id = m.tournament_id
    GROUP BY t.id
    ORDER BY t.created_at DESC
    LIMIT 10
");
$tournaments = $stmt->fetchAll();

// Estadísticas
$stats = $pdo->query("
    SELECT 
        (SELECT COUNT(*) FROM tournaments) as total_tournaments,
        (SELECT COUNT(*) FROM tournaments WHERE status = 'active') as active_tournaments,
        (SELECT COUNT(*) FROM participants) as total_participants,
        (SELECT COUNT(*) FROM matches WHERE status = 'completed') as total_matches
")->fetch();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo SITE_NAME; ?> - Sistema de Torneos de Pulsos</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="bg-animation"></div>
    
    <header class="main-header">
        <div class="container">
            <div class="logo">
                <span class="logo-icon">💪</span>
                <div class="logo-text">
                    <h1>IRON GRIP</h1>
                    <span>Tournament System</span>
                </div>
            </div>
            <nav class="main-nav">
                <a href="index.php" class="active">Inicio</a>
                <a href="pages/tournaments.php">Torneos</a>
                <a href="pages/create.php">Crear Torneo</a>
                <a href="pages/rankings.php">Rankings</a>
            </nav>
        </div>
    </header>

    <main>
        <!-- Hero Section -->
        <section class="hero">
            <div class="container">
                <h2 class="hero-title">DOMINA EL <span class="highlight">PULSO</span></h2>
                <p class="hero-subtitle">Sistema profesional de gestión de torneos de arm wrestling</p>
                <div class="hero-buttons">
                    <a href="pages/create.php" class="btn btn-primary">Crear Torneo</a>
                    <a href="pages/tournaments.php" class="btn btn-secondary">Ver Torneos</a>
                </div>
            </div>
        </section>

        <!-- Stats Section -->
        <section class="stats-section">
            <div class="container">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number"><?php echo $stats['total_tournaments']; ?></div>
                        <div class="stat-label">Torneos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number"><?php echo $stats['active_tournaments']; ?></div>
                        <div class="stat-label">Activos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number"><?php echo $stats['total_participants']; ?></div>
                        <div class="stat-label">Luchadores</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number"><?php echo $stats['total_matches']; ?></div>
                        <div class="stat-label">Pulsos</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Recent Tournaments -->
        <section class="tournaments-section">
            <div class="container">
                <h2 class="section-title">Torneos Recientes</h2>
                
                <?php if (empty($tournaments)): ?>
                    <div class="empty-state">
                        <div class="empty-icon">🏆</div>
                        <h3>No hay torneos aún</h3>
                        <p>Sé el primero en crear un torneo de pulsos</p>
                        <a href="pages/create.php" class="btn btn-primary">Crear Torneo</a>
                    </div>
                <?php else: ?>
                    <div class="tournaments-grid">
                        <?php foreach ($tournaments as $tournament): ?>
                            <div class="tournament-card <?php echo $tournament['status']; ?>">
                                <div class="card-header">
                                    <span class="status-badge <?php echo $tournament['status']; ?>">
                                        <?php 
                                        echo $tournament['status'] == 'draft' ? 'Borrador' : 
                                             ($tournament['status'] == 'active' ? 'En Curso' : 'Finalizado'); 
                                        ?>
                                    </span>
                                    <span class="type-badge">
                                        <?php echo $tournament['type'] == 'double_elimination' ? '2 Vidas' : 'Todos vs Todos (2V)'; ?>
                                    </span>
                                </div>
                                <h3 class="tournament-name"><?php echo sanitize($tournament['name']); ?></h3>
                                <?php if ($tournament['description']): ?>
                                    <p class="tournament-desc"><?php echo sanitize(substr($tournament['description'], 0, 100)) . '...'; ?></p>
                                <?php endif; ?>
                                <div class="tournament-meta">
                                    <span>👤 <?php echo $tournament['participant_count']; ?> participantes</span>
                                    <span>🤼 <?php echo $tournament['matches_completed']; ?> pulsos</span>
                                </div>
                                <div class="card-actions">
                                    <a href="pages/tournament.php?id=<?php echo $tournament['id']; ?>" class="btn btn-view">Ver Torneo</a>
                                    <?php if ($tournament['status'] == 'draft'): ?>
                                        <a href="pages/bracket.php?id=<?php echo $tournament['id']; ?>" class="btn btn-start">Iniciar</a>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <div class="view-all">
                        <a href="pages/tournaments.php" class="btn btn-outline">Ver Todos los Torneos</a>
                    </div>
                <?php endif; ?>
            </div>
        </section>

        <!-- Features Section -->
        <section class="features-section">
            <div class="container">
                <h2 class="section-title">Características</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🛡️</div>
                        <h3>Sistema de 2 Vidas</h3>
                        <p>Cada luchador tiene dos oportunidades. Una derrota te manda a la repesca, la segunda te elimina.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3>Bracket Visual</h3>
                        <p>Visualización clara del bracket de doble eliminación con seguimiento en tiempo real.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">⚡</div>
                        <h3>Todos vs Todos</h3>
                        <p>Modalidad round-robin donde todos enfrentan a todos con sistema de 2 vidas.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📱</div>
                        <h3>Responsive</h3>
                        <p>Accede y gestiona tus torneos desde cualquier dispositivo.</p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="main-footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-logo">
                    <span class="logo-icon">💪</span>
                    <span>IRON GRIP</span>
                </div>
                <p class="footer-text">Sistema profesional de gestión de torneos de arm wrestling</p>
                <p class="footer-copy">&copy; <?php echo date('Y'); ?> Iron Grip Tournaments. Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>

    <script src="assets/js/main.js"></script>
</body>
</html>
