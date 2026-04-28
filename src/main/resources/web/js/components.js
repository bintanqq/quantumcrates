/* ══ SHARED COMPONENTS ══ */

/* SVG icons by reward type */
const REWARD_TYPE_SVGS = {
  VANILLA: `<svg class="rc-icon-vanilla" viewBox="0 0 24 24" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  VANILLA_WITH_COMMANDS: `<svg class="rc-icon-vanilla" viewBox="0 0 24 24" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><line x1="12" y1="22.08" x2="12" y2="12"/><line x1="16" y1="3.5" x2="16" y2="9"/></svg>`,
  COMMAND: `<svg class="rc-icon-command" viewBox="0 0 24 24" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
  MMOITEMS: `<svg class="rc-icon-mmoitems" viewBox="0 0 24 24" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  ITEMSADDER: `<svg class="rc-icon-itemsadder" viewBox="0 0 24 24" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  ORAXEN: `<svg class="rc-icon-oraxen" viewBox="0 0 24 24" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
};

function getRewardTypeLabel(type) {
  const labels = {
    VANILLA: 'Item',
    VANILLA_WITH_COMMANDS: 'Item+Cmd',
    COMMAND: 'Command',
    MMOITEMS: 'MMOItems',
    ITEMSADDER: 'ItemsAdder',
    ORAXEN: 'Oraxen',
  };
  return labels[type] || type;
}

/* Reward Card */
function RewardCard(reward, totalWeight, onClick, onRemove) {
  const pct   = Utils.chance(reward.weight, totalWeight);
  const color = Utils.rarityColor(reward.rarity);
  const svgIcon = REWARD_TYPE_SVGS[reward.type] || REWARD_TYPE_SVGS.VANILLA;

  const div = Utils.el('div', 'reward-card');
  div.dataset.id = reward.id;
  div.innerHTML = `
    <button class="rc-remove" title="Remove">✕</button>
    <div class="rc-icon">
      ${svgIcon}
      <div class="rc-rarity-bar" style="background:${color}"></div>
    </div>
    <div class="rc-name">${Utils.strip(reward.displayName) || reward.id}</div>
    <div class="rc-type-label">${getRewardTypeLabel(reward.type)}</div>
    <div class="rc-weight">${Utils.fmtChance(pct)}</div>
  `;
  div.onclick = (e) => { if (!e.target.classList.contains('rc-remove')) onClick?.(reward); };
  div.querySelector('.rc-remove').onclick = (e) => { e.stopPropagation(); onRemove?.(reward); };
  return div;
}

/* Add Card button */
function AddCard(onClick) {
  const div = Utils.el('div', 'add-card');
  div.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    <span>Add Reward</span>
  `;
  div.onclick = onClick;
  return div;
}

