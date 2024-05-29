import { ChatInputCommandInteraction } from "discord.js";
import { BaseCommand } from "../../base/baseCommand";
import { BotClient } from "../../botclient";
import { BaseExtractor, Player } from "discord-player"

class RadioExtractor extends BaseExtractor {

}

class PlayerCommand extends BaseCommand {
    constructor() {
        super();

        this.setName("radio")
        this.setDescription("plays the provided radio station");
        this.addStringOption(input => 
            input
                .setName("name")
                .setDescription("name of the the radio station")
                .setRequired(true)
        )
    }

    execute(client: BotClient, interaction: ChatInputCommandInteraction) {
        const player = new Player(client);

        player.extractors.store.
    }
}