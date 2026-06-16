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
  return `assets/${day}.${file}.jpg`;
}

function removeEmptyCard(element) {
  const card = element.closest(".day-card");

  element.remove();

  if (card && !card.querySelector(".meal-photo")) {
    card.remove();
  }
}

function createMealFigure(day, part, onMissing, onReady) {
  const figure = document.createElement("div");
  figure.className = "meal-photo";
  let fallbackTried = false;

  const label = document.createElement("span");
  label.className = "meal-part-label";
  label.textContent = part.label;

  const image = document.createElement("img");
  image.className = "day-photo";
  image.src = getImagePath(day, part.file);
  image.alt = `${part.label} ${formatDateLabel(day)}`;
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
    if (part.fallback && !fallbackTried) {
      fallbackTried = true;
      image.src = getImagePath(day, part.fallback);
      return;
    }

    figure.remove();
    onMissing();
  });

  image.addEventListener("load", onReady);

  button.append(label, image);
  figure.append(button);
  return figure;
}

function createMealSlider(day, meal) {
  const viewer = document.createElement("div");
  viewer.className = "meal-viewer";

  const slider = document.createElement("div");
  slider.className = "meal-slider";

  const parts = mealParts[meal] || [];
  let missingCount = 0;
  let fallbackUsed = false;

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

  function handleMissing() {
    missingCount = Math.min(missingCount + 1, parts.length);

    if (missingCount < parts.length || slider.querySelector(".meal-photo")) {
      updateNavButtons();
      return;
    }

    if (meal === "obed" && !fallbackUsed) {
      fallbackUsed = true;
      slider.append(createMealFigure(
        day,
        { file: "obed", label: "Obed" },
        () => removeEmptyCard(slider),
        updateNavButtons
      ));
      updateNavButtons();
      return;
    }

    removeEmptyCard(slider);
  }

  parts.forEach((part) => {
    slider.append(createMealFigure(day, part, handleMissing, updateNavButtons));
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
    card.append(header, createMealSlider(day, selectedMeal));
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
