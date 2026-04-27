/* ══ MODAL: ADD / EDIT REWARD ══ */
const RewardModal = {
  selectedRarity: null,  // null = akan di-set ke lowest rarity saat open
  iconUrl: '',
  callback: null,
  editing: null,

  open(reward, onSave) {
    this.callback = onSave;
    this.editing  = reward;
    this.selectedRarity = reward?.rarity || State.rarities[0]?.id || 'COMMON';
    this.iconUrl  = reward?.iconUrl || '';

    const rarityPickerHtml = State.rarities.map(r => {
      const color = r.hexColor;
      const isActive = this.selectedRarity === r.id;
      return `<div class="rarity-opt${isActive ? ' active' : ''}"
        data-r="${r.id}"
        style="border-color:${color};color:${color};${isActive ? `background:${color}18` : ''}"
        onclick="RewardModal.pickRarity(this,'${r.id}')">
        ${r.icon} ${r.displayName}
      </div>`;
    }).join('');

    Modal.open(`
      <div class="modal-head">
        <div class="modal-head-left">
          <div class="modal-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${reward ? 'Edit Reward' : 'Add Reward'}
          </div>
          <div class="modal-subtitle">Configure reward properties and icon.</div>
        </div>
        <button class="modal-close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal-body">
        <!-- Row 1: ID + Name -->
        <div class="field-row" style="margin-bottom:12px">
          <div class="field-group">
            <label class="field-label">Reward ID *</label>
            <input class="field-input" id="rwId" value="${reward?.id||''}" placeholder="dragon_sword" autofocus/>
          </div>
          <div class="field-group">
            <label class="field-label">Display Name *</label>
            <input class="field-input" id="rwName" value="${reward?.displayName||''}" placeholder="&6Dragon Sword"/>
          </div>
        </div>

        <!-- Icon upload + material -->
        <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start">
          <div style="flex-shrink:0">
            <label class="field-label" style="margin-bottom:5px">Reward Icon</label>
            <div class="icon-drop" id="iconDrop" onclick="document.getElementById('iconFile').click()" title="Click or drag to upload">
              ${this.iconUrl ? `<img class="icon-drop-preview" src="${this.iconUrl}" id="iconPreview"/>` : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`}
              <div class="icon-drop-overlay" id="iconOverlay">${this.iconUrl ? '🔄 Change' : '📁 Upload PNG/GIF'}</div>
            </div>
            <input type="file" id="iconFile" accept="image/*,.gif" style="display:none" onchange="RewardModal.handleIcon(event)"/>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:8px">
            <div class="field-group">
              <label class="field-label">Type</label>
              <select class="field-input" id="rwType" onchange="RewardModal.toggleTypeFields()">
                ${['VANILLA','COMMAND','VANILLA_WITH_COMMANDS','MMOITEMS','ITEMSADDER','ORAXEN'].map(t =>
                  `<option value="${t}" ${reward?.type===t?'selected':''}>${t.replace(/_/g,' ')}</option>`).join('')}
              </select>
            </div>

            <!-- VANILLA fields -->
            <div id="rwVanillaGroup" style="display:flex;flex-direction:column;gap:8px">
              <div class="field-group">
                <label class="field-label">Material (Bukkit)</label>
                <input class="field-input" id="rwMat" value="${reward?.material||'STONE'}" placeholder="DIAMOND_SWORD"/>
              </div>
              <div class="field-group">
                <label class="field-label">Amount</label>
                <input class="field-input" type="number" id="rwAmt" value="${reward?.amount||1}" min="1" max="64"/>
              </div>
            </div>

            <!-- MMOITEMS fields -->
            <div id="rwMmoGroup" style="display:none;flex-direction:column;gap:8px">
              <div class="field-group">
                <label class="field-label">MMOItems Type</label>
                <input class="field-input" id="rwMmoType" value="${reward?.mmoItemsType||''}" placeholder="SWORD"/>
              </div>
              <div class="field-group">
                <label class="field-label">MMOItems ID</label>
                <input class="field-input" id="rwMmoId" value="${reward?.mmoItemsId||''}" placeholder="my_sword"/>
              </div>
              <div class="field-group">
                <label class="field-label">Amount</label>
                <input class="field-input" type="number" id="rwMmoAmt" value="${reward?.amount||1}" min="1" max="64"/>
              </div>
            </div>

            <!-- ITEMSADDER fields -->
            <div id="rwIaGroup" style="display:none;flex-direction:column;gap:8px">
              <div class="field-group">
                <label class="field-label">ItemsAdder Namespace ID</label>
                <input class="field-input" id="rwIaId" value="${reward?.itemsAdderId||''}" placeholder="mypack:ruby_sword"/>
              </div>
              <div class="field-group">
                <label class="field-label">Amount</label>
                <input class="field-input" type="number" id="rwIaAmt" value="${reward?.amount||1}" min="1" max="64"/>
              </div>
            </div>

            <!-- ORAXEN fields -->
            <div id="rwOraxenGroup" style="display:none;flex-direction:column;gap:8px">
              <div class="field-group">
                <label class="field-label">Oraxen ID</label>
                <input class="field-input" id="rwOraxenId" value="${reward?.oraxenId||''}" placeholder="my_item"/>
              </div>
              <div class="field-group">
                <label class="field-label">Amount</label>
                <input class="field-input" type="number" id="rwOraxenAmt" value="${reward?.amount||1}" min="1" max="64"/>
              </div>
            </div>
          </div>
        </div>

        <!-- Rarity — dynamic dari State.rarities -->
        <div class="field-group" style="margin-bottom:12px">
          <label class="field-label">Rarity</label>
          <div class="rarity-picker" id="rarityPicker">
            ${rarityPickerHtml}
          </div>
        </div>

        <!-- Weight + Broadcast row -->
        <div class="field-row" style="margin-bottom:12px">
          <div class="field-group">
            <label class="field-label">Weight (higher = more common)</label>
            <input class="field-input" type="number" id="rwWeight" value="${reward?.weight||10}" min="0.01" step="0.5"/>
          </div>
          <div class="field-group">
            <label class="field-label">Broadcast on Win?</label>
            <select class="field-input" id="rwBroadcast">
              <option value="false" ${!reward?.broadcast?'selected':''}>No</option>
              <option value="true"  ${reward?.broadcast?'selected':''}>Yes</option>
            </select>
          </div>
        </div>

        <!-- Broadcast message -->
        <div class="field-group" id="broadcastMsgGroup" style="${reward?.broadcast?'':'display:none'}margin-bottom:12px">
          <label class="field-label">Broadcast Message</label>
          <input class="field-input" id="rwBroadcastMsg" value="${reward?.broadcastMessage||'&e{player} &7won &6{reward}&7!'}" placeholder="&e{player} &7won &6{reward}!"/>
        </div>

        <!-- Custom Model Data -->
        <div class="field-group" style="margin-bottom:12px">
          <label class="field-label">Custom Model Data <span style="color:var(--text3)">(-1 = disabled)</span></label>
          <input class="field-input" type="number" id="rwCmd" value="${reward?.customModelData ?? -1}"/>
        </div>

        <!-- Commands -->
        <div class="field-group" id="rwCmdsGroup" style="margin-bottom:0">
          <label class="field-label">Commands <span style="color:var(--text3)">(one per line · prefix: console: or player:)</span></label>
          <textarea class="field-input" id="rwCmds" rows="3" placeholder="console: eco give {player} 10000&#10;player: say I got a reward!">${(reward?.commands||[]).join('\n')}</textarea>
        </div>

        <!-- Lore -->
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">Lore <span style="color:var(--text3)">(one line per row, supports &amp; codes)</span></label>
          <textarea class="field-input" id="rwLore" rows="2" placeholder="&7A powerful weapon of legend.">${(reward?.lore||[]).join('\n')}</textarea>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="RewardModal.save()">
          ${reward ? '✓ Update Reward' : '+ Add Reward'}
        </button>
      </div>
    `, 'modal-lg');

    Utils.qs('#rwBroadcast').onchange = e => {
      Utils.qs('#broadcastMsgGroup').style.display = e.target.value==='true' ? '' : 'none';
    };

    this.toggleTypeFields();
    this._bindDrop();
  },

  toggleTypeFields() {
    const type = Utils.qs('#rwType')?.value || 'VANILLA';
    Utils.qs('#rwVanillaGroup').style.display = 'none';
    Utils.qs('#rwMmoGroup').style.display     = 'none';
    Utils.qs('#rwIaGroup').style.display      = 'none';
    Utils.qs('#rwOraxenGroup').style.display  = 'none';
    switch(type) {
      case 'VANILLA':
      case 'VANILLA_WITH_COMMANDS':
        Utils.qs('#rwVanillaGroup').style.display = 'flex'; break;
      case 'COMMAND': break;
      case 'MMOITEMS':   Utils.qs('#rwMmoGroup').style.display    = 'flex'; break;
      case 'ITEMSADDER': Utils.qs('#rwIaGroup').style.display     = 'flex'; break;
      case 'ORAXEN':     Utils.qs('#rwOraxenGroup').style.display = 'flex'; break;
    }
  },

  pickRarity(el, rarity) {
    this.selectedRarity = rarity;
    Utils.qsa('.rarity-opt').forEach(o => {
      const isActive = o.dataset.r === rarity;
      o.classList.toggle('active', isActive);
      const def = State.rarities.find(r => r.id === o.dataset.r);
      if (def) o.style.background = isActive ? `${def.hexColor}18` : '';
    });
  },

  handleIcon(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      this.iconUrl = ev.target.result;
      const drop = Utils.qs('#iconDrop');
      if (drop) {
        drop.innerHTML = `<img class="icon-drop-preview" src="${this.iconUrl}"/><div class="icon-drop-overlay">🔄 Change</div>`;
        this._bindDrop();
      }
    };
    reader.readAsDataURL(file);
  },

  _bindDrop() {
    const drop = Utils.qs('#iconDrop'); if (!drop) return;
    drop.ondragover = e => { e.preventDefault(); drop.classList.add('drag'); };
    drop.ondragleave= () => drop.classList.remove('drag');
    drop.ondrop     = e => { e.preventDefault(); drop.classList.remove('drag'); this.handleIcon({ target: { files: e.dataTransfer.files } }); };
  },

  save() {
    const id   = Utils.qs('#rwId')?.value?.trim();
    const name = Utils.qs('#rwName')?.value?.trim();
    if (!id || !name) { toast('ID and Display Name are required', 'error'); return; }

    const type = Utils.qs('#rwType')?.value || 'VANILLA';
    let material = null, amount = 1, mmoItemsType = null, mmoItemsId = null;
    let itemsAdderId = null, oraxenId = null;

    switch(type) {
      case 'VANILLA':
      case 'VANILLA_WITH_COMMANDS':
        material = Utils.qs('#rwMat')?.value?.trim() || 'STONE';
        amount   = parseInt(Utils.qs('#rwAmt')?.value) || 1;
        break;
      case 'MMOITEMS':
        mmoItemsType = Utils.qs('#rwMmoType')?.value?.trim() || null;
        mmoItemsId   = Utils.qs('#rwMmoId')?.value?.trim() || null;
        amount       = parseInt(Utils.qs('#rwMmoAmt')?.value) || 1;
        break;
      case 'ITEMSADDER':
        itemsAdderId = Utils.qs('#rwIaId')?.value?.trim() || null;
        amount       = parseInt(Utils.qs('#rwIaAmt')?.value) || 1;
        break;
      case 'ORAXEN':
        oraxenId = Utils.qs('#rwOraxenId')?.value?.trim() || null;
        amount   = parseInt(Utils.qs('#rwOraxenAmt')?.value) || 1;
        break;
    }

    const reward = {
      id, displayName: name,
      rarity:           this.selectedRarity,
      type, material, amount, mmoItemsType, mmoItemsId, itemsAdderId, oraxenId,
      weight:           parseFloat(Utils.qs('#rwWeight')?.value) || 10,
      broadcast:        Utils.qs('#rwBroadcast')?.value === 'true',
      broadcastMessage: Utils.qs('#rwBroadcastMsg')?.value || '',
      customModelData:  parseInt(Utils.qs('#rwCmd')?.value) || -1,
      commands:         (Utils.qs('#rwCmds')?.value || '').split('\n').map(s=>s.trim()).filter(Boolean),
      lore:             (Utils.qs('#rwLore')?.value || '').split('\n').map(s=>s.trim()).filter(Boolean),
      iconUrl:          this.iconUrl,
    };

    this.callback?.(reward);
    Modal.close();
    toast(`Reward "${Utils.strip(name)}" ${this.editing ? 'updated' : 'added'} ✓`, 'success');
  },
};