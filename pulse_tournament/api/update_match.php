<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

$match_id = $_POST['match_id'] ?? '';
$score1 = intval($_POST['score1'] ?? 0);
$score2 = intval($_POST['score2'] ?? 0);

if (!$match_id) {
    echo json_encode(['success' => false, 'error' => 'ID de partido requerido']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    // Obtener información del partido
    $stmt = $pdo->prepare("
        SELECT m.*, t.type as tournament_type, t.id as tournament_id
        FROM matches m
        JOIN tournaments t ON m.tournament_id = t.id
        WHERE m.id = ?
    ");
    $stmt->execute([$match_id]);
    $match = $stmt->fetch();
    
    if (!$match) {
        throw new Exception('Partido no encontrado');
    }
    
    if ($match['status'] == 'completed') {
        throw new Exception('El partido ya está completado');
    }
    
    // Determinar ganador (en pulsos, quien gana el pulso es el ganador)
    // Por simplicidad, asumimos que score1=1 significa que jugador 1 ganó el pulso
    if ($score1 > $score2) {
        $winner_id = $match['participant1_id'];
        $loser_id = $match['participant2_id'];
    } elseif ($score2 > $score1) {
        $winner_id = $match['participant2_id'];
        $loser_id = $match['participant1_id'];
    } else {
        throw new Exception('Debe haber un ganador');
    }
    
    // Actualizar partido
    $stmt = $pdo->prepare("
        UPDATE matches 
        SET score1 = ?, score2 = ?, winner_id = ?, loser_id = ?, status = 'completed', completed_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$score1, $score2, $winner_id, $loser_id, $match_id]);
    
    // Actualizar vidas del perdedor
    $stmt = $pdo->prepare("UPDATE participants SET lives = lives - 1 WHERE id = ?");
    $stmt->execute([$loser_id]);
    
    // Verificar si el perdedor fue eliminado
    $stmt = $pdo->prepare("SELECT lives FROM participants WHERE id = ?");
    $stmt->execute([$loser_id]);
    $loser_lives = $stmt->fetchColumn();
    
    if ($loser_lives <= 0) {
        $stmt = $pdo->prepare("UPDATE participants SET status = 'eliminated' WHERE id = ?");
        $stmt->execute([$loser_id]);
    }
    
    // Actualizar estadísticas
    updateStats($pdo, $winner_id, $match['tournament_id'], true);
    updateStats($pdo, $loser_id, $match['tournament_id'], false);
    
    // Si es doble eliminación, manejar bracket
    if ($match['tournament_type'] == 'double_elimination') {
        handleDoubleEliminationAdvancement($pdo, $match, $winner_id, $loser_id);
    } else {
        // Round Robin - verificar si hay un campeón
        checkRoundRobinChampion($pdo, $match['tournament_id']);
    }
    
    $pdo->commit();
    
    echo json_encode(['success' => true]);
    
    // Redirigir de vuelta al bracket
    header("Location: ../pages/bracket.php?id=" . $match['tournament_id']);
    exit;
    
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function updateStats($pdo, $participant_id, $tournament_id, $is_winner) {
    // Verificar si ya existen estadísticas
    $stmt = $pdo->prepare("
        SELECT id FROM participant_stats 
        WHERE participant_id = ? AND tournament_id = ?
    ");
    $stmt->execute([$participant_id, $tournament_id]);
    $stats = $stmt->fetch();
    
    if ($stats) {
        // Actualizar
        $stmt = $pdo->prepare("
            UPDATE participant_stats 
            SET matches_played = matches_played + 1,
                wins = wins + ?,
                losses = losses + ?
            WHERE participant_id = ? AND tournament_id = ?
        ");
        $stmt->execute([$is_winner ? 1 : 0, $is_winner ? 0 : 1, $participant_id, $tournament_id]);
    } else {
        // Crear nuevo
        $id = generateId();
        $stmt = $pdo->prepare("
            INSERT INTO participant_stats (id, participant_id, tournament_id, matches_played, wins, losses)
            VALUES (?, ?, ?, 1, ?, ?)
        ");
        $stmt->execute([$id, $participant_id, $tournament_id, $is_winner ? 1 : 0, $is_winner ? 0 : 1]);
    }
}

function handleDoubleEliminationAdvancement($pdo, $match, $winner_id, $loser_id) {
    // Avanzar ganador al siguiente partido
    if ($match['next_match_id']) {
        $stmt = $pdo->prepare("
            SELECT participant1_id FROM matches WHERE id = ?
        ");
        $stmt->execute([$match['next_match_id']]);
        $next_match = $stmt->fetch();
        
        if ($next_match['participant1_id']) {
            $stmt = $pdo->prepare("
                UPDATE matches SET participant2_id = ? WHERE id = ?
            ");
            $stmt->execute([$winner_id, $match['next_match_id']]);
        } else {
            $stmt = $pdo->prepare("
                UPDATE matches SET participant1_id = ? WHERE id = ?
            ");
            $stmt->execute([$winner_id, $match['next_match_id']]);
        }
    }
    
    // Enviar perdedor al bracket de perdedores (si no es la final)
    if ($match['bracket'] == 'winners' && $match['loser_match_id']) {
        $stmt = $pdo->prepare("
            SELECT participant1_id FROM matches WHERE id = ?
        ");
        $stmt->execute([$match['loser_match_id']]);
        $loser_match = $stmt->fetch();
        
        if ($loser_match['participant1_id']) {
            $stmt = $pdo->prepare("
                UPDATE matches SET participant2_id = ? WHERE id = ?
            ");
            $stmt->execute([$loser_id, $match['loser_match_id']]);
        } else {
            $stmt = $pdo->prepare("
                UPDATE matches SET participant1_id = ? WHERE id = ?
            ");
            $stmt->execute([$loser_id, $match['loser_match_id']]);
        }
    }
    
    // Verificar si el torneo terminó
    checkTournamentCompletion($pdo, $match['tournament_id']);
}

function checkRoundRobinChampion($pdo, $tournament_id) {
    // Contar participantes activos
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM participants 
        WHERE tournament_id = ? AND status = 'active'
    ");
    $stmt->execute([$tournament_id]);
    $active_count = $stmt->fetchColumn();
    
    // Si solo queda uno, es el campeón
    if ($active_count == 1) {
        $stmt = $pdo->prepare("
            UPDATE participants SET status = 'champion' 
            WHERE tournament_id = ? AND status = 'active'
        ");
        $stmt->execute([$tournament_id]);
        
        // Finalizar torneo
        $stmt = $pdo->prepare("
            UPDATE tournaments SET status = 'completed', completed_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$tournament_id]);
    }
}

function checkTournamentCompletion($pdo, $tournament_id) {
    // Verificar si la final se completó
    $stmt = $pdo->prepare("
        SELECT winner_id FROM matches 
        WHERE tournament_id = ? AND bracket = 'final' AND status = 'completed'
    ");
    $stmt->execute([$tournament_id]);
    $final_winner = $stmt->fetchColumn();
    
    if ($final_winner) {
        // Marcar campeón
        $stmt = $pdo->prepare("
            UPDATE participants SET status = 'champion' WHERE id = ?
        ");
        $stmt->execute([$final_winner]);
        
        // Finalizar torneo
        $stmt = $pdo->prepare("
            UPDATE tournaments SET status = 'completed', completed_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$tournament_id]);
    }
}
