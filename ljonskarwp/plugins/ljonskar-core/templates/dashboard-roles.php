<?php

$users = get_users();

echo "<table style='width:100%;color:white'>";
echo "<tr><th>Membre</th><th>Rôle / Permissions</th></tr>";

foreach ($users as $u) {

    echo "<tr>";
    echo "<td>{$u->display_name} ({$u->user_email})</td>";
    
    echo "<td>";

    echo "<form method='POST'>";
    echo "<input type='hidden' name='lj_action' value='update_roles'>";
    echo "<input type='hidden' name='user_id' value='{$u->ID}'>";

    $caps = [
        'manage_ljonskar_roles' => 'Gérer les rôles',
        'manage_ljonskar_events' => 'Gérer les évènements',
        'manage_ljonskar_gallery' => 'Gérer la galerie',
        'manage_ljonskar_shop' => 'Gérer la boutique'
    ];

    foreach ($caps as $cap => $label) {
        $checked = user_can($u, $cap) ? "checked" : "";
        echo "<label style='margin-right:20px'>";
        echo "<input type='checkbox' name='caps[]' value='$cap' $checked> $label";
        echo "</label>";
    }

    echo "<button type='submit'>Enregistrer</button>";
    echo "</form>";

    echo "</td>";
    echo "</tr>";
}

echo "</table>";