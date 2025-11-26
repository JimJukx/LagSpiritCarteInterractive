<h2>Gestion des rôles Ljønskar</h2>

<p>Liste des membres et gestion des rôles (bientôt développée).</p>

<?php
$users = get_users();

echo "<ul>";
foreach ($users as $user) {
    echo "<li>" . $user->display_name . " (" . implode(', ', $user->roles) . ")</li>";
}
echo "</ul>";
?>