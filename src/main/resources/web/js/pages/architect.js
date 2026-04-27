/* ══ PAGE: CRATE ARCHITECT ══ */
const Architect = {
  dirty: false,

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Crate Architect</div>
          <div class="page-sub">Design and configure the ultimate loot experience.</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm" id="btnRarityEditor">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Rarities
          </button>
          <button class="btn btn-ghost btn-sm" id="btnPreviewCrate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview
          </button>
          <button class="btn btn-danger btn-sm" id="btnDiscardCrate">↩ Discard</button>
          <button class="btn btn-primary btn-sm" id="btnSaveCrate">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Crate
          </button>
        </div>
      </div>

      <!-- Crate tabs -->
      <div class="crate-selector-bar" id="crateTabs"></div>

      <div class="architect-grid">
        <div class="architect-left" id="architectLeft">
          <div class="card" id="rewardsCard">
            <div class="card-header">
              <div class="card-title"><span class="card-accent"></span>REWARDS <span class="card-sub">Loot Table</span></div>
              <button class="btn btn-ghost btn-sm" id="btnAddReward">+ Add Reward</button>
            </div>
            <div class="rewards-grid" id="rewardsGrid"></div>
            <div class="total-weight-bar"><div class="total-weight-fill" id="totalWeightFill"></div></div>
            <div class="weight-footer">
              <span>Total Weight</span>
              <span class="weight-total" id="totalWeightLabel">0%</span>
            </div>
          </div>

          <div class="card" id="sliderCard">
            <div class="card-header">
              <div class="card-title"><span class="card-accent"></span>CHANCE MANAGEMENT <span class="card-sub">Weight %</span></div>
              <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text3)">
                Sort:
                <select class="field-input" style="padding:4px 22px 4px 8px;width:auto;font-size:11px" id="sortOrder">
                  <option value="RARITY_DESC">Rarity ↓</option>
                  <option value="RARITY_ASC">Rarity ↑</option>
                  <option value="WEIGHT_DESC">Weight ↓</option>
                  <option value="WEIGHT_ASC">Weight ↑</option>
                  <option value="CONFIG_ORDER">Config Order</option>
                </select>
              </div>
            </div>
            <div id="sliderGrid"></div>
          </div>
        </div>

        <div class="architect-right" id="architectRight">
          <!-- Crate Settings -->
          <div class="card card-sm" id="crateSettingsCard">
            <div class="card-header" style="margin-bottom:10px">
              <div class="card-title"><span class="card-accent"></span>CRATE SETTINGS</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px" id="crateSettingsFields"></div>
          </div>

          <!-- Pity System -->
          <div class="card card-sm" id="pityCard">
            <div class="card-header" style="margin-bottom:8px">
              <div class="card-title"><span class="card-accent"></span>PITY SYSTEM</div>
              <div id="pityToggle"></div>
            </div>
            <div id="pityBody"></div>
          </div>

          <!-- Key Section -->
          <div class="card card-sm" id="keyCard">
            <div class="card-header" style="margin-bottom:8px">
              <div class="card-title"><span class="card-accent"></span>KEY REQUIREMENTS</div>
            </div>
            <div id="keyBody"></div>
          </div>

          <!-- Preview Config -->
          <div class="card card-sm" id="previewConfigCard">
            <div class="card-header" style="margin-bottom:8px">
              <div class="card-title"><span class="card-accent"></span>PREVIEW GUI CONFIG</div>
            </div>
            <div id="previewConfigBody"></div>
          </div>
        </div>
      </div>
    `;

    this._bindTopActions();
    this.renderCrateTabs();
    if (State.currentCrateId) this.loadCrate(State.currentCrateId);
  },

  _bindTopActions() {
    Utils.on(Utils.qs('#btnSaveCrate'),    'click', () => this.save());
    Utils.on(Utils.qs('#btnDiscardCrate'), 'click', () => this.discard());
    Utils.on(Utils.qs('#btnPreviewCrate'), 'click', () => PreviewModal.open(State.currentCrate));
    Utils.on(Utils.qs('#btnAddReward'),    'click', () => RewardModal.open(null, r => this.addReward(r)));
    Utils.on(Utils.qs('#btnRarityEditor'), 'click', () => RarityEditor.open());
  },

  renderCrateTabs() {
    const bar = Utils.qs('#crateTabs');
    if (!bar) return;
    bar.innerHTML = '';
    State.crateOrder.forEach(id => {
      const c   = State.crates[id];
      const tab = Utils.el('div', `crate-tab${id === State.currentCrateId ? ' active' : ''}`);
      const color = Utils.rarityColor(this._highestRarity(c.rewards));
      tab.innerHTML = `<span class="crate-tab-dot" style="background:${color}"></span>${Utils.strip(c.displayName || id)}`;
      tab.onclick = () => this.loadCrate(id);
      bar.appendChild(tab);
    });
    const add = Utils.el('div', 'crate-tab crate-tab-add');
    add.innerHTML = '+ New Crate';
    add.onclick = () => this.newCrate();
    bar.appendChild(add);
  },

  loadCrate(id) {
    State.currentCrateId = id;
    this.renderCrateTabs();
    this.renderRewards();
    this.renderSliders();
    this.renderCrateSettings();
    this.renderPity();
    this.renderKeys();
    this.renderPreviewConfig();
  },

  /* ── Rewards ── */
  renderRewards() {
    const grid  = Utils.qs('#rewardsGrid'); if (!grid) return;
    const crate = State.currentCrate;       if (!crate) return;
    grid.innerHTML = '';
    const tw = Utils.totalWeight(crate.rewards);
    const sorted = this._sortedRewards(crate.rewards);
    sorted.forEach(r => {
      grid.appendChild(RewardCard(r, tw,
        () => RewardModal.open(r, updated => this.updateReward(r.id, updated)),
        () => this.removeReward(r.id)
      ));
    });
    grid.appendChild(AddCard(() => RewardModal.open(null, r => this.addReward(r))));
    this._updateWeightBar(tw);
  },

  renderSliders() {
    const grid  = Utils.qs('#sliderGrid'); if (!grid) return;
    const crate = State.currentCrate;      if (!crate) return;
    grid.innerHTML = '';
    const sorted = this._sortedRewards(crate.rewards);
    const tw = Utils.totalWeight(crate.rewards);
    sorted.forEach(r => grid.appendChild(SliderRow(r, tw, () => {
      this.dirty = true;
      this.renderRewards();
      this.renderSliders();
    })));
  },

  _updateWeightBar(tw) {
    const fill  = Utils.qs('#totalWeightFill');
    const label = Utils.qs('#totalWeightLabel');
    if (!fill || !label) return;
    fill.style.width = Math.min(tw, 100) + '%';
    label.textContent = tw.toFixed(1) + '%';
    label.style.color = tw > 100 ? 'var(--red)' : 'var(--cyan)';
  },

  /* ── Crate Settings ── */
  renderCrateSettings() {
    const body  = Utils.qs('#crateSettingsFields'); if (!body) return;
    const crate = State.currentCrate;               if (!crate) return;

    body.innerHTML = `
      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Crate ID</label>
          <input class="field-input" id="cfgId" value="${crate.id || ''}" placeholder="legendary_crate"/>
        </div>
        <div class="field-group">
          <label class="field-label">Display Name</label>
          <input class="field-input" id="cfgName" value="${crate.displayName || ''}" placeholder="&6&lLegendary Crate"/>
        </div>
      </div>
      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Cooldown</label>
          <select class="field-input" id="cfgCooldown">
            <option value="0" ${!crate.cooldownMs?'selected':''}>No Cooldown</option>
            <option value="300000"   ${crate.cooldownMs===300000?'selected':''}>5 Minutes</option>
            <option value="1800000"  ${crate.cooldownMs===1800000?'selected':''}>30 Minutes</option>
            <option value="3600000"  ${crate.cooldownMs===3600000?'selected':''}>1 Hour</option>
            <option value="86400000" ${crate.cooldownMs===86400000?'selected':''}>24 Hours</option>
            <option value="custom">Custom...</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Mass Open Limit</label>
          <input class="field-input" type="number" id="cfgMassLimit" value="${crate.massOpenLimit ?? 64}" min="-1"/>
        </div>
      </div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <div class="section-label" style="margin-bottom:8px">IDLE ANIMATION</div>
        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Type</label>
            <select class="field-input" id="cfgIdleType">
              ${['RING','HELIX','SPHERE','SPIRAL','RAIN','NONE'].map(t =>
                `<option value="${t}" ${(crate.idleAnimation?.type||'RING')===t?'selected':''}>${t}</option>`
              ).join('')}
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Particle</label>
            <select class="field-input" id="cfgIdleParticle">
              ${['HAPPY_VILLAGER','FLAME','ENCHANT','SOUL_FIRE_FLAME','DRAGON_BREATH',
                 'END_ROD','WITCH','GLOW','FIREWORK','TOTEM_OF_UNDYING','SCRAPE'].map(p =>
                `<option value="${p}" ${(crate.idleAnimation?.particle||'HAPPY_VILLAGER')===p?'selected':''}>${p}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="field-row" style="margin-top:8px">
          <div class="field-group">
            <label class="field-label">Speed</label>
            <input class="field-input" type="number" id="cfgIdleSpeed" value="${crate.idleAnimation?.speed ?? 1.0}" min="0.1" max="5.0" step="0.1"/>
          </div>
          <div class="field-group">
            <label class="field-label">Radius</label>
            <input class="field-input" type="number" id="cfgIdleRadius" value="${crate.idleAnimation?.radius ?? 1.0}" min="0.2" max="3.0" step="0.1"/>
          </div>
          <div class="field-group">
            <label class="field-label">Density</label>
            <input class="field-input" type="number" id="cfgIdleDensity" value="${crate.idleAnimation?.density ?? 8}" min="1" max="32"/>
          </div>
        </div>

        <div class="section-label" style="margin-top:12px;margin-bottom:8px">OPEN ANIMATION</div>
        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Type</label>
            <select class="field-input" id="cfgOpenType">
              ${['RING','HELIX','SPHERE','SPIRAL','RAIN','NONE'].map(t =>
                `<option value="${t}" ${(crate.openAnimation?.type||'RING')===t?'selected':''}>${t}</option>`
              ).join('')}
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Particle</label>
            <select class="field-input" id="cfgOpenParticle">
              ${['FIREWORK','FLAME','ENCHANT','SOUL_FIRE_FLAME','DRAGON_BREATH',
                 'END_ROD','WITCH','GLOW','HAPPY_VILLAGER','TOTEM_OF_UNDYING'].map(p =>
                `<option value="${p}" ${(crate.openAnimation?.particle||'FIREWORK')===p?'selected':''}>${p}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="field-row" style="margin-top:8px">
          <div class="field-group">
            <label class="field-label">Speed</label>
            <input class="field-input" type="number" id="cfgOpenSpeed" value="${crate.openAnimation?.speed ?? 1.0}" min="0.1" max="5.0" step="0.1"/>
          </div>
          <div class="field-group">
            <label class="field-label">Radius</label>
            <input class="field-input" type="number" id="cfgOpenRadius" value="${crate.openAnimation?.radius ?? 1.0}" min="0.2" max="3.0" step="0.1"/>
          </div>
        </div>
      </div>
      <div id="enabledToggle"></div>
      <div id="massOpenToggle"></div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="HologramModal.open()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Edit Hologram
        </button>
        <button class="btn btn-danger btn-sm" onclick="Architect.deleteCrate('${crate.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          Delete Crate
        </button>
      </div>
    `;

    body.querySelector('#enabledToggle').appendChild(
      ToggleSwitch('Crate Enabled', crate.enabled !== false, v => { crate.enabled = v; this.dirty = true; })
    );
    body.querySelector('#massOpenToggle').appendChild(
      ToggleSwitch('Mass Open Enabled', crate.massOpenEnabled !== false, v => { crate.massOpenEnabled = v; this.dirty = true; })
    );

    ['cfgId','cfgName','cfgCooldown','cfgMassLimit'].forEach(id => {
      Utils.qs('#'+id)?.addEventListener('change', () => {
        crate.id           = Utils.qs('#cfgId').value.trim();
        crate.displayName  = Utils.qs('#cfgName').value;
        crate.cooldownMs   = parseInt(Utils.qs('#cfgCooldown').value) || 0;
        crate.massOpenLimit= parseInt(Utils.qs('#cfgMassLimit').value) || -1;
        this.dirty = true;
        this.renderCrateTabs();
      });
    });
    ['cfgIdleType','cfgIdleParticle','cfgIdleSpeed','cfgIdleRadius','cfgIdleDensity',
     'cfgOpenType','cfgOpenParticle','cfgOpenSpeed','cfgOpenRadius'].forEach(id => {
      Utils.qs('#'+id)?.addEventListener('change', () => {
        if (!crate.idleAnimation) crate.idleAnimation = {};
        if (!crate.openAnimation) crate.openAnimation = {};
        crate.idleAnimation.type     = Utils.qs('#cfgIdleType').value;
        crate.idleAnimation.particle = Utils.qs('#cfgIdleParticle').value;
        crate.idleAnimation.speed    = parseFloat(Utils.qs('#cfgIdleSpeed').value);
        crate.idleAnimation.radius   = parseFloat(Utils.qs('#cfgIdleRadius').value);
        crate.idleAnimation.density  = parseInt(Utils.qs('#cfgIdleDensity').value);
        crate.openAnimation.type     = Utils.qs('#cfgOpenType').value;
        crate.openAnimation.particle = Utils.qs('#cfgOpenParticle').value;
        crate.openAnimation.speed    = parseFloat(Utils.qs('#cfgOpenSpeed').value);
        crate.openAnimation.radius   = parseFloat(Utils.qs('#cfgOpenRadius').value);
        this.dirty = true;
      });
    });
  },

  /* ── Pity ── */
  renderPity() {
    const body  = Utils.qs('#pityBody');   if (!body) return;
    const tog   = Utils.qs('#pityToggle'); if (!tog) return;
    const crate = State.currentCrate;      if (!crate) return;
    const pity  = crate.pity || {};

    tog.innerHTML = '';
    tog.appendChild(ToggleSwitch('', pity.enabled, v => {
      pity.enabled = v; this.dirty = true; this.renderPity();
    }));

    if (!pity.enabled) {
      body.innerHTML = '<div style="font-size:11px;color:var(--text3);padding:4px 0">Pity system is disabled for this crate.</div>';
      return;
    }

    // Rarity options untuk pity — dynamic dari State.rarities
    // Hanya tampilkan rarity dari urutan ke-2 ke atas (index >= 1) — pity biasanya bukan untuk common
    const pityRarityOptions = State.rarities
      .filter((_, i) => i >= 1)
      .map(r => `<option value="${r.id}" ${pity.rareRarityMinimum===r.id?'selected':''}>
        ${r.icon} ${r.displayName}
      </option>`)
      .join('');

    body.innerHTML = `
      ${PityBar(0, pity.threshold || 100, pity.softPityStart || 80).outerHTML}
      <div class="field-row" style="margin-top:10px">
        <div class="field-group">
          <label class="field-label">Hard Pity Threshold</label>
          <input class="field-input" type="number" id="pityMax" value="${pity.threshold || 100}" min="1" max="1000"/>
        </div>
        <div class="field-group">
          <label class="field-label">Soft Pity Start</label>
          <input class="field-input" type="number" id="pitySoft" value="${pity.softPityStart || 80}" min="1"/>
        </div>
      </div>
      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Minimum Rarity for Pity</label>
          <select class="field-input" id="pityRarity">
            ${pityRarityOptions}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Bonus Chance/Open (%)</label>
          <input class="field-input" type="number" id="pityBonus" value="${pity.bonusChancePerOpen || 2}" min="0.1" step="0.1"/>
        </div>
      </div>
    `;

    ['pityMax','pitySoft','pityRarity','pityBonus'].forEach(id => {
      Utils.qs('#'+id)?.addEventListener('change', () => {
        pity.threshold          = parseInt(Utils.qs('#pityMax').value);
        pity.softPityStart      = parseInt(Utils.qs('#pitySoft').value);
        pity.rareRarityMinimum  = Utils.qs('#pityRarity').value;
        pity.bonusChancePerOpen = parseFloat(Utils.qs('#pityBonus').value);
        this.dirty = true;
      });
    });
  },

  /* ── Keys ── */
  renderKeys() {
    const body  = Utils.qs('#keyBody'); if (!body) return;
    const crate = State.currentCrate;  if (!crate) return;
    if (!crate.requiredKeys) crate.requiredKeys = [];

    const renderList = () => {
      body.innerHTML = '';
      crate.requiredKeys.forEach((k, i) => {
        const row = Utils.el('div', 'field-row', `
          <div class="field-group">
            <label class="field-label">Key ID</label>
            <input class="field-input" value="${k.keyId}" placeholder="legendary_key" data-field="keyId" data-idx="${i}"/>
          </div>
          <div class="field-group">
            <label class="field-label">Amount</label>
            <input class="field-input" type="number" value="${k.amount || 1}" min="1" data-field="amount" data-idx="${i}"/>
          </div>
          <div class="field-group">
            <label class="field-label">Source</label>
            <select class="field-input" data-field="type" data-idx="${i}">
              ${['VIRTUAL','PHYSICAL','MMOITEMS','ITEMSADDER','ORAXEN'].map(t =>
                `<option value="${t}" ${k.type===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-danger btn-xs" style="align-self:flex-end;margin-bottom:0" data-remove="${i}">✕</button>
        `);
        row.querySelectorAll('[data-field]').forEach(el => {
          el.onchange = () => {
            const idx   = parseInt(el.dataset.idx);
            const field = el.dataset.field;
            crate.requiredKeys[idx][field] = field === 'amount' ? parseInt(el.value) : el.value;
            this.dirty = true;
          };
        });
        row.querySelector('[data-remove]').onclick = () => {
          crate.requiredKeys.splice(i, 1); this.dirty = true; renderList();
        };
        body.appendChild(row);
      });

      const addBtn = Utils.el('button', 'btn btn-ghost btn-sm', '+ Add Key Requirement');
      addBtn.style.marginTop = '6px';
      addBtn.onclick = () => {
        crate.requiredKeys.push({ keyId: '', amount: 1, type: 'VIRTUAL' });
        this.dirty = true; renderList();
      };
      body.appendChild(addBtn);
    };
    renderList();
  },

  /* ── Preview Config ── */
  renderPreviewConfig() {
    const body  = Utils.qs('#previewConfigBody'); if (!body) return;
    const crate = State.currentCrate;             if (!crate) return;
    if (!crate.preview) crate.preview = {};
    const p = crate.preview;

    body.innerHTML = `
      <div class="field-group">
        <label class="field-label">GUI Title <span style="color:var(--text3)">(leave blank = auto)</span></label>
        <input class="field-input" id="pvTitle" value="${p.title || ''}" placeholder="&0Preview &8» &b{crate}"/>
      </div>
      <div class="field-row" style="margin-top:8px">
        <div class="field-group">
          <label class="field-label">Sort Order</label>
          <select class="field-input" id="pvSort">
            ${['RARITY_DESC','RARITY_ASC','WEIGHT_DESC','WEIGHT_ASC','CONFIG_ORDER'].map(s =>
              `<option value="${s}" ${p.sortOrder===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Border Material</label>
          <input class="field-input" id="pvBorder" value="${p.borderMaterial || ''}" placeholder="auto"/>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px;margin-top:10px" id="pvToggles"></div>
      <div class="field-group" style="margin-top:8px">
        <label class="field-label">Chance Format</label>
        <input class="field-input" id="pvChanceFmt" value="${p.chanceFormat || '&7Chance: &e{chance}'}" placeholder="&7Chance: &e{chance}"/>
      </div>
    `;

    const togs = [
      ['Show Chance %',   'showChance',    p.showChance !== false],
      ['Show Weight',     'showWeight',    !!p.showWeight],
      ['Show Pity',       'showPity',      p.showPity !== false],
      ['Show Key Balance','showKeyBalance',p.showKeyBalance !== false],
      ['Show Actual Item','showActualItem',p.showActualItem !== false],
    ];
    const togContainer = Utils.qs('#pvToggles');
    togs.forEach(([label, key, val]) => {
      togContainer.appendChild(ToggleSwitch(label, val, v => { p[key] = v; this.dirty = true; }));
    });

    ['pvTitle','pvSort','pvBorder','pvChanceFmt'].forEach(id => {
      Utils.qs('#'+id)?.addEventListener('change', () => {
        p.title          = Utils.qs('#pvTitle').value || null;
        p.sortOrder      = Utils.qs('#pvSort').value;
        p.borderMaterial = Utils.qs('#pvBorder').value || null;
        p.chanceFormat   = Utils.qs('#pvChanceFmt').value;
        this.dirty = true;
      });
    });
  },

  /* ── Reward CRUD ── */
  addReward(reward) {
    const crate = State.currentCrate; if (!crate) return;
    if (!crate.rewards) crate.rewards = [];
    crate.rewards.push(reward);
    this.dirty = true;
    this.renderRewards();
    this.renderSliders();
  },

  updateReward(id, updated) {
    const crate = State.currentCrate; if (!crate) return;
    const idx   = crate.rewards.findIndex(r => r.id === id);
    if (idx !== -1) crate.rewards[idx] = updated;
    this.dirty = true;
    this.renderRewards();
    this.renderSliders();
  },

  removeReward(id) {
    const crate = State.currentCrate; if (!crate) return;
    crate.rewards = crate.rewards.filter(r => r.id !== id);
    this.dirty = true;
    this.renderRewards();
    this.renderSliders();
    toast('Reward removed', 'info');
  },

  /* ── Save / Discard ── */
  async save() {
    const crate = State.currentCrate; if (!crate) return;
    const btn   = Utils.qs('#btnSaveCrate');
    btn.disabled = true;
    btn.innerHTML = '<svg class="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 00-9-9"/></svg> Saving...';
    try {
      await API.saveCrate(crate.id, crate);
      State.setCrate(crate);
      this.dirty = false;
      toast('Crate saved & synced to server ✓', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Crate';
    }
  },

  discard() {
    if (!this.dirty || confirm('Discard all unsaved changes?')) {
      this.dirty = false;
      this.loadCrate(State.currentCrateId);
      toast('Changes discarded', 'info');
    }
  },

  async deleteCrate(id) {
    if (!confirm(`Hapus crate "${id}" permanen? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await API.deleteCrate(id);
      State.deleteCrate(id);
      toast(`Crate "${id}" berhasil dihapus.`, 'success');
      if (State.crateOrder.length > 0) {
        this.loadCrate(State.crateOrder[0]);
      } else {
        State.currentCrateId = null;
        this.renderCrateTabs();
        Utils.qs('#architectLeft').innerHTML  = '<div class="empty-state"><p>No crates yet. Create one!</p></div>';
        Utils.qs('#architectRight').innerHTML = '';
      }
      this.renderCrateTabs();
    } catch (e) {
      toast(e.message, 'error');
    }
  },

  newCrate() {
    const id    = 'new_crate_' + Date.now();
    const lowestId = State.rarities[0]?.id || 'COMMON';
    const highestId = State.rarities[State.rarities.length - 1]?.id || 'MYTHIC';
    const midId = State.rarities[Math.floor(State.rarities.length / 2)]?.id || 'RARE';
    const crate = {
      id, displayName: '&fNew Crate', enabled: true,
      cooldownMs: 0, massOpenEnabled: true, massOpenLimit: 64,
      requiredKeys: [{ keyId: 'example_key', amount: 1, type: 'VIRTUAL' }],
      rewards: [],
      pity: { enabled: false, threshold: 100, softPityStart: 80, rareRarityMinimum: midId, bonusChancePerOpen: 2 },
      preview: { sortOrder: 'RARITY_DESC', showChance: true, showPity: true, showKeyBalance: true, showActualItem: true },
    };
    State.setCrate(crate);
    State.currentCrateId = id;
    this.dirty = true;
    this.renderCrateTabs();
    this.loadCrate(id);
    toast('New crate created — fill in the details and save!', 'info');
  },

  /* ── Sort helper ── */
  _sortedRewards(rewards) {
    if (!rewards) return [];
    const order = Utils.qs('#sortOrder')?.value || State.currentCrate?.preview?.sortOrder || 'RARITY_DESC';
    const arr = [...rewards];
    switch (order) {
      case 'RARITY_DESC':  return arr.sort((a,b) => Utils.rarityOrder(b.rarity) - Utils.rarityOrder(a.rarity) || b.weight - a.weight);
      case 'RARITY_ASC':   return arr.sort((a,b) => Utils.rarityOrder(a.rarity) - Utils.rarityOrder(b.rarity) || a.weight - b.weight);
      case 'WEIGHT_DESC':  return arr.sort((a,b) => b.weight - a.weight);
      case 'WEIGHT_ASC':   return arr.sort((a,b) => a.weight - b.weight);
      default:             return arr;
    }
  },

  _highestRarity(rewards) {
    if (!rewards?.length) return State.rarities[0]?.id || 'COMMON';
    return rewards.reduce((h, r) =>
      Utils.rarityOrder(r.rarity) > Utils.rarityOrder(h) ? r.rarity : h,
      State.rarities[0]?.id || 'COMMON'
    );
  },
};

