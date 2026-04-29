package me.bintanq.quantumcrates.web;

import me.bintanq.quantumcrates.QuantumCrates;
import org.bukkit.Bukkit;
import org.bukkit.scheduler.BukkitTask;

import java.util.concurrent.atomic.AtomicLong;

public class StatsScheduler {

    private final QuantumCrates plugin;
    private BukkitTask task;
    private final AtomicLong openingsToday = new AtomicLong(0);

    public StatsScheduler(QuantumCrates plugin) {
        this.plugin = plugin;
    }

    public void start() {
        task = Bukkit.getScheduler().runTaskTimer(plugin, () -> {
            double tps = Bukkit.getTPS()[0];
            int online  = Bukkit.getOnlinePlayers().size();

            WebSocketBridge.getInstance().broadcastServerStats(online, tps, openingsToday.get());
        }, 600L, 600L);
    }

    public void stop() {
        if (task != null) task.cancel();
    }

    public void incrementOpenings() { openingsToday.incrementAndGet(); }

    public void resetDailyCounter() { openingsToday.set(0); }
}
