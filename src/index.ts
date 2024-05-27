import { Client, Events, GatewayIntentBits, VoiceChannel } from "discord.js";
import * as dotenv from "dotenv";
import { handleCommand, loadCommands, registerCommands } from "./helpers/commandManager.js";
import { globalConnections, initPlayers } from "./player.js";
import { BotClient } from "botclient.js";
import { Logger } from "util.js";

dotenv.config();

(async () => {
    const token = process.env.TOKEN;
    const clientid = process.env.CLIENTID;

    if (token === undefined || clientid === undefined) throw new Error("missing token or clientid");

    const client = new BotClient({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
        ],
        token,
        clientid
    });

    client.commandManager.load("commands");

    client.login(token);

    client.on("ready", async () => {
    });

    // also blatantly stolen from discord (but it's unlicensed so who cares >_>) (I really really REALLY hope it's actually unlicensed)
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        handleCommand(interaction);
    });
})();