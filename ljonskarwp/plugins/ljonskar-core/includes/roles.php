<?php

// ===== Création des capacités personnalisées =====
function ljonskar_register_capabilities() {

    $caps = [
        'manage_ljonskar_roles',
        'manage_ljonskar_events',
        'manage_ljonskar_gallery',
        'manage_ljonskar_shop'
    ];

    // On ajoute ces caps à l'admin WordPress (super admin)
    $admin = get_role('administrator');
    if ($admin) {
        foreach ($caps as $cap) {
            $admin->add_cap($cap);
        }
    }

    // Création du rôle super-admin Ljønskar (toi uniquement)
    add_role(
        'ljonskar_superadmin',
        'Super Admin Ljønskar',
        [
            'read' => true,
            'edit_posts' => false,
            'manage_ljonskar_roles' => true,
            'manage_ljonskar_events' => true,
            'manage_ljonskar_gallery' => true,
            'manage_ljonskar_shop' => true
        ]
    );
}

add_action('init', 'ljonskar_register_capabilities');