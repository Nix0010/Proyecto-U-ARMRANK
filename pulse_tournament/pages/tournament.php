<?php
require_once '../config.php';

$tournament_id = $_GET['id'] ?? '';

if (!$tournament_id) {
    redirect('tournaments.php');
}

// Obtener torneo
$stmt = $pdo->prepare("
    SELECT t.*, 
           COUNT(DISTINCT p.id) as participant_count,
           COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as matches_completed,
           COUNT(DISTINCT m.id) as total_matches
    FROM tournaments t
    LEFT JOIN participants p ON t.id = p.tournament_id
    LEFT JOIN matches m ON t.id = m.tournament_id
    WHERE t.id = ?
    GROUP BY t.id
");
$stmt->execute([$tournament_id]);
$tournament = $stmt->fetch();

if (!$tournament) {
    redirect('tournaments.php');
}

// Obtener participantes
$stmt = $pdo->prepare("
    SELECT p.*, 
           COUNT(CASE WHEN m.winner_id = p.id THEN 1 END) as wins,
           COUNT(CASE WHEN (m.participant1_id = p.id OR m.participant2_id = p.id) AND m.status = 'completed' THEN 1 END) as matches_played
    FROM participants p
    LEFT JOIN matches m ON (p.id = m.participant1_id OR p.id = m.participant2_id) AND m.tournament_id = p.tournament_id
    WHERE p.tournament_id = ?
    GROUP BY p.id
    ORDER BY 
        CASE p.status 
            WHEN 'champion' THEN 1 
            WHEN 'active' THEN 2 
            ELSE 3 
        END,
        p.lives DESC,
        wins DESC,
        p.seed ASC
");
$stmt->execute([$tournament_id]);
$participants = $stmt->fetchAll();

// Obtener partidos recientes
$stmt = $pdo->prepare("
    SELECT m.*, 
           p1.name as participant1_name,
           p2.name as participant2_name,
           w.name as winner_name
    FROM matches m
    LEFT JOIN participants p1 ON m.participant1_id = p1.id
    LEFT JOIN participants p2 ON m.participant2_id = p2.id
    LEFT JOIN participants w ON m.winner_id = w.id
    WHERE m.tournament_id = ? AND m.status = 'completed'
    ORDER BY m.completed_at DESC
    LIMIT 10
");
$stmt->execute([$tournament_id]);
$recent_matches = $stmt->fetchAll();

// Tab activa
$tab = $_GET['tab'] ?? 'standings';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo sanitize($tournament['name']); ?> - <?php echo SITE_NAME; ?></title>
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
                <a href="rankings.php">Rankings</a>
            </nav>
        </div>
    </header>

    <main>
        <!-- Tournament Header -->
        <section class="tournament-header">
            <div class="container">
                <div class="tournament-info">
                    <span class="status-badge <?php echo $tournament['status']; ?>" style="margin-bottom: 15px; display: inline-block;">
                        <?php 
                        echo $tournament['status'] == 'draft' ? 'Borrador' : 
                             ($tournament['status'] == 'active' ? 'En Curso' : 'Finalizado'); 
                        ?>
                    </span>
                    <h1><?php echo sanitize($tournament['name']); ?></h1>
                    <div class="meta">
                        <span>🛡️ <?php echo $tournament['type'] == 'double_elimination' ? 'Doble Eliminación (2 Vidas)' : 'Todos vs Todos (2 Vidas)'; ?></span>
                        <span>👤 <?php echo $tournament['participant_count']; ?> participantes</span>
                        <span>🤼 <?php echo $tournament['matches_completed']; ?>/<?php echo $tournament['total_matches']; ?> pulsos</span>
                        <?php if ($tournament['category']): ?>
                            <span>🏷️ <?php echo sanitize($tournament['category']); ?></span>
                        <?php endif; ?>
                        <?php if ($tournament['weight_class']): ?>
                            <span>⚖️ <?php echo sanitize($tournament['weight_class']); ?></span>
                        <?php endif; ?>
                        <?php if ($tournament['arm']): ?>
                            <span>💪 Brazo <?php echo $tournament['arm'] == 'left' ? 'Izquierdo' : ($tournament['arm'] == 'right' ? 'Derecho' : 'Ambos'); ?></span>
                        <?php endif; ?>
                    </div>
                </div>
                <div class="tournament-actions">
                    <?php if ($tournament['status'] == 'draft'): ?>
                        <a href="bracket.php?id=<?php echo $tournament_id; ?>" class="btn btn-start">Iniciar Torneo</a>
                    <?php elseif ($tournament['status'] == 'active'): ?>
                        <a href="bracket.php?id=<?php echo $tournament_id; ?>" class="btn btn-primary">Ver Bracket</a>
                    <?php else: ?>
                        <a href="bracket.php?id=<?php echo $tournament_id; ?>" class="btn btn-view">Ver Resultados</a>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <!-- Tabs -->
        <section class="tournaments-section">
            <div class="container">
                <div class="tabs-nav">
                    <a href="?id=<?php echo $tournament_id; ?>&tab=standings" class="tab-btn <?php echo $tab == 'standings' ? 'active' : ''; ?>">Clasificación</a>
                    <a href="?id=<?php echo $tournament_id; ?>&tab=participants" class="tab-btn <?php echo $tab == 'participants' ? 'active' : ''; ?>">Participantes</a>
                    <a href="?id=<?php echo $tournament_id; ?>&tab=matches" class="tab-btn <?php echo $tab == 'matches' ? 'active' : ''; ?>">Partidos</a>
                    <a href="bracket.php?id=<?php echo $tournament_id; ?>" class="tab-btn">Bracket →</a>
                </div>

                <!-- Standings Tab -->
                <?php if ($tab == 'standings'): ?>
                    <div class="tab-content active">
                        <h3 style="margin-bottom: 20px; font-family: 'Orbitron', sans-serif;">Tabla de Clasificación</h3>
                        
                        <?php if (empty($participants)): ?>
                            <div class="empty-state">
                                <p>No hay participantes registrados</p>
                            </div>
                        <?php else: ?>
                            <table class="standings-table">
                                <thead>
                                    <tr>
                                        <th>Pos</th>
                                        <th>Luchador</th>
                                        <th>Vidas</th>
                                        <th>PJ</th>
                                        <th>PG</th>
                                        <th>PP</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php 
                                    $position = 1;
                                    foreach ($participants as $p): 
                                        $lives_class = $p['lives'] == 2 ? 'active' : ($p['lives'] == 1 ? 'warning' : 'eliminated');
                                    ?>
                                        <tr>
                                            <td class="position-cell position-<?php echo $position <= 3 ? $position : ''; ?>">
                                                <?php echo $position; ?>
                                            </td>
                                            <td>
                                                <div class="player-cell">
                                                    <div class="avatar"><?php echo substr($p['name'], 0, 1); ?></div>
                                                    <div class="info">
                                                        <span class="name"><?php echo sanitize($p['name']); ?></span>
                                                        <?php if ($p['nickname']): ?>
                                                            <span class="nickname">"<?php echo sanitize($p['nickname']); ?>"</span>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="lives-indicator">
                                                    <?php for ($i = 0; $i < 2; $i++): ?>
                                                        <span class="life <?php echo $i >= $p['lives'] ? 'lost' : ''; ?>"></span>
                                                    <?php endfor; ?>
                                                </div>
                                            </td>
                                            <td class="stats-cell"><?php echo $p['matches_played']; ?></td>
                                            <td class="stats-cell" style="color: var(--success);"><?php echo $p['wins']; ?></td>
                                            <td class="stats-cell" style="color: var(--danger);"><?php echo $p['matches_played'] - $p['wins']; ?></td>
                                            <td>
                                                <span class="status-badge-small <?php echo $p['status']; ?>">
                                                    <?php 
                                                    echo $p['status'] == 'active' ? 'Activo' : 
                                                         ($p['status'] == 'champion' ? 'Campeón' : 'Eliminado'); 
                                                    ?>
                                                </span>
                                            </td>
                                        </tr>
                                    <?php 
                                        $position++;
                                    endforeach; 
                                    ?>
                                </tbody>
                            </table>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>

                <!-- Participants Tab -->
                <?php if ($tab == 'participants'): ?>
                    <div class="tab-content active">
                        <h3 style="margin-bottom: 20px; font-family: 'Orbitron', sans-serif;">Lista de Participantes</h3>
                        
                        <?php if (empty($participants)): ?>
                            <div class="empty-state">
                                <p>No hay participantes registrados</p>
                            </div>
                        <?php else: ?>
                            <div class="tournaments-grid">
                                <?php foreach ($participants as $p): ?>
                                    <div class="tournament-card">
                                        <div class="card-header">
                                            <span class="participant-seed" style="position: static;">#<?php echo $p['seed']; ?></span>
                                            <span class="status-badge-small <?php echo $p['status']; ?>">
                                                <?php 
                                                echo $p['status'] == 'active' ? 'Activo' : 
                                                     ($p['status'] == 'champion' ? 'Campeón' : 'Eliminado'); 
                                                ?>
                                            </span>
                                        </div>
                                        <h3 class="tournament-name"><?php echo sanitize($p['name']); ?></h3>
                                        <?php if ($p['nickname']): ?>
                                            <p class="tournament-desc">"<?php echo sanitize($p['nickname']); ?>"</p>
                                        <?php endif; ?>
                                        <div class="tournament-meta">
                                            <span>Vidas: 
                                                <?php for ($i = 0; $i < $p['lives']; $i++): ?>❤️<?php endfor; ?>
                                            </span>
                                            <span>PG: <?php echo $p['wins']; ?></span>
                                        </div>
                                        <?php if ($p['club']): ?>
                                            <div class="tournament-meta">
                                                <span>🏋️ <?php echo sanitize($p['club']); ?></span>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>

                <!-- Matches Tab -->
                <?php if ($tab == 'matches'): ?>
                    <div class="tab-content active">
                        <h3 style="margin-bottom: 20px; font-family: 'Orbitron', sans-serif;">Partidos Recientes</h3>
                        
                        <?php if (empty($recent_matches)): ?>
                            <div class="empty-state">
                                <p>No hay partidos registrados aún</p>
                            </div>
                        <?php else: ?>
                            <div class="tournaments-grid">
                                <?php foreach ($recent_matches as $match): ?>
                                    <div class="tournament-card">
                                        <div class="card-header">
                                            <span class="type-badge">Ronda <?php echo $match['round']; ?></span>
                                            <span class="status-badge completed">Finalizado</span>
                                        </div>
                                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px 0;">
                                            <div style="text-align: center; flex: 1;">
                                                <div style="font-weight: 600; <?php echo $match['winner_id'] == $match['participant1_id'] ? 'color: var(--success);' : ''; ?>">
                                                    <?php echo sanitize($match['participant1_name'] ?? 'BYE'); ?>
                                                </div>
                                                <div style="font-family: 'Orbitron', sans-serif; font-size: 1.5rem; margin-top: 5px;">
                                                    <?php echo $match['score1']; ?>
                                                </div>
                                            </div>
                                            <div style="padding: 0 20px; color: var(--text-muted); font-weight: 700;">VS</div>
                                            <div style="text-align: center; flex: 1;">
                                                <div style="font-weight: 600; <?php echo $match['winner_id'] == $match['participant2_id'] ? 'color: var(--success);' : ''; ?>">
                                                    <?php echo sanitize($match['participant2_name'] ?? 'BYE'); ?>
                                                </div>
                                                <div style="font-family: 'Orbitron', sans-serif; font-size: 1.5rem; margin-top: 5px;">
                                                    <?php echo $match['score2']; ?>
                                                </div>
                                            </div>
                                        </div>
                                        <div style="text-align: center; padding-top: 10px; border-top: 1px solid var(--border-color);">
                                            <span style="color: var(--success);">🏆 Ganador: <?php echo sanitize($match['winner_name'] ?? 'N/A'); ?></span>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
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
