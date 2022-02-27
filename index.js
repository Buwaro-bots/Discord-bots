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

        if(nbBouclesMax > 10 && message.author.id !== config.admin ) {
            nbBouclesMax = 5;
        }

        while (nbBoucles < nbBouclesMax){
            if(command === "code" || command === "source") {
                mesCommandes.outils.envoyerMessage(client, "https://github.com/Buwaro-bots/Discord-bots", message);
            }

            if(command === "help" || command === "aide" || command === "commande" || command === "commandes") {
                mesCommandes.outils.envoyerMessage(client, 
                    "**;roll** pour faire des jets. Il est possible de juste mettre le nombre de faces comme **;roll 20**, des commandes plus compliquées comme **;roll 1d10 + 1d8 + 3**, " +
                    "ou juste **;roll** pour avoir la commande par défaut qui en général est 100. **;roll setup 1d10 + 1d8** permets de changer le roll par défaut.\r\n" +
                    "**;d2**, ;d4, ;d6, ;d8, ;d10, ;d12, ;d20 et ;d100 sont des raccourcis pour les jets correspondant.\r\n" +
                    "**;ins** pour faire un jet pour In Nomine Satanis / Magna Veritas. **;ins commandes** a la liste des commandes spécifiques.\r\n"+            
                    "**;dng** pour faire un jet pour Donjons et Groudon, par exemple **;dng 4** pour faire un jet avec une stat de 4.\r\n" +
                    "=> Pour ces trois commandes, rajouter un ping à la fin du message permet d'envoyer le roll en privé à vous et à la personne pingée. Sinon mettre deux **;** envoit le résultat en privé.\r\n\r\n" +
                    "**;isekai** pour vous faire réincarner en pokémon. Il est possible de roll dans une catégorie telle que les types, Femelle/Mâle, gen1, DnG. " +
                    "**;isekai disable** permet d'enlever des pokémons de vos rolls, soit en les listant ou en listant les tags.\r\n\r\n"+
                    "**;repeat** permet de faire plusieurs fois la même commandes comme **;repeat 3 dng** pour faire 3 rolls de dng."
                    , message, envoyerPM
                )
                return;
            }

            else if(command === "pokemon" || command === "isekai") {
                mesCommandes.isekai.isekai(client, message, args, command);
            }

            else if(command === "horoscope") {
                mesCommandes.horoscope.horoscope(client, message, args)
            }

            else if(command === "dng") {
                mesCommandes.dng.dng(client, message, args, envoyerPM, idMJ);
            }

            else if(command === "ins") { 
                mesCommandes.ins.ins(client, message, args, envoyerPM, idMJ);
            }

            else if(command === "num") { 
                mesCommandes.num.num(client, message, args, envoyerPM, idMJ);
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

            else if(command === "roll") { 
                mesCommandes.roll.roll(client, message, args, envoyerPM, idMJ, commandBody);
            }

            else if(command === "fermer" && message.author.id === config.admin) {
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