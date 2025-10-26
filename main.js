// main.js (ES module)
// Keep this file at /js/main.js and reference it with <script type="module" src="js/main.js"></script>

const ASSETS = {
  sounds: '/assets/sounds/',
  images: '/assets/images/',
  data: '/data/'
};

const STORAGE_KEY = 'tropical_revolution_state_v1';

let gameState = {
  year: 1985,
  difficulty: 'normal',
  audio: { music: true, sfx: true },
  stats: { stability: 65, economy: 45, support: 70, military: 85 },
  resources: { budget: 15000, materials: 2500, population: 125000, energy: 1200 }
};

// --- Helpers ---
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

async function loadJSON(path) {
  try {
    const res = await fetch(path, {cache: "no-cache"});
    if (!res.ok) throw new Error('Failed to fetch ' + path);
    return await res.json();
  } catch (e) {
    console.warn('Could not load JSON', path, e);
    return null;
  }
}

function formatCurrency(num) {
  return '$' + Number(num).toLocaleString();
}

// --- Persistence ---
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.assign(gameState, parsed);
  } catch (e) { console.warn('loadState failed', e); }
}

// --- Audio ---
function updateAudioUI() {
  const musicBtn = qs('#music-toggle');
  musicBtn.textContent = gameState.audio.music ? '🔊 Música' : '🔇 Música';
  musicBtn.setAttribute('aria-pressed', String(gameState.audio.music));
  const sfxBtn = qs('#sfx-toggle');
  sfxBtn.textContent = gameState.audio.sfx ? '🔊 Efeitos' : '🔇 Efeitos';
  sfxBtn.setAttribute('aria-pressed', String(gameState.audio.sfx));
}

function toggleMusic() {
  gameState.audio.music = !gameState.audio.music;
  const bg = qs('#background-music');
  if (!bg) return;
  if (gameState.audio.music) {
    bg.muted = false;
    bg.play().catch(()=>{});
  } else {
    bg.pause();
    bg.muted = true;
  }
  updateAudioUI();
  saveState();
}

function toggleSFX() {
  gameState.audio.sfx = !gameState.audio.sfx;
  updateAudioUI();
  saveState();
}

function playSFX(name) {
  if (!gameState.audio.sfx) return;
  const sfxMap = {
    click: ASSETS.sounds + 'click.mp3',
    next_turn: ASSETS.sounds + 'next_turn.mp3',
    event: ASSETS.sounds + 'event.mp3',
    crisis: ASSETS.sounds + 'crisis.mp3'
  };
  const url = sfxMap[name];
  if (!url) return;
  const audio = new Audio(url);
  audio.play().catch(()=>{});
}

// --- Visual banana background same behavior as original ---
function createBananaElements(count = 25) {
  const container = qs('.banana-container');
  if (!container) return;
  container.innerHTML = '';
  for (let i=0;i<count;i++){
    const span = document.createElement('span');
    span.className = 'banana';
    span.textContent = '🍌';
    const x = Math.random()*100;
    const y = Math.random()*100;
    const size = 14 + Math.random()*26;
    const rotate = (Math.random()*40 - 20) + 'deg';
    const opacity = 0.5 + Math.random()*0.6;
    span.style.left = x + 'vw';
    span.style.top = y + 'vh';
    span.style.fontSize = size + 'px';
    span.style.opacity = opacity;
    span.style.transform = `rotate(${rotate})`;
    container.appendChild(span);
  }
}

function triggerRandomBananaGlow() {
  const bananas = qsa('.banana-container .banana');
  if (!bananas.length) return;
  const toGlow = Math.max(1, Math.floor(Math.random()*3));
  for (let i=0;i<toGlow;i++){
    const idx = Math.floor(Math.random()*bananas.length);
    const el = bananas[idx];
    if (!el) continue;
    el.classList.add('banana-glow');
    if (Math.random() < 0.35) el.classList.add('strong');
    const hold = 900 + Math.random()*1600;
    el.style.opacity = 1;
    setTimeout(()=> {
      el.classList.remove('banana-glow');
      el.classList.remove('strong');
      el.style.opacity = 0.8 + Math.random()*0.2;
    }, hold);
  }
}

// --- UI Rendering ---
function renderStats() {
  qs('#stability-bar').style.width = gameState.stats.stability + '%';
  qs('#stability-text').textContent = gameState.stats.stability + '%';
  qs('#economy-bar').style.width = gameState.stats.economy + '%';
  qs('#economy-text').textContent = gameState.stats.economy + '%';
  qs('#support-bar').style.width = gameState.stats.support + '%';
  qs('#support-text').textContent = gameState.stats.support + '%';
  qs('#military-bar').style.width = gameState.stats.military + '%';
  qs('#military-text').textContent = gameState.stats.military + '%';

  qs('#budget').textContent = formatCurrency(gameState.resources.budget);
  qs('#resources').textContent = gameState.resources.materials.toLocaleString();
  qs('#population').textContent = (gameState.resources.population/1000).toFixed(0) + 'K';
  qs('#energy').textContent = gameState.resources.energy.toLocaleString();
}

