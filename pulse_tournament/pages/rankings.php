<?php
require_once '../config.php';

// Obtener estadísticas de participantes
$stmt = $pdo->query("
    SELECT 
        p.name,
        p.nickname,
        p.club,
        p.country,
        COUNT(DISTINCT p.tournament_id) as tournaments,
        SUM(CASE WHEN p.status = 'champion' THEN 1 ELSE 0 END) as championships,
        SUM(ps.wins) as total_wins,
        SUM(ps.losses) as total_losses,
        SUM(ps.matches_played) as total_matches
    FROM participants p
    LEFT JOIN participant_stats ps ON p.id = ps.participant_id
    GROUP BY p.name
    HAVING total_matches > 0
    ORDER BY championships DESC, total_wins DESC, total_matches ASC
    LIMIT 100
");
$rankings = $stmt->fetchAll();

// Obtener campeones
$stmt = $pdo->query("
    SELECT 
        p.name,
        p.nickname,
        t.name as tournament_name,
        t.category,
        t.weight_class,
        t.completed_at
    FROM participants p
    JOIN tournaments t ON p.tournament_id = t.id
    WHERE p.status = 'champion' AND t.status = 'completed'
    ORDER BY t.completed_at DESC
    LIMIT 10
");
$champions = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rankings - <?php echo SITE_NAME; ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/style.css">
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
                <a href="../index.php">Inicio</a>
                <a href="tournaments.php">Torneos</a>
                <a href="create.php">Crear Torneo</a>
                <a href="rankings.php" class="active">Rankings</a>
            </nav>
        </div>
    </header>

    <main>
        <section class="page-header">
            <div class="container">
                <h1>Rankings</h1>
                <p>Los mejores luchadores de Iron Grip</p>
            </div>
        </section>

        <section class="tournaments-section">
            <div class="container">
                <!-- Campeones Recientes -->
                <h3 style="margin-bottom: 20px; font-family: 'Orbitron', sans-serif;">🏆 Campeones Recientes</h3>
                
                <?php if (empty($champions)): ?>
                    <div class="empty-state" style="margin-bottom: 40px;">
                        <p>No hay campeones registrados aún</p>
                    </div>
                <?php else: ?>
                    <div class="tournaments-grid" style="margin-bottom: 60px;">
                        <?php foreach ($champions as $champion): ?>
                            <div class="tournament-card" style="border-color: var(--secondary);">
                                <div class="card-header">
                                    <span style="font-size: 2rem;">🏆</span>
                                    <span class="status-badge completed">Campeón</span>
                                </div>
                                <h3 class="tournament-name" style="color: var(--secondary);"><?php echo sanitize($champion['name']); ?></h3>
                                <?php if ($champion['nickname']): ?>
                                    <p class="tournament-desc">"<?php echo sanitize($champion['nickname']); ?>"</p>
                                <?php endif; ?>
                                <div class="tournament-meta">
                                    <span>🎯 <?php echo sanitize($champion['tournament_name']); ?></span>
                                </div>
                                <?php if ($champion['category'] || $champion['weight_class']): ?>
                                    <div class="tournament-meta">
                                        <?php if ($champion['category']): ?>
                                            <span>🏷️ <?php echo sanitize($champion['category']); ?></span>
                                        <?php endif; ?>
                                        <?php if ($champion['weight_class']): ?>
                                            <span>⚖️ <?php echo sanitize($champion['weight_class']); ?></span>
                                        <?php endif; ?>
                                    </div>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>

                <!-- Tabla de Rankings -->
                <h3 style="margin-bottom: 20px; font-family: 'Orbitron', sans-serif;">📊 Tabla General</h3>
                
                <?php if (empty($rankings)): ?>
                    <div class="empty-state">
                        <p>No hay datos de rankings aún</p>
                    </div>
                <?php else: ?>
                    <table class="standings-table">
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Luchador</th>
                                <th>Torneos</th>
                                <th>Campeonatos</th>
                                <th>PJ</th>
                                <th>PG</th>
                                <th>PP</th>
                                <th>% Victorias</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php 
                            $position = 1;
                            foreach ($rankings as $r): 
                                $win_pct = $r['total_matches'] > 0 ? round(($r['total_wins'] / $r['total_matches']) * 100, 1) : 0;
                            ?>
                                <tr>
                                    <td class="position-cell position-<?php echo $position <= 3 ? $position : ''; ?>">
                                        <?php echo $position; ?>
                                    </td>
                                    <td>
                                        <div class="player-cell">
                                            <div class="avatar"><?php echo substr($r['name'], 0, 1); ?></div>
                                            <div class="info">
                                                <span class="name"><?php echo sanitize($r['name']); ?></span>
                                                <?php if ($r['nickname']): ?>
                                                    <span class="nickname">"<?php echo sanitize($r['nickname']); ?>"</span>
                                                <?php endif; ?>
                                                <?php if ($r['club']): ?>
                                                    <span class="nickname">🏋️ <?php echo sanitize($r['club']); ?></span>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="stats-cell"><?php echo $r['tournaments']; ?></td>
                                    <td class="stats-cell" style="color: var(--secondary); font-weight: 700;"><?php echo $r['championships']; ?></td>
                                    <td class="stats-cell"><?php echo $r['total_matches']; ?></td>
                                    <td class="stats-cell" style="color: var(--success);"><?php echo $r['total_wins']; ?></td>
                                    <td class="stats-cell" style="color: var(--danger);"><?php echo $r['total_losses']; ?></td>
                                    <td class="stats-cell" style="font-family: 'Orbitron', sans-serif;"><?php echo $win_pct; ?>%</td>
                                </tr>
                            <?php 
                                $position++;
                            endforeach; 
                            ?>
                        </tbody>
                    </table>
                <?php endif; ?>
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
</body>
</html>
