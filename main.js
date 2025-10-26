// main.js (ES module) — usa import.meta.url para localizar game-data.json de forma robusta

const ASSETS = {
  soundsExternal: {
    click: 'https://www.soundjay.com/buttons/sounds/button-09.mp3',
    next_turn: 'https://www.soundjay.com/mechanical/sounds/camera-shutter-click-01.wav',
    event: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    crisis: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav'
  }
};

const STORAGE_KEY = 'tropical_revolution_state_v1';

let gameState = {
  year: 1985,
  difficulty: 'normal',
  audio: { music: true, sfx: true },
  stats: { stability: 65, economy: 45, support: 70, military: 85 },
  resources: { budget: 15000, materials: 2500, population: 125000, energy: 1200 }
};

// Helpers
const qs = (s, r=document) => r.querySelector(s);
const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

async function loadJSON(url) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Fetch failed ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('loadJSON failed', url, e);
    return null;
  }
}

function formatCurrency(n) {
  return '$' + Number(n).toLocaleString();
}

// Persistence
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)); }
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    Object.assign(gameState, JSON.parse(raw));
  } catch (e) { console.warn('loadState', e); }
}

// Audio helpers
function updateAudioUI() {
  const musicBtn = qs('#music-toggle');
  if (musicBtn) musicBtn.textContent = gameState.audio.music ? '🔊 Música' : '🔇 Música';
  if (musicBtn) musicBtn.setAttribute('aria-pressed', String(gameState.audio.music));
  const sfxBtn = qs('#sfx-toggle');
  if (sfxBtn) sfxBtn.textContent = gameState.audio.sfx ? '🔊 Efeitos' : '🔇 Efeitos';
  if (sfxBtn) sfxBtn.setAttribute('aria-pressed', String(gameState.audio.sfx));
}

function toggleMusic() {
  gameState.audio.music = !gameState.audio.music;
  const bg = qs('#background-music');
  if (bg) {
    if (gameState.audio.music) { bg.muted = false; bg.play().catch(()=>{}); }
    else { bg.pause(); bg.muted = true; }
  }
  updateAudioUI(); saveState();
}

function toggleSFX() { gameState.audio.sfx = !gameState.audio.sfx; updateAudioUI(); saveState(); }

function playSFX(name) {
  if (!gameState.audio.sfx) return;
  const url = ASSETS.soundsExternal[name];
  if (!url) return;
  const a = new Audio(url);
  a.play().catch(()=>{});
}

// Banana background (visual)
function createBananaElements(count=25) {
  const container = qs('.banana-container');
  if (!container) return;
  container.innerHTML = '';
  for (let i=0;i<count;i++){
    const span = document.createElement('span');
    span.className = 'banana';
    span.textContent = '🍌';
    span.style.left = (Math.random()*100) + 'vw';
    span.style.top = (Math.random()*100) + 'vh';
    span.style.fontSize = (14 + Math.random()*26) + 'px';
    span.style.opacity = (0.5 + Math.random()*0.6);
    span.style.transform = `rotate(${(Math.random()*40 - 20)}deg)`;
    container.appendChild(span);
  }
}

function triggerRandomBananaGlow() {
  const bananas = qsa('.banana-container .banana');
  if (!bananas.length) return;
  const toGlow = Math.max(1, Math.floor(Math.random()*3));
  for (let i=0;i<toGlow;i++){
    const el = bananas[Math.floor(Math.random()*bananas.length)];
    if (!el) continue;
    el.classList.add('banana-glow');
    if (Math.random()<0.35) el.classList.add('strong');
    const hold = 900 + Math.random()*1600;
    el.style.opacity = 1;
    setTimeout(()=> { el.classList.remove('banana-glow'); el.classList.remove('strong'); el.style.opacity = (0.8 + Math.random()*0.2); }, hold);
  }
}

// UI render
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

