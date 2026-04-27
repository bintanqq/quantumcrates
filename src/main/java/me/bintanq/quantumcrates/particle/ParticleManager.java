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

public class ParticleManager {

    public enum AnimationType {
        RING, HELIX, SPHERE, SPIRAL, RAIN, NONE
    }

    private final QuantumCrates plugin;
    private final Map<String, BukkitTask> idleTasks = new HashMap<>();

    public ParticleManager(QuantumCrates plugin) {
        this.plugin = plugin;
    }

    /* ─────────────────────── Idle ─────────────────────── */

    public void startIdleParticles(Crate crate) {
        stopIdleParticles(crate.getId());
        if (crate.getLocation() == null) return;

        Location loc = toLocation(crate.getLocation());
        if (loc == null) return;

        Crate.AnimationConfig cfg = crate.getIdleAnimation();
        AnimationType type = parseType(cfg.getType());
        if (type == AnimationType.NONE) return;

        Particle particle = parseParticle(cfg.getParticle(), Particle.HAPPY_VILLAGER);
        long interval    = plugin.getConfig().getLong("particles.idle-interval", 2L);

        BukkitTask task = switch (type) {
            case RING   -> startRing(loc, particle, cfg, interval);
            case HELIX  -> startHelix(loc, particle, cfg, interval);
            case SPHERE -> startSphere(loc, particle, cfg, interval);
            case SPIRAL -> startSpiral(loc, particle, cfg, interval);
            case RAIN   -> startRain(loc, particle, cfg, interval);
            default     -> null;
        };

        if (task != null) idleTasks.put(crate.getId(), task);
    }

