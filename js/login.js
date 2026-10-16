document.addEventListener("DOMContentLoaded", async () => {
  await CarWise.init("login");
  document.getElementById("visual-brand-icon").innerHTML = CarWise.carIconSVG();
  document.getElementById("visual-scene").innerHTML = CarWise.carIconSVG();

  // If already signed in, no reason to show the form.
  if (CarWise.getSession()) {
    window.location.href = "browse.html";
    return;
  }

  const form = document.getElementById("login-form");
  const emailField = document.getElementById("field-email");
  const passwordField = document.getElementById("field-password");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const banner = document.getElementById("form-banner");
  const bannerText = document.getElementById("form-banner-text");
  const submitBtn = document.getElementById("login-submit");

  function setError(fieldEl, message) {
    fieldEl.classList.add("has-error");
    if (message) fieldEl.querySelector("[data-error-text]").textContent = message;
  }
  function clearError(fieldEl) {
    fieldEl.classList.remove("has-error");
  }
  function showBanner(message, success = false) {
    bannerText.textContent = message;
    banner.classList.add("is-visible");
    banner.classList.toggle("form-banner--success", success);
  }
  function hideBanner() {
    banner.classList.remove("is-visible");
  }

  emailInput.addEventListener("input", () => clearError(emailField));
  passwordInput.addEventListener("input", () => clearError(passwordField));

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
    clearError(emailField);
    clearError(passwordField);

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let hasError = false;

    if (!email) {
      setError(emailField, "Enter the email address on your account.");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(emailField, "That doesn't look like a valid email address.");
      hasError = true;
    }
    if (!password) {
      setError(passwordField, "Enter your password to continue.");
      hasError = true;
    }
    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in…";

    try {
      await CarWise.signIn(email, password);
      const user = CarWise.getSession();
      const firstName = user ? user.name.split(" ")[0] : "there";
      showBanner(`Welcome back, ${firstName} — redirecting…`, true);
      setTimeout(() => (window.location.href = "browse.html"), 700);
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Continue";

      const msg = err.message || "Something went wrong";
      if (msg.includes("Invalid login")) {
        setError(passwordField, "Invalid email or password. Check your credentials and try again.");
      } else if (msg.includes("Email not confirmed")) {
        showBanner("Please check your inbox and confirm your email before signing in.");
      } else {
        showBanner(msg);
      }
    }
  });

  /* Google OAuth — works once configured in the Supabase dashboard. */
  const googleBtn = document.querySelector(".btn--google");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        const { error } = await _supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: "http://localhost:3000/browse.html" }
        });
        if (error) CarWise.showToast("Google sign-in is not configured yet.");
      } catch {
        CarWise.showToast("Google sign-in is not configured yet.");
      }
    });
  }

  /* Forgot password — sends a real reset email via Supabase. */
  document.getElementById("forgot-link").addEventListener("click", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      _supabase.auth.resetPasswordForEmail(email).then(({ error }) => {
        if (error) {
          CarWise.showToast("Could not send reset email. Try again later.");
        } else {
          CarWise.showToast("Password reset email sent — check your inbox.");
        }
      });
    } else {
      CarWise.showToast("Enter your email address first, then click Forgot password.");
    }
  });
});
