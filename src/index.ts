import {
    Client,
    Events,
    GatewayIntentBits,
} from "discord.js";
import * as dotenv from "dotenv";
import { handleCommand, loadCommands, registerCommands } from "./command.js";
import { initPlayers } from "./player.js";

dotenv.config();

(async ()=>{

    const token = process.env.TOKEN!;
    const clientId = process.env.CLIENTID!;

    if (token === undefined || clientId === undefined) {
        console.log("ERROR missing token or clientid");

        return;
    }

    await loadCommands().catch(e => console.error);
    await registerCommands(token, clientId, false, "1062342426934661130").catch(e => console.error(e));

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

})();