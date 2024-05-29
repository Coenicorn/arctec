import { Client, ClientOptions, SlashCommandBooleanOption } from "discord.js";
import { CommandManager } from "./helpers/commandManager.js";

export interface BotClientOptions extends ClientOptions {
    token: string;
    clientid: string;
}

export class BotClient extends Client {
    token: string;
    clientid: string;

    commandManager: CommandManager;

    constructor(options: BotClientOptions) {
        super(options);

        this.token = options.token;
        this.clientid = options.clientid;

        this.commandManager = new CommandManager();
    }
}