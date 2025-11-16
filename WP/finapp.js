// === Accès admin via double-clic sur ⚙️ ===
document.addEventListener("DOMContentLoaded", () => {
  const adminBtn = document.getElementById("admin-carte-btn");
  const popup = document.getElementById("admin-popup");
  const passInput = document.getElementById("admin-pass-input");
  const passBtn = document.getElementById("admin-pass-validate");
  const passError = document.getElementById("admin-pass-error");

  if (!adminBtn) return;

  let clickTimer = null;

  adminBtn.addEventListener("click", () => {
    if (clickTimer === null) {
      clickTimer = setTimeout(() => { clickTimer = null; }, 250);
    } else {
      clearTimeout(clickTimer);
      clickTimer = null;
      popup.style.display = "flex";
      passInput.value = "";
      passError.textContent = "";
    }
  });

  popup.addEventListener("click", (e) => {
    if (e.target === popup) popup.style.display = "none";
  });

  passBtn.addEventListener("click", async () => {
    const pwd = passInput.value.trim();
    if (!pwd) {
      passError.textContent = "Merci d’entrer le mot de passe.";
      return;
    }

    try {
      const res = await fetch(lagspiritCarteData.assetsBaseUrl + "admin/admincarte-secret.json");
      const data = await res.json();

      if (pwd === data.password) {
        window.open(lagspiritCarteData.admin_url, "_blank");
        popup.style.display = "none";
      } else {
        passError.textContent = "Mot de passe incorrect.";
      }
    } catch (e) {
      passError.textContent = "Erreur lors de la vérification.";
    }
  });
});