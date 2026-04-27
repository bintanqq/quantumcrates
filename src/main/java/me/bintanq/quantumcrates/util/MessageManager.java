package me.bintanq.quantumcrates.util;

import me.bintanq.quantumcrates.QuantumCrates;
import org.bukkit.command.CommandSender;

/**
 * MessageManager — ZERO hardcoded messages.
 *
 * All chat messages are read from config.yml section "messages".
 * All GUI messages are read from config.yml section "gui-messages".
 * Both can be overridden from the Web Dashboard without a restart.
 *
 * Usage:
 *   MessageManager.send(player, "reward-received", "{reward}", "Diamond");
 *   MessageManager.getGui("prev-button-name");
 *   MessageManager.getGui("info-pity-label", "{pity}", "5", "{pity_max}", "100");
 */
public final class MessageManager {

    private static QuantumCrates plugin;

    private MessageManager() {}

    public static void init(QuantumCrates p) { plugin = p; }

    /* ─────────────────────── Chat Messages ─────────────────────── */

    /**
     * Send a chat message with prefix and placeholder replacement.
     * Placeholder format: key-value pairs, e.g. "{player}", "Steve", "{amount}", "5"
     */
    public static void send(CommandSender sender, String key, String... placeholders) {
        sender.sendMessage(get(key, placeholders));
    }

    public static void sendRaw(CommandSender sender, String key, String... placeholders) {
        sender.sendMessage(getRaw(key, placeholders));
    }

    /**
     * Get a chat message with prefix applied.
     */
    public static String get(String key, String... placeholders) {
        String prefix = getRaw("prefix");
        String msg    = getRaw(key, placeholders);
        return color(prefix + msg);
    }

    /**
     * Get a chat message without prefix.
     */
    public static String getRaw(String key, String... placeholders) {
        String msg = plugin.getConfig().getString("messages." + key,
                "[MSG NOT FOUND: " + key + "]");
        for (int i = 0; i + 1 < placeholders.length; i += 2) {
            msg = msg.replace(placeholders[i], placeholders[i + 1]);
        }
        return color(msg);
    }

    public static boolean has(String key) {
        return plugin.getConfig().contains("messages." + key);
    }

    /* ─────────────────────── GUI Messages ─────────────────────── */

    /**
     * Get a GUI message (inventory item name / lore) with placeholder replacement.
     * Reads from config.yml section "gui-messages".
     * Returns colorized string, empty string if key not found.
     */
    public static String getGui(String key, String... placeholders) {
        String msg = plugin.getConfig().getString("gui-messages." + key, "");
        for (int i = 0; i + 1 < placeholders.length; i += 2) {
            msg = msg.replace(placeholders[i], placeholders[i + 1]);
        }
        return color(msg);
    }

    /**
     * Check if a GUI message key exists.
     */
    public static boolean hasGui(String key) {
        return plugin.getConfig().contains("gui-messages." + key);
    }

    /* ─────────────────────── Convenience Senders ─────────────────────── */

    public static void sendNoPermission(CommandSender sender) {
        send(sender, "no-permission");
    }

    public static void sendPlayerOnly(CommandSender sender) {
        send(sender, "player-only");
    }

    public static void sendPlayerNotFound(CommandSender sender, String name) {
        send(sender, "player-not-found", "{player}", name);
    }

    public static void sendCrateNotFound(CommandSender sender, String crateId) {
        send(sender, "crate-not-found", "{crate}", crateId);
    }

    public static void sendInvalidNumber(CommandSender sender) {
        send(sender, "invalid-number");
    }

    public static void sendReloadSuccess(CommandSender sender) {
        send(sender, "reload-success");
    }

    /* ─────────────────────── Broadcast ─────────────────────── */

    public static void broadcast(String key, String... placeholders) {
        plugin.getServer().broadcastMessage(get(key, placeholders));
    }

    /* ─────────────────────── Colorize ─────────────────────── */

    public static String color(String s) {
        return s == null ? "" : s.replace("&", "\u00A7");
    }
}