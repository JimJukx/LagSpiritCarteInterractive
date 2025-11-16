<?php
/**
 * Plugin Name: Lag Spirit – Carte interactive
 * Description: Carte interactive des chapitres Lag Spirit.
 * Version: 1.0.0
 * Author: Lag Spirit MC
 */

if (!defined('ABSPATH')) exit;

define('LAGSPIRIT_CARTE_URL',  plugin_dir_url(__FILE__));
define('LAGSPIRIT_CARTE_PATH', plugin_dir_path(__FILE__));

/**
 * Enregistrement des assets
 */
function lagspirit_carte_register_assets() {

    // Leaflet (CDN)
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

    // CSS utilisateur
    wp_register_style(
        'lagspirit-carte-style',
        LAGSPIRIT_CARTE_URL . 'assets/css/style.css',
        ['leaflet-css'],
        '1.0.0'
    );

    // JS utilisateur
    wp_register_script(
        'lagspirit-carte-script',
        LAGSPIRIT_CARTE_URL . 'assets/js/app.js',
        ['leaflet-js'],
        '1.0.0',
        true
    );

    // Passage de variables PHP → JS
    wp_localize_script(
        'lagspirit-carte-script',
        'lagspiritCarteData',
        [
            'assetsBaseUrl' => LAGSPIRIT_CARTE_URL . 'assets/',
            'admin_url'     => LAGSPIRIT_CARTE_URL . 'assets/admin/admincarte.html',
        ]
    );
}
add_action('wp_enqueue_scripts', 'lagspirit_carte_register_assets');

/**
 * SHORTCODE : [lagspirit_carte]
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
            <img src="<?php echo esc_url( LAGSPIRIT_CARTE_URL . 'assets/img/lagspirit-logo.png'); ?>" alt="Logo Lag Spirit">
          </div>
          <div>
            <h1>Lag Spirit – Carte des Chapitres</h1>
            <div class="subtitle">Soutiens aux victimes de harcèlement scolaire</div>
          </div>
        </div>

        <div class="search-area">
          <input id="city-search" type="text" placeholder="Tape ta ville (ex : Lyon)">
          <button id="search-btn">Trouver</button>
          <button id="locate-btn">Me localiser</button>

          <!-- ⚙️ Bouton admin (double clic) -->
          <button id="admin-carte-btn" class="admin-btn" title="Administration">
            ⚙️
          </button>
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
            <p>Saisis une ville ou clique sur la carte.</p>
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
              Le <strong>Lag Spirit MC</strong> compte des professionnels issus
              des forces de l’ordre, mais intervenant uniquement comme
              <strong>bénévoles associatifs</strong>.
            </p>

            <button id="emergency-toggle" class="emergency-btn">
              Afficher les numéros d’urgence
            </button>

            <div id="emergency-numbers" class="emergency-numbers">
              <p class="legal-numbers">
                <strong>17</strong> – Police<br>
                <strong>15</strong> – SAMU<br>
                <strong>18</strong> – Pompiers<br>
                <strong>112</strong> – Numéro d’urgence européen<br>
                <strong>119</strong> – Enfance en danger<br>
                <strong>3018</strong> – Cyberharcèlement<br>
              </p>
            </div>
          </div>

        </aside>
      </main>

      <!-- POPUP mot de passe -->
      <div id="admin-popup" class="admin-popup">
        <div class="admin-popup-box">
          <h3>Accès administrateur</h3>
          <input type="password" id="admin-pass-input" placeholder="Code secret">
          <div id="admin-pass-error" class="admin-error"></div>
          <button id="admin-pass-validate">Valider</button>
        </div>
      </div>

    </div>

    <?php
    return ob_get_clean();
}
add_shortcode('lagspirit_carte', 'lagspirit_carte_shortcode');
