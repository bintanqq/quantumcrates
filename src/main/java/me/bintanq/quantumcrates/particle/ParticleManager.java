package me.bintanq.quantumcrates.particle;

import me.bintanq.quantumcrates.QuantumCrates;
import me.bintanq.quantumcrates.model.Crate;
import me.bintanq.quantumcrates.util.Logger;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * ParticleManager — smooth, phase-accumulator-based particle animations.
 *
 * Each animation type uses a shared tick counter that drives a continuous
 * math function, so animations loop seamlessly and scale with server TPS.
 *
 * Idle animations are subtle, ambient loops (low density, slow phase shift).
 * Open animations are burst/dramatic effects with expanding geometry.
 *
 * Design principles (matching top plugins like PhoenixCrates / ExcellentCrates):
 *  - Phase accumulator: angle advances smoothly each tick, no frame jumps
 *  - Separate density for idle (subtle) vs open (dramatic burst)
 *  - NONE type is actually checked and skips task creation
 *  - Open effects are one-shot BukkitRunnables that self-cancel
 *  - Particle count scales with radius, not hardcoded
 */
public class ParticleManager {

    public enum AnimationType {
        RING,    // rotating horizontal circle
        HELIX,   // dual counter-rotating helices rising/falling
        SPHERE,  // fibonacci sphere point-cloud slowly rotating
        SPIRAL,  // contracting/expanding spiral vortex
        RAIN,    // particles falling from above into crate
        ORBIT,   // multiple particles orbiting at different heights (NEW)
        PULSE,   // ring that pulses outward and fades (NEW)
        NONE
    }

    private final QuantumCrates plugin;

    /** crateId → running idle task */
    private final Map<String, BukkitTask> idleTasks = new HashMap<>();

    /** crateId → accumulated phase (persists across ticks for smooth looping) */
    private final Map<String, Double> phaseMap = new HashMap<>();

    public ParticleManager(QuantumCrates plugin) {
        this.plugin = plugin;
    }

    /* ═══════════════════════════════════════════════════════════
       IDLE PARTICLE SYSTEM
       ═══════════════════════════════════════════════════════════ */

    public void startIdleParticles(Crate crate) {
        stopIdleParticles(crate.getId());
        if (crate.getLocation() == null) return;

        Location loc = toLocation(crate.getLocation());
        if (loc == null) return;

        Crate.AnimationConfig cfg = crate.getIdleAnimation();
        AnimationType type = parseType(cfg.getType());

        if (type == AnimationType.NONE) return;

        Particle particle  = parseParticle(cfg.getParticle(), Particle.HAPPY_VILLAGER);
        long tickInterval  = plugin.getConfig().getLong("particles.idle-interval", 2L);
        double radius      = Math.max(0.2, cfg.getRadius());
        double speed       = Math.max(0.05, cfg.getSpeed());

        // Idle density is capped to keep it subtle — dramatic = open animation's job
        int density = Math.min(cfg.getDensity(), 12);

        phaseMap.put(crate.getId(), 0.0);

        BukkitTask task = switch (type) {
            case RING   -> idleRing  (crate.getId(), loc, particle, radius, speed, density, tickInterval);
            case HELIX  -> idleHelix (crate.getId(), loc, particle, radius, speed, density, tickInterval);
            case SPHERE -> idleSphere(crate.getId(), loc, particle, radius, speed, density, tickInterval);
            case SPIRAL -> idleSpiral(crate.getId(), loc, particle, radius, speed, density, tickInterval);
            case RAIN   -> idleRain  (crate.getId(), loc, particle, radius, speed, density, tickInterval);
            case ORBIT  -> idleOrbit (crate.getId(), loc, particle, radius, speed, density, tickInterval);
            case PULSE  -> idlePulse (crate.getId(), loc, particle, radius, speed, density, tickInterval);
            default     -> null;
        };

        if (task != null) idleTasks.put(crate.getId(), task);
    }

