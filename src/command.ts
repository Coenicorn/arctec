import * as fs from "node:fs";
import * as path from "node:path";
import {
    ChatInputCommandInteraction,
    Collection,
    REST,
    RESTPostAPIApplicationCommandsJSONBody,
    Routes,
} from "discord.js";
import { Command } from "./types.js";
import { replyError } from "./util.js";

const globalCommands: Collection<string, Command> = new Collection();

export async function loadCommands(): Promise<Error | void> {
    // load commands programatically
    const foldersPath = path.join(__dirname, "commands");
    const commandFiles = fs.readdirSync(foldersPath);

    // allow subfolder
    for (const folderName of commandFiles) {
        // get individual command file names
        const commandsPath = path.join(foldersPath, folderName);
        const commandNames = fs.readdirSync(commandsPath);

        // console.log(commandNames);

        for (const fileName of commandNames) {
            // load command into variable
            const filePath = path.join(commandsPath, fileName);

            const command = (await import(filePath)).default.default;

            console.log(`loaded command ${command.data.name}`);

            globalCommands.set(command.data.name, command);
        }
    }
}

// this code is copied from the discordjs docs lol
// if it aint broke don't fix it
export async function registerCommands(
    token: string,
    clientId: string,
    isGlobal: boolean,
    guildId?: string
): Promise<void | Error> {
    if (globalCommands.size === 0) {
        return new Error(
            "refusing to load 0 commands, have you called loadCommands()?"
        );
    }

    const commands: Array<RESTPostAPIApplicationCommandsJSONBody> = [];

    globalCommands.each(command => {
        commands.push(command.data.toJSON());
    });

    // push commands to discord REST

    const rest = new REST().setToken(token);

    try {
        // console.log(`registering ${commands.length} commands...`);

        let route;

        if (!isGlobal) {
            if (guildId === undefined)
                return new Error("no guild id was specified");

            route = Routes.applicationGuildCommands(clientId, guildId);
        } else {
            route = Routes.applicationCommands(clientId);
        }

        const data = await rest.put(route, { body: commands });
    } catch (e) {
        console.error(e);
    }
}

export async function handleCommand(interaction: ChatInputCommandInteraction) {
    const command = globalCommands.get(interaction.commandName);
    const user = interaction.user;

    if (command === undefined) {
        interaction.reply({ content: `Couldn't find any command called ${interaction.commandName}`, ephemeral: true});

        return;
    }

    try {
        command.execute(interaction);
    } catch (e) {
        console.error(e);
        
        replyError(interaction);
    }
}