<?php
/**
 * Plugin Name: Lag Spirit – Carte interactive
 * Description: Carte interactive des chapitres Lag Spirit (harcèlement scolaire).
 * Version: 1.0.0
 * Author: Lag Spirit MC
 */

if (!defined('ABSPATH')) {
    exit;
}

define('LAGSPIRIT_CARTE_URL',  plugin_dir_url(__FILE__));
define('LAGSPIRIT_CARTE_PATH', plugin_dir_path(__FILE__));

/**
 * Autoriser WordPress à servir les fichiers JSON du plugin
 */
function lagspirit_allow_json($mime_types) {
    $mime_types['json'] = 'application/json';
    return $mime_types;
}
add_filter('upload_mimes', 'lagspirit_allow_json');

/**
 * Autoriser l'accès direct au JSON (évite les blocages 403)
 */
function lagspirit_json_headers() {
    if (isset($_SERVER['REQUEST_URI']) && str_ends_with($_SERVER['REQUEST_URI'], '.json')) {
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json");
    }
}
add_action('init', 'lagspirit_json_headers');


/**
 * Enregistre les CSS/JS
 */
function lagspirit_carte_register_assets() {

    // Leaflet CSS + JS
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

    // Ton CSS perso
    wp_register_style(
        'lagspirit-carte-style',
        LAGSPIRIT_CARTE_URL . 'assets/css/style.css',
        ['leaflet-css'],
        '1.0.0'
    );

    // Ton JS perso
    wp_register_script(
        'lagspirit-carte-script',
        LAGSPIRIT_CARTE_URL . 'assets/js/app.js',
        ['leaflet-js'],
        '1.0.0',
        true
    );

    // On donne au JS les URL nécessaires
    wp_localize_script(
        'lagspirit-carte-script',
        'lagspiritCarteData',
        [
            'assetsBaseUrl' => LAGSPIRIT_CARTE_URL . 'assets/',
            'jsonUrl' => LAGSPIRIT_CARTE_URL . 'assets/chapters.json'
        ]
    );
}
add_action('wp_enqueue_scripts', 'lagspirit_carte_register_assets');


/**
 * Shortcode [lagspirit_carte]
 */
function lagspirit_carte_shortcode() {

    wp_enqueue_style('lagspirit-carte-style');
    wp_enqueue_script('lagspirit-carte-script');

    ob_start();
    ?>

    <div class="lagspirit-wrapper">

      <header>
        <div class="brand">
          <div class="brand-logo">
            <img src="<?php echo esc_url( LAGSPIRIT_CARTE_URL . 'assets/img/lagspirit-logo.png' ); ?>" alt="Logo Lag Spirit" />
          </div>
          <div>
            <h1>Lag Spirit – Carte des Chapitres</h1>
            <div class="subtitle">Soutiens aux victimes de harcèlement scolaire</div>
          </div>
        </div>

        <div class="search-area">
          <input id="city-search" type="text" placeholder="Tape ta ville (ex : Lyon, Brest...)" />
          <button id="search-btn">Trouve le chapitre le plus proche</button>
          <button id="locate-btn">Me localiser</button>
        </div>
      </header>

      <div class="welcome-banner">
        Tu n’es pas seul(e). Nous sommes là pour t’écouter, te conseiller et t’orienter.
      </div>

      <main>
        <div id="map"></div>

        <aside class="sidebar">

          <h2>Besoin d’aide&nbsp;?</h2>
          <p class="info-text">
            Entre ta ville ou clique sur une zone de la carte.
            Si la distance est trop importante, il peut être difficile pour un chapitre
            de se déplacer, mais nous restons disponibles pour te soutenir.
          </p>

          <div id="result-card" class="chapter-card">
            <div class="chapter-tag">Chapitre sélectionné</div>
            <h3>Aucun chapitre affiché</h3>
            <p>Entre une ville ou clique sur une zone de la carte pour afficher le chapitre le plus proche.</p>
          </div>

          <div class="chapters-list-wrapper">
            <div class="chapters-list-header">
              <div class="chapters-list-title">Chapitres Lag Spirit</div>
              <button id="toggle-chapters" class="chapters-toggle-btn" aria-expanded="false">Afficher</button>
            </div>
            <div id="chapters-list" class="chapters-list collapsed"></div>
          </div>

          <p class="motto">🤜 FORT ENSEMBLE 🤛</p>

          <div class="legal-info">
            <p>
              Le <strong>Lag Spirit MC</strong> compte parmi ses membres des
              professionnels issus des forces de l’ordre, intervenant en tant que bénévoles.
            </p>

            <button id="emergency-toggle" class="emergency-btn">
              Afficher les numéros d’urgence
            </button>

            <div id="emergency-numbers" class="emergency-numbers">
              <p>
                <strong>17</strong> – Police / Gendarmerie<br />
                <strong>15</strong> – SAMU<br />
                <strong>18</strong> – Pompiers<br />
                <strong>112</strong> – Numéro d’urgence européen<br />
                <strong>119</strong> – Enfance en danger<br />
                <strong>3018</strong> – Harcèlement / Cyberharcèlement<br />
              </p>
            </div>

          </div>

        </aside>
      </main>

    </div>

    <?php
    return ob_get_clean();
}
add_shortcode('lagspirit_carte', 'lagspirit_carte_shortcode');
