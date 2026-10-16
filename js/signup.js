document.addEventListener("DOMContentLoaded", async () => {
  await CarWise.init("signup");
  document.getElementById("visual-brand-icon").innerHTML = CarWise.carIconSVG();
  document.getElementById("visual-scene").innerHTML = CarWise.carIconSVG();

  if (CarWise.getSession()) {
    window.location.href = "browse.html";
    return;
  }

  const form = document.getElementById("signup-form");
  const fields = {
    name: document.getElementById("field-name"),
    email: document.getElementById("field-email"),
    password: document.getElementById("field-password"),
    confirm: document.getElementById("field-confirm")
  };
  const inputs = {
    name: document.getElementById("signup-name"),
    email: document.getElementById("signup-email"),
    password: document.getElementById("signup-password"),
    confirm: document.getElementById("signup-confirm")
  };
  const banner = document.getElementById("form-banner");
  const bannerText = document.getElementById("form-banner-text");
  const submitBtn = document.getElementById("signup-submit");

  function setError(key, message) {
    fields[key].classList.add("has-error");
    if (message) fields[key].querySelector("[data-error-text]").textContent = message;
  }
  function clearError(key) {
    fields[key].classList.remove("has-error");
  }
  function showBanner(message, success = false) {
    bannerText.textContent = message;
    banner.classList.add("is-visible");
    banner.classList.toggle("form-banner--success", success);
  }
  function hideBanner() {
    banner.classList.remove("is-visible");
  }

  Object.keys(inputs).forEach((key) => inputs[key].addEventListener("input", () => clearError(key)));

  document.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.toggleFor);
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.textContent = showing ? "Show" : "Hide";
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideBanner();
    Object.keys(fields).forEach(clearError);

    const name = inputs.name.value.trim();
    const email = inputs.email.value.trim();
    const password = inputs.password.value;
    const confirm = inputs.confirm.value;
    let hasError = false;

    if (!name) {
      setError("name", "Tell us what to call you.");
      hasError = true;
    }
    if (!email) {
      setError("email", "Enter your email address.");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("email", "That doesn't look like a valid email address.");
      hasError = true;
    }
    if (!password) {
      setError("password", "Choose a password to protect your shortlist.");
      hasError = true;
    } else if (password.length < 6) {
      setError("password", "Password needs to be at least 6 characters.");
      hasError = true;
    }
    if (!confirm) {
      setError("confirm", "Type your password again to confirm it.");
      hasError = true;
    } else if (password && confirm !== password) {
      setError("confirm", "That doesn't match the password above.");
      hasError = true;
    }
    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account…";

    try {
      await CarWise.signUp(name, email, password);
      showBanner("Account created — taking you to your shortlist…", true);
      setTimeout(() => (window.location.href = "browse.html"), 700);
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";

      const msg = err.message || "Something went wrong";
      if (msg.includes("already registered") || msg.includes("already exists")) {
        setError("email", "An account already exists for this email — sign in instead?");
      } else if (msg.includes("password")) {
        setError("password", msg);
      } else {
        showBanner(msg);
      }
    }
  });
});
