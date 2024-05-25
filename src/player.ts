import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    entersState,
    StreamType,
    AudioPlayerStatus,
    AudioPlayer,
    VoiceConnection,
    VoiceConnectionStatus,
    NoSubscriberBehavior,
} from "@discordjs/voice";
import { VoiceChannel, Collection, TextChannel } from "discord.js";
import { readFile, readFileSync, readdirSync } from "node:fs";
import { RadioStreamJson } from "./types";

export declare interface RadioURL {
    name: string;
    url: string;
    station: string;
}

export declare interface AudioPlayerWithInfo {
    source: RadioURL;
    player: AudioPlayer;
}

// store players globally; not every single client needs one
const globalPlayers: Collection<string, AudioPlayerWithInfo> = new Collection();

export declare interface AudioConnectionData {
    player: AudioPlayerWithInfo;
    connection: VoiceConnection;
    timer: ReturnType<typeof setTimeout> | null;
    callerChannel: TextChannel;
}

export const globalConnections: Map<string, AudioConnectionData> =
    new Collection();

export function getGuildAudioConnectionData(
    guildid: string
): AudioConnectionData | undefined {
    return globalConnections.get(guildid);
}

/**
 * search for a stored radio station based on these parameters
 * function is pretty inefficient but that doesn't really matter I believe,
 * it's not going to be used THAT often
 */
export async function getAudioPlayerWithInfo(
    name: string | null,
    station: string | null
): Promise<Array<RadioURL>> {
    // check for a perfect match

    const out: Array<RadioURL> = [];

    // search for match
    globalPlayers.each((playerInfo) => {
        if (name !== null && playerInfo.source.name.toLowerCase().match(name) == null) return;
        if (
            station !== null &&
            playerInfo.source.station.toLowerCase().match(station) == null
        )
            return;

        out.push(playerInfo.source);
    });

    return out;
}

/**
 * Adds new AudioPlayerWithInfo to global array
 * @returns key in globalPlayers
 */
export async function addAudioPlayerWithInfo(radioUrl: RadioURL): Promise<string> {
    // workaround for redirects
    const response = await fetch(radioUrl.url);

    if (response.url !== radioUrl.url) {
        console.log(`correction: ${radioUrl.url} -> ${response.url}`);
        radioUrl.url = response.url;
    }

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause
        }
    });
    const resource = createAudioResource(radioUrl.url, {
        inputType: StreamType.Arbitrary,
    });

    player.play(resource);

    entersState(player, AudioPlayerStatus.Playing, 5000);

    const playerWithInfo = {
        source: radioUrl,
        player: player,
    };

    globalPlayers.set(radioUrl.name, playerWithInfo);

    return radioUrl.name;
}

export async function initPlayers() {
    // await addAudioPlayerWithInfo({
    //     name: "indie",
    //     url: "http://streams.pinguinradio.com/PinguinRadio192.mp3",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "classics",
    //     url: "http://streams.pinguinradio.com/PinguinClassics192.mp3",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "on the rocks",
    //     url: "http://streams.pinguinradio.com/PinguinOnTheRocks192.mp3",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "aardschok",
    //     url: "https://streams.pinguinradio.com/Aardschok192.mp3",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "pop",
    //     url: "https://samcloud.spacial.com/api/listen?sid=98586&m=sc&rid=174409",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "grooves",
    //     url: "https://samcloud.spacial.com/api/listen?sid=98587&m=sc&rid=174412",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "pluche",
    //     url: "https://samcloud.spacial.com/api/listen?sid=98569&m=sc&rid=174384",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "world",
    //     url: "https://samcloud.spacial.com/api/listen?sid=98570&m=sc&rid=174387",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "fiesta",
    //     url: "https://19293.live.streamtheworld.com/SP_R2292843_SC",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "showcases",
    //     url: "https://samcloud.spacial.com/api/listen?sid=110690&m=sc&rid=190799&t=ssl",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "vintage",
    //     url: "https://samcloud.spacial.com/api/listen?sid=131111&m=sc&rid=275910&t=ssl",
    //     station: "pinguin_radio",
    // });
    // await addAudioPlayerWithInfo({
    //     name: "blues",
    //     url: "https://samcloud.spacial.com/api/listen?sid=93462&m=sc&rid=168006&t=ssl",
    //     station: "pinguin_radio",
    // });
 
    const filename = process.env.STREAMFILE;

    if (filename === undefined) throw new Error("no environment variable for STREAMFILE");

    const content = readFileSync(filename, {
        encoding: "utf8"
    });

    const urls: RadioStreamJson = JSON.parse(content);

    for (const url of urls.streams) {
        await addAudioPlayerWithInfo(url);
    }

}

// connects to a discord voice channel
export async function connectToVoiceChannel(
    channel: VoiceChannel
): Promise<VoiceConnection> {
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        return connection;
    } catch (error) {
        connection.destroy();
        throw error;
    }
}

export async function moveVoiceChannel(
    channel: VoiceChannel,
    data: AudioConnectionData
): Promise<Error | void> {
    // check if the subscribed-to player exists
    const player = globalPlayers.get(data.player.source.name);

    if (player === undefined) return new Error(`could not find audio player`);

    await data.connection.destroy;
    data.connection = await connectToVoiceChannel(channel);

    data.connection.subscribe(player.player);
}

export async function playAudio(
    url: RadioURL,
    channel: VoiceChannel,
    callerChannel: TextChannel
) {
    // get the currently playing audio player, mapped by name
    const currentPlayer = globalPlayers.get(url.name);

    if (currentPlayer === undefined) {
        return;
    }

    const guildid = channel.guildId;

    let data = globalConnections.get(guildid);

    // console.log(data);
    // console.log(url)

    if (data === undefined) {
        // not currently in a voice channel, create connection
        data = {
            connection: joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guildId,
                adapterCreator: channel.guild.voiceAdapterCreator,
            }),
            player: currentPlayer,
            timer: null,
            callerChannel
        }
    } else if (channel.id !== data.connection.joinConfig.channelId) {
        // not in the same channel as the user, move
        moveVoiceChannel(channel, data);
    } else if (data.player.source.name === url.name) {
        return
    }

    data.connection.subscribe(currentPlayer.player);

    globalConnections.set(guildid, data);

    return;
}
