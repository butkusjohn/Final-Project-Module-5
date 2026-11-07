const OMDB_API_KEY = "YOUR_OMDB_API_KEY";

const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const moviesGrid = document.querySelector("#moviesGrid");
const resultsInfo = document.querySelector("#resultsInfo");
const sortSelect = document.querySelector("#sortSelect");

let movies = [];
let searchController;

function waitForMinimumSpinnerTime(startTime) {
  const minimumDuration = 1200;
  const remaining = minimumDuration - (Date.now() - startTime);

  if (remaining <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, remaining));
}

function showMessage(message) {
  resultsInfo.textContent = message;
}

function showLoadingSpinner() {
  const loading = document.createElement("div");
  loading.className = "movies-grid__loading";
  loading.setAttribute("role", "status");

  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.textContent = "Loading results...";

  loading.append(spinner, label);
  moviesGrid.replaceChildren(loading);
}

function getYear(movie) {
  const year = Number.parseInt(movie.Year, 10);
  return Number.isNaN(year) ? 0 : year;
}

function getSortedMovies() {
  const sortedMovies = [...movies];

  switch (sortSelect.value) {
    case "a-z":
      sortedMovies.sort((a, b) => a.Title.localeCompare(b.Title));
      break;
    case "z-a":
      sortedMovies.sort((a, b) => b.Title.localeCompare(a.Title));
      break;
    case "newest":
      sortedMovies.sort((a, b) => getYear(b) - getYear(a));
      break;
    case "oldest":
      sortedMovies.sort((a, b) => getYear(a) - getYear(b));
      break;
  }

  return sortedMovies;
}

function renderMovies() {
  moviesGrid.replaceChildren();

  for (const movie of getSortedMovies()) {
    const card = document.createElement("div");
    card.className = "movie-card";

    if (movie.Poster && movie.Poster !== "N/A") {
      const poster = document.createElement("img");
      poster.className = "movie-card__img";
      poster.src = movie.Poster;
      poster.alt = `${movie.Title} poster`;
      card.append(poster);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "movie-card__poster-placeholder";
      placeholder.innerHTML = "Movie Poster<br>Not Available";
      card.append(placeholder);
    }

    const title = document.createElement("h2");
    title.className = "movie-card__title";
    title.textContent = movie.Title;

    const year = document.createElement("p");
    year.className = "movie-card__year";
    year.textContent = movie.Year;

    card.append(title, year);
    moviesGrid.append(card);
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();

  if (!query) {
    showMessage("Enter a movie or series title to search.");
    return;
  }

  if (OMDB_API_KEY === "YOUR_OMDB_API_KEY") {
    showMessage("Add your OMDb API key in script.js to enable search.");
    return;
  }

  searchController?.abort();
  const controller = new AbortController();
  searchController = controller;
  const spinnerStartedAt = Date.now();
  showLoadingSpinner();
  showMessage(`Searching for: ${query}...`);

  try {
    const params = new URLSearchParams({
      apikey: OMDB_API_KEY,
      s: query,
    });
    const response = await fetch(`https://www.omdbapi.com/?${params}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status}).`);
    }

    const data = await response.json();
    await waitForMinimumSpinnerTime(spinnerStartedAt);

    if (controller.signal.aborted) {
      return;
    }

    if (data.Response === "False") {
      movies = [];
      moviesGrid.replaceChildren();
      showMessage(data.Error === "Movie not found!"
        ? `No results found for: ${query}`
        : `OMDb error: ${data.Error}`);
      return;
    }

    movies = data.Search;
    renderMovies();
    showMessage(`Showing: ${query}`);
  } catch (error) {
    await waitForMinimumSpinnerTime(spinnerStartedAt);

    if (!controller.signal.aborted && error.name !== "AbortError") {
      moviesGrid.replaceChildren();
      showMessage(`Search failed: ${error.message}`);
    }
  } finally {
    if (searchController === controller) {
      searchController = undefined;
    }
  }
});

sortSelect.addEventListener("change", () => {
  if (movies.length > 0) {
    renderMovies();
  }
});