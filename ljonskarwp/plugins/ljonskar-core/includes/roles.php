<?php
// sécurité
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Crée les rôles Ljønskar.
 * Appelé à l’activation du plugin.
 */
function ljonskar_register_roles() {

    // Rôle de base pour les membres du club
    add_role(
        'lj_member',
        'Membre Ljønskar',
        array(
            'read' => true,
        )
    );

    // Rôle : peut gérer les rôles
    add_role(
        'lj_roles_manager',
        'Gestion des rôles',
        array(
            'read'           => true,
            'lj_manage_roles' => true,
        )
    );

    // Rôle : peut gérer les événements
    add_role(
        'lj_events_manager',
        'Gestion des événements',
        array(
            'read'             => true,
            'lj_manage_events' => true,
        )
    );

    // Rôle : peut gérer la galerie
    add_role(
        'lj_gallery_manager',
        'Gestion de la galerie',
        array(
            'read'              => true,
            'lj_manage_gallery' => true,
        )
    );

    // Rôle : peut gérer la boutique
    add_role(
        'lj_shop_manager',
        'Gestion de la boutique',
        array(
            'read'           => true,
            'lj_manage_shop' => true,
        )
    );
}

/**
 * Donne toutes les capacités Ljønskar à l’admin WordPress.
 * (toi, le super admin)
 */
function ljonskar_add_caps_to_admin() {
    $admin = get_role( 'administrator' );
    if ( ! $admin ) {
        return;
    }

    $admin->add_cap( 'lj_manage_roles' );
    $admin->add_cap( 'lj_manage_events' );
    $admin->add_cap( 'lj_manage_gallery' );
    $admin->add_cap( 'lj_manage_shop' );
}
add_action( 'init', 'ljonskar_add_caps_to_admin' );