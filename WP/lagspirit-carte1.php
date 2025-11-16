<?php
/**
 * Plugin Name: Lag Spirit – Carte interactive
 * Description: Carte interactive des chapitres Lag Spirit (harcèlement scolaire).
 * Version: 1.0.0
 * Author: Lag Spirit MC
 */

if (!defined('ABSPATH')) exit;

define('LAGSPIRIT_CARTE_URL',  plugin_dir_url(__FILE__));
define('LAGSPIRIT_CARTE_PATH', plugin_dir_path(__FILE__));

/* -----------------------------------------------------------
   ENREGISTREMENT DES ASSETS
----------------------------------------------------------- */
function lagspirit_carte_register_assets() {

    // Leaflet CSS / JS
    wp_register_style(
        'leaflet-css',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        [],
        '1.9.4'
    );
    wp_register_script(
        'leaflet-js',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        [],
        '1.9.4',
        true
    );

    // Ton CSS
    wp_register_style(
        'lagspirit-carte-style',
        LAGSPIRIT_CARTE_URL . 'assets/css/style.css',
        ['leaflet-css'],
        '1.0.0'
    );

    // Ton JS
    wp_register_script(
        'lagspirit-carte-script',
        LAGSPIRIT_CARTE_URL . 'assets/js/app.js',
        ['leaflet-js'],
        '1.0.0',
        true
    );

    // Variables JS globales
    wp_localize_script(
        'lagspirit-carte-script',
        'lagspiritCarteData',
        [
            "assetsBaseUrl" => LAGSPIRIT_CARTE_URL . "assets/",
            "jsonUrl"       => LAGSPIRIT_CARTE_URL . "assets/chapters.json",
            "admin_url"     => admin_url('options-general.php?page=lagspirit-carte-admin')
        ]
    );
}
add_action('wp_enqueue_scripts', 'lagspirit_carte_register_assets');


/* -----------------------------------------------------------
   PAGE ADMIN DU PLUGIN
----------------------------------------------------------- */
function lagspirit_carte_admin_page() {
    add_options_page(
        "Lag Spirit – Admin Carte",
        "Lag Spirit Carte",
        "manage_options",
        "lagspirit-carte-admin",
        "lagspirit_carte_admin_render"
    );
}
add_action('admin_menu', 'lagspirit_carte_admin_page');


function lagspirit_carte_admin_render() {
    echo "<h1>Administration de la carte Lag Spirit</h1>";
    echo "<p>Interface complète de gestion des chapitres.</p>";
    echo "<p>(L’éditeur que tu avais créé va ici — on peut le remettre quand tu veux.)</p>";
}


/* -----------------------------------------------------------
   AFFICHAGE DE LA CARTE AVEC SHORTCODE
----------------------------------------------------------- */
function lagspirit_carte_shortcode() {

    wp_enqueue_style('lagspirit-carte-style');
    wp_enqueue_script('lagspirit-carte-script');

    ob_start(); ?>

<div class="lagspirit-wrapper">

<header>
  <div class="brand">
    <div class="brand-logo">
      <img src="<?php echo esc_url(LAGSPIRIT_CARTE_URL . 'assets/img/lagspirit-logo.png'); ?>" />
    </div>
    <div>
      <h1>Lag Spirit – Carte des Chapitres</h1>
      <div class="subtitle">Soutiens aux victimes de harcèlement scolaire</div>
    </div>
  </div>

  <div class="search-area">
    <input id="city-search" type="text" placeholder="Tape ta ville (ex : Lyon, Brest...)">
    <button id="search-btn">Trouve le chapitre le plus proche</button>
    <button id="locate-btn">Me localiser</button>

    <!-- BOUTON ADMIN -->
    <button id="admin-carte-btn" class="admin-icon-btn">⚙️</button>
  </div>
</header>

<div class="welcome-banner">
  Tu n’es pas seul(e). Nous sommes là pour t’écouter, te conseiller et t’orienter.
</div>

<main>
  <div id="map"></div>

  <aside class="sidebar">

    <h2>Besoin d’aide ?</h2>
    <p class="info-text">
      Entre une ville ou clique sur une zone de la carte.
    </p>

    <div id="result-card" class="chapter-card">
      <div class="chapter-tag">Chapitre sélectionné</div>
      <h3>Aucun chapitre affiché</h3>
      <p>Entre une ville ou clique sur une zone de la carte.</p>
    </div>

    <div class="chapters-list-wrapper">
      <div class="chapters-list-header">
        <div class="chapters-list-title">Chapitres Lag Spirit</div>
        <button id="toggle-chapters" class="chapters-toggle-btn" aria-expanded="false">
          Afficher
        </button>
      </div>
      <div id="chapters-list" class="chapters-list collapsed"></div>
    </div>

    <p class="motto">🤜 FORT ENSEMBLE 🤛</p>

    <div class="legal-info">
      <p>
        Le <strong>Lag Spirit MC</strong> compte des membres des forces de l’ordre,
        mais interviennent toujours en tant que <strong>bénévoles associatifs</strong>.
      </p>
    </div>

  </aside>
</main>


<!-- POPUP ADMIN -->
<div id="admin-popup" class="admin-popup">
  <div class="admin-popup-inner">
    <h3>🔐 Accès administration</h3>
    <input id="admin-pass-input" type="password" placeholder="Mot de passe admin carte">
    <button id="admin-pass-validate">Valider</button>
    <p id="admin-pass-error"></p>
  </div>
</div>

</div>

<?php
    return ob_get_clean();
}
add_shortcode('lagspirit_carte', 'lagspirit_carte_shortcode');