import { BaseCommand } from "base/baseCommand.js";
import { BotClient } from "botclient.js";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { simpleEmbed } from "util.js";

export class PingCommand extends BaseCommand {
    constructor() {
        super();

        this.setName("ping");
        this.setDescription("Tests bot activity status");
    }

    async execute(client: BotClient, interaction: ChatInputCommandInteraction): Promise<Error | void> {
        
        interaction.reply({ embeds: simpleEmbed("this is a message") });

    }
}