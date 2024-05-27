import * as fs from "node:fs";
import * as path from "node:path";
import {
    ChatInputCommandInteraction,
    Client,
    Collection,
    REST,
    RESTPostAPIApplicationCommandsJSONBody,
    Routes,
} from "discord.js";
import { BaseCommand } from "base/baseCommand.js";
import { BotClient } from "botclient.js";
import { Logger } from "util.js";

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

            Logger.info(`loaded command ${command.data.name}`);

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

export class CommandManager {
    readonly commands: Collection<string, BaseCommand> = new Collection();

    async loadCommands(commandsSubDirectory: string): Promise<void | Error> {

        const foldersPath = path.join(process.cwd(), commandsSubDirectory);
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFileNames = fs.readdirSync(commandsPath);

            for (const commandFile of commandFileNames) {

                const filePath = path.join(commandsPath, commandFile);

                const command: BaseCommand = (await import(filePath)).default.default;

                Logger.info(`loaded command ${command.name}`);

                this.commands.set(command.name, command);

            }
        }
    }

    async registerCommands() {
        if (this.commands.size === 0) {}
    }

    async handleCommand(client: BotClient, interaction: ChatInputCommandInteraction): Promise<void | Error> {

        const command = this.commands.get(interaction.commandName);

        if (command === undefined) return new Error(`No command found named '${interaction.commandName}'`);

        return command.execute(client, interaction);

    }
}