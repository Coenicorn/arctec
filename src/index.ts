import { Client, Events, ChatInputCommandInteraction, Collection, GatewayIntentBits, VoiceChannel, REST, Routes, SlashCommandBuilder, CommandInteraction, GuildMember } from "discord.js"
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    entersState,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	AudioPlayer,
	VoiceConnection
} from "@discordjs/voice"
import { createDiscordJSAdapter } from "./adapter.js";
import * as dotenv from "dotenv"

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

function registerCommand(command: Command)
{
	const name = command.data.name;
	commands.set(name, command);
}

async function connectToChannel(channel: VoiceChannel): Promise<VoiceConnection> {
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
	nowPlaying: string;
}

const guildPlayers: Map<string, AudioGuildData> = new Collection();

interface RadioURL {
	name: string;
	value: string;
}

const radioURLS: Array<RadioURL> = [
	{ name: 'indie', value: 'http://streams.pinguinradio.com/PinguinRadio192.mp3'},
	{ name: 'classics', value: 'http://streams.pinguinradio.com/PinguinClassics192.mp3'},
	{ name: 'on the rocks', value: 'http://streams.pinguinradio.com/PinguinOnTheRocks192.mp3'},
	{ name: 'aardschok', value: 'https://streams.pinguinradio.com/Aardschok192.mp3'},
	{ name: 'pop', value: 'https://samcloud.spacial.com/api/listen?sid=98586&m=sc&rid=174409'},
	{ name: 'grooves', value: 'https://samcloud.spacial.com/api/listen?sid=98587&m=sc&rid=174412'},
	{ name: 'pluche', value: 'https://samcloud.spacial.com/api/listen?sid=98569&m=sc&rid=174384'},
	{ name: 'world', value: 'https://samcloud.spacial.com/api/listen?sid=98570&m=sc&rid=174387'},
	{ name: 'fiesta', value: 'https://19293.live.streamtheworld.com/SP_R2292843_SC'},
	{ name: 'showcases', value: 'https://samcloud.spacial.com/api/listen?sid=110690&m=sc&rid=190799&t=ssl'},
	{ name: 'vintage', value: 'https://samcloud.spacial.com/api/listen?sid=131111&m=sc&rid=275910&t=ssl'},
	{ name: 'blues', value: 'https://samcloud.spacial.com/api/listen?sid=93462&m=sc&rid=168006&t=ssl'},
];

registerCommand({
	data: new SlashCommandBuilder()
		.setName('radio')
		.setDescription('begin playing a radio station')
		.addIntegerOption(option => 
			option.addChoices(
				{ name: 'indie', value: 0},
				{ name: 'classics', value: 1},
				{ name: 'on the rocks', value: 2},
				{ name: 'aardschok', value: 3},
				{ name: 'pop', value: 4},
				{ name: 'grooves', value: 5},
				{ name: 'pluche', value: 6},
				{ name: 'world', value: 7},
				{ name: 'fiesta', value: 8},
				{ name: 'showcases', value: 9},
				{ name: 'vintage', value: 10},
				{ name: 'blues', value: 11},
			)
			.setName('station')
			.setRequired(true)
			.setDescription('the station that will play')
		),
	async execute(interaction: ChatInputCommandInteraction) {
	
		try {
			const guildid = interaction.guildId!;
			const member = interaction.member as GuildMember | null;

			// dunno how this would fail, check for it nonetheless
			if (!member) {
				interaction.reply("failed to fetch interaction member");
				return;
			}

			// I hate typescript
			const channel = member.voice.channel as VoiceChannel | null;

			if (!channel) {
				await interaction.reply("you are not in any voice channels");

				return;
			}

			const url = radioURLS[interaction.options.getInteger('station', true)];

			let data = guildPlayers.get(guildid);

			if (data?.nowPlaying === url.name)
			{
				interaction.reply({
					content: `Already playing ___${url.name}___`
				});

				return;
			} else {
				// new channel has been picked
				interaction.reply(`Playing ___${url.name}___`);
			}

			if (!data) {
				data = {
					player: createAudioPlayer(),
					connection: await connectToChannel(channel),
					nowPlaying: url.name
				};
			} else {
				data.nowPlaying = url.name;
			}

			const resource = createAudioResource(url.value, {
				inputType: StreamType.Arbitrary
			});

			data.player.play(resource);

			entersState(data.player, AudioPlayerStatus.Playing, 5000);

			data.connection.subscribe(data.player);

			guildPlayers.set(guildid, data);

		} catch (e) {
			console.error(e);
		}
	}
});

registerCommand({
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('disconnects from voice channel'),
	async execute(interaction: ChatInputCommandInteraction) {
		const guildId = interaction.guildId!;

		const guildPlayer = guildPlayers.get(guildId);

		if (guildPlayer === undefined) {
			interaction.reply({content: "not in a voice channel", ephemeral: true});
		} else {
			guildPlayer.connection.destroy();
			guildPlayer.player.stop();

			interaction.reply("done!");
		}
	}
});

registerCommand({
	data: new SlashCommandBuilder()
		.setName('nowplaying')
		.setDescription('list currently playing radio channel'),
	async execute(interaction: ChatInputCommandInteraction) {
		const guildid = interaction.guildId;

		if (!guildid) {
			interaction.reply('Not playing anything :/');
			return;
		}
		
		const data = guildPlayers.get(guildid!);

		if (!data) {
			interaction.reply('Not playing anything :/');
			return;
		}

		interaction.reply(`Currently playing ___${data?.nowPlaying}___`);

		
	}
});

// and deploy your commands!
(async () => {
	const commandList: Array<string> = [];

	commands.each(c => {
		commandList.push(c.data.toJSON());
		console.log(`deployed command '${c.data.name}'`);
	})

	const rest = new REST().setToken(token);

	try {
		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commandList },
		);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.GuildMessages
] });

client.login(token);

client.on('ready', async () => {
	console.log("client ready");
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = commands.find((elm) => elm.data.name == interaction.commandName);

	if (!command) {
		interaction.reply("you are NOT going to like this... but 404");
		return;
	}

	try {
		await command.execute(interaction);
	} catch (e) {
		console.error(e);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});