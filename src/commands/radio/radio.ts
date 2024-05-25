import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, TextChannel, VoiceChannel, escapeHeading } from "discord.js";
import { getAudioPlayerWithInfo, playAudio } from "../../player.js";
import { Command } from "../../types.js";
import { radioUrlsToString, replyMention } from "../../util.js";

export default {
    data: new SlashCommandBuilder()
        .setName("radio")
        .setDescription("plays the selected radio stream in the current voice channel.")
        .addStringOption(input => 
            input.
                setName("name")
                .setDescription("selected radio stream name")
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const streamName = interaction.options.getString("name", true);
        const member = interaction.member as GuildMember;
        const channel = member.voice.channel as VoiceChannel | null;
        const guild = interaction.guild;

        if (guild === null) return;

        if (channel === null) {
            replyMention(interaction, "You are not in a voice channel", true);

            return;
        }

        const urls = await getAudioPlayerWithInfo(streamName, null);

        if (urls.length === 0) return replyMention(interaction, `Radio stream ___${streamName}___ not found`, true);
        else if (urls.length > 1) {
            let str = `Too many streams found matching ___'${streamName}'___:\n${radioUrlsToString(urls)}` 

            replyMention(interaction, str, true);

            return;
        }

        // 1 stream found

        const radiourl = urls[0];

        try {
            playAudio(radiourl, channel, (guild.channels.cache.get(interaction.channelId) as TextChannel)).catch(e => console.error(e));

            replyMention(interaction, `Playing ___${radiourl.name}___!`);
        } catch (e) {
            console.error(e);

            replyMention(interaction, "An error uccurred trying to run this command", true);
        }
    }
}