    // ── RING: smooth rotating circle at fixed height ──────────────────────────
    private BukkitTask idleRing(String id, Location base, Particle particle,
                                double radius, double speed, int density, long interval) {
        return new BukkitRunnable() {
            @Override public void run() {
                World w = base.getWorld();
                if (w == null) { cancel(); return; }

                double phase = phaseMap.getOrDefault(id, 0.0);
                double step  = TWO_PI / density;

                for (int i = 0; i < density; i++) {
                    double angle = phase + step * i;
                    double x = base.getX() + 0.5 + Math.cos(angle) * radius;
                    double z = base.getZ() + 0.5 + Math.sin(angle) * radius;
                    double y = base.getY() + 1.3 + Math.sin(phase * 2 + i) * 0.08; // subtle bob
                    w.spawnParticle(particle, x, y, z, 1, 0, 0, 0, 0);
                }

                phaseMap.put(id, (phase + speed * 0.12) % TWO_PI);
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    // ── HELIX: two strands rising and falling ─────────────────────────────────
    private BukkitTask idleHelix(String id, Location base, Particle particle,
                                 double radius, double speed, int density, long interval) {
        return new BukkitRunnable() {
            final double HEIGHT = 2.0;
            @Override public void run() {
                World w = base.getWorld();
                if (w == null) { cancel(); return; }

                double phase = phaseMap.getOrDefault(id, 0.0);
                int pointsPerStrand = Math.max(3, density / 2);

                for (int strand = 0; strand < 2; strand++) {
                    double strandOffset = strand * Math.PI;
                    for (int i = 0; i < pointsPerStrand; i++) {
                        double t      = phase + (TWO_PI * i / pointsPerStrand);
                        double yFrac  = ((t + strandOffset) % TWO_PI) / TWO_PI; // 0→1
                        double yPos   = base.getY() + yFrac * HEIGHT;
                        double angle  = t + strandOffset;
                        double x = base.getX() + 0.5 + Math.cos(angle) * radius;
                        double z = base.getZ() + 0.5 + Math.sin(angle) * radius;
                        w.spawnParticle(particle, x, yPos, z, 1, 0, 0, 0, 0);
                    }
                }

                phaseMap.put(id, (phase + speed * 0.09) % TWO_PI);
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    // ── SPHERE: fibonacci lattice slowly rotating ─────────────────────────────
    private BukkitTask idleSphere(String id, Location base, Particle particle,
                                  double radius, double speed, int density, long interval) {
        return new BukkitRunnable() {
            // Pre-compute fibonacci sphere offsets
            final double[] PHI_CACHE;
            final double[] THETA_CACHE;
            {
                int n = Math.max(6, density);
                PHI_CACHE   = new double[n];
                THETA_CACHE = new double[n];
                double golden = Math.PI * (3 - Math.sqrt(5));
                for (int i = 0; i < n; i++) {
                    PHI_CACHE[i]   = Math.acos(1 - 2.0 * i / n);
                    THETA_CACHE[i] = golden * i;
                }
            }

            @Override public void run() {
                World w = base.getWorld();
                if (w == null) { cancel(); return; }

                double phase  = phaseMap.getOrDefault(id, 0.0);
                int limit     = Math.min(PHI_CACHE.length, density);

                // Spawn a subset each tick to avoid TPS spike
                int start = (int)((phase / TWO_PI) * limit) % limit;
                int count = Math.max(2, limit / 4);

                for (int i = 0; i < count; i++) {
                    int idx   = (start + i) % limit;
                    double phi = PHI_CACHE[idx];
                    double theta = THETA_CACHE[idx] + phase;
                    double x  = base.getX() + 0.5 + radius * Math.sin(phi) * Math.cos(theta);
                    double y  = base.getY() + 1.0 + radius * Math.cos(phi);
                    double z  = base.getZ() + 0.5 + radius * Math.sin(phi) * Math.sin(theta);
                    w.spawnParticle(particle, x, y, z, 1, 0, 0, 0, 0);
                }

                phaseMap.put(id, (phase + speed * 0.07) % TWO_PI);
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    // ── SPIRAL: particle tracing a shrinking/expanding vortex ─────────────────
    private BukkitTask idleSpiral(String id, Location base, Particle particle,
                                  double radius, double speed, int density, long interval) {
        return new BukkitRunnable() {
            @Override public void run() {
                World w = base.getWorld();
                if (w == null) { cancel(); return; }

                double phase = phaseMap.getOrDefault(id, 0.0);

                for (int i = 0; i < density; i++) {
                    double t   = phase + (TWO_PI * i / density);
                    double r   = radius * (0.3 + 0.7 * ((Math.sin(t * 0.5) + 1) / 2.0));
                    double y   = base.getY() + 1.0 + (t % TWO_PI) / TWO_PI * 1.8;
                    double x   = base.getX() + 0.5 + Math.cos(t * 2) * r;
                    double z   = base.getZ() + 0.5 + Math.sin(t * 2) * r;
                    w.spawnParticle(particle, x, y, z, 1, 0, 0, 0, 0);
                }

                phaseMap.put(id, (phase + speed * 0.1) % (TWO_PI * 4));
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    // ── RAIN: gentle downward drift ───────────────────────────────────────────
    private BukkitTask idleRain(String id, Location base, Particle particle,
                                double radius, double speed, int density, long interval) {
        return new BukkitRunnable() {
            @Override public void run() {
                World w = base.getWorld();
                if (w == null) { cancel(); return; }

                // Spawn a few particles per tick falling slowly
                int perTick = Math.max(1, density / 4);
                ThreadLocalRandom rng = ThreadLocalRandom.current();

                for (int i = 0; i < perTick; i++) {
                    double angle = rng.nextDouble() * TWO_PI;
                    double r     = rng.nextDouble() * radius;
                    double x     = base.getX() + 0.5 + Math.cos(angle) * r;
                    double z     = base.getZ() + 0.5 + Math.sin(angle) * r;
                    double y     = base.getY() + 2.0 + rng.nextDouble() * 0.5;
                    // vx/vz = 0, vy = slight downward nudge via extra param not available,
                    // so just spawn high and let them drift (HAPPY_VILLAGER floats naturally)
                    w.spawnParticle(particle, x, y, z, 1, 0.02, -0.04 * speed, 0.02, 0.01);
                }
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    // ── ORBIT: particles at different heights/speeds (layered depth) ──────────
    private BukkitTask idleOrbit(String id, Location base, Particle particle,
                                 double radius, double speed, int density, long interval) {
        return new BukkitRunnable() {
            final int LAYERS = 3;
            @Override public void run() {
                World w = base.getWorld();
                if (w == null) { cancel(); return; }

                double phase = phaseMap.getOrDefault(id, 0.0);

                for (int layer = 0; layer < LAYERS; layer++) {
                    double layerAngle = phase * (1.0 + layer * 0.3);
                    double layerR     = radius * (0.5 + 0.5 * layer / LAYERS);
                    double layerY     = base.getY() + 0.8 + layer * 0.5;
                    double x = base.getX() + 0.5 + Math.cos(layerAngle) * layerR;
                    double z = base.getZ() + 0.5 + Math.sin(layerAngle) * layerR;
                    w.spawnParticle(particle, x, layerY, z, 1, 0, 0, 0, 0);
                }

                phaseMap.put(id, (phase + speed * 0.15) % TWO_PI);
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    // ── PULSE: ring that breathes in and out ──────────────────────────────────
    private BukkitTask idlePulse(String id, Location base, Particle particle,
                                 double radius, double speed, int density, long interval) {
        return new BukkitRunnable() {
            @Override public void run() {
                World w = base.getWorld();
                if (w == null) { cancel(); return; }

                double phase      = phaseMap.getOrDefault(id, 0.0);
                // Pulse: radius breathes 0.4→1.0 of configured radius
                double breathe    = 0.4 + 0.6 * ((Math.sin(phase * 2) + 1) / 2.0);
                double r          = radius * breathe;
                double step       = TWO_PI / density;

                for (int i = 0; i < density; i++) {
                    double angle = step * i; // no phase on angle — ring stays still, only radius pulses
                    double x = base.getX() + 0.5 + Math.cos(angle) * r;
                    double z = base.getZ() + 0.5 + Math.sin(angle) * r;
                    double y = base.getY() + 1.1;
                    w.spawnParticle(particle, x, y, z, 1, 0, 0, 0, 0);
                }

                phaseMap.put(id, (phase + speed * 0.08) % TWO_PI);
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    /* ═══════════════════════════════════════════════════════════
       OPEN EFFECT SYSTEM  (one-shot, dramatic)
       ═══════════════════════════════════════════════════════════ */

    public void playOpenEffect(Crate crate, Location playerLoc) {
        Crate.AnimationConfig cfg = crate.getOpenAnimation();
        AnimationType type  = parseType(cfg.getType());
        Particle particle   = parseParticle(cfg.getParticle(), Particle.FIREWORK);
        double radius       = Math.max(0.3, cfg.getRadius());
        double speed        = Math.max(0.1, cfg.getSpeed());
        int density         = Math.max(8, cfg.getDensity());

        switch (type) {
            case RING   -> openBurst (playerLoc, particle, radius, speed, density);
            case HELIX  -> openHelixBurst(playerLoc, particle, radius, speed);
            case SPHERE -> openSphereBurst(playerLoc, particle, radius, density);
            case SPIRAL -> openSpiralBurst(playerLoc, particle, radius, speed);
            case RAIN   -> openShower(playerLoc, particle, radius, density);
            case ORBIT  -> openOrbitBurst(playerLoc, particle, radius, speed);
            case PULSE  -> openShockwave(playerLoc, particle, radius, density);
            case NONE   -> { /* do nothing */ }
            default     -> openBurst(playerLoc, particle, radius, speed, density);
        }
    }

    // ── RING open: expanding ring that grows outward ──────────────────────────
    private void openBurst(Location loc, Particle particle, double radius, double speed, int density) {
        new BukkitRunnable() {
            int tick = 0;
            @Override public void run() {
                World w = loc.getWorld();
                if (w == null || tick >= 16) { cancel(); return; }

                // Ring expands from 0 to radius*2, then fades
                double progress = tick / 15.0;
                double ease     = easeOutCubic(progress);
                double r        = radius * 2.0 * ease;
                double y        = loc.getY() + 1.0 + progress * 0.5;
                int count       = Math.max(8, (int)(density * (1 - progress * 0.5)));
                double step     = TWO_PI / count;

                for (int i = 0; i < count; i++) {
                    double angle = step * i + tick * speed * 0.2;
                    w.spawnParticle(particle,
                            loc.getX() + Math.cos(angle) * r, y, loc.getZ() + Math.sin(angle) * r,
                            2, 0.05, 0.05, 0.05, 0.03);
                }

                // Inner burst on early ticks
                if (tick < 5) {
                    for (int i = 0; i < 6; i++) {
                        double a = TWO_PI / 6 * i;
                        w.spawnParticle(particle,
                                loc.getX() + Math.cos(a) * r * 0.4, y + 0.3,
                                loc.getZ() + Math.sin(a) * r * 0.4,
                                1, 0, 0.1, 0, 0.02);
                    }
                }

                tick++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    // ── HELIX open: three strands corkscrewing upward ─────────────────────────
    private void openHelixBurst(Location loc, Particle particle, double radius, double speed) {
        new BukkitRunnable() {
            double t = 0;
            @Override public void run() {
                World w = loc.getWorld();
                if (w == null || t > Math.PI * 5) { cancel(); return; }

                int strands = 3;
                for (int s = 0; s < strands; s++) {
                    double offset = s * (TWO_PI / strands);
                    double shrink = Math.max(0, 1.0 - t / (Math.PI * 5)); // shrinks as it rises
                    double r      = radius * (0.3 + 0.7 * shrink);
                    double x      = loc.getX() + Math.cos(t * 1.5 + offset) * r;
                    double z      = loc.getZ() + Math.sin(t * 1.5 + offset) * r;
                    double y      = loc.getY() + (t / (Math.PI * 5)) * 4.0;
                    w.spawnParticle(particle, x, y, z, 2, 0.03, 0.03, 0.03, 0.02);
                }

                t += 0.18 * speed;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    // ── SPHERE open: expanding sphere burst ───────────────────────────────────
    private void openSphereBurst(Location loc, Particle particle, double radius, int density) {
        new BukkitRunnable() {
            int tick = 0;
            @Override public void run() {
                World w = loc.getWorld();
                if (w == null || tick >= 14) { cancel(); return; }

                double progress = tick / 13.0;
                double r        = radius * 2.5 * easeOutCubic(progress);
                double golden   = Math.PI * (3 - Math.sqrt(5));
                int pts         = Math.max(6, (int)(density * (1 - progress * 0.6)));

                for (int i = 0; i < pts; i++) {
                    double phi   = Math.acos(1 - 2.0 * i / pts);
                    double theta = golden * i + tick * 0.3;
                    w.spawnParticle(particle,
                            loc.getX() + r * Math.sin(phi) * Math.cos(theta),
                            loc.getY() + 1.0 + r * Math.cos(phi),
                            loc.getZ() + r * Math.sin(phi) * Math.sin(theta),
                            1, 0, 0, 0, 0);
                }

                tick++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    // ── SPIRAL open: contracting vortex that collapses inward ────────────────
    private void openSpiralBurst(Location loc, Particle particle, double radius, double speed) {
        new BukkitRunnable() {
            double t = 0;
            @Override public void run() {
                World w = loc.getWorld();
                if (w == null || t > Math.PI * 6) { cancel(); return; }

                double progress = t / (Math.PI * 6);
                // Spiral contracts: starts wide, converges to center
                double r = radius * (1.0 - easeInCubic(progress));
                int pts  = 4;

                for (int i = 0; i < pts; i++) {
                    double angle = t * 4 + (TWO_PI / pts * i);
                    double y     = loc.getY() + 0.5 + progress * 2.5;
                    w.spawnParticle(particle,
                            loc.getX() + Math.cos(angle) * r, y,
                            loc.getZ() + Math.sin(angle) * r,
                            2, 0.03, 0.04, 0.03, 0.02);
                }

                t += 0.2 * speed;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    // ── RAIN open: shower of particles falling from height ───────────────────
    private void openShower(Location loc, Particle particle, double radius, int density) {
        new BukkitRunnable() {
            int tick = 0;
            @Override public void run() {
                World w = loc.getWorld();
                if (w == null || tick >= 25) { cancel(); return; }

                ThreadLocalRandom rng = ThreadLocalRandom.current();
                int perTick = Math.max(4, density / 3);

                for (int i = 0; i < perTick; i++) {
                    double angle = rng.nextDouble() * TWO_PI;
                    double r     = rng.nextDouble() * radius * 1.5;
                    w.spawnParticle(particle,
                            loc.getX() + Math.cos(angle) * r,
                            loc.getY() + 3.5 + rng.nextDouble(),
                            loc.getZ() + Math.sin(angle) * r,
                            1, 0.02, -0.2, 0.02, 0.01);
                }

                tick++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    // ── ORBIT open: cascade of orbiting rings at different heights ────────────
    private void openOrbitBurst(Location loc, Particle particle, double radius, double speed) {
        new BukkitRunnable() {
            double t = 0;
            @Override public void run() {
                World w = loc.getWorld();
                if (w == null || t > Math.PI * 4) { cancel(); return; }

                double progress = t / (Math.PI * 4);
                // 5 orbiting particles per ring, 3 rings
                for (int ring = 0; ring < 3; ring++) {
                    double ringPhase = ring * (TWO_PI / 3);
                    double ringR     = radius * (0.5 + ring * 0.4) * (1 + progress * 0.5);
                    double ringY     = loc.getY() + 0.6 + ring * 0.7;

                    for (int i = 0; i < 5; i++) {
                        double angle = t * (1.0 + ring * 0.4) + ringPhase + (TWO_PI / 5 * i);
                        w.spawnParticle(particle,
                                loc.getX() + Math.cos(angle) * ringR, ringY,
                                loc.getZ() + Math.sin(angle) * ringR,
                                1, 0, 0, 0, 0);
                    }
                }

                t += 0.15 * speed;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    // ── PULSE open: expanding shockwave ring + vertical beam ──────────────────
    private void openShockwave(Location loc, Particle particle, double radius, int density) {
        new BukkitRunnable() {
            int tick = 0;
            @Override public void run() {
                World w = loc.getWorld();
                if (w == null || tick >= 18) { cancel(); return; }

                double progress = tick / 17.0;
                double ease     = easeOutExpo(progress);

                // Outward ring
                double r    = radius * 3.0 * ease;
                int ringPts = Math.max(12, (int)(density * 1.5));
                double step = TWO_PI / ringPts;

                for (int i = 0; i < ringPts; i++) {
                    double angle = step * i;
                    w.spawnParticle(particle,
                            loc.getX() + Math.cos(angle) * r, loc.getY() + 0.1,
                            loc.getZ() + Math.sin(angle) * r,
                            1, 0, 0.02, 0, 0);
                }

                // Upward beam on early ticks
                if (tick < 8) {
                    double beamFrac = 1.0 - tick / 8.0;
                    double beamH    = beamFrac * 3.5;
                    for (int i = 0; i < 4; i++) {
                        w.spawnParticle(particle,
                                loc.getX() + 0.5 + (Math.random() - 0.5) * 0.2,
                                loc.getY() + Math.random() * beamH,
                                loc.getZ() + 0.5 + (Math.random() - 0.5) * 0.2,
                                1, 0, 0, 0, 0);
                    }
                }

                tick++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    /* ═══════════════════════════════════════════════════════════
       LIFECYCLE
       ═══════════════════════════════════════════════════════════ */

    public void stopIdleParticles(String crateId) {
        BukkitTask task = idleTasks.remove(crateId);
        if (task != null) task.cancel();
        phaseMap.remove(crateId);
    }

    public void startAll() {
        plugin.getCrateManager().getAllCrates().forEach(crate -> {
            if (crate.getLocation() != null && crate.isEnabled()) {
                startIdleParticles(crate);
            }
        });
    }

    public void stopAll() {
        idleTasks.values().forEach(t -> { try { t.cancel(); } catch (Exception ignored) {} });
        idleTasks.clear();
        phaseMap.clear();
    }

    /* ═══════════════════════════════════════════════════════════
       HELPERS
       ═══════════════════════════════════════════════════════════ */

    private static final double TWO_PI = Math.PI * 2;

    /** Smooth deceleration — fast start, slow end */
    private static double easeOutCubic(double t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /** Slow start, fast end */
    private static double easeInCubic(double t) {
        return t * t * t;
    }

    /** Extreme deceleration — great for expanding effects */
    private static double easeOutExpo(double t) {
        return t == 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    private AnimationType parseType(String name) {
        if (name == null || name.isEmpty()) return AnimationType.RING;
        try {
            return AnimationType.valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            Logger.warn("Unknown animation type: '" + name + "', defaulting to RING.");
            return AnimationType.RING;
        }
    }

    private Particle parseParticle(String name, Particle fallback) {
        if (name == null || name.isEmpty()) return fallback;
        try {
            return Particle.valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            Logger.warn("Unknown particle: '" + name + "', using fallback.");
            return fallback;
        }
    }

    private Location toLocation(Crate.SerializableLocation sl) {
        World world = plugin.getServer().getWorld(sl.world);
        if (world == null) return null;
        // Offset +0.5 to center on block
        return new Location(world, sl.x + 0.5, sl.y, sl.z + 0.5);
    }
}