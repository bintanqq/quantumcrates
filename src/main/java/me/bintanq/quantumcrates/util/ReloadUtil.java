package me.bintanq.quantumcrates.util;

import me.bintanq.quantumcrates.QuantumCrates;

public final class ReloadUtil {

    private ReloadUtil() {}

    public static void reloadAll(QuantumCrates plugin) {
        plugin.reloadConfig();
        MessageManager.init(plugin);
        plugin.getKeyManager().reload();

        if (plugin.getRarityManager() != null) plugin.getRarityManager().reload();
        if (plugin.getParticleManager() != null) plugin.getParticleManager().stopAll();
        if (plugin.getHologramManager() != null) plugin.getHologramManager().removeAll();

        plugin.getCrateManager().loadAllCrates();

        if (plugin.getHologramManager() != null) plugin.getHologramManager().spawnAll();
        if (plugin.getParticleManager() != null) plugin.getParticleManager().startAll();

        me.bintanq.quantumcrates.web.WebSocketBridge.getInstance().broadcastCrateUpdate(null);
        me.bintanq.quantumcrates.web.WebSocketBridge.getInstance()
                .broadcastRaritiesUpdate(plugin.getRarityManager().getAll());

        Logger.info("Full reload complete. &e"
                + plugin.getCrateManager().getAllCrates().size() + " &fcrates loaded, &e"
                + plugin.getRarityManager().getAll().size() + " &frarity tiers.");
    }
}