/* ══ GLOBAL STATE ══ */
const State = {
  jwt: null,
  serverUrl: 'http://localhost:7420',
  currentPage: 'architect',
  currentCrateId: null,
  crates: {},          // id → crate object
  crateOrder: [],      // ordered ids
  messages: {},        // key → value from server
  serverStatus: null,
  openingsToday: 0,
  demoMode: false,

  /**
   * Rarity definitions loaded from /api/rarities.
   * Array of { id, displayName, color, hexColor, order, borderMaterial, icon }
   * sorted ascending by order (index 0 = lowest/most common).
   */
  rarities: [],

  get currentCrate() {
    return this.currentCrateId ? this.crates[this.currentCrateId] : null;
  },

  setCrate(crate) {
    this.crates[crate.id] = crate;
    if (!this.crateOrder.includes(crate.id)) this.crateOrder.push(crate.id);
  },

  deleteCrate(id) {
    delete this.crates[id];
    this.crateOrder = this.crateOrder.filter(i => i !== id);
    if (this.currentCrateId === id) {
      this.currentCrateId = this.crateOrder[0] || null;
    }
  },

  /* ── Rarity helpers (pengganti hardcode di utils.js) ── */

  /**
   * Ingest rarity list dari API, sort by order, inject CSS vars.
   * Dipanggil sekali di launchApp dan setiap RARITIES_UPDATE WS event.
   */
  setRarities(list) {
    this.rarities = [...list].sort((a, b) => a.order - b.order);
    this._injectCssVars();
  },

  /** hex color untuk rarity id (fallback #aaa) */
  rarityColor(id) {
    const r = this._getRarity(id);
    return r ? r.hexColor : '#aaaaaa';
  },

  /** tier order integer (fallback 0) */
  rarityOrder(id) {
    const r = this._getRarity(id);
    return r ? r.order : 0;
  },

  /** icon/emoji (fallback ⬜) */
  rarityIcon(id) {
    const r = this._getRarity(id);
    return r ? r.icon : '⬜';
  },

  /** display name (fallback = id itu sendiri) */
  rarityName(id) {
    const r = this._getRarity(id);
    return r ? r.displayName : (id || 'Unknown');
  },

  /** Array of all rarity IDs, sorted lowest→highest */
  rarityIds() {
    return this.rarities.map(r => r.id);
  },

  /** IDs at or above a minimum rarity (untuk pity selector) */
  rarityIdsAtOrAbove(minId) {
    const minOrder = this.rarityOrder(minId);
    return this.rarities.filter(r => r.order >= minOrder).map(r => r.id);
  },

  _getRarity(id) {
    if (!id) return null;
    return this.rarities.find(r => r.id === id.toUpperCase()) || null;
  },

  /** Inject --r-<id> CSS custom properties ke :root */
  _injectCssVars() {
    let style = document.getElementById('qc-rarity-vars');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qc-rarity-vars';
      document.head.appendChild(style);
    }
    const vars = this.rarities.map(r =>
      `--r-${r.id.toLowerCase()}:${r.hexColor};`
    ).join('\n');
    style.textContent = `:root { ${vars} }`;
  },
};