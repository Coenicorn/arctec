import { BaseCommand } from "base/baseCommand.js";
import { BotClient } from "botclient.js";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export class PingCommand extends BaseCommand {
    constructor() {
        super();

        this.setName("ping");
        this.setDescription("Tests bot activity status");
    }

    execute(client: BotClient, interaction: ChatInputCommandInteraction): Promise<void | Error> {
        
        interaction.reply({ embeds: new EmbedBuilder() })

    }
}