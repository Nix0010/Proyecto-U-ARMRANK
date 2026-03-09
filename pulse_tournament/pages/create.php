<?php
require_once '../config.php';

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $type = $_POST['type'] ?? '';
    $category = trim($_POST['category'] ?? '');
    $weight_class = trim($_POST['weight_class'] ?? '');
    $arm = $_POST['arm'] ?? 'right';
    $participants = $_POST['participants'] ?? [];
    
    if (empty($name)) {
        $error = 'El nombre del torneo es obligatorio';
    } elseif (empty($type)) {
        $error = 'Selecciona un tipo de torneo';
    } elseif (count($participants) < 3) {
        $error = 'Mínimo 3 participantes para crear un torneo';
    } else {
        try {
            $pdo->beginTransaction();
            
            // Crear torneo
            $tournament_id = generateId();
            $stmt = $pdo->prepare("INSERT INTO tournaments (id, name, description, type, category, weight_class, arm, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')");
            $stmt->execute([$tournament_id, $name, $description, $type, $category, $weight_class, $arm]);
            
            // Agregar participantes
            $seed = 1;
            foreach ($participants as $participant_name) {
                if (!empty(trim($participant_name))) {
                    $participant_id = generateId();
                    $stmt = $pdo->prepare("INSERT INTO participants (id, tournament_id, name, seed, lives) VALUES (?, ?, ?, ?, 2)");
                    $stmt->execute([$participant_id, $tournament_id, trim($participant_name), $seed]);
                    $seed++;
                }
            }
            
            $pdo->commit();
            $success = 'Torneo creado exitosamente';
            
            // Redirigir al bracket
            redirect("bracket.php?id=$tournament_id");
            
        } catch (Exception $e) {
            $pdo->rollBack();
            $error = 'Error al crear el torneo: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crear Torneo - <?php echo SITE_NAME; ?></title>
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
                <a href="create.php" class="active">Crear Torneo</a>
                <a href="rankings.php">Rankings</a>
            </nav>
        </div>
    </header>

    <main>
        <section class="form-section">
            <div class="container">
                <div class="form-container">
                    <h2 class="form-title">Crear Nuevo Torneo</h2>
                    <p class="form-subtitle">Configura tu torneo de pulsos</p>
                    
                    <?php if ($error): ?>
                        <div class="alert alert-error">
                            <span>⚠️</span> <?php echo $error; ?>
                        </div>
                    <?php endif; ?>
                    
                    <form method="POST" action="" id="createTournamentForm">
                        <!-- Información básica -->
                        <div class="form-group">
                            <label class="form-label">Nombre del Torneo *</label>
                            <input type="text" name="name" class="form-input" placeholder="Ej: Torneo Iron Grip 2024" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Descripción <span>(opcional)</span></label>
                            <textarea name="description" class="form-textarea" placeholder="Describe tu torneo..."></textarea>
                        </div>
                        
                        <!-- Tipo de torneo -->
                        <div class="form-group">
                            <label class="form-label">Tipo de Torneo *</label>
                            <div class="type-selection">
                                <label class="type-card" onclick="selectType('double_elimination')">
                                    <input type="radio" name="type" value="double_elimination" required>
                                    <div class="type-icon">🛡️</div>
                                    <h4>Doble Eliminación</h4>
                                    <p>Sistema de 2 vidas. Cada luchador puede perder una vez antes de ser eliminado.</p>
                                </label>
                                <label class="type-card" onclick="selectType('round_robin')">
                                    <input type="radio" name="type" value="round_robin">
                                    <div class="type-icon">⚡</div>
                                    <h4>Todos vs Todos (2V)</h4>
                                    <p>Cada uno enfrenta a todos. 2 vidas, el último en pie gana.</p>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Detalles adicionales -->
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Categoría <span>(opcional)</span></label>
                                <input type="text" name="category" class="form-input" placeholder="Ej: Profesional, Amateur">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Clase de Peso <span>(opcional)</span></label>
                                <input type="text" name="weight_class" class="form-input" placeholder="Ej: -80kg, +90kg">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Brazo</label>
                            <select name="arm" class="form-select">
                                <option value="right">Derecho</option>
                                <option value="left">Izquierdo</option>
                                <option value="both">Ambos</option>
                            </select>
                        </div>
                        
                        <!-- Participantes -->
                        <div class="participants-section">
                            <div class="participants-header">
                                <h3>Participantes</h3>
                                <span class="participant-count"><span id="participantCount">0</span> agregados</span>
                            </div>
                            
                            <div class="participant-input-group">
                                <input type="text" id="newParticipant" class="form-input" placeholder="Nombre del participante">
                                <button type="button" class="btn btn-primary" onclick="addParticipant()">Agregar</button>
                            </div>
                            
                            <div id="participantsList" class="participants-list">
                                <!-- Los participantes se agregan aquí -->
                            </div>
                            
                            <p class="form-hint">Mínimo 3 participantes. El seed se asigna automáticamente en orden de llegada.</p>
                        </div>
                        
                        <div class="form-actions">
                            <a href="../index.php" class="btn btn-secondary">Cancelar</a>
                            <button type="submit" class="btn btn-primary">Crear Torneo</button>
                        </div>
                    </form>
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

    <script>
        let participants = [];
        
        function selectType(type) {
            document.querySelectorAll('.type-card').forEach(card => {
                card.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');
            event.currentTarget.querySelector('input').checked = true;
        }
        
        function addParticipant() {
            const input = document.getElementById('newParticipant');
            const name = input.value.trim();
            
            if (!name) {
                alert('Ingresa un nombre');
                return;
            }
            
            if (participants.includes(name)) {
                alert('Este participante ya está agregado');
                return;
            }
            
            participants.push(name);
            input.value = '';
            renderParticipants();
            input.focus();
        }
        
        function removeParticipant(index) {
            participants.splice(index, 1);
            renderParticipants();
        }
        
        function renderParticipants() {
            const list = document.getElementById('participantsList');
            const count = document.getElementById('participantCount');
            
            count.textContent = participants.length;
            
            if (participants.length === 0) {
                list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No hay participantes aún</p>';
                return;
            }
            
            list.innerHTML = participants.map((name, index) => `
                <div class="participant-item">
                    <div class="participant-seed">${index + 1}</div>
                    <span class="participant-name">${escapeHtml(name)}</span>
                    <input type="hidden" name="participants[]" value="${escapeHtml(name)}">
                    <div class="participant-actions">
                        <button type="button" class="btn-icon" onclick="removeParticipant(${index})">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Enter para agregar participante
        document.getElementById('newParticipant').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addParticipant();
            }
        });
        
        // Validar formulario
        document.getElementById('createTournamentForm').addEventListener('submit', function(e) {
            if (participants.length < 3) {
                e.preventDefault();
                alert('Mínimo 3 participantes para crear un torneo');
                return false;
            }
        });
        
        // Inicializar
        renderParticipants();
    </script>
</body>
</html>
