import { GatewayDispatchEvents, } from 'discord-api-types/v10';
import { Events, Status } from 'discord.js';
const adapters = new Map();
const trackedClients = new Set();
const trackedShards = new Map();
/**
 * Tracks a Discord.js client, listening to VOICE_SERVER_UPDATE and VOICE_STATE_UPDATE events
 *
 * @param client - The Discord.js Client to track
 */
function trackClient(client) {
    if (trackedClients.has(client))
        return;
    trackedClients.add(client);
    client.ws.on(GatewayDispatchEvents.VoiceServerUpdate, (payload) => {
        var _a;
        (_a = adapters.get(payload.guild_id)) === null || _a === void 0 ? void 0 : _a.onVoiceServerUpdate(payload);
    });
    client.ws.on(GatewayDispatchEvents.VoiceStateUpdate, (payload) => {
        var _a, _b;
        if (payload.guild_id && payload.session_id && payload.user_id === ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id)) {
            (_b = adapters.get(payload.guild_id)) === null || _b === void 0 ? void 0 : _b.onVoiceStateUpdate(payload);
        }
    });
    client.on(Events.ShardDisconnect, (_, shardId) => {
        var _a;
        const guilds = trackedShards.get(shardId);
        if (guilds) {
            for (const guildID of guilds.values()) {
                (_a = adapters.get(guildID)) === null || _a === void 0 ? void 0 : _a.destroy();
            }
        }
        trackedShards.delete(shardId);
    });
}
function trackGuild(guild) {
    let guilds = trackedShards.get(guild.shardId);
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
export function createDiscordJSAdapter(channel) {
    return (methods) => {
        adapters.set(channel.guild.id, methods);
        trackClient(channel.client);
        trackGuild(channel.guild);
        return {
            sendPayload(data) {
                if (channel.guild.shard.status === Status.Ready) {
                    channel.guild.shard.send(data);
                    return true;
                }
                return false;
            },
            destroy() {
                return adapters.delete(channel.guild.id);
            },
        };
    };
}
