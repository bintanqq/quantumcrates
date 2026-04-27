/* ══ APP.JS — Core App Logic ══
   Login dan magic link auth dihandle di index.html (inline script).
   File ini berisi: launchApp, navigate, refreshStatus, helpers.
*/

/* ── Navigate ── */
function navigate(page) {
  State.currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (!pageEl) return;

  const pages = {
    architect: Architect, analytics: Analytics,
    keys: KeySettings,   messages: Messages,
    players: Players,    settings: Settings
  };
  const names = {
    architect:'Crate Architect', analytics:'Analytics & Logs',
    keys:'Key Settings',         messages:'Messages',
    players:'Players',           settings:'Settings'
  };

  pages[page]?.render(pageEl);
  pageEl.classList.add('active');

  const bc = document.getElementById('breadcrumbPage');
  if (bc) bc.textContent = names[page] || page;
}

/* ── Launch App (called after auth) ── */
async function launchApp() {
  document.getElementById('magicScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').style.display    = 'flex';

  // Load rarities FIRST — everything else depends on this
  try {
    const data = await API.get('/rarities');
    const list = data.data || [];
    State.setRarities(list);
  } catch (e) {
    console.warn('Could not load rarities, using defaults:', e.message);
    State.setRarities(DEFAULT_RARITIES);
  }

  // Load crates
  try {
    const data = await API.getCrates();
    const list = data.data || (Array.isArray(data) ? data : Object.values(data));
    list.forEach(c => State.setCrate(c));
    if (State.crateOrder.length) State.currentCrateId = State.crateOrder[0];
  } catch (e) {
    console.warn('Could not load crates:', e.message);
    if (State.demoMode) {
      Object.values(DEMO_CRATES).forEach(c => State.setCrate(c));
      State.currentCrateId = State.crateOrder[0];
    }
  }

  // WebSocket
  WS.connect();
  WS.on('SERVER_STATS', data => Analytics.onServerStats?.(data));
  WS.on('CRATE_OPEN',   data => {
    State.openingsToday++;
    const el = document.getElementById('tstatOpens');
    if (el) el.textContent = Utils.num(State.openingsToday);
    if (State.currentPage === 'analytics') Analytics.onLiveOpen?.(data);
  });
  WS.on('CRATE_UPDATE', () => {
    API.getCrates().then(data => {
      const list = data.data || [];
      list.forEach(c => State.setCrate(c));
    }).catch(() => {});
  });
  WS.on('RARITIES_UPDATE', data => {
    if (data.rarities) {
      // rarities dari WS adalah JsonArray, parse kalau perlu
      const list = Array.isArray(data.rarities) ? data.rarities : [];
      State.setRarities(list);
      // Re-render architect kalau sedang buka
      if (State.currentPage === 'architect') {
        const el = document.getElementById('page-architect');
        if (el) Architect.render(el);
      }
    }
  });

  await refreshStatus();
  navigate('architect');
  updateSidebarVersion();
  if (State.demoMode) toast('Demo Mode — changes not saved.', 'info', 5000);
}

/* ── Server Status ── */
async function refreshStatus() {
  try {
    const s = await API.getServerStatus();
    State.serverStatus = s;
    updateStatusDot(true);
    const host = State.serverUrl.replace(/https?:\/\//, '').split(':')[0];
    document.getElementById('serverName').textContent = host;
    document.getElementById('serverMeta').textContent =
      `${s.onlinePlayers}/${s.maxPlayers} online · TPS ${s.tps?.toFixed(1)}`;
    document.getElementById('tstatOnline').textContent = s.onlinePlayers ?? '—';
    document.getElementById('tstatTps').textContent    = s.tps?.toFixed(1) ?? '—';
  } catch {
    updateStatusDot(false);
    document.getElementById('serverName').textContent = 'Disconnected';
    document.getElementById('serverMeta').textContent = 'Cannot reach server';
  }
}

function updateStatusDot(online) {
  const dot = document.getElementById('statusDot');
  if (dot) dot.className = 'server-status-dot ' + (online ? 'online' : 'offline');
}

function updateSidebarVersion() {
  const el = document.getElementById('sidebarVer');
  if (el && State.serverStatus?.version) {
    const v = State.serverStatus.version.match(/(\d+\.\d+\.\d+)/)?.[1] || '';
    el.textContent = v ? 'MC ' + v : 'v1.0.0';
  }
}

/* ── Logout ── */
function logout() {
  document.cookie = 'qc_jwt=; Path=/; Max-Age=0';
  State.jwt = null;
  State.demoMode = false;
  WS.disconnect();
  document.getElementById('appShell').style.display    = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

/* ── Sidebar Toggle ── */
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('collapsed');
}

/* ── Demo Mode ── */
function showDemoMode() {
  State.demoMode = true;
  State.jwt = 'demo';
  launchApp();
}

/* ── Login particles ── */
function initLoginParticles() {
  const container = document.getElementById('loginParticles');
  if (!container || container.children.length) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position:absolute;border-radius:50%;
      width:${2+Math.random()*3}px;height:${2+Math.random()*3}px;
      background:rgba(0,229,212,${.1+Math.random()*.2});
      left:${Math.random()*100}%;top:${Math.random()*100}%;
      animation:float-particle ${6+Math.random()*8}s ease-in-out infinite;
      animation-delay:${Math.random()*6}s;
    `;
    container.appendChild(p);
  }
  if (!document.getElementById('particleKf')) {
    const s = document.createElement('style');
    s.id = 'particleKf';
    s.textContent = `@keyframes float-particle{0%,100%{transform:translateY(0) scale(1);opacity:.15}50%{transform:translateY(-28px) scale(1.2);opacity:.4}}`;
    document.head.appendChild(s);
  }
}

/* ── Modal helpers (global) ── */
function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('modalOverlay')) Modal.close();
}

/* ── Default rarities fallback (kalau server offline / demo) ── */
const DEFAULT_RARITIES = [
  { id:'COMMON',    displayName:'Common',    color:'&f', hexColor:'#aaaaaa', order:0, borderMaterial:'GRAY_STAINED_GLASS_PANE',    icon:'⬜' },
  { id:'UNCOMMON',  displayName:'Uncommon',  color:'&a', hexColor:'#00d97e', order:1, borderMaterial:'GREEN_STAINED_GLASS_PANE',   icon:'🟩' },
  { id:'RARE',      displayName:'Rare',      color:'&9', hexColor:'#4488ff', order:2, borderMaterial:'BLUE_STAINED_GLASS_PANE',    icon:'🔷' },
  { id:'EPIC',      displayName:'Epic',      color:'&5', hexColor:'#9b59f5', order:3, borderMaterial:'MAGENTA_STAINED_GLASS_PANE', icon:'🟣' },
  { id:'LEGENDARY', displayName:'Legendary', color:'&6', hexColor:'#f5a623', order:4, borderMaterial:'ORANGE_STAINED_GLASS_PANE',  icon:'🟡' },
  { id:'MYTHIC',    displayName:'Mythic',    color:'&d', hexColor:'#ff44aa', order:5, borderMaterial:'PURPLE_STAINED_GLASS_PANE',  icon:'🩷' },
];