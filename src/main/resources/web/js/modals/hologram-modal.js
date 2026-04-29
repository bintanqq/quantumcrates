/* ══ MODAL: HOLOGRAM EDITOR ══ */
const HologramModal = {

  open() {
    const crate = State.currentCrate;
    if (!crate) { toast('No crate selected', 'error'); return; }
    if (!crate.hologramLines) crate.hologramLines = [];

    Modal.open(`
      <div class="modal-head">
        <div class="modal-head-left">
          <div class="modal-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Edit Hologram
            <span style="color:var(--cyan);margin-left:4px">${Utils.strip(crate.displayName || crate.id)}</span>
          </div>
          <div class="modal-subtitle">
            Supports & color codes. Drag to reorder. Changes saved when klik Save.
          </div>
        </div>
        <button class="modal-close" onclick="Modal.close()">✕</button>
      </div>

      <div class="modal-body">
        <!-- Preview hologram -->
        <div style="background:rgba(0,0,0,.4);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;text-align:center;min-height:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px" id="holoPreview">
          <div style="font-size:10px;color:var(--text3);margin-bottom:4px">HOLOGRAM PREVIEW</div>
        </div>

        <!-- Lines editor -->
        <div style="display:flex;flex-direction:column;gap:6px" id="holoLines"></div>

        <!-- Add button -->
        <button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%;justify-content:center"
          onclick="HologramModal.addLine()">
          + Add Line
        </button>

        <!-- Tips -->
        <div style="margin-top:12px;padding:10px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:11px;color:var(--text3);line-height:1.7">
          <div style="color:var(--text2);font-weight:600;margin-bottom:4px">Color Codes:</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${[
              ['&0','#000','■'],['&1','#0000aa','■'],['&2','#00aa00','■'],['&3','#00aaaa','■'],
              ['&4','#aa0000','■'],['&5','#aa00aa','■'],['&6','#ffaa00','■'],['&7','#aaaaaa','■'],
              ['&8','#555','■'],['&9','#5555ff','■'],['&a','#55ff55','■'],['&b','#55ffff','■'],
              ['&c','#ff5555','■'],['&d','#ff55ff','■'],['&e','#ffff55','■'],['&f','#fff','■'],
              ['&l','#fff','<b>B</b>'],['&o','#fff','<i>I</i>'],['&n','#fff','<u>U</u>'],['&m','#fff','<s>S</s>'],
            ].map(([code, color, sym]) =>
              `<span style="cursor:pointer;padding:2px 5px;background:var(--bg2);border:1px solid var(--border);border-radius:3px;font-family:monospace;font-size:10px"
                onclick="HologramModal.insertCode('${code}')" title="${code}">
                <span style="color:${color}">${sym}</span> ${code}
              </span>`
            ).join('')}
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg3); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border); margin-bottom:15px">
            <div style="display:flex; flex-direction:column; gap:2px">
              <span style="font-size:12px; font-weight:600; color:var(--text2)">Hologram Height Offset</span>
              <span style="font-size:10px; color:var(--text3)">Default: 1.2</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px">
              <input type="number"
                class="field-input"
                style="width:80px; text-align:center; font-family:monospace"
                step="0.1"
                value="${crate.hologramHeight || 1.2}"
                oninput="HologramModal.updateHeight(this.value)"
              />
              <span style="font-size:11px; color:var(--cyan)">blocks</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="HologramModal.save()">
          ✓ Save Hologram
        </button>
      </div>
    `, 'modal-lg');

    this.renderLines();
    this.updatePreview();
  },

  renderLines() {
    const container = Utils.qs('#holoLines');
    if (!container) return;
    const crate = State.currentCrate;
    container.innerHTML = '';

    if (!crate.hologramLines.length) {
      container.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:12px">No lines yet. Click "Add Line" to start.</div>';
      return;
    }

    crate.hologramLines.forEach((line, idx) => {
      const row = Utils.el('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px';
      row.innerHTML = `
        <div style="color:var(--text3);font-size:11px;width:20px;text-align:center;flex-shrink:0">${idx + 1}</div>
        <input class="field-input" style="flex:1" value="${line.replace(/"/g, '&quot;')}"
          placeholder="&b&lCRATE NAME"
          oninput="HologramModal.updateLine(${idx}, this.value)"
          onfocus="HologramModal.setFocused(${idx})"/>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="slider-btn" onclick="HologramModal.moveLine(${idx}, -1)"
            title="Move Up" ${idx === 0 ? 'disabled style="opacity:.3"' : ''}>↑</button>
          <button class="slider-btn" onclick="HologramModal.moveLine(${idx}, 1)"
            title="Move Down" ${idx === crate.hologramLines.length - 1 ? 'disabled style="opacity:.3"' : ''}>↓</button>
          <button class="slider-btn" style="color:var(--red)"
            onclick="HologramModal.removeLine(${idx})" title="Remove">✕</button>
        </div>
      `;
      container.appendChild(row);
    });
  },

  updatePreview() {
    const preview = Utils.qs('#holoPreview');
    if (!preview) return;
    const crate = State.currentCrate;

    // Hapus semua line lama kecuali label
    const label = preview.querySelector('div');
    preview.innerHTML = '';
    preview.appendChild(label || Object.assign(document.createElement('div'), {
      style: 'font-size:10px;color:var(--text3);margin-bottom:4px',
      textContent: 'HOLOGRAM PREVIEW'
    }));

    if (!crate.hologramLines.length) {
      const empty = Utils.el('div', '', '<span style="color:var(--text3);font-size:11px">No lines configured</span>');
      preview.appendChild(empty);
      return;
    }

    crate.hologramLines.forEach(line => {
      const div = Utils.el('div');
      div.style.cssText = 'font-size:13px;font-weight:500;text-shadow:0 0 8px rgba(0,0,0,.8)';
      div.innerHTML = Utils.mc(line) || '&nbsp;';
      preview.appendChild(div);
    });
  },

  focusedIdx: null,
  setFocused(idx) { this.focusedIdx = idx; },

  insertCode(code) {
    const crate = State.currentCrate;
    const idx = this.focusedIdx;
    if (idx === null || idx === undefined) {
      toast('Klik dulu di input baris yang mau disisipkan kodenya', 'info');
      return;
    }
    const inputs = Utils.qsa('#holoLines input');
    const input = inputs[idx];
    if (!input) return;

    const start = input.selectionStart;
    const end   = input.selectionEnd;
    const val   = input.value;
    input.value = val.slice(0, start) + code + val.slice(end);
    input.setSelectionRange(start + code.length, start + code.length);
    input.focus();
    this.updateLine(idx, input.value);
  },

  updateLine(idx, val) {
    const crate = State.currentCrate;
    crate.hologramLines[idx] = val;
    this.updatePreview();
  },

  addLine() {
    const crate = State.currentCrate;
    crate.hologramLines.push('');
    this.renderLines();
    this.updatePreview();
    // Focus ke input terakhir
    setTimeout(() => {
      const inputs = Utils.qsa('#holoLines input');
      inputs[inputs.length - 1]?.focus();
      this.focusedIdx = inputs.length - 1;
    }, 50);
  },

  removeLine(idx) {
    const crate = State.currentCrate;
    crate.hologramLines.splice(idx, 1);
    this.focusedIdx = null;
    this.renderLines();
    this.updatePreview();
  },

  moveLine(idx, dir) {
    const crate = State.currentCrate;
    const lines = crate.hologramLines;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= lines.length) return;
    [lines[idx], lines[newIdx]] = [lines[newIdx], lines[idx]];
    this.focusedIdx = newIdx;
    this.renderLines();
    this.updatePreview();
  },

  updateHeight(val) {
      const crate = State.currentCrate;
      crate.hologramHeight = val === "" ? 1.2 : parseFloat(val);

      if (typeof Architect !== 'undefined') {
          Architect.dirty = true;
      }
  },

  save() {
    const crate = State.currentCrate;
    // Filter baris kosong di akhir
    crate.hologramLines = crate.hologramLines.filter((l, i) =>
      l.trim() !== '' || i < crate.hologramLines.length - 1
    );
    Architect.dirty = true;
    Modal.close();
    toast('Hologram updated! Jangan lupa Save Crate.', 'success');
    // Refresh hologram di server kalau ada
    if (plugin?.getHologramManager) {
      plugin.getHologramManager().updateHologram(crate);
    }
  },
};