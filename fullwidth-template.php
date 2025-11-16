<?php
/**
 * Template Name: LagSpirit Fullscreen
 * Template Post Type: page
 */

get_header();
?>

<style>
    .entry-header,
    .wp-block-post-title,
    header,
    footer,
    .site-header,
    .page-header,
    .wp-block-template-part,
    .site-footer {
        display: none !important;
    }

    body {
        margin: 0 !important;
        padding: 0 !important;
        background: #0a0a0a !important; /* noir pour s'adapter à ta carte */
    }

    .entry-content {
        max-width: 100%!important;
        padding: 0 !important;
        margin: 0 !important;
    }
</style>

<div id="lagspirit_fullscreen">
    <?php echo do_shortcode('[lagspirit_carte]'); ?>
</div>

<?php get_footer(); ?>