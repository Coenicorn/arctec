import { ChatInputCommandInteraction, VoiceChannel } from "discord.js";
import { RadioURL } from "./player";

export function replyMention(
    interaction: ChatInputCommandInteraction,
    message: string,
    ephemeral = false
) {
    interaction.reply({
        content: interaction.user.toString() + " " + message,
        ephemeral,
    });
}

export function radioUrlsToString(urls: Array<RadioURL>): string {
    let out = "";
    for (const url of urls) {
        out += `- name: ___${url.name}___, station: ___${url.station}___\n`;
    }
    return out;
}