<?php
require_once '../config.php';

// Paginación
$page = max(1, intval($_GET['page'] ?? 1));
$per_page = 12;
$offset = ($page - 1) * $per_page;

// Filtros
$status_filter = $_GET['status'] ?? '';
$type_filter = $_GET['type'] ?? '';

// Construir query
$where = [];
$params = [];

if ($status_filter) {
    $where[] = "status = ?";
    $params[] = $status_filter;
}
if ($type_filter) {
    $where[] = "type = ?";
    $params[] = $type_filter;
}

$where_clause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Contar total
$count_sql = "SELECT COUNT(*) FROM tournaments $where_clause";
$stmt = $pdo->prepare($count_sql);
$stmt->execute($params);
$total = $stmt->fetchColumn();
$total_pages = ceil($total / $per_page);

// Obtener torneos
$sql = "
    SELECT t.*, 
           COUNT(DISTINCT p.id) as participant_count,
           COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as matches_completed
    FROM tournaments t
    LEFT JOIN participants p ON t.id = p.tournament_id
    LEFT JOIN matches m ON t.id = m.tournament_id
    $where_clause
    GROUP BY t.id
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
";

$stmt = $pdo->prepare($sql);
$stmt->execute(array_merge($params, [$per_page, $offset]));
$tournaments = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Torneos - <?php echo SITE_NAME; ?></title>
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
                <a href="tournaments.php" class="active">Torneos</a>
                <a href="create.php">Crear Torneo</a>
                <a href="rankings.php">Rankings</a>
            </nav>
        </div>
    </header>

    <main>
        <section class="page-header">
            <div class="container">
                <h1>Todos los Torneos</h1>
                <p><?php echo $total; ?> torneos registrados</p>
            </div>
        </section>

        <section class="tournaments-section">
            <div class="container">
                <!-- Filtros -->
                <div class="rankings-filters">
                    <form method="GET" action="" style="display: flex; gap: 15px; flex-wrap: wrap;">
                        <select name="status" class="form-select" onchange="this.form.submit()">
                            <option value="">Todos los estados</option>
                            <option value="draft" <?php echo $status_filter == 'draft' ? 'selected' : ''; ?>>Borrador</option>
                            <option value="active" <?php echo $status_filter == 'active' ? 'selected' : ''; ?>>En Curso</option>
                            <option value="completed" <?php echo $status_filter == 'completed' ? 'selected' : ''; ?>>Finalizado</option>
                        </select>
                        <select name="type" class="form-select" onchange="this.form.submit()">
                            <option value="">Todos los tipos</option>
                            <option value="double_elimination" <?php echo $type_filter == 'double_elimination' ? 'selected' : ''; ?>>2 Vidas</option>
                            <option value="round_robin" <?php echo $type_filter == 'round_robin' ? 'selected' : ''; ?>>Todos vs Todos (2V)</option>
                        </select>
                        <?php if ($status_filter || $type_filter): ?>
                            <a href="tournaments.php" class="btn btn-secondary btn-sm">Limpiar filtros</a>
                        <?php endif; ?>
                    </form>
                </div>
                
                <?php if (empty($tournaments)): ?>
                    <div class="empty-state">
                        <div class="empty-icon">🏆</div>
                        <h3>No se encontraron torneos</h3>
                        <p>Prueba con otros filtros o crea un nuevo torneo</p>
                        <a href="create.php" class="btn btn-primary">Crear Torneo</a>
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
                                <?php if ($tournament['category'] || $tournament['weight_class']): ?>
                                    <div class="tournament-meta" style="margin-top: 5px;">
                                        <?php if ($tournament['category']): ?>
                                            <span>🏷️ <?php echo sanitize($tournament['category']); ?></span>
                                        <?php endif; ?>
                                        <?php if ($tournament['weight_class']): ?>
                                            <span>⚖️ <?php echo sanitize($tournament['weight_class']); ?></span>
                                        <?php endif; ?>
                                    </div>
                                <?php endif; ?>
                                <div class="card-actions">
                                    <a href="tournament.php?id=<?php echo $tournament['id']; ?>" class="btn btn-view">Ver Torneo</a>
                                    <?php if ($tournament['status'] == 'draft'): ?>
                                        <a href="bracket.php?id=<?php echo $tournament['id']; ?>" class="btn btn-start">Iniciar</a>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    
                    <!-- Paginación -->
                    <?php if ($total_pages > 1): ?>
                        <div class="pagination">
                            <?php if ($page > 1): ?>
                                <a href="?page=<?php echo $page - 1; ?>&status=<?php echo $status_filter; ?>&type=<?php echo $type_filter; ?>">← Anterior</a>
                            <?php endif; ?>
                            
                            <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                                <?php if ($i == $page): ?>
                                    <span class="current"><?php echo $i; ?></span>
                                <?php else: ?>
                                    <a href="?page=<?php echo $i; ?>&status=<?php echo $status_filter; ?>&type=<?php echo $type_filter; ?>"><?php echo $i; ?></a>
                                <?php endif; ?>
                            <?php endfor; ?>
                            
                            <?php if ($page < $total_pages): ?>
                                <a href="?page=<?php echo $page + 1; ?>&status=<?php echo $status_filter; ?>&type=<?php echo $type_filter; ?>">Siguiente →</a>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
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
