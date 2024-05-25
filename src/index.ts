import { Client, Events, GatewayIntentBits, VoiceChannel } from "discord.js";
import * as dotenv from "dotenv";
import { handleCommand, loadCommands, registerCommands } from "./command.js";
import { globalConnections, initPlayers } from "./player.js";

dotenv.config();

(async () => {
    const token = process.env.TOKEN!;
    const clientId = process.env.CLIENTID!;

    if (token === undefined || clientId === undefined) {
        console.log("ERROR missing token or clientid");

        return;
    }

    await loadCommands().catch((e) => console.error);
    await registerCommands(token, clientId, false, "1062342426934661130").catch(
        (e) => console.error(e)
    );

    initPlayers();

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
        ],
    });

    client.login(token);

    client.on("ready", async () => {
        console.log(
            `\n****************\nClient ready\nTOKEN=${token}\nCLIENTID=${clientId}\n****************\n`
        );
    });

    // also blatantly stolen from discord (but it's unlicensed so who cares >_>) (I really really REALLY hope it's actually unlicensed)
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        handleCommand(interaction);
    });

    client.on(Events.VoiceStateUpdate, (oldState, newState) => {
        // check if the bot is in any voice channels
        const guildid = newState.guild.id;
        const data = globalConnections.get(guildid);

        // no current connections
        if (data === undefined || data.connection.state.status === "destroyed") return;

        if (
            newState.channelId === data.connection.joinConfig.channelId &&
            data.timer !== null
        ) {
            // someone has joined the voice channel the bot is in
            // reset leave timer
            clearTimeout(data.timer);

            return;
        }
        
        // check amount of users in voice channel bot is in
        const channel = client.channels.cache.get(data.connection.joinConfig.channelId! /* connection isn't destroyed so this always exists */);

        if (channel === undefined || !channel.isVoiceBased()) return;

        if (channel.members.size === 1) {
            // if only the bot is in the voice channel, set a leave timeout
            data.timer = setTimeout(() => {
                data.connection.destroy();

                data.callerChannel.send("I left the voice channel due to loneliness :(");

                globalConnections.delete(guildid);
            }, 1000);
        }
    });
})();
