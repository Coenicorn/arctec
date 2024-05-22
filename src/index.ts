import {
    Client,
    Events,
    ChatInputCommandInteraction,
    Collection,
    GatewayIntentBits,
    VoiceChannel,
    REST,
    Routes,
    SlashCommandBuilder,
    CommandInteraction,
    GuildMember,
} from "discord.js";
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    entersState,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    AudioPlayer,
    VoiceConnection,
} from "@discordjs/voice";
import { createDiscordJSAdapter } from "./adapter.js";
import * as dotenv from "dotenv";

dotenv.config();

const token: string = process.env.TOKEN!;

// load global commands on app deploy

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

const clientId = process.env.CLIENTID!;

interface Command {
    execute(interaction: CommandInteraction): Promise<void>;
    data: any;
}

const commands: Collection<string, Command> = new Collection();

function registerCommand(command: Command) {
    const name = command.data.name;
    commands.set(name, command);
}

async function connectToChannel(
    channel: VoiceChannel
): Promise<VoiceConnection> {
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: createDiscordJSAdapter(channel),
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        return connection;
    } catch (error) {
        connection.destroy();
        throw error;
    }
}

interface AudioGuildData {
    player: AudioPlayer;
    connection: VoiceConnection;
    nowPlaying: string /* name of the currently playing stream */;
    channelId: string /* channel ID of the channel currently playing in */;
}

const guildPlayers: Map<string, AudioGuildData> = new Collection();

interface RadioURL {
    name: string;
    value: string;
}

const radioURLS: Array<RadioURL> = [
    {
        name: "indie",
        value: "http://streams.pinguinradio.com/PinguinRadio192.mp3",
    },
    {
        name: "classics",
        value: "http://streams.pinguinradio.com/PinguinClassics192.mp3",
    },
    {
        name: "on the rocks",
        value: "http://streams.pinguinradio.com/PinguinOnTheRocks192.mp3",
    },
    {
        name: "aardschok",
        value: "https://streams.pinguinradio.com/Aardschok192.mp3",
    },
    {
        name: "pop",
        value: "https://samcloud.spacial.com/api/listen?sid=98586&m=sc&rid=174409",
    },
    {
        name: "grooves",
        value: "https://samcloud.spacial.com/api/listen?sid=98587&m=sc&rid=174412",
    },
    {
        name: "pluche",
        value: "https://samcloud.spacial.com/api/listen?sid=98569&m=sc&rid=174384",
    },
    {
        name: "world",
        value: "https://samcloud.spacial.com/api/listen?sid=98570&m=sc&rid=174387",
    },
    {
        name: "fiesta",
        value: "https://19293.live.streamtheworld.com/SP_R2292843_SC",
    },
    {
        name: "showcases",
        value: "https://samcloud.spacial.com/api/listen?sid=110690&m=sc&rid=190799&t=ssl",
    },
    {
        name: "vintage",
        value: "https://samcloud.spacial.com/api/listen?sid=131111&m=sc&rid=275910&t=ssl",
    },
    {
        name: "blues",
        value: "https://samcloud.spacial.com/api/listen?sid=93462&m=sc&rid=168006&t=ssl",
    },
];

