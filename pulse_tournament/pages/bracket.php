<?php
require_once '../config.php';

$tournament_id = $_GET['id'] ?? '';
$action = $_GET['action'] ?? '';

if (!$tournament_id) {
    redirect('tournaments.php');
}

// Obtener torneo
$stmt = $pdo->prepare("
    SELECT t.*, COUNT(p.id) as participant_count
    FROM tournaments t
    LEFT JOIN participants p ON t.id = p.tournament_id
    WHERE t.id = ?
    GROUP BY t.id
");
$stmt->execute([$tournament_id]);
$tournament = $stmt->fetch();

if (!$tournament) {
    redirect('tournaments.php');
}

// Iniciar torneo
if ($action == 'start' && $tournament['status'] == 'draft') {
    try {
        $pdo->beginTransaction();
        
        // Obtener participantes
        $stmt = $pdo->prepare("SELECT * FROM participants WHERE tournament_id = ? ORDER BY seed ASC");
        $stmt->execute([$tournament_id]);
        $participants = $stmt->fetchAll();
        
        if ($tournament['type'] == 'double_elimination') {
            generateDoubleEliminationBracket($pdo, $tournament_id, $participants);
        } else {
            generateRoundRobinBracket($pdo, $tournament_id, $participants);
        }
        
        // Actualizar estado del torneo
        $stmt = $pdo->prepare("UPDATE tournaments SET status = 'active', started_at = NOW() WHERE id = ?");
        $stmt->execute([$tournament_id]);
        
        $pdo->commit();
        redirect("bracket.php?id=$tournament_id");
        
    } catch (Exception $e) {
        $pdo->rollBack();
        $error = "Error al iniciar el torneo: " . $e->getMessage();
    }
}

// Función para generar bracket de doble eliminación
function generateDoubleEliminationBracket($pdo, $tournament_id, $participants) {
    $count = count($participants);
    
    // Calcular siguiente potencia de 2
    $bracket_size = 1;
    while ($bracket_size < $count) {
        $bracket_size *= 2;
    }
    
    // Calcular número de rondas
    $rounds = (int)log($bracket_size, 2);
    
    // Crear bracket de ganadores
    $matches = [];
    
    // Crear todos los partidos del bracket de ganadores
    for ($round = 1; $round <= $rounds; $round++) {
        $matches_in_round = $bracket_size / pow(2, $round);
        
        for ($position = 1; $position <= $matches_in_round; $position++) {
            $id = generateId();
            $matches[$round][$position] = [
                'id' => $id,
                'next_match_id' => null,
                'loser_match_id' => null
            ];
            
            // Determinar el siguiente partido (si no es la final)
            if ($round < $rounds) {
                $next_round_position = ceil($position / 2);
                // Guardamos referencia que se actualizará después
                $matches[$round][$position]['next_round'] = $round + 1;
                $matches[$round][$position]['next_position'] = $next_round_position;
            }
            
            // Insertar partido
            $stmt = $pdo->prepare("
                INSERT INTO matches (id, tournament_id, round, position, bracket, status) 
                VALUES (?, ?, ?, ?, 'winners', 'pending')
            ");
            $stmt->execute([$id, $tournament_id, $round, $position]);
        }
    }
    
    // Actualizar los next_match_id del bracket de ganadores
    for ($round = 1; $round < $rounds; $round++) {
        foreach ($matches[$round] as $position => $match_data) {
            $next_match_id = $matches[$match_data['next_round']][$match_data['next_position']]['id'];
            
            $stmt = $pdo->prepare("
                UPDATE matches SET next_match_id = ? WHERE id = ?
            ");
            $stmt->execute([$next_match_id, $match_data['id']]);
        }
    }
    
    // Asignar participantes a la primera ronda
    $first_round_matches = $bracket_size / 2;
    $participant_index = 0;
    
    for ($i = 1; $i <= $first_round_matches; $i++) {
        $match_id = $matches[1][$i]['id'];
        
        // Asignar participante 1
        if ($participant_index < $count) {
            $stmt = $pdo->prepare("UPDATE matches SET participant1_id = ? WHERE id = ?");
            $stmt->execute([$participants[$participant_index]['id'], $match_id]);
            $participant_index++;
        }
        
        // Asignar participante 2
        if ($participant_index < $count) {
            $stmt = $pdo->prepare("UPDATE matches SET participant2_id = ? WHERE id = ?");
            $stmt->execute([$participants[$participant_index]['id'], $match_id]);
            $participant_index++;
        }
    }
    
    // Crear bracket de perdedores
    $losers_matches = [];
    $losers_rounds = ($rounds - 1) * 2;
    $current_losers_round = 0;
    
    for ($round = 1; $round <= $losers_rounds; $round++) {
        $matches_in_round = ceil($bracket_size / pow(2, ceil($round / 2) + 1));
        $actual_round_in_db = $rounds + $round;
        
        for ($position = 1; $position <= max(1, $matches_in_round); $position++) {
            $id = generateId();
            $losers_matches[$round][$position] = ['id' => $id];
            
            $stmt = $pdo->prepare("
                INSERT INTO matches (id, tournament_id, round, position, bracket, status) 
                VALUES (?, ?, ?, ?, 'losers', 'pending')
            ");
            $stmt->execute([$id, $tournament_id, $actual_round_in_db, $position]);
        }
    }
    
    // Vincular bracket de ganadores con bracket de perdedores
    // Los perdedores de cada ronda de ganadores van al bracket de perdedores
    for ($round = 1; $round < $rounds; $round++) {
        $losers_round = (($round - 1) * 2) + 1;
        $matches_in_winners = count($matches[$round]);
        
        for ($position = 1; $position <= $matches_in_winners; $position++) {
            // Asignar a posición en bracket de perdedores
            $losers_position = ceil($position / 2);
            if (isset($losers_matches[$losers_round][$losers_position])) {
                $loser_match_id = $losers_matches[$losers_round][$losers_position]['id'];
                
                $stmt = $pdo->prepare("
                    UPDATE matches SET loser_match_id = ? WHERE id = ?
                ");
                $stmt->execute([$loser_match_id, $matches[$round][$position]['id']]);
            }
        }
    }
    
    // Conectar partidos del bracket de perdedores entre sí
    for ($round = 1; $round < $losers_rounds; $round++) {
        if (!isset($losers_matches[$round]) || !isset($losers_matches[$round + 1])) {
            continue;
        }
        
        $current_matches = $losers_matches[$round];
        $next_matches = $losers_matches[$round + 1];
        $next_match_count = count($next_matches);
        
        $position_in_next = 1;
        foreach ($current_matches as $position => $match_data) {
            // Determinar a qué partido de la siguiente ronda va el ganador
            $target_position = ceil($position / 2);
            if ($target_position > $next_match_count) {
                $target_position = (($target_position - 1) % $next_match_count) + 1;
            }
            
            if (isset($next_matches[$target_position])) {
                $next_match_id = $next_matches[$target_position]['id'];
                
                $stmt = $pdo->prepare("
                    UPDATE matches SET next_match_id = ? WHERE id = ?
                ");
                $stmt->execute([$next_match_id, $match_data['id']]);
            }
        }
    }
    
    // Crear final
    $final_id = generateId();
    $final_round = $rounds + $losers_rounds + 1;
    $stmt = $pdo->prepare("
        INSERT INTO matches (id, tournament_id, round, position, bracket, status) 
        VALUES (?, ?, ?, ?, 'final', 'pending')
    ");
    $stmt->execute([$final_id, $tournament_id, $final_round, 1]);
    
    // Conectar la final del bracket de ganadores con la gran final
    $last_winners_match = $matches[$rounds][1]['id'];
    $stmt = $pdo->prepare("
        UPDATE matches SET next_match_id = ? WHERE id = ?
    ");
    $stmt->execute([$final_id, $last_winners_match]);
    
    // Conectar la final del bracket de perdedores con la gran final
    if ($losers_rounds > 0 && isset($losers_matches[$losers_rounds][1])) {
        $last_losers_match = $losers_matches[$losers_rounds][1]['id'];
        $stmt = $pdo->prepare("
            UPDATE matches SET next_match_id = ? WHERE id = ?
        ");
        $stmt->execute([$final_id, $last_losers_match]);
    }
}

// Función para generar bracket round robin
function generateRoundRobinBracket($pdo, $tournament_id, $participants) {
    $count = count($participants);
    $round = 1;
    
    // Cada uno contra cada uno
    for ($i = 0; $i < $count; $i++) {
        for ($j = $i + 1; $j < $count; $j++) {
            $id = generateId();
            
            $stmt = $pdo->prepare("
                INSERT INTO matches (id, tournament_id, round, position, bracket, participant1_id, participant2_id, status) 
                VALUES (?, ?, ?, ?, 'winners', ?, ?, 'pending')
            ");
            $stmt->execute([$id, $tournament_id, $round, $i * $count + $j, $participants[$i]['id'], $participants[$j]['id']]);
        }
    }
}

// Obtener partidos del bracket de ganadores
$stmt = $pdo->prepare("
    SELECT m.*, 
           p1.name as participant1_name, p1.lives as p1_lives,
           p2.name as participant2_name, p2.lives as p2_lives,
           w.name as winner_name
    FROM matches m
    LEFT JOIN participants p1 ON m.participant1_id = p1.id
    LEFT JOIN participants p2 ON m.participant2_id = p2.id
    LEFT JOIN participants w ON m.winner_id = w.id
    WHERE m.tournament_id = ? AND m.bracket = 'winners'
    ORDER BY m.round, m.position
");
$stmt->execute([$tournament_id]);
$winners_matches = $stmt->fetchAll();

// Obtener partidos del bracket de perdedores
$stmt = $pdo->prepare("
    SELECT m.*, 
           p1.name as participant1_name, p1.lives as p1_lives,
           p2.name as participant2_name, p2.lives as p2_lives,
           w.name as winner_name
    FROM matches m
    LEFT JOIN participants p1 ON m.participant1_id = p1.id
    LEFT JOIN participants p2 ON m.participant2_id = p2.id
    LEFT JOIN participants w ON m.winner_id = w.id
    WHERE m.tournament_id = ? AND m.bracket = 'losers'
    ORDER BY m.round, m.position
");
$stmt->execute([$tournament_id]);
$losers_matches = $stmt->fetchAll();

// Obtener final
$stmt = $pdo->prepare("
    SELECT m.*, 
           p1.name as participant1_name, p1.lives as p1_lives,
           p2.name as participant2_name, p2.lives as p2_lives,
           w.name as winner_name
    FROM matches m
    LEFT JOIN participants p1 ON m.participant1_id = p1.id
    LEFT JOIN participants p2 ON m.participant2_id = p2.id
    LEFT JOIN participants w ON m.winner_id = w.id
    WHERE m.tournament_id = ? AND m.bracket = 'final'
    ORDER BY m.round, m.position
");
$stmt->execute([$tournament_id]);
$final_matches = $stmt->fetchAll();

// Agrupar partidos por ronda
$winners_rounds = [];
foreach ($winners_matches as $match) {
    $winners_rounds[$match['round']][] = $match;
}

$losers_rounds = [];
foreach ($losers_matches as $match) {
    $losers_rounds[$match['round']][] = $match;
}

// Obtener participantes activos
$stmt = $pdo->prepare("
    SELECT * FROM participants 
    WHERE tournament_id = ? AND status = 'active'
    ORDER BY lives DESC, seed ASC
");
$stmt->execute([$tournament_id]);
$active_participants = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bracket - <?php echo sanitize($tournament['name']); ?> - <?php echo SITE_NAME; ?></title>
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
                    <h1><?php echo sanitize($tournament['name']); ?></h1>
                    <div class="meta">
                        <span>🛡️ <?php echo $tournament['type'] == 'double_elimination' ? 'Doble Eliminación (2 Vidas)' : 'Todos vs Todos (2 Vidas)'; ?></span>
                        <span>👤 <?php echo $tournament['participant_count']; ?> participantes</span>
                        <span class="status-badge <?php echo $tournament['status']; ?>">
                            <?php 
                            echo $tournament['status'] == 'draft' ? 'Borrador' : 
                                 ($tournament['status'] == 'active' ? 'En Curso' : 'Finalizado'); 
                            ?>
                        </span>
                    </div>
                </div>
                <div class="tournament-actions">
                    <?php if ($tournament['status'] == 'draft'): ?>
                        <a href="?id=<?php echo $tournament_id; ?>&action=start" class="btn btn-start" onclick="return confirm('¿Iniciar el torneo? No podrás agregar más participantes.')">Iniciar Torneo</a>
                    <?php endif; ?>
                    <a href="tournament.php?id=<?php echo $tournament_id; ?>" class="btn btn-view">Ver Detalles</a>
                </div>
            </div>
        </section>

        <section class="tournaments-section">
            <div class="container">
                <?php if ($tournament['status'] == 'draft'): ?>
                    <div class="empty-state">
                        <div class="empty-icon">🏆</div>
                        <h3>Torneo en Borrador</h3>
                        <p>Haz clic en "Iniciar Torneo" para generar el bracket y comenzar las competencias.</p>
                        <a href="?id=<?php echo $tournament_id; ?>&action=start" class="btn btn-start" onclick="return confirm('¿Iniciar el torneo? No podrás agregar más participantes.')">Iniciar Torneo</a>
                    </div>
                <?php elseif ($tournament['type'] == 'round_robin'): ?>
                    <!-- Round Robin View -->
                    <h3 style="margin-bottom: 20px; font-family: 'Orbitron', sans-serif;">Partidos - Todos vs Todos</h3>
                    
                    <?php if (empty($winners_matches)): ?>
                        <div class="empty-state">
                            <p>No hay partidos generados</p>
                        </div>
                    <?php else: ?>
                        <div class="tournaments-grid">
                            <?php foreach ($winners_matches as $match): ?>
                                <div class="tournament-card <?php echo $match['status']; ?>">
                                    <div class="card-header">
                                        <span class="type-badge">Partido #<?php echo $match['position']; ?></span>
                                        <span class="status-badge <?php echo $match['status']; ?>">
                                            <?php echo $match['status'] == 'completed' ? 'Finalizado' : 'Pendiente'; ?>
                                        </span>
                                    </div>
                                    <div style="padding: 15px 0;">
                                        <div class="match-participant <?php echo $match['winner_id'] == $match['participant1_id'] ? 'winner' : ($match['status'] == 'completed' ? 'loser' : ''); ?>" style="border-radius: 8px 8px 0 0;">
                                            <div class="participant-avatar"><?php echo substr($match['participant1_name'] ?? '?', 0, 1); ?></div>
                                            <div class="participant-info">
                                                <div class="name"><?php echo sanitize($match['participant1_name'] ?? 'Por definir'); ?></div>
                                                <div class="lives"><?php echo $match['p1_lives']; ?> vidas</div>
                                            </div>
                                            <div class="match-score"><?php echo $match['score1']; ?></div>
                                        </div>
                                        <div class="match-participant <?php echo $match['winner_id'] == $match['participant2_id'] ? 'winner' : ($match['status'] == 'completed' ? 'loser' : ''); ?>" style="border-radius: 0 0 8px 8px;">
                                            <div class="participant-avatar"><?php echo substr($match['participant2_name'] ?? '?', 0, 1); ?></div>
                                            <div class="participant-info">
                                                <div class="name"><?php echo sanitize($match['participant2_name'] ?? 'Por definir'); ?></div>
                                                <div class="lives"><?php echo $match['p2_lives']; ?> vidas</div>
                                            </div>
                                            <div class="match-score"><?php echo $match['score2']; ?></div>
                                        </div>
                                    </div>
                                    <?php if ($match['status'] == 'pending' && $match['participant1_id'] && $match['participant2_id']): ?>
                                        <div class="match-actions">
                                            <button class="btn btn-primary btn-sm" onclick="openScoreModal('<?php echo $match['id']; ?>', '<?php echo sanitize($match['participant1_name']); ?>', '<?php echo sanitize($match['participant2_name']); ?>')">Registrar Resultado</button>
                                        </div>
                                    <?php elseif ($match['status'] == 'completed'): ?>
                                        <div class="match-actions">
                                            <span style="color: var(--success);">🏆 <?php echo sanitize($match['winner_name']); ?></span>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                    
                <?php else: ?>
                    <!-- Double Elimination Bracket -->
                    
                    <!-- Winners Bracket -->
                    <h3 style="margin-bottom: 20px; font-family: 'Orbitron', sans-serif;">Bracket de Ganadores</h3>
                    
                    <?php if (empty($winners_rounds)): ?>
                        <div class="empty-state">
                            <p>No hay partidos en el bracket de ganadores</p>
                        </div>
                    <?php else: ?>
                        <div class="bracket-container">
                            <div class="bracket">
                                <?php foreach ($winners_rounds as $round_num => $round_matches): ?>
                                    <div class="bracket-round">
                                        <div class="round-title">Ronda <?php echo $round_num; ?></div>
                                        <?php foreach ($round_matches as $match): ?>
                                            <div class="bracket-match <?php echo $match['status']; ?>">
                                                <div class="match-participant <?php echo $match['winner_id'] == $match['participant1_id'] ? 'winner' : ($match['status'] == 'completed' ? 'loser' : ''); ?>">
                                                    <div class="participant-avatar"><?php echo substr($match['participant1_name'] ?? '?', 0, 1); ?></div>
                                                    <div class="participant-info">
                                                        <div class="name"><?php echo sanitize($match['participant1_name'] ?? 'Por definir'); ?></div>
                                                    </div>
                                                    <div class="match-score"><?php echo $match['score1']; ?></div>
                                                </div>
                                                <div class="match-participant <?php echo $match['winner_id'] == $match['participant2_id'] ? 'winner' : ($match['status'] == 'completed' ? 'loser' : ''); ?>">
                                                    <div class="participant-avatar"><?php echo substr($match['participant2_name'] ?? '?', 0, 1); ?></div>
                                                    <div class="participant-info">
                                                        <div class="name"><?php echo sanitize($match['participant2_name'] ?? 'Por definir'); ?></div>
                                                    </div>
                                                    <div class="match-score"><?php echo $match['score2']; ?></div>
                                                </div>
                                                <?php if ($match['status'] == 'pending' && $match['participant1_id'] && $match['participant2_id']): ?>
                                                    <div class="match-actions">
                                                        <button class="btn btn-primary btn-sm" onclick="openScoreModal('<?php echo $match['id']; ?>', '<?php echo sanitize($match['participant1_name']); ?>', '<?php echo sanitize($match['participant2_name']); ?>')">Registrar</button>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Losers Bracket -->
                    <?php if (!empty($losers_rounds)): ?>
                        <div class="losers-bracket">
                            <h3 style="margin-bottom: 20px; font-family: 'Orbitron', sans-serif; color: var(--danger);">Bracket de Perdedores (Repesca)</h3>
                            
                            <div class="bracket-container">
                                <div class="bracket">
                                    <?php foreach ($losers_rounds as $round_num => $round_matches): ?>
                                        <div class="bracket-round">
                                            <div class="round-title">Ronda <?php echo $round_num; ?></div>
                                            <?php foreach ($round_matches as $match): ?>
                                                <div class="bracket-match <?php echo $match['status']; ?>">
                                                    <div class="match-participant <?php echo $match['winner_id'] == $match['participant1_id'] ? 'winner' : ($match['status'] == 'completed' ? 'loser' : ''); ?>">
                                                        <div class="participant-avatar"><?php echo substr($match['participant1_name'] ?? '?', 0, 1); ?></div>
                                                        <div class="participant-info">
                                                            <div class="name"><?php echo sanitize($match['participant1_name'] ?? 'Por definir'); ?></div>
                                                        </div>
                                                        <div class="match-score"><?php echo $match['score1']; ?></div>
                                                    </div>
                                                    <div class="match-participant <?php echo $match['winner_id'] == $match['participant2_id'] ? 'winner' : ($match['status'] == 'completed' ? 'loser' : ''); ?>">
                                                        <div class="participant-avatar"><?php echo substr($match['participant2_name'] ?? '?', 0, 1); ?></div>
                                                        <div class="participant-info">
                                                            <div class="name"><?php echo sanitize($match['participant2_name'] ?? 'Por definir'); ?></div>
                                                        </div>
                                                        <div class="match-score"><?php echo $match['score2']; ?></div>
                                                    </div>
                                                    <?php if ($match['status'] == 'pending' && $match['participant1_id'] && $match['participant2_id']): ?>
                                                        <div class="match-actions">
                                                            <button class="btn btn-primary btn-sm" onclick="openScoreModal('<?php echo $match['id']; ?>', '<?php echo sanitize($match['participant1_name']); ?>', '<?php echo sanitize($match['participant2_name']); ?>')">Registrar</button>
                                                        </div>
                                                    <?php endif; ?>
                                                </div>
                                            <?php endforeach; ?>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Finals -->
                    <?php if (!empty($final_matches)): ?>
                        <div class="finals-section">
                            <h3>🏆 GRAN FINAL 🏆</h3>
                            <div class="tournaments-grid" style="max-width: 400px; margin: 0 auto;">
                                <?php foreach ($final_matches as $match): ?>
                                    <div class="tournament-card <?php echo $match['status']; ?>">
                                        <div style="padding: 20px;">
                                            <div class="match-participant <?php echo $match['winner_id'] == $match['participant1_id'] ? 'winner' : ($match['status'] == 'completed' ? 'loser' : ''); ?>" style="padding: 15px;">
                                                <div class="participant-avatar" style="width: 50px; height: 50px; font-size: 1.2rem;"><?php echo substr($match['participant1_name'] ?? '?', 0, 1); ?></div>
                                                <div class="participant-info">
                                                    <div class="name" style="font-size: 1.2rem;"><?php echo sanitize($match['participant1_name'] ?? 'Por definir'); ?></div>
                                                </div>
                                                <div class="match-score" style="font-size: 2rem;"><?php echo $match['score1']; ?></div>
                                            </div>
                                            <div style="text-align: center; padding: 10px; color: var(--primary); font-family: 'Orbitron', sans-serif; font-size: 1.5rem;">VS</div>
                                            <div class="match-participant <?php echo $match['winner_id'] == $match['participant2_id'] ? 'winner' : ($match['status'] == 'completed' ? 'loser' : ''); ?>" style="padding: 15px;">
                                                <div class="participant-avatar" style="width: 50px; height: 50px; font-size: 1.2rem;"><?php echo substr($match['participant2_name'] ?? '?', 0, 1); ?></div>
                                                <div class="participant-info">
                                                    <div class="name" style="font-size: 1.2rem;"><?php echo sanitize($match['participant2_name'] ?? 'Por definir'); ?></div>
                                                </div>
                                                <div class="match-score" style="font-size: 2rem;"><?php echo $match['score2']; ?></div>
                                            </div>
                                        </div>
                                        <?php if ($match['status'] == 'pending' && $match['participant1_id'] && $match['participant2_id']): ?>
                                            <div class="match-actions">
                                                <button class="btn btn-primary" onclick="openScoreModal('<?php echo $match['id']; ?>', '<?php echo sanitize($match['participant1_name']); ?>', '<?php echo sanitize($match['participant2_name']); ?>')">Registrar Resultado Final</button>
                                            </div>
                                        <?php elseif ($match['status'] == 'completed'): ?>
                                            <div class="match-actions" style="background: linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 107, 53, 0.2) 100%);">
                                                <span style="color: var(--secondary); font-size: 1.3rem; font-family: 'Orbitron', sans-serif;">🏆 CAMPEÓN: <?php echo strtoupper(sanitize($match['winner_name'])); ?> 🏆</span>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                    
                <?php endif; ?>
            </div>
        </section>
    </main>

    <!-- Score Modal -->
    <div class="modal-overlay" id="scoreModal">
        <div class="modal">
            <div class="modal-header">
                <h3>Registrar Resultado</h3>
                <button class="modal-close" onclick="closeScoreModal()">&times;</button>
            </div>
            <form id="scoreForm" method="POST" action="../api/update_match.php">
                <input type="hidden" name="match_id" id="matchId">
                <input type="hidden" name="tournament_id" value="<?php echo $tournament_id; ?>">
                
                <div class="score-input-group">
                    <div class="score-player">
                        <div class="name" id="player1Name">Jugador 1</div>
                        <input type="number" name="score1" class="score-input" value="0" min="0" required>
                    </div>
                    <div class="score-divider">-</div>
                    <div class="score-player">
                        <div class="name" id="player2Name">Jugador 2</div>
                        <input type="number" name="score2" class="score-input" value="0" min="0" required>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeScoreModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Resultado</button>
                </div>
            </form>
        </div>
    </div>

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

    <script>
        function openScoreModal(matchId, player1, player2) {
            document.getElementById('matchId').value = matchId;
            document.getElementById('player1Name').textContent = player1;
            document.getElementById('player2Name').textContent = player2;
            document.getElementById('scoreModal').classList.add('active');
        }
        
        function closeScoreModal() {
            document.getElementById('scoreModal').classList.remove('active');
        }
        
        // Cerrar modal al hacer clic fuera
        document.getElementById('scoreModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeScoreModal();
            }
        });
    </script>
</body>
</html>
