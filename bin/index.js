var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Client, Events, Collection, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } from "@discordjs/voice";
import { createDiscordJSAdapter } from "./adapter.js";
import * as dotenv from "dotenv";
dotenv.config();
const token = process.env.TOKEN;
// load global commands on app deploy
// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);
const clientId = process.env.CLIENTID;
const commands = new Collection();
function registerCommand(command) {
    const name = command.data.name;
    commands.set(name, command);
}
function connectToChannel(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: createDiscordJSAdapter(channel),
        });
        try {
            yield entersState(connection, VoiceConnectionStatus.Ready, 30000);
            return connection;
        }
        catch (error) {
            connection.destroy();
            throw error;
        }
    });
}
const guildPlayers = new Collection();
registerCommand({
    data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('begin playing a radio station')
        .addStringOption(option => option.addChoices({ name: 'indie', value: 'http://streams.pinguinradio.com/PinguinRadio192.mp3' }, { name: 'classics', value: 'http://streams.pinguinradio.com/PinguinClassics192.mp3' }, { name: 'on the rocks', value: 'http://streams.pinguinradio.com/PinguinOnTheRocks192.mp3' }, { name: 'aardschok', value: 'https://streams.pinguinradio.com/Aardschok192.mp3' }, { name: 'pop', value: 'https://samcloud.spacial.com/api/listen?sid=98586&m=sc&rid=174409' }, { name: 'grooves', value: 'https://samcloud.spacial.com/api/listen?sid=98587&m=sc&rid=174412' }, { name: 'pluche', value: 'https://samcloud.spacial.com/api/listen?sid=98569&m=sc&rid=174384' }, { name: 'world', value: 'https://samcloud.spacial.com/api/listen?sid=98570&m=sc&rid=174387' }, { name: 'fiesta', value: 'https://19293.live.streamtheworld.com/SP_R2292843_SC' }, { name: 'showcases', value: 'https://samcloud.spacial.com/api/listen?sid=110690&m=sc&rid=190799&t=ssl' }, { name: 'vintage', value: 'https://samcloud.spacial.com/api/listen?sid=131111&m=sc&rid=275910&t=ssl' }, { name: 'blues', value: 'https://samcloud.spacial.com/api/listen?sid=93462&m=sc&rid=168006&t=ssl' })
        .setName('station')
        .setRequired(true)
        .setDescription('the station that will play')),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const guildid = interaction.guildId;
                const member = interaction.member;
                if (!member) {
                    interaction.reply("something weird happened, idk");
                    return;
                }
                const channel = member.voice.channel;
                if (!channel) {
                    yield interaction.reply("you are not in any voice channels...?");
                    return;
                }
                let data = {
                    player: createAudioPlayer(),
                    connection: yield connectToChannel(channel)
                };
                const url = interaction.options.getString('station', true);
                const resource = createAudioResource(url, {
                    inputType: StreamType.Arbitrary
                });
                data.player.play(resource);
                entersState(data.player, AudioPlayerStatus.Playing, 5000);
                data.connection.subscribe(data.player);
                guildPlayers.set(guildid, data);
                interaction.reply(`joined ${channel.name}!`);
            }
            catch (e) {
                console.error(e);
            }
        });
    }
});
registerCommand({
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('disconnects from voice channel'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const guildId = interaction.guildId;
            const guildPlayer = guildPlayers.get(guildId);
            if (guildPlayer === undefined) {
                interaction.reply("not in a voice channel");
            }
            else {
                guildPlayer.connection.destroy();
                guildPlayer.player.stop();
                interaction.reply("done!");
            }
        });
    }
});
// and deploy your commands!
(() => __awaiter(void 0, void 0, void 0, function* () {
    const commandList = [];
    commands.each(c => {
        commandList.push(c.data.toJSON());
    });
    const rest = new REST().setToken(token);
    try {
        // The put method is used to fully refresh all commands in the guild with the current set
        const data = yield rest.put(Routes.applicationCommands(clientId), { body: commandList });
    }
    catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
}))();
const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ] });
client.login(token);
client.on('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("client ready");
}));
client.on(Events.InteractionCreate, (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!interaction.isChatInputCommand())
        return;
    const command = commands.find((elm) => elm.data.name == interaction.commandName);
    if (!command) {
        interaction.reply("you are NOT going to like this... but 404");
        return;
    }
    try {
        yield command.execute(interaction);
    }
    catch (e) {
        console.error(e);
        if (interaction.replied || interaction.deferred) {
            yield interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        }
        else {
            yield interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
}));
