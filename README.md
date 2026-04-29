# QuantumCrates

A Minecraft crate plugin for Paper 1.21 built around a **web-first management philosophy** — configure everything from a browser dashboard without touching a single config file or restarting the server.

---

## Requirements

- Paper 1.21+ (Java 21)
- SQLite (built-in, zero setup) or MySQL 8+

**Optional integrations**
- PlaceholderAPI
- DecentHolograms
- MMOItems
- ItemsAdder
- Oraxen

---

## Installation

1. Drop the `.jar` into your `plugins/` folder.
2. Start the server once to generate config files.
3. Open `config.yml` and configure:
   - `web.secret-token` — change this to something long and random
   - `web.port` — default is `7420`
   - `web.hostname` — your server's IP or domain (required if behind a reverse proxy)
4. Restart the server.
5. In-game, run `/qc web` to get a magic link and open the dashboard.

---

## Getting Started

### Accessing the Dashboard

Run `/qc web` in-game. A one-time link valid for **5 minutes** will appear in chat — click it to open the dashboard and authenticate automatically.

If the link expires, just run `/qc web` again.

For manual login, navigate to the dashboard URL directly and enter your `web.secret-token` from `config.yml`.

### Creating Your First Crate

1. Open the dashboard and go to **Crate Architect**.
2. Click **+ New Crate** and give it an ID and display name.
3. Add rewards with the **Add Reward** button. Each reward has a type, material, rarity, and weight.
4. Configure key requirements, cooldown, and pity in the config cards below the reward grid.
5. Click **Save Crate**, then **Save All** to push changes to the server — no restart needed.
6. In-game, look at a block and run `/qc setloc <crateId>` to place the crate.

### Giving Keys to Players

**Virtual keys (default):**
```
/qc give <player> <keyId> <amount>
```

You can also give keys directly from the **Key Settings** page in the dashboard.

**Physical keys:** If `keys.mode` is set to `physical` in `config.yml`, the command above gives a physical key item to the player's inventory instead.

---

## Features

### Crate System

Each crate is stored as a `.json` file under `plugins/QuantumCrates/crates/`. You can edit these manually or manage them entirely through the dashboard.

**Per-crate configuration:**
- Display name (supports `&` color codes)
- Required keys — how many and what type
- Rewards with individual weights
- Cooldown between openings per player
- Mass open toggle
- Idle and open particle animations
- GUI opening animation style
- Hologram lines and height offset
- Schedule (time window, days of week, or limited-time event)

---

### Reward System

Rewards use a **weighted random** system. A reward with weight `20` is twice as likely as one with weight `10`. Weight is relative — not a direct percentage.

**Supported reward types:**

| Type | Description |
|---|---|
| `VANILLA` | Standard Minecraft item |
| `COMMAND` | Runs console or player commands on win |
| `VANILLA_WITH_COMMANDS` | Item + commands together |
| `MMOITEMS` | Item from MMOItems plugin |
| `ITEMSADDER` | Item from ItemsAdder plugin |
| `ORAXEN` | Item from Oraxen plugin |

Each reward supports:
- Custom display name and lore
- Custom Model Data
- Enchantments
- Server-wide broadcast message on win
- Per-reward icon (uploaded via dashboard)

---

### Pity System

The pity system guarantees rare rewards after a set number of unsuccessful openings.

- **Soft pity** — once a player's counter reaches `softPityStart`, the weight of all rare-tier-and-above rewards increases with each subsequent open.
- **Hard pity** — once the counter hits `threshold`, the next open is guaranteed to give a reward at or above the configured minimum rarity. The counter resets after any qualifying rare drop.

Pity is tracked per-player and per-crate, persisted in the database.

---

### Key System

Two modes are available server-wide (set in `config.yml`):

- **Virtual** — keys are stored as a balance in the database. Cannot be dropped, traded, or duplicated. Recommended for most servers.
- **Physical** — keys are physical inventory items tagged with a unique PDC identifier. Can be stored in chests and traded between players.

Physical key appearance (material, Custom Model Data, lore) is configurable from the dashboard under **Key Settings**.

Crates can also require keys from third-party plugins (MMOItems, ItemsAdder, Oraxen) by setting the key type in the crate config.