/* ══ RARITY EDITOR MODAL ══
   Dibuka dari tombol "Rarities" di header Architect.
   Fitur: edit hex color, display name, icon, order, add/remove custom rarity.
   Save → POST /api/rarities → server reload rarities.yml → WS broadcast.
*/
const RarityEditor = {
  // Working copy — jangan mutasi State.rarities langsung
  draft: [],

  open() {
    // Deep clone dari State.rarities sebagai draft
    this.draft = State.rarities.map(r => ({ ...r }));
    this._render();
  },

  _render() {
    const rows = this.draft.map((r, i) => this._rowHtml(r, i)).join('');

    Modal.open(`
      <div class="modal-head">
        <div class="modal-head-left">
          <div class="modal-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Rarity Editor
          </div>
          <div class="modal-subtitle">Add, remove, or recolor rarity tiers. Changes saved to rarities.yml instantly.</div>
        </div>
        <button class="modal-close" onclick="Modal.close()">✕</button>
      </div>

      <div class="modal-body" style="padding-bottom:8px">
        <!-- Header row -->
        <div style="display:grid;grid-template-columns:28px 1fr 110px 80px 60px 36px;gap:6px;align-items:center;
          padding:0 4px 6px;border-bottom:1px solid var(--border);margin-bottom:8px;
          font-size:9.5px;font-weight:700;color:var(--text3);letter-spacing:.7px;text-transform:uppercase">
          <span></span>
          <span>Display Name</span>
          <span>Hex Color</span>
          <span>Order</span>
          <span>Icon</span>
          <span></span>
        </div>

        <!-- Rarity rows -->
        <div id="rarityRows" style="display:flex;flex-direction:column;gap:6px">
          ${rows}
        </div>

        <button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%;justify-content:center"
          onclick="RarityEditor.addRow()">
          + Add Custom Rarity
        </button>

        <div style="margin-top:12px;padding:10px 12px;background:var(--bg3);border:1px solid var(--border);
          border-radius:var(--radius-sm);font-size:11px;color:var(--text3);line-height:1.7">
          <strong style="color:var(--text2)">Tips:</strong> ID dibuat otomatis dari Display Name (uppercase, spasi → _).
          Order menentukan urutan tier — angka lebih tinggi = lebih langka.
          Perubahan langsung sync ke server dan semua client yang konek.
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-ghost btn-sm" onclick="RarityEditor.reload()">↻ Reload from File</button>
        <button class="btn btn-primary" onclick="RarityEditor.save()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
          Save Rarities
        </button>
      </div>
    `, 'modal-lg');

    this._bindRows();
  },

  _rowHtml(r, i) {
    const isBuiltin = i < 6; // 6 rarity default — bisa dihapus tapi kasih warning visual
    return `
      <div class="rarity-editor-row" data-idx="${i}"
        style="display:grid;grid-template-columns:28px 1fr 110px 80px 60px 36px;gap:6px;align-items:center;
          padding:6px 4px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg3)">

        <!-- Color swatch -->
        <div style="width:24px;height:24px;border-radius:6px;background:${r.hexColor};
          border:2px solid ${r.hexColor}40;flex-shrink:0;cursor:pointer"
          onclick="document.getElementById('rClrPick${i}').click()"
          title="Click to change color">
          <input type="color" id="rClrPick${i}" value="${r.hexColor}"
            style="opacity:0;width:0;height:0;position:absolute"
            oninput="RarityEditor.update(${i},'hexColor',this.value);
                     this.parentNode.style.background=this.value;
                     this.parentNode.style.borderColor=this.value+'40'"/>
        </div>

        <!-- Display Name -->
        <input class="field-input" style="padding:5px 8px;font-size:12px"
          value="${r.displayName}"
          placeholder="e.g. Legendary"
          oninput="RarityEditor.update(${i},'displayName',this.value)"/>

        <!-- Hex color text -->
        <input class="field-input" style="padding:5px 8px;font-size:11px;font-family:monospace"
          value="${r.hexColor}"
          placeholder="#aaaaaa"
          oninput="RarityEditor.update(${i},'hexColor',this.value);
                   const sw=this.closest('.rarity-editor-row').querySelector('div[style*=background]');
                   if(sw&&/^#[0-9a-f]{6}$/i.test(this.value)){sw.style.background=this.value;sw.style.borderColor=this.value+'40'}"/>

        <!-- Order -->
        <input class="field-input" type="number" style="padding:5px 8px;font-size:12px"
          value="${r.order}" min="0" max="99"
          oninput="RarityEditor.update(${i},'order',parseInt(this.value)||0)"/>

        <!-- Icon/Emoji -->
        <input class="field-input" style="padding:5px 8px;font-size:16px;text-align:center"
          value="${r.icon || '⬜'}"
          maxlength="4"
          oninput="RarityEditor.update(${i},'icon',this.value)"/>

        <!-- Remove -->
        <button class="btn btn-danger btn-xs" style="padding:5px 7px"
          onclick="RarityEditor.removeRow(${i})" title="Remove rarity">✕</button>
      </div>
    `;
  },

  _bindRows() {
    // Semua sudah pakai inline oninput — tidak perlu bind tambahan
  },

  update(idx, field, value) {
    if (!this.draft[idx]) return;
    this.draft[idx][field] = value;
    // Auto-generate ID dari displayName
    if (field === 'displayName') {
      this.draft[idx].id = value.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '') || 'CUSTOM';
    }
  },

  addRow() {
    const nextOrder = this.draft.length > 0
      ? Math.max(...this.draft.map(r => r.order)) + 1
      : 0;
    this.draft.push({
      id:             'CUSTOM_' + nextOrder,
      displayName:    'Custom',
      color:          '&f',
      hexColor:       '#ffffff',
      order:          nextOrder,
      borderMaterial: 'WHITE_STAINED_GLASS_PANE',
      icon:           '✨',
    });
    this._render();
  },

  removeRow(idx) {
    if (this.draft.length <= 1) {
      toast('Must have at least one rarity!', 'error');
      return;
    }
    this.draft.splice(idx, 1);
    this._render();
  },

  async save() {
    // Validasi: setiap rarity harus punya displayName
    for (const r of this.draft) {
      if (!r.displayName?.trim()) {
        toast('All rarities must have a Display Name', 'error');
        return;
      }
      // Pastikan ID ter-generate
      if (!r.id?.trim()) {
        r.id = r.displayName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
      }
    }

    try {
      await API.post('/rarities', { rarities: this.draft });
      toast('Rarities saved & applied to server ✓', 'success');
      // State.rarities akan di-update via WS RARITIES_UPDATE event
      // Tapi update juga langsung buat responsiveness
      State.setRarities(this.draft);
      Modal.close();
      // Re-render architect biar rarity picker ikut update
      const el = document.getElementById('page-architect');
      if (el) Architect.render(el);
    } catch (e) {
      toast(e.message, 'error');
    }
  },

  async reload() {
    try {
      await API.post('/rarities/reload');
      toast('Rarities reloaded from rarities.yml', 'info');
      const data = await API.get('/rarities');
      State.setRarities(data.data || []);
      Modal.close();
      const el = document.getElementById('page-architect');
      if (el) Architect.render(el);
    } catch (e) {
      toast(e.message, 'error');
    }
  },
};