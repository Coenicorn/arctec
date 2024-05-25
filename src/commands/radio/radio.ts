import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
    TextChannel,
    VoiceChannel,
    escapeHeading,
} from "discord.js";
import { getAudioPlayerWithInfo, playAudio } from "../../player.js";
import { Command } from "../../types.js";
import {
    radioUrlToString,
    radioUrlsToString,
    replyEmbedSimple,
    replyError,
} from "../../util.js";

export default {
    data: new SlashCommandBuilder()
        .setName("radio")
        .setDescription(
            "plays the selected radio stream in the current voice channel."
        )
        .addStringOption((input) =>
            input
                .setName("name")
                .setDescription("name of the source name")
                .setRequired(true)
        )
        .addStringOption((input) => 
            input
                .setName("station")
                .setDescription("name of the source radio station")
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const streamName = interaction.options.getString("name", true);
        const stationName = interaction.options.getString("station", false);
        const member = interaction.member as GuildMember;
        const channel = member.voice.channel as VoiceChannel | null;
        const guild = interaction.guild;

        if (guild === null) return;

        if (channel === null) {
            interaction.reply({
                content: "You are not in a voice channel",
                ephemeral: true,
            });

            return;
        }

        const urls = await getAudioPlayerWithInfo(streamName, stationName);

        if (urls.length === 0)
            interaction.reply({content: `Radio stream **${streamName}** not found`, ephemeral: true});
        else if (urls.length > 1) {
            let str = `Too many streams found matching '**${streamName}**':\n${radioUrlsToString(
                urls
            )}`;

            replyEmbedSimple(interaction, str, true);

            return;
        }

        // 1 stream found

        const radiourl = urls[0];

        try {
            playAudio(
                radiourl,
                channel,
                guild.channels.cache.get(interaction.channelId) as TextChannel
            );

            replyEmbedSimple(interaction, `Playing ${radioUrlToString(radiourl)}!`);
        } catch (e) {
            console.error(e);

            replyError(interaction);
        }
    },
};
