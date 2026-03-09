<?php
/**
 * Iron Grip Tournament System
 * Sistema de Torneos de Pulsos (Arm Wrestling)
 * 
 * Configuración de base de datos
 */

// Configuración de la base de datos - AJUSTA ESTOS VALORES
define('DB_HOST', 'localhost');
define('DB_NAME', 'pulse_tournament');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Configuración del sitio
define('SITE_NAME', 'Iron Grip Tournaments');
define('SITE_URL', 'http://localhost/pulse_tournament');
define('ADMIN_EMAIL', 'admin@irongrip.com');

// Conexión a la base de datos
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}

// Iniciar sesión
session_start();

// Funciones útiles
function redirect($url) {
    header("Location: " . $url);
    exit();
}

function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

function generateId() {
    return bin2hex(random_bytes(16));
}

function formatDate($date) {
    return date('d/m/Y H:i', strtotime($date));
}
?>