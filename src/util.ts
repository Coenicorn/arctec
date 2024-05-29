import { ChatInputCommandInteraction, EmbedBuilder, InteractionReplyOptions } from "discord.js";
import { RadioURL } from "./types";
import { Config } from "./config.js";

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
    
export function getTimeFormatted(): string {
    const date = new Date();

    return `[${date.toTimeString()}]`;
}

export namespace Logger {
    export function error(message: string): void {
        console.log(getTimeFormatted() + " [ERROR] " + message);
    }

    export function info(message: string): void {
        console.log(getTimeFormatted() + " [INFO] " + message);
    }
}

export function simpleEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Config.globalBotEmbedColor)
        .setDescription(message);
}

export function safeReply(interaction: ChatInputCommandInteraction, options: InteractionReplyOptions) {
    if (interaction.deferred) interaction.editReply(options);
    else interaction.reply(options);
}