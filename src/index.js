"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var discord_js_1 = require("discord.js");
var voice_1 = require("@discordjs/voice");
var adapter_1 = require("./adapter");
var dotenv = require("dotenv");
dotenv.config();
var token = process.env.TOKEN;
// load global commands on app deploy
// Construct and prepare an instance of the REST module
var rest = new discord_js_1.REST().setToken(token);
var clientId = process.env.CLIENTID;
var commands = new discord_js_1.Collection();
function registerCommand(command) {
    var name = command.data.name;
    commands.set(name, command);
}
function connectToChannel(channel) {
    return __awaiter(this, void 0, void 0, function () {
        var connection, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connection = (0, voice_1.joinVoiceChannel)({
                        channelId: channel.id,
                        guildId: channel.guild.id,
                        adapterCreator: (0, adapter_1.createDiscordJSAdapter)(channel),
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Ready, 30000)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, connection];
                case 3:
                    error_1 = _a.sent();
                    connection.destroy();
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
var guildPlayers = new discord_js_1.Collection();
registerCommand({
    data: new discord_js_1.SlashCommandBuilder()
        .setName('radio')
        .setDescription('begin playing a radio station')
        .addStringOption(function (option) {
        return option.addChoices({ name: 'indie', value: 'http://streams.pinguinradio.com/PinguinRadio192.mp3' }, { name: 'classics', value: 'http://streams.pinguinradio.com/PinguinClassics192.mp3' }, { name: 'on the rocks', value: 'http://streams.pinguinradio.com/PinguinOnTheRocks192.mp3' }, { name: 'aardschok', value: 'https://streams.pinguinradio.com/Aardschok192.mp3' }, { name: 'pop', value: 'https://samcloud.spacial.com/api/listen?sid=98586&m=sc&rid=174409' }, { name: 'grooves', value: 'https://samcloud.spacial.com/api/listen?sid=98587&m=sc&rid=174412' }, { name: 'pluche', value: 'https://samcloud.spacial.com/api/listen?sid=98569&m=sc&rid=174384' }, { name: 'world', value: 'https://samcloud.spacial.com/api/listen?sid=98570&m=sc&rid=174387' }, { name: 'fiesta', value: 'https://19293.live.streamtheworld.com/SP_R2292843_SC' }, { name: 'showcases', value: 'https://samcloud.spacial.com/api/listen?sid=110690&m=sc&rid=190799&t=ssl' }, { name: 'vintage', value: 'https://samcloud.spacial.com/api/listen?sid=131111&m=sc&rid=275910&t=ssl' }, { name: 'blues', value: 'https://samcloud.spacial.com/api/listen?sid=93462&m=sc&rid=168006&t=ssl' })
            .setName('station')
            .setRequired(true)
            .setDescription('the station that will play');
    }),
    execute: function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var guildid, member, channel, data, url, resource, e_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        guildid = interaction.guildId;
                        member = interaction.member;
                        if (!member) {
                            interaction.reply("something weird happened, idk");
                            return [2 /*return*/];
                        }
                        channel = member.voice.channel;
                        if (!!channel) return [3 /*break*/, 2];
                        return [4 /*yield*/, interaction.reply("you are not in any voice channels...?")];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                    case 2:
                        _a = {
                            player: (0, voice_1.createAudioPlayer)()
                        };
                        return [4 /*yield*/, connectToChannel(channel)];
                    case 3:
                        data = (_a.connection = _b.sent(),
                            _a);
                        url = interaction.options.getString('station', true);
                        resource = (0, voice_1.createAudioResource)(url, {
                            inputType: voice_1.StreamType.Arbitrary
                        });
                        data.player.play(resource);
                        (0, voice_1.entersState)(data.player, voice_1.AudioPlayerStatus.Playing, 5000);
                        data.connection.subscribe(data.player);
                        guildPlayers.set(guildid, data);
                        interaction.reply("joined ".concat(channel.name, "!"));
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _b.sent();
                        console.error(e_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
});
registerCommand({
    data: new discord_js_1.SlashCommandBuilder()
        .setName('stop')
        .setDescription('disconnects from voice channel'),
    execute: function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var guildId, guildPlayer;
            return __generator(this, function (_a) {
                guildId = interaction.guildId;
                guildPlayer = guildPlayers.get(guildId);
                if (guildPlayer === undefined) {
                    interaction.reply("not in a voice channel");
                }
                else {
                    guildPlayer.connection.destroy();
                    guildPlayer.player.stop();
                    interaction.reply("done!");
                }
                return [2 /*return*/];
            });
        });
    }
});
// and deploy your commands!
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var commandList, rest, data, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                commandList = [];
                commands.each(function (c) {
                    commandList.push(c.data.toJSON());
                });
                rest = new discord_js_1.REST().setToken(token);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: commandList })];
            case 2:
                data = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                // And of course, make sure you catch and log any errors!
                console.error(error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); })();
var client = new discord_js_1.Client({ intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
        discord_js_1.GatewayIntentBits.GuildMessages
    ] });
client.login(token);
client.on('ready', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log("client ready");
        return [2 /*return*/];
    });
}); });
client.on(discord_js_1.Events.InteractionCreate, function (interaction) { return __awaiter(void 0, void 0, void 0, function () {
    var command, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!interaction.isChatInputCommand())
                    return [2 /*return*/];
                command = commands.find(function (elm) { return elm.data.name == interaction.commandName; });
                if (!command) {
                    interaction.reply("you are NOT going to like this... but 404");
                    return [2 /*return*/];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 8]);
                return [4 /*yield*/, command.execute(interaction)];
            case 2:
                _a.sent();
                return [3 /*break*/, 8];
            case 3:
                e_2 = _a.sent();
                console.error(e_2);
                if (!(interaction.replied || interaction.deferred)) return [3 /*break*/, 5];
                return [4 /*yield*/, interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })];
            case 4:
                _a.sent();
                return [3 /*break*/, 7];
            case 5: return [4 /*yield*/, interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })];
            case 6:
                _a.sent();
                _a.label = 7;
            case 7: return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
