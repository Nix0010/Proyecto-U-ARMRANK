# Iron Grip Tournament System

Sistema profesional de gestión de torneos de pulsos (arm wrestling) desarrollado en PHP para servidores Ubuntu.

## Características

- 🛡️ **Doble Eliminación (2 Vidas)**: Cada luchador tiene dos oportunidades antes de ser eliminado
- ⚡ **Todos vs Todos (2 Vidas)**: Modalidad round-robin con sistema de vidas
- 📊 **Bracket Visual**: Visualización clara del bracket en tiempo real
- 🏆 **Sistema de Rankings**: Estadísticas y clasificación de luchadores
- 📱 **Responsive**: Accesible desde cualquier dispositivo
- 🎨 **Diseño Profesional**: Tema oscuro con acentos naranja/dorado

## Requisitos

- PHP 7.4 o superior
- MySQL 5.7 o superior
- Apache2 o Nginx
- Ubuntu Server (recomendado 20.04 LTS o superior)

## Instalación en Ubuntu Server

### 1. Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Apache, MySQL y PHP

```bash
sudo apt install -y apache2 mysql-server php php-mysql php-pdo php-mbstring
```

### 3. Configurar MySQL

```bash
sudo mysql_secure_installation
```

Crear la base de datos:

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE pulse_tournament CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pulse_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON pulse_tournament.* TO 'pulse_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Importar el esquema de la base de datos

```bash
sudo mysql -u pulse_user -p pulse_tournament < database.sql
```

### 5. Configurar el sitio web

Copiar los archivos al directorio de Apache:

```bash
sudo cp -r /ruta/del/proyecto/pulse_tournament/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

### 6. Configurar la base de datos

Editar el archivo `config.php`:

```bash
sudo nano /var/www/html/config.php
```

Modificar las credenciales:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'pulse_tournament');
define('DB_USER', 'pulse_user');
define('DB_PASS', 'tu_password_seguro');
```

### 7. Configurar Apache (Opcional - para URL limpias)

```bash
sudo a2enmod rewrite
sudo nano /etc/apache2/sites-available/000-default.conf
```

Agregar dentro de `<Directory /var/www/html>`:

```apache
<Directory /var/www/html>
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

Reiniciar Apache:

```bash
sudo systemctl restart apache2
```

### 8. Acceder al sistema

Abrir en el navegador:

```
http://tu-servidor/
```

## Estructura del Proyecto

```
pulse_tournament/
├── api/                    # Endpoints de API
│   └── update_match.php   # Actualizar resultados
├── assets/
│   ├── css/
│   │   └── style.css      # Estilos principales
│   ├── js/
│   │   └── main.js        # JavaScript principal
│   └── images/            # Imágenes
├── pages/                 # Páginas del sistema
│   ├── tournaments.php    # Lista de torneos
│   ├── create.php         # Crear torneo
│   ├── tournament.php     # Detalle de torneo
│   ├── bracket.php        # Bracket del torneo
│   └── rankings.php       # Rankings
├── config.php            # Configuración
├── database.sql          # Esquema de base de datos
├── index.php             # Página principal
└── README.md             # Este archivo
```

## Uso

### Crear un Torneo

1. Ir a "Crear Torneo"
2. Ingresar nombre y descripción
3. Seleccionar tipo de torneo:
   - **Doble Eliminación**: Sistema de 2 vidas con bracket de ganadores y perdedores
   - **Todos vs Todos**: Cada uno enfrenta a todos con 2 vidas
4. Agregar participantes (mínimo 3)
5. Guardar e iniciar el torneo

### Gestionar Partidos

1. Ir al bracket del torneo
2. Clic en "Registrar Resultado" en el partido deseado
3. Ingresar el marcador (1-0 para indicar ganador)
4. El sistema automáticamente:
   - Actualiza vidas del perdedor
   - Avanza al ganador a la siguiente ronda
   - Envía al perdedor al bracket de repesca (si aplica)

### Sistema de 2 Vidas

- Cada luchador comienza con 2 vidas ❤️❤️
- Al perder un pulso, pierde 1 vida
- Con 0 vidas, el luchador es eliminado
- En doble eliminación, la primera derrota envía al bracket de perdedores
- La segunda derrota elimina al luchador

## Personalización

### Cambiar colores

Editar `assets/css/style.css` y modificar las variables CSS:

```css
:root {
    --primary: #ff6b35;        /* Color principal */
    --secondary: #ffc107;      /* Color secundario */
    --bg-dark: #0a0a0f;        /* Fondo oscuro */
    /* ... */
}
```

### Cambiar nombre del sitio

Editar `config.php`:

```php
define('SITE_NAME', 'Tu Nombre');
```

## Seguridad

- Cambiar la contraseña del admin por defecto
- Usar HTTPS en producción
- Mantener PHP y MySQL actualizados
- Hacer backups regulares de la base de datos

## Backup de Base de Datos

```bash
sudo mysqldump -u pulse_user -p pulse_tournament > backup_$(date +%Y%m%d).sql
```

## Soporte

Para reportar problemas o sugerencias, contactar al administrador del sistema.

## Licencia

Sistema desarrollado para uso privado de torneos de arm wrestling.

---

**Iron Grip Tournament System** - Domina el Pulso 💪
