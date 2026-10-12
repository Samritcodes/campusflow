<?php
// backend/config/database.php

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../utils/response.php';

function getDBConnection(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            "mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4",
            DB_HOST,
            DB_PORT,
            DB_NAME
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            sendResponse(
                false,
                'Database connection failed. Ensure XAMPP MySQL is running and "campusflow" database exists.',
                null,
                500,
                APP_ENV === 'development' ? $e->getMessage() : null
            );
        }
    }

    return $pdo;
}
