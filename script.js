const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const body = document.body;
const header = $(".site-header");
const nav = $("#mainNav");
const menuToggle = $("#menuToggle");
const themeToggle = $("#themeToggle");
const modal = $("#modal");
const lightbox = $("#lightbox");
let lastFocusedElement = null;
function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
document.addEventListener("DOMContentLoaded", refreshIcons);

$("#year").textContent = new Date().getFullYear();
function closeMenu() {
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Ouvrir le menu");
  menuToggle.innerHTML = '<i data-lucide="menu" aria-hidden="true"></i>';
  refreshIcons();
}
menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  menuToggle.innerHTML = `<i data-lucide="${open ? "x" : "menu"}" aria-hidden="true"></i>`;
  refreshIcons();
});
$$("nav a").forEach(link => link.addEventListener("click", closeMenu));

const savedTheme = localStorage.getItem("amc-theme");
if (savedTheme === "dark") body.classList.add("dark");

function updateThemeIcon() {
  const dark = body.classList.contains("dark");
  themeToggle.setAttribute("aria-label", dark ? "Activer le mode clair" : "Activer le mode sombre");
  themeToggle.innerHTML = `<i data-lucide="${dark ? "sun" : "moon"}" aria-hidden="true"></i>`;
  refreshIcons();
}
updateThemeIcon();

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark");
  localStorage.setItem("amc-theme", body.classList.contains("dark") ? "dark" : "light");
  updateThemeIcon();
});

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 8);
  $("#backToTop").classList.toggle("show", window.scrollY > 500);
}, { passive: true });

const navLinks = $$('nav a[href^="#"]');
const sections = $$("main section[id]");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${entry.target.id}`
    ));
  });
}, { rootMargin: "-35% 0px -55% 0px" });
sections.forEach(section => observer.observe(section));

$$(".filter").forEach(button => {
  button.addEventListener("click", () => {
    $$(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter;
    $$(".course").forEach(card => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

function openModal(title) {
  lastFocusedElement = document.activeElement;
  $("#modalTitle").textContent = title;
  $("#modalText").textContent =
    "Cette fiche peut accueillir les informations officielles : formateur, durée, date, lieu, places disponibles et conditions d’inscription.";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  $("#modalAction").focus();
}
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  lastFocusedElement?.focus();
}
$$("[data-modal]").forEach(button => button.addEventListener("click", () => openModal(button.dataset.modal)));
$("#modalClose").addEventListener("click", closeModal);
$("#modalAction").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

const galleryImages = [
  { src:"image/523890178_122100407180954588_2182383566286050794_n.jpg", alt:"Membres AMC réunis" },
  { src:"image/523764382_122100407504954588_5282076224531056337_n.jpg", alt:"Jeunes réunis pendant une activité AMC" },
  { src:"image/523945098_122100407444954588_7642840081565331444_n.jpg", alt:"Jeunes et membres AMC pendant une formation" }
];
let galleryIndex = 0;
function showGalleryImage(index) {
  galleryIndex = (index + galleryImages.length) % galleryImages.length;
  const image = galleryImages[galleryIndex];
  $("#lightboxImage").src = image.src;
  $("#lightboxImage").alt = image.alt;
  $("#lightboxCaption").textContent = `${galleryIndex + 1} / ${galleryImages.length} — ${image.alt}`;
}
function openLightbox(index) {
  lastFocusedElement = document.activeElement;
  showGalleryImage(index);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  $("#lightboxClose").focus();
}
function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lastFocusedElement?.focus();
}
$$("[data-gallery-index]").forEach(button =>
  button.addEventListener("click", () => openLightbox(Number(button.dataset.galleryIndex)))
);
$("#lightboxPrev").addEventListener("click", () => showGalleryImage(galleryIndex - 1));
$("#lightboxNext").addEventListener("click", () => showGalleryImage(galleryIndex + 1));
$("#lightboxClose").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });

const contactForm = $("#contactForm");
const formStatus = $("#formStatus");
const membershipForm = $("#membershipForm");
const membershipStatus = $("#membershipStatus");
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getSupabaseError(response, fallback) {
  return response.json()
    .then(details => details.message || details.hint || details.error || fallback)
    .catch(() => fallback);
}

function validateFields(form) {
  let valid = true;
  $$('input[required], textarea[required], select[required]', form).forEach(field => {
    const invalid = !field.value.trim() || !field.validity.valid;
    field.classList.toggle("field-invalid", invalid);
    field.setAttribute("aria-invalid", String(invalid));
    if (invalid) valid = false;
  });
  return valid;
}

function clearFieldErrors(form) {
  $$('input, textarea, select', form).forEach(field => {
    field.classList.remove("field-invalid");
    field.removeAttribute("aria-invalid");
  });
}

contactForm.addEventListener("submit", async e => {
  e.preventDefault();
  const valid = validateFields(contactForm);

  if (!valid) {
    formStatus.textContent = "Vérifiez les champs indiqués avant de continuer.";
    formStatus.className = "form-status error";
    return;
  }
  if (!supabaseUrl || !supabasePublishableKey) {
    formStatus.textContent = "Le service de contact n’est pas configuré. Contactez AMC pour finaliser votre demande.";
    formStatus.className = "form-status error";
    return;
  }

  const formData = Object.fromEntries(new FormData(contactForm));
  const submitButton = $("button[type=submit]", contactForm);
  submitButton.disabled = true;
  formStatus.textContent = "Envoi du message...";
  formStatus.className = "form-status";

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/contact_messages`, {
      method: "POST",
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${supabasePublishableKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error(await getSupabaseError(response, `Supabase returned ${response.status}`));
    }

    formStatus.textContent = "Votre message a bien été envoyé.";
    formStatus.className = "form-status success";
    contactForm.reset();
    clearFieldErrors(contactForm);
  } catch (error) {
    console.error("Supabase contact form error:", error);
    formStatus.textContent = "Impossible d’envoyer le message pour le moment. Réessayez plus tard.";
    formStatus.className = "form-status error";
  } finally {
    submitButton.disabled = false;
  }
});

