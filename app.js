"use strict";

// Add new weeks here. The HTML does not need to change.
const weeks = [
  {
    id: 1,
    range: "15.6 – 19.6.2026",
    days: ["15.6", "16.6", "17.6", "18.6", "19.6"]
  },
  {
    id: 2,
    range: "22.6 – 26.6.2026",
    days: ["22.6", "23.6", "24.6", "25.6", "26.6"]
  },
  {
    id: 3,
    range: "29.6 – 3.7.2026",
    days: ["29.6", "30.6", "1.7", "2.7", "3.7"]
  }
];

const dayNames = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok"];
const mealParts = {
  obed: [
    { file: "polievka", label: "Polievka" },
    { file: "menua", label: "Menu A", fallback: "menu-a" },
    { file: "menub", label: "Menu B", fallback: "menu-b" }
  ],
  desiata: [
    { file: "desiata", label: "Desiata" }
  ]
};

let currentWeekIndex = 0;
let selectedMeal = "obed";
const assetVersion = "20260616-3";
let renderRequestId = 0;

const weekRange = document.querySelector("#weekRange");
const weekSelect = document.querySelector("#weekSelect");
const previousWeek = document.querySelector("#previousWeek");
const nextWeek = document.querySelector("#nextWeek");
const gallery = document.querySelector("#gallery");
const mealButtons = document.querySelectorAll(".meal-button");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxCaption = document.querySelector("#lightboxCaption");
const lightboxClose = document.querySelector("#lightboxClose");

function formatDateLabel(day) {
  return `${day}.`;
}

function getImagePath(day, file) {
  return `assets/${day}.${file}.jpg?v=${assetVersion}`;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(src), { once: true });
    image.addEventListener("error", () => resolve(null), { once: true });
    image.src = src;
  });
}

async function resolveMealPart(day, part) {
  const primarySrc = await loadImage(getImagePath(day, part.file));

  if (primarySrc) {
    return { ...part, src: primarySrc };
  }

  if (!part.fallback) return null;

  const fallbackSrc = await loadImage(getImagePath(day, part.fallback));
  return fallbackSrc ? { ...part, src: fallbackSrc } : null;
}

async function getAvailableMealParts(day, meal) {
  const parts = mealParts[meal] || [];
  const availableParts = (await Promise.all(parts.map((part) => resolveMealPart(day, part))))
    .filter(Boolean);

  if (availableParts.length || meal !== "obed") {
    return availableParts;
  }

  const fallbackSrc = await loadImage(getImagePath(day, "obed"));
  return fallbackSrc ? [{ file: "obed", label: "Obed", src: fallbackSrc }] : [];
}

function createMealFigure(day, part) {
  const figure = document.createElement("div");
  figure.className = "meal-photo";

  const label = document.createElement("span");
  label.className = "meal-part-label";
  label.textContent = part.label;

  const image = document.createElement("img");
  image.className = "day-photo";
  image.src = part.src;
  image.alt = `${part.label} ${formatDateLabel(day)}`;
  image.loading = "lazy";

  const button = document.createElement("button");
  button.className = "photo-button";
  button.type = "button";
  button.setAttribute("aria-label", `Zväčšiť fotografiu: ${image.alt}`);
  button.addEventListener("click", () => {
    openLightbox(image.src, image.alt);
  });

  button.append(label, image);
  figure.append(button);
  return figure;
}

