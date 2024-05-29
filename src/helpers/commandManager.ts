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
import { BaseCommand } from "../base/baseCommand";
import { BotClient } from "../botclient.js";
import { Logger, safeReply, simpleEmbed } from "../util.js";

// const globalCommands: Collection<string, Command> = new Collection();

// export async function loadCommands(): Promise<Error | void> {
//     // load commands programatically
//     const foldersPath = path.join(__dirname, "commands");
//     const commandFiles = fs.readdirSync(foldersPath);

//     // allow subfolder
//     for (const folderName of commandFiles) {
//         // get individual command file names
//         const commandsPath = path.join(foldersPath, folderName);
//         const commandNames = fs.readdirSync(commandsPath);

//         // console.log(commandNames);

//         for (const fileName of commandNames) {
//             // load command into variable
//             const filePath = path.join(commandsPath, fileName);

//             const command = (await import(filePath)).default.default;

//             Logger.info(`loaded command ${command.data.name}`);

//             globalCommands.set(command.data.name, command);
//         }
//     }
// }

// // this code is copied from the discordjs docs lol
// // if it aint broke don't fix it
// export async function registerCommands(
//     token: string,
//     clientId: string,
//     isGlobal: boolean,
//     guildId?: string
// ): Promise<void | Error> {
//     if (globalCommands.size === 0) {
//         return new Error(
//             "refusing to load 0 commands, have you called loadCommands()?"
//         );
//     }

//     const commands: Array<RESTPostAPIApplicationCommandsJSONBody> = [];

//     globalCommands.each(command => {
//         commands.push(command.data.toJSON());
//     });

//     // push commands to discord REST

//     const rest = new REST().setToken(token);

//     try {
//         // console.log(`registering ${commands.length} commands...`);

//         let route;

//         if (!isGlobal) {
//             if (guildId === undefined)
//                 return new Error("no guild id was specified");

//             route = Routes.applicationGuildCommands(clientId, guildId);
//         } else {
//             route = Routes.applicationCommands(clientId);
//         }

//         const data = await rest.put(route, { body: commands });
//     } catch (e) {
//         Logger.error(e);
//     }
// }

export class CommandManager {
    readonly commands: Collection<string, BaseCommand> = new Collection();

    async loadCommands(commandsSubDirectory: string): Promise<void | Error> {
        const foldersPath = path.join(
            path.join(__dirname, "../"),
            commandsSubDirectory
        );
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFileNames = fs
                .readdirSync(commandsPath)
                .filter((v) => v.endsWith(".js"));

            for (const commandFile of commandFileNames) {
                const filePath = path.join(commandsPath, commandFile);

                const command: BaseCommand = (await import(filePath)).default
                    .default;

                Logger.info(`loaded command ${command.name}`);

                this.commands.set(command.name, command);
            }
        }
    }

    async registerCommands(
        client: BotClient,
        global = false,
        guildid: string | null = null
    ): Promise<Error | void> {
        if (this.commands.size === 0)
            return Promise.reject(
                new Error("no commands loaded to be registered")
            );

        const commands: Array<RESTPostAPIApplicationCommandsJSONBody> = [];

        this.commands.each((cmd) => {
            commands.push(cmd.toJSON());
        });

        try {
            let route;

            if (global) route = Routes.applicationCommands(client.clientid);
            else if (guildid === null)
                /*missing guildid*/ return Promise.reject(
                    new Error("Guild id not specified")
                );
            else
                route = Routes.applicationGuildCommands(
                    client.clientid,
                    guildid
                );

            Logger.info(`registered ${commands.length} commands`);

            const rest = new REST().setToken(client.token);

            const data = await rest.put(route, { body: commands });
        } catch (e) {
            return Promise.reject(
                new Error("something went wrong registering the commands")
            );
        }
    }

    async handleCommand(
        client: BotClient,
        interaction: ChatInputCommandInteraction
    ) {
        const command = this.commands.get(interaction.commandName);

        if (command === undefined) {
            Logger.error(`No command found named '${interaction.commandName}'`);

            interaction.reply(`No command found named '${interaction.commandName}'`);

            return;
        }

        // defer reply if it takes too long
        const timeout = setTimeout(() => {
            if (!interaction.replied) interaction.deferReply();
        }, 1000);

        try {
            command.execute(client, interaction);
            
            clearTimeout(timeout);
        } catch(e) {
            Logger.error("Command error");
            console.error(e);

            safeReply(interaction, {content: "Someting went wrong running this command"});
        }
    }
}