---

### Particle Animations

Each crate has separate idle and open animations. Available animation types:

| Type | Description |
|---|---|
| `HELIX` | Two strands rising and falling |
| `SPIRAL` | Expanding/contracting vortex |
| `SPHERE` | Fibonacci point-cloud slowly rotating |
| `BEACON` | Orbiting ring with vertical sweep |
| `TORNADO` | Wide rotating funnel |
| `VORTEX` | Dual-strand inward vortex |
| `SIMPLE` | Basic burst at center |
| `NONE` | No particles |

Particle effect (e.g. `FLAME`, `ENCHANT`, `END_ROD`) is configurable per animation slot.

---

### GUI Animations

When a player opens a crate, one of these animations plays in a chest GUI:

| Type | Description |
|---|---|
| `ROULETTE` | Horizontal strip scrolling with slowdown (CSGO-style) |
| `SHUFFLER` | Center slot shuffles through random rewards |
| `BOUNDARY` | Reward travels clockwise around the border |
| `SINGLE_SPIN` | Vertical column scrolling with slowdown |
| `FLICKER` | All slots filled randomly, then cleared one-by-one to reveal winner |

---

### Hologram

When a crate has a location set, a floating hologram appears above it. Lines support `&` color codes and can be edited from the dashboard without restarting.

**Height offset** is configurable per crate (default: `1.2` blocks above the block surface).

Two backends are supported:
- **DecentHolograms** — used automatically if the plugin is installed
- **Built-in ArmorStand** — fallback with zero dependencies

---

### Scheduling

Crates can be restricted to open only during specific times:

| Mode | Description |
|---|---|
| `ALWAYS` | Always openable (default) |
| `TIME_WINDOW` | Openable between two times each day (overnight windows supported) |
| `DAYS_OF_WEEK` | Openable on specific days, optionally within a time window |
| `EVENT` | Openable between two absolute timestamps (for limited-time events) |

Timezone is configurable per crate.

---

### Mass Open

Players with the `quantumcrates.massopen` permission can hold Shift and right-click a crate to open it as many times as they have keys. Each crate has a configurable per-session limit. Mass opens are processed in batches of 10 per server tick to minimize TPS impact.

---

### Preview GUI

Left-clicking a crate block opens a paginated preview GUI showing all rewards. Displays:
- Reward item with custom name and lore
- Drop chance percentage
- Rarity tier
- Player's current key balance
- Player's current pity counter and progress bar

All labels in the preview GUI are fully customizable from `config.yml` under `gui-messages`.

---

### Analytics Dashboard

The **Analytics** page in the web dashboard shows:
- Total opening count per crate with a breakdown bar chart
- Live feed of crate opens as they happen (via WebSocket)
- Top rewards by frequency
- Pity trigger events

All openings are stored in the database with player name, UUID, reward, pity counter at open, location, and timestamp.

---

### Messages

Every message sent by the plugin — chat messages, GUI labels, button names, lore lines — is fully configurable. Zero hardcoded strings.

- **Chat messages** are in `config.yml` under `messages:`
- **GUI messages** are in `config.yml` under `gui-messages:`
- Both can be edited live from the dashboard's **Messages** page without restarting.

---

### Rarity System

Rarities are fully user-defined in `rarities.yml`. You can add, rename, recolor, or remove any tier freely.

**Default tiers:**

| ID | Display | Color |
|---|---|---|
| `COMMON` | Common | Gray |
| `UNCOMMON` | Uncommon | Green |
| `RARE` | Rare | Blue |
| `EPIC` | Epic | Purple |
| `LEGENDARY` | Legendary | Gold |
| `MYTHIC` | Mythic | Pink |

Each rarity has a Minecraft color code (used in-game) and a hex color (used in the web dashboard). Changes made through the **Rarities** editor in the dashboard sync to `rarities.yml` immediately.

---

## Commands

All commands use `/quantumcrates` or the alias `/qc`.

