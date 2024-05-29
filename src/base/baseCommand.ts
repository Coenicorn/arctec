import { BotClient } from "../botclient.js";
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder, ChatInputCommandInteraction } from "discord.js";

export type SlashCommandBuilderOutput = SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

export abstract class BaseCommand extends SlashCommandBuilder {
    constructor() {
        super();
    }

    abstract execute(client: BotClient, interaction: ChatInputCommandInteraction): void;
}