function appendEvent(text, type='neutral') {
  const log = qs('#events-log');
  if (!log) return;
  const div = document.createElement('div');
  div.className = 'event ' + type;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  if (type === 'critical') playSFX('crisis'); else playSFX('event');
}

// --- Actions (example generator) ---
function generateActions() {
  const panel = qs('#actions-panel');
  panel.innerHTML = '';
  const actions = [
    { id:'invest_health', title:'Investir Saúde', cost:2000, effect: ()=> { gameState.stats.support+=3; gameState.resources.budget -= 2000; appendEvent('Investiu em saúde: apoio +3', 'positive'); } },
    { id:'build_plant', title:'Construir Usina', cost:3000, effect: ()=> { gameState.stats.economy+=4; gameState.resources.budget -= 3000; gameState.resources.energy += 500; appendEvent('Usina construída: economia +4, energia +500', 'positive'); } },
    { id:'crackdown', title:'Repressão Local', cost:1000, effect: ()=> { gameState.stats.stability += 2; gameState.stats.support -= 5; gameState.resources.budget -= 1000; appendEvent('Operação repressiva: estabilidade +2, apoio -5', 'negative'); } }
  ];
  actions.forEach(a=>{
    const card = document.createElement('div');
    card.className = 'action-card';
    card.tabIndex = 0;
    card.innerHTML = `<h3>${a.title}</h3><div class="action-cost">Custo: ${formatCurrency(a.cost)}</div>`;
    card.addEventListener('click', ()=> { 
      if (gameState.resources.budget < a.cost) { appendEvent('Dinheiro insuficiente', 'negative'); playSFX('error'); return; }
      a.effect(); renderStats(); saveState(); playSFX('click');
    });
    panel.appendChild(card);
  });
}

// --- Turn system ---
function nextTurn() {
  // Simple deterministic changes per turn (example)
  gameState.year += 1;
  // small random events
  const roll = Math.random();
  if (roll < 0.08) {
    // negative
    gameState.stats.stability -= 8;
    appendEvent('Protestos massivos! Estabilidade caiu.', 'critical');
  } else if (roll < 0.2) {
    gameState.stats.economy += 3;
    appendEvent('Boom econômico local!', 'positive');
  } else {
    appendEvent('Nenhum evento significativo neste turno.', 'neutral');
  }
  // clamp values
  ['stability','economy','support','military'].forEach(k => {
    gameState.stats[k] = Math.max(0, Math.min(100, gameState.stats[k]));
  });
  renderStats();
  saveState();
  playSFX('next_turn');
}

// --- Initialization ---
async function init() {
  loadState();
  createBananaElements(25);
  setInterval(()=> triggerRandomBananaGlow(), 1500 + Math.random()*3000);

  // Hook UI
  qs('#music-toggle').addEventListener('click', ()=> { toggleMusic(); });
  qs('#sfx-toggle').addEventListener('click', ()=> { toggleSFX(); });
  qs('#next-turn').addEventListener('click', ()=> { nextTurn(); });

  qs('#background-select').addEventListener('change', (e)=>{
    switch(e.target.value){
      case 'beach': document.body.style.background = 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)'; break;
      case 'jungle': document.body.style.background = 'linear-gradient(135deg, #1b4332, #2d6a4f, #40916c)'; break;
      case 'mountain': document.body.style.background = 'linear-gradient(135deg, #3a5a40, #588157, #a3b18a)'; break;
      case 'city': document.body.style.background = 'linear-gradient(135deg, #1e3a5f, #4a4e69, #9a8c98)'; break;
      default: document.body.style.background = '';
    }
  });

  // Render initial components
  renderStats();
  generateActions();
  updateAudioUI();

  // Preload some game data (optional)
  const data = await loadJSON(ASSETS.data + 'game-data.json');
  if (data) {
    // use data to populate actions, map, etc.
    // Example: dynamically create zones from data.zones
    if (Array.isArray(data.zones)) {
      const map = qs('#island-map');
      map.innerHTML = '';
      data.zones.forEach(z => {
        const node = document.createElement('div');
        node.className = 'zone ' + (z.type || '');
        node.style.left = z.x + '%';
        node.style.top = z.y + '%';
        node.style.width = (z.w || 12) + '%';
        node.style.height = (z.h || 8) + '%';
        node.textContent = z.name;
        node.tabIndex = 0;
        node.addEventListener('click', ()=> appendEvent(`Zona: ${z.name}`, 'neutral'));
        map.appendChild(node);
      });
    }
  }

  // start background music if allowed and requested
  const bg = qs('#background-music');
  if (bg && gameState.audio.music) { bg.play().catch(()=>{}); }
}

window.addEventListener('DOMContentLoaded', init);
export { gameState, saveState, loadState };