registerCommand({
    data: new SlashCommandBuilder()
        .setName("radio")
        .setDescription("begin playing a radio station")
        .addIntegerOption((option) =>
            option
                .addChoices(
                    { name: "indie", value: 0 },
                    { name: "classics", value: 1 },
                    { name: "on the rocks", value: 2 },
                    { name: "aardschok", value: 3 },
                    { name: "pop", value: 4 },
                    { name: "grooves", value: 5 },
                    { name: "pluche", value: 6 },
                    { name: "world", value: 7 },
                    { name: "fiesta", value: 8 },
                    { name: "showcases", value: 9 },
                    { name: "vintage", value: 10 },
                    { name: "blues", value: 11 }
                )
                .setName("station")
                .setRequired(true)
                .setDescription("the station that will play")
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            // grab important data
            const guildid = interaction.guildId!;
            const member = interaction.member as GuildMember | null;
            const user = interaction.user;

            // dunno how this would fail, check for it nonetheless
            if (!member) {
                interaction.reply("failed to fetch interaction member");

                return;
            }

            // I hate typescript
            const channel = member.voice.channel as VoiceChannel | null;

            if (!channel) {
                await interaction.reply(user.toString() + " You are not in any voice channels");

                return;
            }

            const url =
                radioURLS[interaction.options.getInteger("station", true)];

            let data = guildPlayers.get(guildid);

            // if nothing's currently playing, create new data object
            if (data === undefined) {
                data = {
                    player: createAudioPlayer(),
                    connection: await connectToChannel(channel),
                    nowPlaying: "",
                    channelId: channel.id,
                };
            }

            if (data.channelId !== channel.id) {
                // user is in another channel, move
                await data.connection.destroy();
                data.connection = await connectToChannel(channel);
				data.connection.subscribe(data.player);
            }

            if (data.nowPlaying === url.name) {
                // song is currenly being played in the same channel, do nothing
                interaction.reply(
                    user.toString() + ` Already playing ${data.nowPlaying}!`
                );

                return;
            }

            // black magic 0_0
            const resource = createAudioResource(url.value, {
                inputType: StreamType.Arbitrary,
            });

            data.player.play(resource);

            entersState(data.player, AudioPlayerStatus.Playing, 5000);

            data.connection.subscribe(data.player);
            data.nowPlaying = url.name;

            // update stored data
            guildPlayers.set(guildid, data);

            interaction.reply(user.toString() + ` Playing ___${url.name}___`);
        } catch (e) {
            console.error(e);
        }
    },
});

registerCommand({
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("disconnects from voice channel"),
    async execute(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId!;
        const user = interaction.user;
		const channel = (interaction.member as GuildMember | null)?.voice.channel;

        const data = guildPlayers.get(guildId);

        if (data === undefined) {
            // data for guild does not exist
            interaction.reply({
                content: user.toString() + " Not in a voice channel",
                ephemeral: true,
            });
        } else if (channel?.id !== data.channelId) {
			// user is not in same voice channel as bot
			interaction.reply({
				content: user.toString() + " You are not in the same channel as the bot",
				ephemeral: true
			});
		} else {
            // stop playing
            data.connection.destroy();
            data.player.stop();

            interaction.reply(user.toString() + " Done!");
        }
    },
});

/* registers a new slash command */
registerCommand({
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("list currently playing radio channel"),
    async execute(interaction: ChatInputCommandInteraction) {
        const guildid = interaction.guildId;
        const user = interaction.user;

        if (!guildid) {
            interaction.reply("Not playing anything :/");
            return;
        }

        const data = guildPlayers.get(guildid!);

        if (!data) {
            interaction.reply(user.toString() + " Not playing anything :/");
            return;
        }

        interaction.reply(
            user.toString() + ` Currently playing ___${data.nowPlaying}___`
        );
    },
});

// deploy slash commands (blatantly ripped from discord's tutorial lmao)
(async () => {
    const commandList: Array<string> = [];

    commands.each((c) => {
        commandList.push(c.data.toJSON());
        console.log(`deployed command '${c.data.name}'`);
    });

    const rest = new REST().setToken(token);

    try {
        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(Routes.applicationCommands(clientId), {
            body: commandList,
        });
    } catch (error) {
        console.error(error);
    }
})();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
    ],
});

client.login(token);

client.on("ready", async () => {
    console.log(
        `\n****************\nClient ready\nTOKEN=${token}\nCLIENTID=${clientId}\n****************\n`
    );
});

// also blatantly stolen from discord (but it's unlicensed so who cares >_>) (I really really REALLY hope it's actually unlicensed)
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find(
        (elm) => elm.data.name == interaction.commandName
    );

    if (!command) {
        console.log(
            `command ${interaction.commandName} not found (used by @${interaction.user.displayName})`
        );
        interaction.reply({
            content:
                interaction.user.toString() +
                ` A teeny weeny error occurred, message @coenicorn he'll probably want to know`,
            ephemeral: true,
        });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (e) {
        console.error(e);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        }
    }
});
