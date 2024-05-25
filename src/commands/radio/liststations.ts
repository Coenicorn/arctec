import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getAudioPlayerWithInfo } from "../../player.js";
import { Command } from "../../types.js";
import { radioUrlsToString, replyEmbedSimple } from "../../util.js";

export default {
    data: new SlashCommandBuilder()
        .setName("liststations")
        .setDescription("list all available radio stations. Optional search inputs")
        .addStringOption(input => 
            input.
                setName("name")
                .setDescription("name of the source name")
        )
        .addStringOption(input => 
            input.
                setName("station")
                .setDescription("name of the source radio station")
        ),
    async execute(interaction: ChatInputCommandInteraction) {

        const name = interaction.options.getString('name', false);
        const station = interaction.options.getString('station', false);

        const matches = await getAudioPlayerWithInfo(name, station);

        let str = "Stations found: \n" + radioUrlsToString(matches);

        replyEmbedSimple(interaction, str, true);
    }
}