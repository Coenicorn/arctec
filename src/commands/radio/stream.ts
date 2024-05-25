import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getAudioPlayerWithInfo } from "../../player.js";
import { replyEmbedSimple } from "../../util.js";

export default {
    data: new SlashCommandBuilder()
        .setName("stream")
        .setDescription("listen to a custom audio stream url"),
    async execute(interaction: ChatInputCommandInteraction) {
        replyEmbedSimple(interaction, "This command has not yet been implemented kek");
    }
}