/* SliderRow — weight input */
function SliderRow(reward, totalWeight, onChange) {
  const color = Utils.rarityColor(reward.rarity);
  const div = Utils.el('div');
  div.dataset.id = reward.id;
  div.style.cssText = 'display:grid;grid-template-columns:1fr 120px 80px 80px;gap:8px;align-items:center;padding:7px 4px;border-radius:5px;transition:background .12s';
  div.onmouseenter = () => div.style.background = 'var(--bg3)';
  div.onmouseleave = () => div.style.background = '';

  const nameEl = Utils.el('div');
  nameEl.style.cssText = 'display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;overflow:hidden';
  nameEl.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.strip(reward.displayName) || reward.id}</span>`;

  const wtWrap = Utils.el('div');
  wtWrap.style.cssText = 'display:flex;align-items:center;gap:4px';
  const minus = Utils.el('button', 'wt-btn'); minus.textContent = '−';
  const inp = document.createElement('input');
  inp.type = 'number'; inp.className = 'field-input'; inp.value = reward.weight.toFixed(1);
  inp.style.cssText = 'width:54px;padding:4px 6px;font-size:12px;font-weight:600;text-align:center';
  const plus = Utils.el('button', 'wt-btn'); plus.textContent = '+';

  const chanceEl = Utils.el('div');
  chanceEl.style.cssText = 'font-size:12px;font-weight:700;color:var(--cyan)';
  chanceEl.textContent = Utils.fmtChance(Utils.chance(reward.weight, totalWeight));

  const applyW = (val) => {
    reward.weight = parseFloat(Math.max(0.1, Math.min(9999, val)).toFixed(1));
    inp.value = reward.weight.toFixed(1);
    const newTw = totalWeight;
    chanceEl.textContent = Utils.fmtChance(Utils.chance(reward.weight, newTw));
    onChange?.(reward);
  };
  minus.onclick = () => applyW(reward.weight - 0.5);
  plus.onclick  = () => applyW(reward.weight + 0.5);
  inp.onchange  = () => applyW(parseFloat(inp.value) || 0.1);

  wtWrap.appendChild(minus); wtWrap.appendChild(inp); wtWrap.appendChild(plus);

  const rarityEl = Utils.el('div');
  rarityEl.style.cssText = `font-size:10px;font-weight:700;color:${color}`;
  rarityEl.textContent = reward.rarity;

  div.appendChild(nameEl); div.appendChild(wtWrap); div.appendChild(chanceEl); div.appendChild(rarityEl);
  return div;
}

/* Log Item */
function LogItem(log) {
  const crate  = State.crates[log.crateId];
  const reward = crate?.rewards?.find(r => r.id === log.rewardId);
  const rarity = (reward?.rarity || 'COMMON').toLowerCase();
  const type   = reward?.type || 'VANILLA';
  const svgIcon = REWARD_TYPE_SVGS[type] || REWARD_TYPE_SVGS.VANILLA;
  const isPity = log.pityAtOpen > 0 && crate?.pity?.enabled && log.pityAtOpen >= crate.pity.threshold - 1;

  const div = Utils.el('div', 'log-item');
  div.innerHTML = `
    <span class="log-time">${Utils.timeStr(log.timestamp)}</span>
    <div class="log-avatar">${svgIcon}</div>
    <div class="log-body">
      <div class="log-player">${log.playerName} <span style="color:var(--text3);font-weight:400">opened</span> ${Utils.strip(crate?.displayName || log.crateId)}</div>
      <div class="log-reward ${rarity}">
        → ${Utils.strip(log.rewardDisplay)}
        ${isPity ? '<span class="log-pity-tag">PITY</span>' : ''}
      </div>
    </div>
    <span style="font-size:10px;color:var(--text3)">${Utils.timeAgo(log.timestamp)}</span>
  `;
  return div;
}

/* Pity Bar */
function PityBar(pity, max, soft) {
  const fillPct  = max > 0 ? (pity / max * 100) : 0;
  const softPct  = max > 0 ? (soft / max * 100) : 0;
  const remaining = max - pity;
  const div = Utils.el('div', 'pity-bar-card');
  div.innerHTML = `
    <div class="pity-bar-header">
      <div class="pity-bar-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        Pity Counter
      </div>
      <div class="pity-bar-val">${pity} / ${max}</div>
    </div>
    <div class="pity-track">
      <div class="pity-fill" style="width:${fillPct}%"></div>
      <div class="pity-soft-marker" style="left:${softPct}%"></div>
    </div>
    <div class="pity-desc"><strong>${remaining} opens</strong> until next guaranteed rare!</div>
  `;
  return div;
}

/* Stat Card */
function StatCard(iconSvg, val, label, delta, iconBg) {
  const div = Utils.el('div', 'stat-card');
  div.innerHTML = `
    <div class="stat-icon" style="background:${iconBg || 'var(--bg3)'}">${iconSvg}</div>
    <div class="stat-val">${val}</div>
    <div class="stat-label">${label}</div>
    ${delta ? `<div class="stat-delta ${delta > 0 ? 'up' : 'down'}">${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)}%</div>` : ''}
  `;
  return div;
}

/* Toggle Switch */
function ToggleSwitch(label, checked, onChange) {
  const id = 'tgl-' + Math.random().toString(36).slice(2);
  const div = Utils.el('div', 'toggle-wrap');
  div.innerHTML = `
    <span class="toggle-label-text">${label}</span>
    <label class="toggle-switch">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}/>
      <span class="toggle-slider"></span>
    </label>
  `;
  div.querySelector('input').onchange = e => onChange?.(e.target.checked);
  return div;
}

/* Badge */
function RarityBadge(rarity) {
  const span = Utils.el('span', `badge badge-${rarity.toLowerCase()}`);
  span.textContent = rarity;
  return span;
}