const memberDomain = $("#memberDomain");
const customDomainField = $("#customDomainField");
const customDomain = $("#customDomain");
const schoolStatus = $("#schoolStatus");
const schoolFields = $("#schoolFields");
const educationFields = $("#educationFields");

function setConditionalFields() {
  const customDomainVisible = memberDomain.value === "Autre";
  const schoolVisible = schoolStatus.value === "school";
  const educationVisible = schoolStatus.value === "finished";
  customDomainField.hidden = !customDomainVisible;
  schoolFields.hidden = !schoolVisible;
  educationFields.hidden = !educationVisible;
  customDomain.required = customDomainVisible;
  $$('input', schoolFields).forEach(field => { field.required = schoolVisible; });
  $$('input', educationFields).forEach(field => { field.required = educationVisible; });
}

memberDomain.addEventListener("change", setConditionalFields);
schoolStatus.addEventListener("change", setConditionalFields);
setConditionalFields();

membershipForm.addEventListener("submit", async e => {
  e.preventDefault();
  setConditionalFields();
  const valid = validateFields(membershipForm);

  if (!valid) {
    membershipStatus.textContent = "Vérifiez les champs indiqués avant de continuer.";
    membershipStatus.className = "form-status error";
    return;
  }
  if (!supabaseUrl || !supabasePublishableKey) {
    membershipStatus.textContent = "Le service d’adhésion n’est pas configuré. Contactez AMC pour finaliser votre demande.";
    membershipStatus.className = "form-status error";
    return;
  }

  const formData = Object.fromEntries(new FormData(membershipForm));
  formData.age = Number(formData.age);
  const submitButton = $("button[type=submit]", membershipForm);
  submitButton.disabled = true;
  membershipStatus.textContent = "Envoi de votre demande...";
  membershipStatus.className = "form-status";

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/members`, {
      method: "POST",
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${supabasePublishableKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(formData)
    });
    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      throw new Error(details.message || `Supabase returned ${response.status}`);
    }
    membershipStatus.textContent = "Votre demande d’adhésion a été envoyée avec succès ! Merci de vouloir rejoindre AMC. Notre équipe examinera votre demande et vous contactera prochainement.";
    membershipStatus.className = "form-status success";
    membershipForm.reset();
    clearFieldErrors(membershipForm);
    setConditionalFields();
  } catch (error) {
    console.error("Supabase membership form error:", error);
    membershipStatus.textContent = "Impossible d’enregistrer votre demande pour le moment. Vérifiez votre connexion puis réessayez.";
    membershipStatus.className = "form-status error";
  } finally {
    submitButton.disabled = false;
  }
});

$("#backToTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeMenu();
    if (modal.classList.contains("open")) closeModal();
    if (lightbox.classList.contains("open")) closeLightbox();
  }
  if (lightbox.classList.contains("open")) {
    if (e.key === "ArrowRight") showGalleryImage(galleryIndex + 1);
    if (e.key === "ArrowLeft") showGalleryImage(galleryIndex - 1);
  }
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });

$$(".domain,.course,.activity-list>div,.project-feature,.news-card,.gallery-item,.contact-form,.about-content article").forEach(el => {
  el.classList.add("reveal");
  revealObserver.observe(el);
});
