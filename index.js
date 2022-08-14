const config = require('./config.json'); // Ce fichier contient le token de connection et d'autres infos nécéssaires à différentes commandes
const aliases = require('./Données/aliases.json'); // Ce fichier contient les noms alternatifs des commandes
const outils = require("./Commandes/outils.js");

const requireDir = require('require-dir');
const mesCommandes = requireDir('./Commandes'); // Ces deux lignes importent mes commandes du dossier commande.
delete mesCommandes.outils;
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS], partials: ["CHANNEL"]});

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Penser à gérer correctment les erreurs 400 un jour.");
});

let prefix = config.prefix; // Set the prefix
console.log("Ready!");

client.on("messageCreate", (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return; // On ne fait rien si le message n'a pas le préfixe ou si l'auteur est un bot.
    
    dateHeure = new Date();
    let heure = outils.pad(dateHeure.getHours()) + ':' + outils.pad(dateHeure.getMinutes()) + ':' + outils.pad(dateHeure.getSeconds());
    process.stdout.write(`\x1b[92m${heure}  \x1b[96m${message.author.username}#${message.author.discriminator} \x1b[94m${message.content} \x1b[90m=> \x1b[97m`);
    let envoyerPM = false; // Cette variable indique si la réponse doit être envoyée par mp.
    let idMJ = null;

    // Si l'utilisateur utilise deux fois le préfix, on considère qu'il veut recevoir la réponse par mp
    if (message.content.startsWith(prefix + prefix)) {
        envoyerPM = true;
        message.content = message.content.slice(prefix.length);
    }

    // Si le message contient un d et inclus un nombre après le d, on remplace le message par un lancer
    if (!(message.content.includes(' ')) && message.content.includes('d') && message.content.length > message.content.indexOf('d') + 1 && !isNaN(message.content.substring(message.content.indexOf('d') + 1))) {
        message.content = ";roll " +  message.content.substring(1);
    }

    /* Note pour moi même :
    commandBody : string qui représente le message tel qu'il est entré moins le préfix.
    args        : tableau qui contient tout les paramètres après la commande
    command     : string qui est la commande après le préfix
    */
    let commandBody = message.content.slice(prefix.length); // Cette partie sert à séparer la commande des arguments.
    let args = commandBody.split(/ +/); // Regular expression pour empêcher les double espaces de faire planter.
    let command = outils.normalisationString(args.shift());
    try {
        [args, envoyerPM, idMJ] = outils.verifierSiMJ(args, envoyerPM); // Avoir un ping au milieu d'un message peut poser problème, donc on l'enlève ici. (Note le mettre en dessous du foreach a causé un bug une fois.)

        // Gestion des alias, c'est à dire des commandes qui ont plusieurs noms. Il peut rajouter des paramètres si l'alias était un raccourci vers une commande plus longue.
        aliases.forEach(alias => {
            if (command === alias["nom"]) {
                command = alias["alias"];
                if (alias.hasOwnProperty("unshift")) {
                    for (let i = alias.unshift.length -1 ; i >= 0; i--) {
                        args.unshift(alias.unshift[i]);
                    }
                }
                return;
            }
        })

        if (command === "code" || command === "source") {
            mesCommandes.outils.envoyerMessage(client, "https://github.com/Buwaro-bots/Discord-bots", message);
        }

        else if (command === "patchnotes" || command === "changelog") { // C'est plus un changelog que des patch notes.
            mesCommandes.outils.envoyerMessage(client, "Mode d'emploi : <https://buwaro-bots.github.io/Discord-bots/?mode=patch>\r\nGithub : https://github.com/Buwaro-bots/Discord-bots/commits/main", message);
        }

        else if (command === "help" || command === "aide" || command === "commande" || command === "commandes") {
            if (args.length > 0 && args[0] === "dng") {
                mesCommandes.dng.dng(client, message, ["help"], envoyerPM);
            }
            else if (args.length > 0 && args[0] === "ins") {
                mesCommandes.ins.ins(client, message, ["help"], envoyerPM);
            }
            else {
                let botReply = "Mode d'emploi : <https://buwaro-bots.github.io/Discord-bots/?mode=roll>\r\n" +
                            "\r\n" +
                            "**;roll** pour faire des jets. Il est possible de juste mettre le nombre de faces comme **;roll *20***, des commandes plus compliquées comme **;roll *1d10 + 1d8 + 3***, " +
                            "ou juste **;roll** pour avoir la commande par défaut qui en général est 100. **;roll setup *1d10 + 1d8*** permets de changer le roll par défaut. Il est aussi possible d'abréger en **;r**.\r\n" +
                            "**;d20** ou **;2d100** est un raccourci pour faire un jet simple, mais il n'est possible de lancer qu'un seul type de dés. .\r\n" +
                            "\r\n" +
                            "**;ins** pour faire un jet pour In Nomine Satanis / Magna Veritas. **;ins commandes** a la liste des commandes spécifiques.\r\n"+
                            "**;dng stat** pour faire un jet pour Donjons et Groudon, **;ins commandes** a la liste des commandes spécifiques et une aide rapide pour les lancers.\r\n" +
                            "**;num *test*** pour faire un lancer de numénera. \r\n" +
                            "\r\n" +
                            "=> Pour les lancers de jdr, rajouter un ping à la fin du message permet d'envoyer le roll en privé à vous et à la personne pingée. Sinon mettre deux **;** envoit le résultat en privé.\r\n" +
                            "**;repeat** permet de faire plusieurs fois la même commandes comme **;repeat 3 dng 4** pour faire 3 rolls de dng avec une stat de 4.\r\n" +
                            "\r\n" +
                            "**;isekai** pour vous faire réincarner en pokémon. Il est possible de roll dans une catégorie telle que les types, Femelle/Mâle, gen1, DnG. ";
                mesCommandes.outils.envoyerMessage(client, botReply , message, envoyerPM);
            }
            return;
        }

        else if (mesCommandes.hasOwnProperty(command)) {
            mesCommandes[command][command](client, message, args, envoyerPM, idMJ);
        }

        else if (command === "fermer" && message.author.id === config.admin) {
            console.log("ok");
            client.destroy();
        }

        else if (mesCommandes.autres.hasOwnProperty(command)) {
            mesCommandes.autres[command](client, message, args, envoyerPM, idMJ);
        }
        
        else {
            args.unshift(command);
            mesCommandes.meta.meta(client, message, args, envoyerPM, idMJ);
        }

    }

    catch(err) {
        message.react('❌');
        console.log(err/*.substring(0, 200)*/);
        }
});
 
client.login(config.botToken);