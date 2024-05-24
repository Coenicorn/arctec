import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getAudioPlayerWithInfo } from "../../player.js";
import { replyMention } from "../../util.js";

export default {
    data: new SlashCommandBuilder()
        .setName("stream")
        .setDescription("listen to a custom audio stream url"),
    async execute(interaction: ChatInputCommandInteraction) {
        replyMention(interaction, "This command has not yet been implementer kek", true);
    }
}