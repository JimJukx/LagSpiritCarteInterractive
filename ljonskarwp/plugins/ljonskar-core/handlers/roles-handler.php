<?php

add_action('init', 'ljonskar_handle_roles_update');

function ljonskar_handle_roles_update() {

    if (!isset($_POST['lj_action']) || $_POST['lj_action'] !== 'update_roles') {
        return;
    }

    if (!is_user_logged_in()) return;

    $current = wp_get_current_user();

    if (!user_can($current, 'manage_ljonskar_roles')) return;

    $user_id = intval($_POST['user_id']);
    $caps = isset($_POST['caps']) ? $_POST['caps'] : [];

    $all_caps = [
        'manage_ljonskar_roles',
        'manage_ljonskar_events',
        'manage_ljonskar_gallery',
        'manage_ljonskar_shop'
    ];

    $user = get_user_by('id', $user_id);

    foreach ($all_caps as $cap) {
        if (in_array($cap, $caps)) {
            $user->add_cap($cap);
        } else {
            $user->remove_cap($cap);
        }
    }

    wp_redirect($_SERVER['HTTP_REFERER']);
    exit;
}