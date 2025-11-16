// === Accès admin via double-clic sur ⚙️ ===
document.addEventListener("DOMContentLoaded", () => {
  const adminBtn   = document.getElementById("admin-carte-btn");
  const popup      = document.getElementById("admin-popup");
  const passInput  = document.getElementById("admin-pass-input");
  const passBtn    = document.getElementById("admin-pass-validate");
  const passError  = document.getElementById("admin-pass-error");

  if (!adminBtn || !popup || !passInput || !passBtn || !passError) return;

  // Double-clic sur la roue crantée -> ouvre le popup
  adminBtn.addEventListener("dblclick", () => {
    popup.style.display = "flex";
    passInput.value = "";
    passError.textContent = "";
    passInput.focus();
  });

  // Clic en dehors de la boite -> ferme le popup
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.style.display = "none";
    }
  });

  // Clic sur "Valider"
  passBtn.addEventListener("click", async () => {
    const pwd = passInput.value.trim();
    if (!pwd) {
      passError.textContent = "Merci d’entrer le code.";
      return;
    }

    try {
      // admincarte-secret.json doit être dans assets/admin/
      const res = await fetch(
        lagspiritCarteData.assetsBaseUrl + "admin/admincarte-secret.json",
        { cache: "no-cache" }
      );
      const data = await res.json();

      if (pwd === data.password) {
        // Code correct -> ouvre la page admin WordPress dans un nouvel onglet
        window.open(lagspiritCarteData.admin_url, "_blank");
        popup.style.display = "none";
      } else {
        passError.textContent = "Code incorrect.";
      }
    } catch (err) {
      console.error(err);
      passError.textContent = "Erreur lors de la vérification.";
    }
  });
});