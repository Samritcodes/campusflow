<?php
// backend/config/config.php

define('APP_ENV', 'development');
define('FRONTEND_URL', 'http://localhost:5173');

// XAMPP MySQL Defaults
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'campusflow');
define('DB_USER', 'root');
define('DB_PASS', ''); // Default XAMPP password is empty

// Role Constants
define('ROLE_STUDENT', 'STUDENT');
define('ROLE_ORGANIZER', 'ORGANIZER');
define('ROLE_DEPT_MANAGER', 'DEPARTMENT_MANAGER');
define('ROLE_ADMIN', 'ADMIN');
