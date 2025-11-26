<?php
/**
 * Plugin Name: Ljonskar Core
 * Description: Fonctionnalités de base du site Ljønskar.
 * Version: 1.0
 * Author: Jimmy
 */

// Sécurité
if (!defined('ABSPATH')) exit;

// AUTOCHARGEMENT DES MODULES
require_once __DIR__ . '/includes/roles.php';

// HANDLERS
require_once __DIR__ . '/handlers/roles-handler.php';

// CHARGER LES TEMPLATES DU TABLEAU DE BORD
function ljonskar_render_template($template_name) {
    $file = __DIR__ . '/templates/' . $template_name . '.php';
    if (file_exists($file)) {
        include $file;
    } else {
        echo "<h2>Template introuvable : $template_name</h2>";
    }
}