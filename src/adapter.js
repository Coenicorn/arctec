"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiscordJSAdapter = void 0;
var v10_1 = require("discord-api-types/v10");
var discord_js_1 = require("discord.js");
var adapters = new Map();
var trackedClients = new Set();
var trackedShards = new Map();
/**
 * Tracks a Discord.js client, listening to VOICE_SERVER_UPDATE and VOICE_STATE_UPDATE events
 *
 * @param client - The Discord.js Client to track
 */
function trackClient(client) {
    if (trackedClients.has(client))
        return;
    trackedClients.add(client);
    client.ws.on(v10_1.GatewayDispatchEvents.VoiceServerUpdate, function (payload) {
        var _a;
        (_a = adapters.get(payload.guild_id)) === null || _a === void 0 ? void 0 : _a.onVoiceServerUpdate(payload);
    });
    client.ws.on(v10_1.GatewayDispatchEvents.VoiceStateUpdate, function (payload) {
        var _a, _b;
        if (payload.guild_id && payload.session_id && payload.user_id === ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id)) {
            (_b = adapters.get(payload.guild_id)) === null || _b === void 0 ? void 0 : _b.onVoiceStateUpdate(payload);
        }
    });
    client.on(discord_js_1.Events.ShardDisconnect, function (_, shardId) {
        var _a;
        var guilds = trackedShards.get(shardId);
        if (guilds) {
            for (var _i = 0, _b = guilds.values(); _i < _b.length; _i++) {
                var guildID = _b[_i];
                (_a = adapters.get(guildID)) === null || _a === void 0 ? void 0 : _a.destroy();
            }
        }
        trackedShards.delete(shardId);
    });
}
function trackGuild(guild) {
    var guilds = trackedShards.get(guild.shardId);
    if (!guilds) {
        guilds = new Set();
        trackedShards.set(guild.shardId, guilds);
    }
    guilds.add(guild.id);
}
/**
 * Creates an adapter for a Voice Channel.
 *
 * @param channel - The channel to create the adapter for
 */
function createDiscordJSAdapter(channel) {
    return function (methods) {
        adapters.set(channel.guild.id, methods);
        trackClient(channel.client);
        trackGuild(channel.guild);
        return {
            sendPayload: function (data) {
                if (channel.guild.shard.status === discord_js_1.Status.Ready) {
                    channel.guild.shard.send(data);
                    return true;
                }
                return false;
            },
            destroy: function () {
                return adapters.delete(channel.guild.id);
            },
        };
    };
}
exports.createDiscordJSAdapter = createDiscordJSAdapter;
