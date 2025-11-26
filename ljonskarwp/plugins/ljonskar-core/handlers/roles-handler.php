<?php
if (!defined('ABSPATH')) exit;

class LjonskarRolesHandler {

    public static function init() {
        add_shortcode('ljonskar_admin_roles', [__CLASS__, 'render_roles_dashboard']);
    }

    public static function render_roles_dashboard() {

        if (!is_user_logged_in()) {
            return "<p>Veuillez vous connecter.</p>";
        }

        $user = wp_get_current_user();

        if (!in_array('ljonskar_roles_manager', $user->roles)) {
            return "<h3>⛔ Accès refusé</h3>";
        }

        ob_start();
        ljonskar_render_template('dashboard-roles');
        return ob_get_clean();
    }
}

LjonskarRolesHandler::init();