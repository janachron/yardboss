const app = document.querySelector('#app');
const seasons = ['spring', 'summer', 'fall', 'winter'];
const seasonNames = { spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter' };
let plants = [];

function careItems(plant) {
  return seasons.flatMap((season) => (plant.tasks[season] || []).map((task) => ({ ...task, season })));
}

function enableImageFallbacks() {
  document.querySelectorAll('img[data-plant-image]').forEach((image) => {
    image.addEventListener('error', () => image.classList.add('is-missing'), { once: true });
  });
}

function homeView() {
  app.innerHTML = `
    <span class="eyebrow">Your garden field guide</span>
    <h1>Know what your garden needs next.</h1>
    <p class="intro">Browse each plant’s care guide or start with the season and see every task waiting outside.</p>
    <section class="path-grid" aria-label="Choose a view">
      <a class="path-card path-card--plants" href="#plants">
        <span>Plant library</span><strong>Swipe through every plant</strong><p>Photos and full care instructions, all in one place.</p>
      </a>
      <a class="path-card path-card--season" href="#season/spring">
        <span>Seasonal planner</span><strong>What should I do this season?</strong><p>Choose Spring, Summer, Fall, or Winter to make a task list.</p>
      </a>
    </section>`;
}

function plantView(selectedId, returnHash = '#home') {
  const cards = plants.map((plant, index) => {
    const tasks = careItems(plant).map((task) => `
      <article class="care-item"><span class="care-meta">${seasonNames[task.season]} · ${task.timing}</span><strong>${task.title}</strong><p>${task.details}</p></article>`).join('') || '<p>No care notes yet.</p>';
    return `<article class="plant-card" id="plant-${plant.id}"><div class="image-fallback">Photo to add</div><img data-plant-image src="${plant.image}" alt="${plant.name}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async"><div class="card-content"><span class="plant-number">${String(index + 1).padStart(2, '0')} / ${String(plants.length).padStart(2, '0')}</span><h2>${plant.name}</h2><div class="care-list">${tasks}</div></div></article>`;
  }).join('');
  app.innerHTML = `<div class="view-heading"><button class="back-button" type="button" data-back="${returnHash}">← Back</button><div><span class="eyebrow">Plant library</span><h1>Every plant, up close.</h1></div></div><p class="swipe-hint">Swipe or scroll sideways to explore →</p><section class="plant-track" aria-label="Plant care cards">${cards}</section>`;
  enableImageFallbacks();
  if (selectedId) requestAnimationFrame(() => document.querySelector(`#plant-${selectedId}`)?.scrollIntoView({ inline: 'start', behavior: 'smooth' }));
}

function seasonView(season) {
  const tasks = plants.flatMap((plant) => (plant.tasks[season] || []).map((task) => ({ plant, task })));
  const cards = tasks.map(({ plant, task }) => `<article class="task-card"><div class="task-thumb-wrap"><div class="image-fallback">Photo<br>to add</div><img class="task-thumb" data-plant-image src="${plant.image}" alt="${plant.name}" loading="lazy" decoding="async"></div><div><span class="task-meta">${task.timing}</span><h3>${plant.name} — ${task.title}</h3><p>${task.details}</p></div><a class="open-plant" href="#plants/${plant.id}/season/${season}">View plant →</a></article>`).join('');
  app.innerHTML = `<div class="view-heading"><button class="back-button" type="button" data-back="#home">← Back</button><div><span class="eyebrow">Seasonal planner</span><h1>${seasonNames[season]} tasks</h1><p class="view-copy">A focused list of what your garden needs this season.</p></div></div><nav class="season-tabs" aria-label="Seasons">${seasons.map((name) => `<a class="season-tab" aria-selected="${name === season}" href="#season/${name}">${seasonNames[name]}</a>`).join('')}</nav><section class="task-list">${cards || document.querySelector('#empty-template').innerHTML}</section>`;
  enableImageFallbacks();
}

function route() {
  const parts = location.hash.slice(1).split('/');
  if (parts[0] === 'plants') {
    const selectedId = parts[1];
    const returnHash = parts[2] === 'season' && seasons.includes(parts[3]) ? `#season/${parts[3]}` : '#home';
    plantView(selectedId, returnHash);
  } else if (parts[0] === 'season' && seasons.includes(parts[1])) {
    seasonView(parts[1]);
  } else homeView();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-back]');
  if (button) location.hash = button.dataset.back;
});

fetch('data/plants.json')
  .then((response) => response.json())
  .then((data) => { plants = data; route(); window.addEventListener('hashchange', route); })
  .catch(() => { app.innerHTML = '<p>Unable to load the plant guide. Please try again.</p>'; });
