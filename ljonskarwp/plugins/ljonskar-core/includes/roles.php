<?php
// Sécurité
if (!defined('ABSPATH')) exit;

class LjonskarRoles {

    public static function init() {
        add_action('init', [__CLASS__, 'register_roles']);
    }

    // Rôles personnalisés
    public static function register_roles() {

        add_role('ljonskar_roles_manager', 'Gestionnaire des rôles', [
            'read' => true,
            'manage_ljonskar_roles' => true
        ]);

        add_role('ljonskar_events_manager', 'Gestionnaire des événements', [
            'read' => true,
            'manage_ljonskar_events' => true
        ]);

        add_role('ljonskar_gallery_manager', 'Gestionnaire de la galerie', [
            'read' => true,
            'manage_ljonskar_gallery' => true
        ]);

        add_role('ljonskar_shop_manager', 'Gestionnaire de la boutique', [
            'read' => true,
            'manage_ljonskar_shop' => true
        ]);
    }
}

LjonskarRoles::init();