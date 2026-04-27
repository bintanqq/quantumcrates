/* ══ PAGE: MESSAGES ══ */
const Messages = {
  chatData: {},
  guiData:  {},
  activeTab: 'chat',
  dirty: false,

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Messages</div>
          <div class="page-sub">All plugin messages — zero hardcoded. Supports &amp; color codes.</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm" onclick="Messages.reset()">↩ Reset</button>
          <button class="btn btn-primary btn-sm" id="btnSaveMessages">💾 Save Messages</button>
        </div>
      </div>

      <!-- Tab switcher -->
      <div style="display:flex;align-items:center;gap:0;margin-bottom:16px">
        <div class="seg-ctrl" id="msgTabCtrl">
          <div class="seg-opt active" data-tab="chat" onclick="Messages.switchTab('chat')">
            💬 Chat Messages
          </div>
          <div class="seg-opt" data-tab="gui" onclick="Messages.switchTab('gui')">
            📦 GUI Messages
          </div>
        </div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
          <input class="field-input" id="msgSearch" placeholder="Search key..."
            style="width:180px;padding:6px 10px;font-size:11.5px"
            oninput="Messages.filterGrid(this.value)"/>
        </div>
      </div>

      <!-- Description banner per tab -->
      <div id="chatTabDesc" style="margin-bottom:12px;padding:10px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:11.5px;color:var(--text2);line-height:1.7">
        <strong style="color:var(--text)">Chat Messages</strong> — shown in player chat with prefix.<br/>
        Placeholders: <code style="color:var(--cyan)">{player}</code> <code style="color:var(--cyan)">{crate}</code>
        <code style="color:var(--cyan)">{reward}</code> <code style="color:var(--cyan)">{key}</code>
        <code style="color:var(--cyan)">{amount}</code> <code style="color:var(--cyan)">{time}</code>
        <code style="color:var(--cyan)">{count}</code> <code style="color:var(--cyan)">{schedule}</code>
      </div>
      <div id="guiTabDesc" style="display:none;margin-bottom:12px;padding:10px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:11.5px;color:var(--text2);line-height:1.7">
        <strong style="color:var(--text)">GUI Messages</strong> — inventory item names, lore lines, and button labels.<br/>
        Placeholders: <code style="color:var(--cyan)">{crate}</code> <code style="color:var(--cyan)">{page}</code>
        <code style="color:var(--cyan)">{pages}</code> <code style="color:var(--cyan)">{chance}</code>
        <code style="color:var(--cyan)">{rarity}</code> <code style="color:var(--cyan)">{weight}</code>
        <code style="color:var(--cyan)">{pity}</code> <code style="color:var(--cyan)">{pity_max}</code>
        <code style="color:var(--cyan)">{key}</code> <code style="color:var(--cyan)">{balance}</code>
        <code style="color:var(--cyan)">{needed}</code>
      </div>

      <!-- Grid -->
      <div class="msg-grid" id="msgGrid">
        <div class="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>Loading messages...</p>
        </div>
      </div>
    `;

    Utils.on(Utils.qs('#btnSaveMessages'), 'click', () => this.save());
    this.load();
  },

  async load() {
    try {
      // Load both sections — API returns { chat: {...}, gui: {...} }
      // Server endpoint /api/config/messages now returns both
      const res = await API.getMessages();
      if (res.chat && res.gui) {
        this.chatData = res.chat;
        this.guiData  = res.gui;
      } else {
        // Fallback: server returns flat object (old format) → treat as chat only
        this.chatData = res;
        this.guiData  = {};
      }
      this.renderGrid();
    } catch (e) {
      // Demo fallback
      this.chatData = DEMO_MESSAGES;
      this.guiData  = DEMO_GUI_MESSAGES;
      this.renderGrid();
    }
  },

  switchTab(tab) {
    this.activeTab = tab;
    Utils.qsa('#msgTabCtrl .seg-opt').forEach(o =>
      o.classList.toggle('active', o.dataset.tab === tab));
    Utils.qs('#chatTabDesc').style.display = tab === 'chat' ? '' : 'none';
    Utils.qs('#guiTabDesc').style.display  = tab === 'gui'  ? '' : 'none';
    this.renderGrid();
  },

  filterGrid(query) {
    const q = query.toLowerCase();
    Utils.qsa('#msgGrid .msg-item').forEach(item => {
      const key = item.querySelector('.msg-key')?.textContent || '';
      item.style.display = key.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  renderGrid(filter = '') {
    const grid = Utils.qs('#msgGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const data = this.activeTab === 'chat' ? this.chatData : this.guiData;
    const entries = Object.entries(data);

    if (!entries.length) {
      grid.innerHTML = '<div class="empty-state"><p>No messages found in this section.</p></div>';
      return;
    }

    // Group entries by prefix (e.g. "help-", "info-", "preview-", etc.)
    const groups = this._groupEntries(entries);

    groups.forEach(([groupName, groupEntries]) => {
      // Group header
      if (groupName) {
        const header = Utils.el('div', '',
          `<div style="grid-column:1/-1;padding:8px 0 4px;font-size:9.5px;font-weight:700;
            color:var(--text3);letter-spacing:1px;text-transform:uppercase;
            border-bottom:1px solid var(--border);margin-bottom:4px">
            ${groupName}
          </div>`
        );
        grid.appendChild(header);
      }

      groupEntries.forEach(([key, val]) => {
        const item = Utils.el('div', 'msg-item');
        const isMultiline = val.length > 60 || val.includes('\\n');
        const rows = isMultiline ? 2 : 1;

        item.innerHTML = `
          <div class="msg-key">${key}</div>
          <textarea class="msg-input" data-key="${key}" rows="${rows}"
            style="resize:vertical">${val}</textarea>
          <div class="msg-preview">${Utils.mc(val) || '<span style="opacity:.3">empty</span>'}</div>
        `;

        const ta = item.querySelector('textarea');
        ta.oninput = () => {
          // Auto-resize
          ta.style.height = 'auto';
          ta.style.height = ta.scrollHeight + 'px';
          // Update data
          if (this.activeTab === 'chat') this.chatData[key] = ta.value;
          else                           this.guiData[key]  = ta.value;
          // Update preview
          item.querySelector('.msg-preview').innerHTML =
            Utils.mc(ta.value) || '<span style="opacity:.3">empty</span>';
          this.dirty = true;
        };

        // Initial height fit
        setTimeout(() => {
          ta.style.height = 'auto';
          ta.style.height = ta.scrollHeight + 'px';
        }, 0);

        grid.appendChild(item);
      });
    });
  },

  /**
   * Group entries by their key prefix (before the first "-").
   * Returns array of [groupLabel, entries[]] sorted alphabetically by group.
   */
  _groupEntries(entries) {
    const groupMap = new Map();
    entries.forEach(([key, val]) => {
      const parts = key.split('-');
      // Use first part as group, but merge small groups into "General"
      let group = parts[0];
      // Specific group labels
      const groupLabels = {
        prefix:    'General',
        no:        'General',
        player:    'General',
        invalid:   'General',
        reload:    'General',
        crate:     'Crate',
        cooldown:  'Crate',
        already:   'Crate',
        reward:    'Rewards',
        broadcast: 'Rewards',
        inventory: 'Rewards',
        key:       'Keys',
        mass:      'Keys',
        pity:      'Pity',
        setloc:    'Admin',
        info:      'Info Command',
        usage:     'Usage Hints',
        keys:      'Keys',
        list:      'List Command',
        help:      'Help Command',
        preview:   'Preview GUI',
        prev:      'Preview GUI',
        next:      'Preview GUI',
        close:     'Preview GUI',
        'reward-lore': 'Reward Lore',
        'reward-weight': 'Reward Lore',
        'reward-rarity': 'Reward Lore',
        'reward-amount': 'Reward Lore',
        'reward-command': 'Reward Lore',
        'reward-broadcast': 'Reward Lore',
      };
      const label = groupLabels[group] || group.charAt(0).toUpperCase() + group.slice(1);
      if (!groupMap.has(label)) groupMap.set(label, []);
      groupMap.get(label).push([key, val]);
    });
    return [...groupMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  },

  async save() {
    const btn = Utils.qs('#btnSaveMessages');
    btn.disabled = true;
    btn.textContent = '⟳ Saving...';
    try {
      // Send both sections — server endpoint needs to handle { chat, gui } body
      await API.saveMessages({ chat: this.chatData, gui: this.guiData });
      this.dirty = false;
      toast('Messages saved & applied to server ✓', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '💾 Save Messages';
    }
  },

  reset() {
    if (confirm('Reload messages from server? Unsaved changes will be lost.')) this.load();
  },
};

/* ── Demo GUI messages (shown in demo mode / fallback) ── */
const DEMO_GUI_MESSAGES = {
  'preview-title-default':  '&0&lPreview &8» &b{crate}',
  'preview-title-paged':    '&0&lPreview &8» &b{crate} &8[&7{page}&8/&7{pages}&8]',
  'prev-button-name':       '&e&l◄ Previous',
  'prev-button-lore-1':     '&7Page &e{page} &8/ &7{pages}',
  'next-button-name':       '&e&lNext ►',
  'next-button-lore-1':     '&7Page &e{page} &8/ &7{pages}',
  'close-button-name':      '&c&lClose',
  'close-button-lore-1':    '&7Click to close the preview.',
  'reward-lore-divider':    '&8──────────────────',
  'reward-weight-line':     '&7Weight: &f{weight}',
  'reward-rarity-line':     '&7Rarity: {rarity}',
  'reward-amount-line':     '&7Amount: &fx{amount}',
  'reward-command-tag':     '&7+ &aCommand reward',
  'reward-broadcast-tag':   '&6✦ &7Server broadcast',
  'info-item-name':         '&b&lCrate Info',
  'info-divider':           '&8──────────────────',
  'info-crate-label':       '&7Crate: &f{crate}',
  'info-total-rewards':     '&7Total Rewards: &f{count}',
  'info-page-label':        '&7Page: &e{page} &8/ &7{pages}',
  'info-keys-header':       '',
  'info-keys-title':        '&7Your Keys:',
  'info-key-entry-ok':      '  &8▸ &f{key} &8[{type}]: &a{balance}&8/&7{needed}',
  'info-key-entry-missing': '  &8▸ &f{key} &8[{type}]: &c{balance}&8/&7{needed}',
  'info-pity-header':       '',
  'info-pity-label':        '&7Pity: &e{pity}&8/&e{pity_max}',
  'info-pity-status-hard':  '&c&lGUARANTEED RARE!',
  'info-pity-status-soft':  '&e+Bonus Chance',
  'info-pity-status-normal':'&7Normal',
  'info-controls-divider':  '&8──────────────────',
  'info-controls-left':     '&7&oLeft Click  &8— &7&oPreview rewards',
  'info-controls-right':    '&7&oRight Click &8— &7&oOpen crate',
  'info-controls-shift':    '&7&oShift+Right &8— &7&oMass open',
};