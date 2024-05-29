import { EmbedBuilder } from "@discordjs/builders;
import { RadioURL } from "types.js";
import { Config } from "config.js";

export namespace RadioFormat {

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
    
}

export namespace Time {
    export function getTimeFormatted(): string {
        const date = new Date();
    
        return `[${date.toTimeString()}]`;
    }
}

export namespace Logger {
    export function error(message: string): void {
        console.log(Time.getTimeFormatted() + " [ERROR] " + message);
    }

    export function info(message: string): void {
        console.log(Time.getTimeFormatted() + " [INFO] " + message);
    }
}

export namespace SimpleDiscordMessage {

    export function simpleEmbed(message: string): EmbedBuilder {
        new EmbedBuilder().setColor("#336233")
    }

}