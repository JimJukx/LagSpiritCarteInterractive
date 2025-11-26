<?php
// Sécurité
if (!defined('ABSPATH')) exit;

// AJOUT DES RÔLES Ljønskar
function ljonskar_register_roles() {

    add_role('super_admin', 'Super Admin', [
        'read' => true,
        'manage_ljonskar_roles' => true,
        'manage_ljonskar_events' => true,
        'manage_ljonskar_gallery' => true,
        'manage_ljonskar_shop' => true
    ]);

    add_role('roles_manager', 'Gestionnaire des rôles', [
        'read' => true,
        'manage_ljonskar_roles' => true
    ]);

    add_role('events_manager', 'Gestionnaire des évènements', [
        'read' => true,
        'manage_ljonskar_events' => true
    ]);

    add_role('gallery_manager', 'Gestionnaire de la galerie', [
        'read' => true,
        'manage_ljonskar_gallery' => true
    ]);

    add_role('shop_manager', 'Gestionnaire de la boutique', [
        'read' => true,
        'manage_ljonskar_shop' => true
    ]);

    add_role('member', 'Membre', [
        'read' => true
    ]);
}
register_activation_hook(__FILE__, 'ljonskar_register_roles');