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

let currentWeekIndex = 0;
let selectedMeal = "obed";

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

function getImagePath(day, meal) {
  return `assets/${day}.${meal}.jpg`;
}

function createMealFigure(day, meal) {
  const figure = document.createElement("div");
  figure.className = "meal-photo";

  const image = document.createElement("img");
  image.className = "day-photo";
  image.src = getImagePath(day, meal);
  image.alt = `${meal === "obed" ? "Obed" : "Desiata"} ${formatDateLabel(day)}`;
  image.loading = "lazy";

  const button = document.createElement("button");
  button.className = "photo-button";
  button.type = "button";
  button.setAttribute("aria-label", `Zväčšiť fotografiu: ${image.alt}`);
  button.addEventListener("click", () => {
    openLightbox(image.src, image.alt);
  });

  // Missing photos are expected. Hide them silently without showing a broken image.
  image.addEventListener("error", () => {
    const card = figure.closest(".day-card");
    figure.remove();

    if (card && !card.querySelector(".meal-photo")) {
      card.remove();
    }
  });

  button.append(image);
  figure.append(button);
  return figure;
}

function createMealLabel(meal) {
  const label = document.createElement("span");
  label.className = "meal-label";
  label.textContent = meal === "obed" ? "Obed" : "Desiata";
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

function renderGallery() {
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

  week.days.forEach((day, index) => {
    const card = document.createElement("article");
    card.className = "day-card";

    const header = document.createElement("div");
    header.className = "day-header";

    const title = document.createElement("h2");
    title.className = "day-title";
    title.textContent = `${dayNames[index] || "Deň"} (${formatDateLabel(day)})`;

    header.append(title, createMealLabel(selectedMeal));
    card.append(header, createMealFigure(day, selectedMeal));
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
