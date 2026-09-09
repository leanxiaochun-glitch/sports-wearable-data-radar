const state = { data: [], category: 'All', query: '' };
const $ = (selector) => document.querySelector(selector);

function displayValue(item) {
  const value = typeof item.value === 'number' ? item.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : item.value;
  return `${value}${item.unit ? `<small>${item.unit}</small>` : ''}`;
}

function render() {
  const visible = state.data.filter((item) => {
    const matchCategory = state.category === 'All' || item.category === state.category;
    const haystack = `${item.title} ${item.source_name} ${item.article_title} ${item.summary}`.toLowerCase();
    return matchCategory && haystack.includes(state.query.toLowerCase());
  });
  $('#signals').innerHTML = visible.length ? visible.map((item, index) => `
    <article class="card" style="--delay:${index * 35}ms">
      <div class="card-top"><span class="category">${item.category}</span><span class="year">${item.period || ''}</span></div>
      <h3>${item.title}</h3>
      <div class="value">${displayValue(item)}</div>
      <p>${item.summary}</p>
      <dl>
        <div><dt>Source</dt><dd>${item.source_name}</dd></div>
        <div><dt>Published</dt><dd>${item.published_date || 'N/A'}</dd></div>
        <div><dt>Retrieved</dt><dd>${item.retrieved_at}</dd></div>
        <div><dt>Method</dt><dd>${item.method}</dd></div>
      </dl>
      <a class="source-link" href="${item.source_url}" target="_blank" rel="noopener noreferrer" aria-label="Open source: ${item.article_title}">${item.article_title} ↗</a>
    </article>`).join('') : '<p class="empty">No signals match this view.</p>';
}

function configureRepositoryLinks(config) {
  let repo = config.repository;
  if (location.hostname.endsWith('github.io')) {
    const owner = location.hostname.split('.')[0];
    const name = location.pathname.split('/').filter(Boolean)[0];
    if (owner && name) repo = `https://github.com/${owner}/${name}`;
  }
  $('#repo-link').href = repo;
  $('#refresh-link').href = `${repo}/actions/workflows/refresh-data.yml`;
}

Promise.all([
  fetch('data/metrics.json').then((r) => { if (!r.ok) throw new Error('Dataset unavailable'); return r.json(); }),
  fetch('data/config.json').then((r) => r.json())
]).then(([dataset, config]) => {
  state.data = dataset.metrics;
  configureRepositoryLinks(config);
  $('#metric-count').textContent = dataset.metrics.length;
  $('#source-count').textContent = new Set(dataset.metrics.map((x) => x.source_name)).size;
  $('#auto-count').textContent = dataset.metrics.filter((x) => x.method.startsWith('API')).length;
  $('#updated').textContent = `Dataset refreshed ${dataset.generated_at.slice(0, 10)}`;
  const categories = ['All', ...new Set(dataset.metrics.map((x) => x.category))];
  $('#filters').innerHTML = categories.map((c, i) => `<button class="filter ${i === 0 ? 'active' : ''}" data-category="${c}">${c}</button>`).join('');
  $('#filters').addEventListener('click', (event) => {
    if (!event.target.matches('button')) return;
    state.category = event.target.dataset.category;
    document.querySelectorAll('.filter').forEach((b) => b.classList.toggle('active', b === event.target));
    render();
  });
  render();
}).catch((error) => { $('#signals').innerHTML = `<p class="empty">${error.message}</p>`; });

$('#search').addEventListener('input', (event) => { state.query = event.target.value; render(); });