| Command | Description | Permission |
|---|---|---|
| `/qc reload` | Reload all crates, rarities, particles, and holograms | `quantumcrates.admin` |
| `/qc give <player> <keyId> <amount>` | Give keys to a player | `quantumcrates.key.give` |
| `/qc open <crateId>` | Force-open a crate for yourself | `quantumcrates.admin` |
| `/qc massopen <crateId> [count]` | Mass open a crate | `quantumcrates.massopen` |
| `/qc info <crateId>` | Print crate info to chat | `quantumcrates.use` |
| `/qc list` | List all registered crates | `quantumcrates.use` |
| `/qc setloc <crateId>` | Set crate location to the block you are looking at | `quantumcrates.admin` |
| `/qc delloc <crateId>` | Remove a crate's location | `quantumcrates.admin` |
| `/qc pity <player> <crateId>` | Check a player's pity counter | `quantumcrates.admin` |
| `/qc resetpity <player> <crateId>` | Reset a player's pity counter | `quantumcrates.admin` |
| `/qc keys <player> <keyId>` | Check a player's virtual key balance | `quantumcrates.admin` |
| `/qc web [ip]` | Generate a dashboard magic link | `quantumcrates.admin` |

### Block Interactions

| Action | Result |
|---|---|
| Left-click crate block | Open preview GUI |
| Right-click crate block | Open crate |
| Shift + Right-click crate block | Mass open |

---

## Permissions

| Permission | Description | Default |
|---|---|---|
| `quantumcrates.admin` | Full admin access (includes all below) | OP |
| `quantumcrates.use` | Use crates | Everyone |
| `quantumcrates.massopen` | Mass open crates | Everyone |
| `quantumcrates.key.give` | Give keys to other players | OP |
| `quantumcrates.bypasscooldown` | Bypass crate opening cooldown | OP |
| `quantumcrates.web` | Generate dashboard magic links | OP |

---

## PlaceholderAPI

If PlaceholderAPI is installed, these placeholders are available:

| Placeholder | Returns |
|---|---|
| `%quantumcrates_keys_<keyId>%` | Player's virtual key balance |
| `%quantumcrates_pity_<crateId>%` | Player's current pity counter |
| `%quantumcrates_pity_max_<crateId>%` | Pity threshold for the crate |
| `%quantumcrates_cooldown_<crateId>%` | Remaining cooldown, human-readable |
| `%quantumcrates_cooldown_raw_<crateId>%` | Remaining cooldown in milliseconds |
| `%quantumcrates_open_<crateId>%` | `true` or `false` — whether crate is currently openable |
| `%quantumcrates_total_<crateId>%` | Total weight of all rewards in the crate |

---

## Database Configuration

**SQLite (default — no setup required)**
```yaml
database:
  type: sqlite
  sqlite:
    file: quantumcrates.db
```

**MySQL**
```yaml
database:
  type: mysql
  mysql:
    host: localhost
    port: 3306
    database: quantumcrates
    username: root
    password: yourpassword
    pool-size: 10
```

---

## Web Dashboard

The dashboard runs as an embedded web server inside the plugin. No external software required.

**Default port:** `7420`

### Authentication

Two ways to log in:
- **Magic link** — run `/qc web` in-game and click the link in chat. Valid for 5 minutes, single use.
- **Manual** — navigate to the dashboard URL and enter your `web.secret-token`.

### Pages

| Page | Description |
|---|---|
| **Crate Architect** | Create, edit, and delete crates. Manage rewards, weights, pity, keys, schedule, hologram, and particles per crate. |
| **Analytics & Logs** | Live crate opening feed, per-crate stats, and top rewards. |
| **Key Settings** | Switch between virtual/physical key mode. Configure physical key appearance. Give keys to players directly. |
| **Messages** | Edit all chat and GUI messages live. |
| **Players** | Look up a player's pity counters and reset them. |
| **Settings** | Server connection info and plugin reload. |
| **Rarities** | Add, recolor, and reorder rarity tiers. Syncs to `rarities.yml` immediately. |

### Save All

Changes made in the dashboard are **staged locally** until you click **Save All** in the top bar. The badge on the button shows how many unsaved sections are pending. Clicking Save All pushes all changes to the server at once.

---

## Configuration Files

| File | Purpose |
|---|---|
| `config.yml` | Database, key mode, web server, and all messages |
| `rarities.yml` | Rarity tier definitions |
| `crates/<id>.json` | Individual crate definitions |