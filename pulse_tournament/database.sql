-- Iron Grip Tournament System
-- Script de instalación de base de datos

CREATE DATABASE IF NOT EXISTS pulse_tournament CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pulse_tournament;

-- Tabla de torneos
CREATE TABLE tournaments (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('double_elimination', 'round_robin') NOT NULL,
    status ENUM('draft', 'active', 'completed') DEFAULT 'draft',
    category VARCHAR(100),
    weight_class VARCHAR(50),
    arm ENUM('left', 'right', 'both') DEFAULT 'right',
    max_participants INT DEFAULT 32,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de participantes
CREATE TABLE participants (
    id VARCHAR(32) PRIMARY KEY,
    tournament_id VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    country VARCHAR(100),
    club VARCHAR(100),
    seed INT DEFAULT 0,
    lives INT DEFAULT 2,
    status ENUM('active', 'eliminated', 'champion') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de partidos
CREATE TABLE matches (
    id VARCHAR(32) PRIMARY KEY,
    tournament_id VARCHAR(32) NOT NULL,
    round INT NOT NULL,
    position INT NOT NULL,
    bracket ENUM('winners', 'losers', 'final') DEFAULT 'winners',
    participant1_id VARCHAR(32) NULL,
    participant2_id VARCHAR(32) NULL,
    winner_id VARCHAR(32) NULL,
    loser_id VARCHAR(32) NULL,
    score1 INT DEFAULT 0,
    score2 INT DEFAULT 0,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    next_match_id VARCHAR(32) NULL,
    loser_match_id VARCHAR(32) NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (participant1_id) REFERENCES participants(id) ON DELETE SET NULL,
    FOREIGN KEY (participant2_id) REFERENCES participants(id) ON DELETE SET NULL,
    FOREIGN KEY (winner_id) REFERENCES participants(id) ON DELETE SET NULL,
    FOREIGN KEY (loser_id) REFERENCES participants(id) ON DELETE SET NULL,
    INDEX idx_tournament_round (tournament_id, round),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de estadísticas de participantes
CREATE TABLE participant_stats (
    id VARCHAR(32) PRIMARY KEY,
    participant_id VARCHAR(32) NOT NULL,
    tournament_id VARCHAR(32) NOT NULL,
    matches_played INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    lives_lost INT DEFAULT 0,
    final_position INT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant_tournament (participant_id, tournament_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de usuarios administradores
CREATE TABLE users (
    id VARCHAR(32) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('admin', 'organizer') DEFAULT 'organizer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar usuario admin por defecto (password: admin123)
INSERT INTO users (id, username, password_hash, email, role) VALUES 
('admin001', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@irongrip.com', 'admin');
