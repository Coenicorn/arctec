import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, VoiceChannel, escapeHeading } from "discord.js";
import { getAudioPlayerWithInfo, playAudio } from "../../player.js";
import { Command } from "../../types.js";
import { radioUrlsToString, replyEmbed } from "../../util.js";

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

        if (channel === null) {
            replyEmbed(interaction, "You are not in a voice channel", true);

            return;
        }

        const urls = await getAudioPlayerWithInfo(streamName, null);

        if (urls.length === 0) return replyEmbed(interaction, `Radio stream ___${streamName}___ not found`, true);
        else if (urls.length > 1) {
            let str = `Too many streams found matching ___'${streamName}'___:\n${radioUrlsToString(urls)}` 

            replyEmbed(interaction, str, true);

            return;
        }

        // 1 stream found

        const radiourl = urls[0];

        try {
            playAudio(radiourl, channel).catch(e => console.error(e));

            replyEmbed(interaction, `Playing ___${radiourl.name}___!`);
        } catch (e) {
            console.error(e);

            replyEmbed(interaction, "An error uccurred trying to run this command", true);
        }
    }
}