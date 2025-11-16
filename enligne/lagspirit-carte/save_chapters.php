<?php
// Fichier : save_chapters.php
// Sauvegarde le JSON envoyé dans assets/chapters.json

// Chemin absolu vers chapters.json
$chaptersFile = __DIR__ . '/assets/chapters.json';

// On lit le corps brut de la requête
$raw = file_get_contents('php://input');

if (!$raw) {
    http_response_code(400);
    echo "Aucune donnée reçue.";
    exit;
}

// On vérifie que c'est du JSON valide
$data = json_decode($raw, true);
if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo "JSON invalide.";
    exit;
}

// On tente d'écrire le fichier
if (file_put_contents($chaptersFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo "OK";
} else {
    http_response_code(500);
    echo "Impossible d'écrire dans chapters.json";
}