// Actions
function generateActions() {
  const panel = qs('#actions-panel');
  if (!panel) return;
  panel.innerHTML = '';
  const actions = [
    { id:'invest_health', title:'Investir Saúde', cost:2000, effect: ()=> { gameState.stats.support+=3; gameState.resources.budget -= 2000; appendEvent('Investiu em saúde: apoio +3', 'positive'); } },
    { id:'build_plant', title:'Construir Usina', cost:3000, effect: ()=> { gameState.stats.economy+=4; gameState.resources.budget -= 3000; gameState.resources.energy += 500; appendEvent('Usina construída: economia +4, energia +500', 'positive'); } },
    { id:'crackdown', title:'Repressão Local', cost:1000, effect: ()=> { gameState.stats.stability += 2; gameState.stats.support -= 5; gameState.resources.budget -= 1000; appendEvent('Operação repressiva: estabilidade +2, apoio -5', 'negative'); } }
  ];
  actions.forEach(a => {
    const card = document.createElement('div');
    card.className = 'action-card';
    card.tabIndex = 0;
    card.innerHTML = `<h3>${a.title}</h3><div class="action-cost">Custo: ${formatCurrency(a.cost)}</div>`;
    card.addEventListener('click', () => {
      if (gameState.resources.budget < a.cost) { appendEvent('Dinheiro insuficiente', 'negative'); playSFX('error'); return; }
      a.effect(); renderStats(); saveState(); playSFX('click');
    });
    panel.appendChild(card);
  });
}

// Turn
function nextTurn() {
  gameState.year += 1;
  const roll = Math.random();
  if (roll < 0.08) {
    gameState.stats.stability -= 8;
    appendEvent('Protestos massivos! Estabilidade caiu.', 'critical');
  } else if (roll < 0.2) {
    gameState.stats.economy += 3;
    appendEvent('Boom econômico local!', 'positive');
  } else {
    appendEvent('Nenhum evento significativo neste turno.', 'neutral');
  }
  ['stability','economy','support','military'].forEach(k => {
    gameState.stats[k] = Math.max(0, Math.min(100, gameState.stats[k]));
  });
  renderStats();
  saveState();
  playSFX('next_turn');
}

// Init
async function init() {
  loadState();
  createBananaElements(25);
  setInterval(() => triggerRandomBananaGlow(), 1500 + Math.random()*3000);

  // Hooks
  qs('#music-toggle')?.addEventListener('click', toggleMusic);
  qs('#sfx-toggle')?.addEventListener('click', toggleSFX);
  qs('#next-turn')?.addEventListener('click', nextTurn);

  qs('#background-select')?.addEventListener('change', (e) => {
    switch (e.target.value) {
      case 'beach': document.body.style.background = 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)'; break;
      case 'jungle': document.body.style.background = 'linear-gradient(135deg, #1b4332, #2d6a4f, #40916c)'; break;
      case 'mountain': document.body.style.background = 'linear-gradient(135deg, #3a5a40, #588157, #a3b18a)'; break;
      case 'city': document.body.style.background = 'linear-gradient(135deg, #1e3a5f, #4a4e69, #9a8c98)'; break;
      default: document.body.style.background = '';
    }
  });

  renderStats(); generateActions(); updateAudioUI();

  // Carregamento robusto do JSON (game-data.json na raiz do site)
  const dataUrl = new URL('../game-data.json', import.meta.url).href; // main.js está em /js/
  const data = await loadJSON(dataUrl);
  if (data && Array.isArray(data.zones)) {
    const map = qs('#island-map');
    map.innerHTML = '';
    data.zones.forEach(z => {
      const node = document.createElement('div');
      node.className = 'zone ' + (z.type || '');
      node.style.left = (z.x || 10) + '%';
      node.style.top = (z.y || 10) + '%';
      node.style.width = (z.w || 12) + '%';
      node.style.height = (z.h || 8) + '%';
      node.textContent = z.name;
      node.tabIndex = 0;
      node.addEventListener('click', () => appendEvent(`Zona: ${z.name}`, 'neutral'));
      map.appendChild(node);
    });
  } else {
    // fallback: create a few zones to avoid empty map
    const map = qs('#island-map');
    map.innerHTML = '<div class="zone urban" style="left:40%;top:20%;width:15%;height:10%;">Capital</div>';
  }

  const bg = qs('#background-music');
  if (bg && gameState.audio.music) { bg.play().catch(()=>{}); }
}

window.addEventListener('DOMContentLoaded', init);

export { gameState, saveState, loadState };