function createMealSlider(day, parts) {
  const viewer = document.createElement("div");
  viewer.className = "meal-viewer";

  const slider = document.createElement("div");
  slider.className = "meal-slider";

  const previousButton = document.createElement("button");
  previousButton.className = "meal-nav meal-nav-previous";
  previousButton.type = "button";
  previousButton.setAttribute("aria-label", "Predchádzajúca fotka jedla");
  previousButton.textContent = "‹";

  const nextButton = document.createElement("button");
  nextButton.className = "meal-nav meal-nav-next";
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "Nasledujúca fotka jedla");
  nextButton.textContent = "›";

  function getVisiblePhotos() {
    return Array.from(slider.querySelectorAll(".meal-photo"));
  }

  function getCurrentPhotoIndex() {
    const photos = getVisiblePhotos();
    const sliderLeft = slider.getBoundingClientRect().left;
    let currentIndex = 0;
    let smallestDistance = Infinity;

    photos.forEach((photo, index) => {
      const distance = Math.abs(photo.getBoundingClientRect().left - sliderLeft);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        currentIndex = index;
      }
    });

    return currentIndex;
  }

  function updateNavButtons() {
    const photos = getVisiblePhotos();
    const shouldShow = photos.length > 1;

    previousButton.hidden = !shouldShow;
    nextButton.hidden = !shouldShow;
  }

  function scrollToPhoto(index) {
    const photos = getVisiblePhotos();
    const target = photos[index];

    if (!target) return;

    slider.scrollTo({
      left: target.offsetLeft,
      behavior: "smooth"
    });
  }

  previousButton.addEventListener("click", () => {
    scrollToPhoto(Math.max(0, getCurrentPhotoIndex() - 1));
  });

  nextButton.addEventListener("click", () => {
    scrollToPhoto(Math.min(getVisiblePhotos().length - 1, getCurrentPhotoIndex() + 1));
  });

  parts.forEach((part) => {
    slider.append(createMealFigure(day, part));
  });

  slider.addEventListener("scroll", () => {
    window.requestAnimationFrame(updateNavButtons);
  });

  viewer.append(slider, previousButton, nextButton);
  updateNavButtons();
  return viewer;
}

function createMealLabel(meal) {
  const label = document.createElement("span");
  label.className = "meal-label";
  label.textContent = meal === "obed" ? "Obedy" : "Desiata";
  return label;
}

function openLightbox(src, caption) {
  lightboxImage.src = src;
  lightboxImage.alt = caption;
  lightboxCaption.textContent = caption;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
  lightboxImage.alt = "";
  lightboxCaption.textContent = "";
}

function renderWeekOptions() {
  weekSelect.innerHTML = "";

  weeks.forEach((week, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = week.range;
    weekSelect.append(option);
  });
}

function renderMealButtons() {
  mealButtons.forEach((button) => {
    const isActive = button.dataset.meal === selectedMeal;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

async function createDayCard(day, index, meal) {
  const parts = await getAvailableMealParts(day, meal);

  if (!parts.length) return null;

  const card = document.createElement("article");
  card.className = "day-card";

  const header = document.createElement("div");
  header.className = "day-header";

  const title = document.createElement("h2");
  title.className = "day-title";
  title.textContent = `${dayNames[index] || "Deň"} (${formatDateLabel(day)})`;

  header.append(title, createMealLabel(meal));
  card.append(header, createMealSlider(day, parts));
  return card;
}

async function renderGallery() {
  const requestId = ++renderRequestId;
  const week = weeks[currentWeekIndex];
  gallery.innerHTML = "";

  if (!week) {
    weekRange.textContent = "";
    gallery.innerHTML = '<p class="empty-state">Nie sú nastavené žiadne týždne.</p>';
    return;
  }

  weekRange.textContent = week.range;
  weekSelect.value = String(currentWeekIndex);
  previousWeek.disabled = currentWeekIndex === 0;
  nextWeek.disabled = currentWeekIndex === weeks.length - 1;

  const cards = (await Promise.all(
    week.days.map((day, index) => createDayCard(day, index, selectedMeal))
  )).filter(Boolean);

  if (requestId !== renderRequestId) return;

  gallery.innerHTML = "";

  if (!cards.length) {
    gallery.innerHTML = '<p class="empty-state">Pre vybraný týždeň nie sú dostupné žiadne fotografie.</p>';
    return;
  }

  cards.forEach((card) => {
    gallery.append(card);
  });
}

function setWeek(index) {
  if (index < 0 || index >= weeks.length) return;

  currentWeekIndex = index;
  renderGallery();
}

weekSelect.addEventListener("change", (event) => {
  setWeek(Number(event.target.value));
});

previousWeek.addEventListener("click", () => {
  setWeek(currentWeekIndex - 1);
});

nextWeek.addEventListener("click", () => {
  setWeek(currentWeekIndex + 1);
});

mealButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedMeal = button.dataset.meal;
    renderMealButtons();
    renderGallery();
  });
});

lightboxClose.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
    closeLightbox();
  }
});

renderWeekOptions();
renderMealButtons();
renderGallery();
