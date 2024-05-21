"use strict";
// const { REST, Routes } = require('discord.js');
// const { clientId, guildId, token } = require('./config.json');
// const fs = require('node:fs');
// const path = require('node:path');
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var token = process.env.TOKEN;
var clientId = process.env.GUILDID;
var commands = [];
// Grab all the command folders from the commands directory you created earlier
var foldersPath = path.join(__dirname, 'commands');
var commandFolders = fs.readdirSync(foldersPath);
for (var _i = 0, commandFolders_1 = commandFolders; _i < commandFolders_1.length; _i++) {
    var folder = commandFolders_1[_i];
    // Grab all the command files from the commands directory you created earlier
    var commandsPath = path.join(foldersPath, folder);
    var commandFiles = fs.readdirSync(commandsPath).filter(function (f) { return f.endsWith('.js'); });
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (var _a = 0, commandFiles_1 = commandFiles; _a < commandFiles_1.length; _a++) {
        var file = commandFiles_1[_a];
        var filePath = path.join(commandsPath, file);
        var command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
        else {
            console.log("[WARNING] The command at ".concat(filePath, " is missing a required \"data\" or \"execute\" property."));
        }
    }
}
