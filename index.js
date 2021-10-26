const config = require('./config.json'); // Ce fichier contient le token de connection et d'autres infos nécéssaires à différentes commandes
const aliases = require('./Données/aliases.json'); // Ce fichier contient les noms alternatifs des commandes
let statsLancers = require('./Données/stats.json');

const requireDir = require('require-dir');
const mesCommandes = requireDir('./Commandes'); // Ces deux lignes importent mes commandes du dossier commande.

const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');

let prefix = ";"; // Set the prefix
console.log("Ready!");

client.on("message", (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;     // Exit and stop if the prefix is not there or if user is a bot
    
    process.stdout.write(`${message.author.username}#${message.author.discriminator} ${message.content} => `);
    let envoyerPM = false; // Cette variable indique si la réponse doit être envoyée par mp.
    let idMJ = null;
    let nbBouclesMax = 1;
    let nbBoucles = 0;

    /* Note pour moi même :
    commandBody : string qui représente le message tel qu'il est entré moins le préfix.
    args        : tableau qui contient tout les paramètres après la commande
    command     : string qui est la commande après le préfix
    */
    let commandBody = message.content.slice(prefix.length);     // Cette partie sert à séparer la commande des arguments.
    let args = commandBody.split(/ +/); // Regular expression pour empêcher les double espaces de faire planter.
    let command = args.shift().toLowerCase();
    try {
        /* Partie à faire, renommer aussi le nom du tableau parce que je l'aime pas.
        let parametresLogiciel = { 
        "envoyerPM" : false, // Cette variable indique si la réponse doit être envoyée par mp.
        "idMJ" : null,
        "commandBody" : commandbody,
        "args" : args,
        "command" : command
        };
        */
        // Gestion des alias, c'est à dire des commandes qui ont plusieurs noms. La commande eval sert à changer une autre variable si nécéssaire.
        aliases.forEach(alias => {
            if (command == alias["nom"]){
                command = alias["alias"];
                eval(alias["commande"]); 
                return;
            }
        })

        while (nbBoucles < nbBouclesMax){
            if (command === "code" || command === "source"){
                mesCommandes.outils.envoyerMessage(client, "https://github.com/Buwaro-bots/Discord-bots", message);
            }

            else if(command === "pokemon" || command === "isekai") {
                mesCommandes.isekai.isekai(client, message, args, command);
            }

            else if(command === "horoscope"){
                mesCommandes.horoscope.horoscope(message, args)
            }

            else if(command === "dng"){
                mesCommandes.dng.dng(client, message, args, envoyerPM, idMJ);
            }

            else if(command === "ins") { 
                mesCommandes.ins.ins(client, message, args, envoyerPM, idMJ);
            }

            else if(command === "ramoloss") {
                async function speak() {
                    temps = 5*60*1000 + mesCommandes.outils.randomNumber(5*60*1000)// On attends 5 minutes, puis un temps aléatoire entre 1ms et 5 minutes.
                    console.log(temps/1000)
                    await mesCommandes.outils.sleep(temps); 
                    message.channel.send(`${message.author.toString()}`);
                    message.channel.send("https://tenor.com/view/confusedslow-gif-22074333")
                }
                speak();
            }

            else if(command === "roll"){ 
                mesCommandes.roll.roll(client, message, args, envoyerPM, idMJ, commandBody);
            }

            else if(command === "fermer" && message.author.id === config.admin){
                console.log("ok");
                client.destroy();
            }

            nbBoucles += 1;
        }
    }

    catch(err) {
        message.react('❌');
        console.log(err/*.substring(0, 200)*/);
        }
});
 
client.login(config.botToken);