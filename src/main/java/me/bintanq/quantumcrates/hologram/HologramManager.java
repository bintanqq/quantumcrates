package me.bintanq.quantumcrates.hologram;

import me.bintanq.quantumcrates.QuantumCrates;
import me.bintanq.quantumcrates.model.Crate;
import me.bintanq.quantumcrates.util.Logger;
import org.bukkit.Location;
import org.bukkit.World;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HologramManager {

    private final QuantumCrates plugin;
    private final HologramProvider provider;
    private final Map<String, List<Object>> hologramHandles = new HashMap<>();

    public HologramManager(QuantumCrates plugin) {
        this.plugin = plugin;
        String providerName = plugin.getConfig().getString("holograms.provider", "decentholograms");
        if ("decentholograms".equalsIgnoreCase(providerName)
                && plugin.getServer().getPluginManager().getPlugin("DecentHolograms") != null) {
            this.provider = new DecentHologramsProvider(plugin);
            Logger.info("Hologram provider: &aDecentHolograms");
        } else {
            this.provider = new PacketHologramProvider(plugin);
            Logger.info("Hologram provider: &aPacket (built-in)");
        }
    }

    public void spawnHologram(Crate crate) {
        removeHologram(crate.getId());
        if (crate.getLocations().isEmpty() || crate.getHologramLines().isEmpty()) return;

        List<Object> handles = new java.util.ArrayList<>();
        for (int i = 0; i < crate.getLocations().size(); i++) {
            Location loc = toLocation(crate, crate.getLocations().get(i));
            if (loc == null) continue;
            String holoKey = crate.getId() + "_" + i;
            Object handle = provider.createHologram(holoKey, loc, crate.getHologramLines());
            if (handle != null) handles.add(handle);
        }
        if (!handles.isEmpty()) hologramHandles.put(crate.getId(), handles);
    }

    public void removeHologram(String crateId) {
        List<Object> handles = hologramHandles.remove(crateId);
        if (handles != null) handles.forEach(provider::deleteHologram);
    }

    public void updateHologram(Crate crate) {
        List<Object> handles = hologramHandles.get(crate.getId());
        if (handles == null) { spawnHologram(crate); return; }
        handles.forEach(h -> provider.updateLines(h, crate.getHologramLines()));
    }

    public void removeAll() {
        hologramHandles.values().forEach(list -> list.forEach(provider::deleteHologram));
        hologramHandles.clear();
    }

    public void spawnAll() {
        plugin.getCrateManager().getAllCrates().stream()
                .filter(c -> c.getLocations() != null && !c.getHologramLines().isEmpty())
                .forEach(this::spawnHologram);
        Logger.info("Spawned &e" + hologramHandles.size() + " &fholograms.");
    }

    private Location toLocation(Crate crate, Crate.SerializableLocation sl) {
        World world = plugin.getServer().getWorld(sl.world);
        if (world == null) { Logger.warn("Hologram world not found: " + sl.world); return null; }
        double offset = crate.getHologramHeight() > 0 ? crate.getHologramHeight() : 1.2;
        return new Location(world, sl.x + 0.5, sl.y + offset, sl.z + 0.5, sl.yaw, sl.pitch);
    }
}