import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js";
import { globalConnections } from "../../player.js";
import { replyEmbedSimple, replyError } from "../../util.js";

export default {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("list the currently playing radio station"),
    async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember | null;
        if (member === null) {
            replyError(interaction);

            return;
        }
        const channel = member.voice.channel as VoiceChannel | null;
        if (channel === null) {
            replyError(interaction);

            return;
        }
        const guildid = interaction.guildId;
        if (guildid === null) {
            replyError(interaction);

            return;
        }

        // // check if user is in the same channel as the bot
        const data = globalConnections.get(guildid);

        if (data === undefined) {
            // nothing playing
            replyEmbedSimple(interaction, "Nothing is currently playing");
        } else {
            replyEmbedSimple(interaction, `Currently playing ${data.player.source.name}!`);
        }
    }
}