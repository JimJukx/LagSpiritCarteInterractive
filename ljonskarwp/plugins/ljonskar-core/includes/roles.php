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

// ===== Shortcode [ljonskar_roles] =====
function ljonskar_roles_shortcode() {

    if (!is_user_logged_in()) {
        return "<p>Vous devez être connecté.</p>";
    }

    $user = wp_get_current_user();

    if (!user_can($user, 'manage_ljonskar_roles')) {
        return "<p>Vous n’avez pas la permission d'accéder à cette page.</p>";
    }

    ob_start();

    ?>
    <h2>Gestion des rôles Ljønskar</h2>
    <p>Sélectionnez un membre et attribuez-lui des permissions.</p>

    <?php
    // On charge le template plus tard
    include plugin_dir_path(__FILE__) . "../templates/dashboard-roles.php";

    return ob_get_clean();
}

add_shortcode('ljonskar_roles', 'ljonskar_roles_shortcode');