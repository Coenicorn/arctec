import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import { getGuildAudioConnectionData, globalConnections } from "../../player.js";
import { replyEmbedSimple, replyError } from "../../util.js";

export default {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("stops playing and exits voice channel"),
    async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember;
        const channelid = member.voice.channelId;

        // check if the bot is currently playing in this guild
        const guildid = interaction.guildId;
        
        if (guildid === null) {
            replyError(interaction);
            console.log("failed to find guildid");
            
            return;
        }
        
        const data = globalConnections.get(guildid);
        
        if (data === undefined) {
            replyEmbedSimple(interaction, "Not currently playing anything");
            
            return;
        }

        // check if the user is in the same channel as the bot
        if (channelid !== data.connection.joinConfig.channelId) {
            // bot is not in the same channel, do nothing
            replyEmbedSimple(interaction, "You are not in the same channel as the bot :(");
        
            return;
        }

        replyEmbedSimple(interaction, "Left the voice channel");
        
        // terminate connection
        data.connection.destroy();

        globalConnections.delete(guildid);

    }
}