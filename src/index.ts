import { Client, Events, GatewayIntentBits, VoiceChannel } from "discord.js";
import * as dotenv from "dotenv";
import { CommandManager } from "./helpers/commandManager.js";
import { BotClient } from "./botclient.js";
import { Logger, safeReply, simpleEmbed } from "./util.js";

dotenv.config();

(async () => {
    const token = process.env.TOKEN;
    const clientid = process.env.CLIENTID;
    const guildid = process.env.GUILDID;

    if (token === undefined || clientid === undefined || guildid == undefined)
        throw new Error("missing token or clientid");

    const client = new BotClient({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
        ],
        token,
        clientid,
    });

    await client.commandManager.loadCommands("commands");
    await client.commandManager.registerCommands(client, false, guildid);

    client.login(token);

    client.on("ready", async () => {
        Logger.info("client ready");
    });

    // also blatantly stolen from discord (but it's unlicensed so who cares >_>) (I really really REALLY hope it's actually unlicensed)
    client.on(Events.InteractionCreate, (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        client.commandManager.handleCommand(client, interaction);
    });
})();
