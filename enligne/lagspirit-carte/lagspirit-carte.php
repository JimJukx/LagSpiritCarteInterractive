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

/* -----------------------------------------------------------
   ENREGISTREMENT DES ASSETS (FRONT)
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

    // CSS principal
    wp_register_style(
        'lagspirit-carte-style',
        LAGSPIRIT_CARTE_URL . 'assets/css/style.css',
        ['leaflet-css'],
        '1.0.0'
    );

    // JS principal (carte)
    wp_register_script(
        'lagspirit-carte-script',
        LAGSPIRIT_CARTE_URL . 'assets/js/app.js',
        ['leaflet-js'],
        '1.0.0',
        true
    );

    // Variables accessibles côté JS (app.js)
    wp_localize_script(
        'lagspirit-carte-script',
        'lagspiritCarteData',
        [
            'assetsBaseUrl' => LAGSPIRIT_CARTE_URL . 'assets/',
            'jsonUrl'       => LAGSPIRIT_CARTE_URL . 'assets/chapters.json',
            // URL de la page d'admin WordPress (ouverte après validation du code)
            'admin_url'     => admin_url('options-general.php?page=lagspirit-carte-admin'),
        ]
    );
}
add_action('wp_enqueue_scripts', 'lagspirit_carte_register_assets');


/* -----------------------------------------------------------
   PAGE ADMIN (BACK-OFFICE WP, NON PUBLIQUE)
----------------------------------------------------------- */
function lagspirit_carte_add_admin_page() {
    add_options_page(
        'Lag Spirit – Admin Carte',
        'Lag Spirit Carte',
        'manage_options',
        'lagspirit-carte-admin',
        'lagspirit_carte_render_admin_page'
    );
}
add_action('admin_menu', 'lagspirit_carte_add_admin_page');

function lagspirit_carte_render_admin_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap">
        <h1>Lag Spirit – Gestion de la carte</h1>
        <p>
            Page réservée aux responsables Lag Spirit pour gérer la carte.
        </p>
    </div>
    <?php
}


/* -----------------------------------------------------------
   SHORTCODE [lagspirit_carte] : AFFICHE LA CARTE PUBLIQUE
----------------------------------------------------------- */
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
      <input
        id="city-search"
        type="text"
        placeholder="Tape ta ville (ex : Lyon, Brest...)"
      />
      <button id="search-btn">Trouve le chapitre le plus proche</button>
      <button id="locate-btn">Me localiser</button>
      <!-- Bouton discret (roue crantée) -->
      <button id="admin-carte-btn" class="admin-icon-btn">⚙️</button>
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
        de se déplacer, mais nous restons disponibles pour te soutenir, t’écouter
        et t’apporter des conseils.
      </p>

      <div id="result-card" class="chapter-card">
        <div class="chapter-tag">Chapitre sélectionné</div>
        <h3>Aucun chapitre affiché</h3>
        <p>
          Entre une ville ou clique sur une zone de la carte pour afficher
          le chapitre le plus proche si un chapitre Lag Spirit couvre ta zone.
        </p>
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
          Le <strong>Lag Spirit MC</strong> compte parmi ses membres des
          professionnels issus des forces de l’ordre. Cependant, dans le cadre
          de nos actions, ces membres interviennent strictement en qualité de
          <strong>bénévoles associatifs</strong>. Nos interventions ne se
          substituent en aucun cas aux services d’urgence, aux autorités
          judiciaires ou aux professionnels de santé.
        </p>
        <p>
          En cas de danger, de menace ou de situation nécessitant une intervention
          officielle, utilisez les <strong>numéros d’urgence</strong>.
        </p>
        <button id="emergency-toggle" class="emergency-btn">
          Afficher les numéros d’urgence
        </button>
        <div id="emergency-numbers" class="emergency-numbers">
          <p class="legal-numbers">
            <strong>17</strong> – Police / Gendarmerie<br />
            <strong>15</strong> – SAMU (urgence médicale)<br />
            <strong>18</strong> – Pompiers<br />
            <strong>112</strong> – Numéro d’urgence européen<br />
            <strong>119</strong> – Enfance en danger<br />
            <strong>3018</strong> – Harcèlement et cyberharcèlement<br />
          </p>
        </div>
      </div>
    </aside>
  </main>

  <!-- Popup admin ULTRA minimal (pas de texte d'explication) -->
  <div id="admin-popup" class="admin-popup">
    <div class="admin-popup-inner">
      <input
        id="admin-pass-input"
        type="password"
        placeholder="Code"
      />
      <button id="admin-pass-validate">Valider</button>
      <p id="admin-pass-error"></p>
    </div>
  </div>

</div>

    <?php
    return ob_get_clean();
}
add_shortcode('lagspirit_carte', 'lagspirit_carte_shortcode');