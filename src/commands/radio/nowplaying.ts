import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js";
import { globalConnections } from "../../player.js";
import { replyMention } from "../../util.js";

export default {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("list the currently playing radio station"),
    async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember | null;
        if (member === null) {
            replyMention(interaction, "Something went wrong trying to run this command", true);

            return;
        }
        const channel = member.voice.channel as VoiceChannel | null;
        if (channel === null) {
            replyMention(interaction, "Something went wrong trying to run this command", true);

            return;
        }
        const guildid = interaction.guildId;
        if (guildid === null) {
            replyMention(interaction, "Something went wrong trying to run this command", true);

            return;
        }

        // check if user is in the same channel as the bot
        const data = globalConnections.get(guildid);

        if (data === undefined) {
            // nothing playing
            replyMention(interaction, "Nothing is currently playing");
        } else {
            replyMention(interaction, `Currently playing ${data.player.source.name}!`);
        }
    }
}