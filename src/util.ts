import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    VoiceChannel,
} from "discord.js";
import { RadioURL } from "./player";

export function replyEmbedSimple(
    interaction: ChatInputCommandInteraction,
    message: string,
    ephemeral = false
) {
    interaction.reply({
        embeds: [
            new EmbedBuilder().setColor("#336233").setDescription(message),
        ],
        ephemeral,
    });
}

export function replyError(interaction: ChatInputCommandInteraction) {
    interaction.reply({
        content: `Something went wrong trying to run this command :(`,
        ephemeral: true,
    });
}

export function radioUrlToString(url: RadioURL): string {
    return "`" + url.name + "` by `" + url.station + "`";
}

export function radioUrlsToString(urls: Array<RadioURL>): string {
    let out = "- " + radioUrlToString(urls[0]);
    for (let i = 1; i < urls.length; i++) {
        out += "\n- " + radioUrlToString(urls[i]);
    }
    return out;
}