    /* ── RING — lingkaran berputar horizontal ── */
    private BukkitTask startRing(Location loc, Particle particle, Crate.AnimationConfig cfg, long interval) {
        return new BukkitRunnable() {
            double angle = 0;
            @Override public void run() {
                if (loc.getWorld() == null) { cancel(); return; }
                int density = cfg.getDensity();
                double radius = cfg.getRadius();
                for (int i = 0; i < density; i++) {
                    double theta = angle + (Math.PI * 2 / density * i);
                    double x = loc.getX() + 0.5 + Math.cos(theta) * radius;
                    double z = loc.getZ() + 0.5 + Math.sin(theta) * radius;
                    double y = loc.getY() + 1.2;
                    loc.getWorld().spawnParticle(particle, x, y, z, 1, 0, 0, 0, 0);
                }
                angle += 0.15 * cfg.getSpeed();
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    /* ── HELIX — dua spiral naik turun ── */
    private BukkitTask startHelix(Location loc, Particle particle, Crate.AnimationConfig cfg, long interval) {
        return new BukkitRunnable() {
            double t = 0;
            @Override public void run() {
                if (loc.getWorld() == null) { cancel(); return; }
                double radius = cfg.getRadius();
                double height = 2.0;
                // 2 helix berlawanan
                for (int strand = 0; strand < 2; strand++) {
                    double offset = strand * Math.PI;
                    double x = loc.getX() + 0.5 + Math.cos(t + offset) * radius;
                    double z = loc.getZ() + 0.5 + Math.sin(t + offset) * radius;
                    double y = loc.getY() + (t % (Math.PI * 2)) / (Math.PI * 2) * height;
                    loc.getWorld().spawnParticle(particle, x, y, z, 1, 0, 0, 0, 0);
                }
                t += 0.2 * cfg.getSpeed();
                if (t > Math.PI * 2 * 4) t = 0;
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    /* ── SPHERE — titik-titik tersebar di bola ── */
    private BukkitTask startSphere(Location loc, Particle particle, Crate.AnimationConfig cfg, long interval) {
        return new BukkitRunnable() {
            double angle = 0;
            @Override public void run() {
                if (loc.getWorld() == null) { cancel(); return; }
                double radius = cfg.getRadius();
                int density = cfg.getDensity();
                for (int i = 0; i < density; i++) {
                    double phi   = Math.acos(1 - 2.0 * i / density);
                    double theta = Math.PI * (1 + Math.sqrt(5)) * i + angle;
                    double x = loc.getX() + 0.5 + radius * Math.sin(phi) * Math.cos(theta);
                    double y = loc.getY() + 1.0 + radius * Math.cos(phi);
                    double z = loc.getZ() + 0.5 + radius * Math.sin(phi) * Math.sin(theta);
                    loc.getWorld().spawnParticle(particle, x, y, z, 1, 0, 0, 0, 0);
                }
                angle += 0.1 * cfg.getSpeed();
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    /* ── SPIRAL — spiral naik ke atas lalu reset ── */
    private BukkitTask startSpiral(Location loc, Particle particle, Crate.AnimationConfig cfg, long interval) {
        return new BukkitRunnable() {
            double t = 0;
            @Override public void run() {
                if (loc.getWorld() == null) { cancel(); return; }
                double radius = cfg.getRadius() * (1 - t / (Math.PI * 4));
                double x = loc.getX() + 0.5 + Math.cos(t * 3) * radius;
                double z = loc.getZ() + 0.5 + Math.sin(t * 3) * radius;
                double y = loc.getY() + t / (Math.PI * 2) * 1.5;
                loc.getWorld().spawnParticle(particle, x, y, z, 1, 0, 0, 0, 0);
                t += 0.15 * cfg.getSpeed();
                if (t > Math.PI * 4) t = 0;
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    /* ── RAIN — particle jatuh dari atas ── */
    private BukkitTask startRain(Location loc, Particle particle, Crate.AnimationConfig cfg, long interval) {
        return new BukkitRunnable() {
            @Override public void run() {
                if (loc.getWorld() == null) { cancel(); return; }
                double radius = cfg.getRadius();
                int density = cfg.getDensity();
                for (int i = 0; i < density; i++) {
                    double x = loc.getX() + 0.5 + (Math.random() * 2 - 1) * radius;
                    double z = loc.getZ() + 0.5 + (Math.random() * 2 - 1) * radius;
                    double y = loc.getY() + 2.5;
                    loc.getWorld().spawnParticle(particle, x, y, z, 1, 0, -0.1, 0, 0.01);
                }
            }
        }.runTaskTimer(plugin, 0L, interval);
    }

    /* ─────────────────────── Open Effect ─────────────────────── */

    public void playOpenEffect(Crate crate, Location playerLocation) {
        Crate.AnimationConfig cfg = crate.getOpenAnimation();
        AnimationType type = parseType(cfg.getType());
        Particle particle  = parseParticle(cfg.getParticle(), Particle.FIREWORK);
        World world = playerLocation.getWorld();
        if (world == null) return;

        switch (type) {
            case RING   -> playOpenRing(playerLocation, particle, cfg);
            case HELIX  -> playOpenHelix(playerLocation, particle, cfg);
            case SPHERE -> playOpenSphere(playerLocation, particle, cfg);
            case SPIRAL -> playOpenSpiral(playerLocation, particle, cfg);
            case RAIN   -> playOpenRain(playerLocation, particle, cfg);
            default     -> playOpenBurst(playerLocation, particle); // fallback
        }
    }

    private void playOpenBurst(Location loc, Particle particle) {
        new BukkitRunnable() {
            int tick = 0;
            @Override public void run() {
                if (tick >= 10 || loc.getWorld() == null) { cancel(); return; }
                double radius = 0.3 + tick * 0.15;
                double y = loc.getY() + 1.0 + tick * 0.1;
                for (int i = 0; i < 16; i++) {
                    double theta = Math.PI * 2 / 16 * i;
                    loc.getWorld().spawnParticle(particle,
                            loc.getX() + Math.cos(theta) * radius, y,
                            loc.getZ() + Math.sin(theta) * radius,
                            2, 0.05, 0.05, 0.05, 0.02);
                }
                tick++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    private void playOpenRing(Location loc, Particle particle, Crate.AnimationConfig cfg) {
        new BukkitRunnable() {
            int tick = 0;
            double angle = 0;
            @Override public void run() {
                if (tick >= 20 || loc.getWorld() == null) { cancel(); return; }
                double radius = cfg.getRadius() * (1 + tick * 0.1);
                for (int i = 0; i < 16; i++) {
                    double theta = angle + Math.PI * 2 / 16 * i;
                    loc.getWorld().spawnParticle(particle,
                            loc.getX() + Math.cos(theta) * radius,
                            loc.getY() + 1.0,
                            loc.getZ() + Math.sin(theta) * radius,
                            1, 0, 0, 0, 0);
                }
                angle += 0.3 * cfg.getSpeed();
                tick++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    private void playOpenHelix(Location loc, Particle particle, Crate.AnimationConfig cfg) {
        new BukkitRunnable() {
            double t = 0;
            @Override public void run() {
                if (t > Math.PI * 6 || loc.getWorld() == null) { cancel(); return; }
                for (int strand = 0; strand < 3; strand++) {
                    double offset = strand * (Math.PI * 2 / 3);
                    double x = loc.getX() + Math.cos(t + offset) * cfg.getRadius();
                    double z = loc.getZ() + Math.sin(t + offset) * cfg.getRadius();
                    double y = loc.getY() + t / (Math.PI * 6) * 3.0;
                    loc.getWorld().spawnParticle(particle, x, y, z, 1, 0, 0, 0, 0);
                }
                t += 0.2 * cfg.getSpeed();
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    private void playOpenSphere(Location loc, Particle particle, Crate.AnimationConfig cfg) {
        new BukkitRunnable() {
            int tick = 0;
            @Override public void run() {
                if (tick >= 15 || loc.getWorld() == null) { cancel(); return; }
                double radius = cfg.getRadius() * tick * 0.15;
                int points = 20;
                for (int i = 0; i < points; i++) {
                    double phi   = Math.acos(1 - 2.0 * i / points);
                    double theta = Math.PI * (1 + Math.sqrt(5)) * i;
                    loc.getWorld().spawnParticle(particle,
                            loc.getX() + radius * Math.sin(phi) * Math.cos(theta),
                            loc.getY() + 1.0 + radius * Math.cos(phi),
                            loc.getZ() + radius * Math.sin(phi) * Math.sin(theta),
                            1, 0, 0, 0, 0);
                }
                tick++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    private void playOpenSpiral(Location loc, Particle particle, Crate.AnimationConfig cfg) {
        new BukkitRunnable() {
            double t = 0;
            @Override public void run() {
                if (t > Math.PI * 4 || loc.getWorld() == null) { cancel(); return; }
                double radius = cfg.getRadius() * (1 - t / (Math.PI * 4));
                for (int i = 0; i < 3; i++) {
                    double offset = i * Math.PI * 2 / 3;
                    loc.getWorld().spawnParticle(particle,
                            loc.getX() + Math.cos(t * 4 + offset) * radius,
                            loc.getY() + t / (Math.PI * 2) * 2.0,
                            loc.getZ() + Math.sin(t * 4 + offset) * radius,
                            1, 0, 0, 0, 0);
                }
                t += 0.15 * cfg.getSpeed();
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    private void playOpenRain(Location loc, Particle particle, Crate.AnimationConfig cfg) {
        new BukkitRunnable() {
            int tick = 0;
            @Override public void run() {
                if (tick >= 30 || loc.getWorld() == null) { cancel(); return; }
                double radius = cfg.getRadius() * 1.5;
                for (int i = 0; i < cfg.getDensity(); i++) {
                    loc.getWorld().spawnParticle(particle,
                            loc.getX() + (Math.random() * 2 - 1) * radius,
                            loc.getY() + 3.0,
                            loc.getZ() + (Math.random() * 2 - 1) * radius,
                            1, 0, -0.15, 0, 0.01);
                }
                tick++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    /* ─────────────────────── Lifecycle ─────────────────────── */

    public void stopIdleParticles(String crateId) {
        BukkitTask task = idleTasks.remove(crateId);
        if (task != null) task.cancel();
    }

    public void startAll() {
        plugin.getCrateManager().getAllCrates().forEach(crate -> {
            if (crate.getLocation() != null && crate.isEnabled()) {
                startIdleParticles(crate);
            }
        });
    }

    public void stopAll() {
        idleTasks.values().forEach(BukkitTask::cancel);
        idleTasks.clear();
    }

    /* ─────────────────────── Helpers ─────────────────────── */

    private AnimationType parseType(String name) {
        if (name == null) return AnimationType.RING;
        try { return AnimationType.valueOf(name.toUpperCase()); }
        catch (IllegalArgumentException e) { return AnimationType.RING; }
    }

    private Particle parseParticle(String name, Particle fallback) {
        if (name == null || name.isEmpty()) return fallback;
        try { return Particle.valueOf(name.toUpperCase()); }
        catch (IllegalArgumentException e) {
            Logger.warn("Unknown particle: '" + name + "', using fallback.");
            return fallback;
        }
    }

    private Location toLocation(Crate.SerializableLocation sl) {
        var world = plugin.getServer().getWorld(sl.world);
        if (world == null) return null;
        return new Location(world, sl.x + 0.5, sl.y, sl.z + 0.5);
    }
}