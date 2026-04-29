package me.bintanq.quantumcrates.manager;

import me.bintanq.quantumcrates.database.DatabaseManager;
import me.bintanq.quantumcrates.model.PlayerData;
import me.bintanq.quantumcrates.util.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

public class PlayerDataManager {

    private final DatabaseManager db;
    private final Executor asyncExecutor;
    private final ConcurrentHashMap<UUID, PlayerData> cache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, Boolean> dirtySet = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, CompletableFuture<PlayerData>> pendingLoads = new ConcurrentHashMap<>();

    public PlayerDataManager(DatabaseManager db, Executor asyncExecutor) {
        this.db = db;
        this.asyncExecutor = asyncExecutor;
    }

    public CompletableFuture<PlayerData> loadPlayer(UUID uuid) {
        PlayerData cached = cache.get(uuid);
        if (cached != null) return CompletableFuture.completedFuture(cached);
        return pendingLoads.computeIfAbsent(uuid, id ->
                db.loadPlayerData(id).thenApply(data -> {
                    cache.put(id, data);
                    pendingLoads.remove(id);
                    return data;
                })
        );
    }

    public void unloadPlayer(UUID uuid) {
        PlayerData data = cache.remove(uuid);
        if (data != null && isDirty(uuid)) {
            data.setLastSeen(System.currentTimeMillis());
            db.savePlayerData(data);
            dirtySet.remove(uuid);
        }
    }

    public PlayerData getOrEmpty(UUID uuid) {
        return cache.getOrDefault(uuid, new PlayerData(uuid));
    }

    public void markDirty(UUID uuid) {
        dirtySet.put(uuid, Boolean.TRUE);
    }

    public boolean isDirty(UUID uuid) {
        return dirtySet.containsKey(uuid);
    }

    /** Mutates player data in-cache and marks dirty in one step. */
    private void mutateData(UUID uuid, java.util.function.Consumer<PlayerData> mutation) {
        PlayerData data = getOrEmpty(uuid);
        mutation.accept(data);
        cache.put(uuid, data);
        markDirty(uuid);
    }

    public int getPity(UUID uuid, String crateId) {
        return getOrEmpty(uuid).getPity(crateId);
    }

    public void incrementPity(UUID uuid, String crateId) {
        mutateData(uuid, data -> data.incrementPity(crateId));
    }

    public void resetPity(UUID uuid, String crateId) {
        mutateData(uuid, data -> data.resetPity(crateId));
    }

    public boolean isOnCooldown(UUID uuid, String crateId, long cooldownMs) {
        return getOrEmpty(uuid).isOnCooldown(crateId, cooldownMs);
    }

    public long getRemainingCooldown(UUID uuid, String crateId, long cooldownMs) {
        return getOrEmpty(uuid).getRemainingCooldown(crateId, cooldownMs);
    }

    public void setLastOpen(UUID uuid, String crateId) {
        mutateData(uuid, data -> data.setLastOpen(crateId, System.currentTimeMillis()));
    }

    public void flushAll() {
        List<PlayerData> dirty = new ArrayList<>();
        for (UUID uuid : dirtySet.keySet()) {
            PlayerData data = cache.get(uuid);
            if (data != null) {
                data.setLastSeen(System.currentTimeMillis());
                dirty.add(data);
            }
        }
        if (!dirty.isEmpty()) {
            try {
                db.savePlayerDataBatch(dirty).get(10, TimeUnit.SECONDS);
                Logger.info("Flushed &e" + dirty.size() + " &fplayer data entries.");
            } catch (Exception e) {
                Logger.severe("Failed to flush player data on shutdown: " + e.getMessage());
            }
        }
        dirtySet.clear();
        cache.clear();
    }
}