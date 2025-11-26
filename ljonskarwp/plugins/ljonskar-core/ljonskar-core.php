<?php
/**
 * Plugin Name: Ljonskar Core
 * Description: Coeur des fonctions membres Ljønskar (rôles).
 * Version: 0.1.0
 * Author: Jimmy CATTIAU
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // sécurité : pas d'accès direct
}

// Chemin du plugin
define( 'LJONSKAR_CORE_PATH', plugin_dir_path( __FILE__ ) );

// On charge le fichier des rôles
require_once LJONSKAR_CORE_PATH . 'includes/roles.php';

/**
 * À l’activation du plugin : création des rôles.
 */
function ljonskar_core_activate() {
    ljonskar_register_roles();
}
register_activation_hook( __FILE__, 'ljonskar_core_activate' );