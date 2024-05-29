import { BaseCommand } from "../../base/baseCommand.js";
import { BotClient } from "../../botclient.js";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Logger, safeReply, simpleEmbed } from "../../util.js";

class PingCommand extends BaseCommand {
    constructor() {
        super();

        this.setName("ping");
        this.setDescription("Tests bot activity status");
    }

    async execute(
        client: BotClient,
        interaction: ChatInputCommandInteraction
    ) {

        safeReply(interaction, {content: "Bot is up and running!"});

    }
}

export default new PingCommand();