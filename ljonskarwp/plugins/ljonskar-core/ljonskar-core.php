<?php
/**
 * Plugin Name: Ljonskar Core
 * Description: Fonctionnalités principales du site (rôles, profils, événements, administration).
 * Version: 1.0
 * Author: Jimmy CATTIAU
 */

// Sécurité : empêcher accès direct
if (!defined('ABSPATH')) exit;

// Définir le chemin du plugin
define('LJONSKAR_CORE_PATH', plugin_dir_path(__FILE__));

// Charger automatiquement les fichiers du dossier includes
require_once LJONSKAR_CORE_PATH . 'includes/loader.php';