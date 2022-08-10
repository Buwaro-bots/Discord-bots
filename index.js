const config = require('./config.json'); // Ce fichier contient le token de connection et d'autres infos nécéssaires à différentes commandes
const aliases = require('./Données/aliases.json'); // Ce fichier contient les noms alternatifs des commandes
const outils = require("./Commandes/outils.js");

const requireDir = require('require-dir');
const mesCommandes = requireDir('./Commandes'); // Ces deux lignes importent mes commandes du dossier commande.

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS], partials: ["CHANNEL"]});

let listeTempo = {};

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Penser à gérer correctment les erreurs 400 un jour.");
});

let prefix = ";"; // Set the prefix
console.log("Ready!");

client.on("messageCreate", (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return; // On ne fait rien si le message n'a pas le préfixe ou si l'auteur est un bot.
    
    dateHeure = new Date();
    let heure = outils.pad(dateHeure.getHours()) + ':' + outils.pad(dateHeure.getMinutes()) + ':' + outils.pad(dateHeure.getSeconds());
    process.stdout.write(`\x1b[92m${heure}  \x1b[96m${message.author.username}#${message.author.discriminator} \x1b[94m${message.content} \x1b[90m=> \x1b[97m`);
    let envoyerPM = false; // Cette variable indique si la réponse doit être envoyée par mp.
    let idMJ = null;
    let nbBouclesMax = 1;
    let nbBoucles = 0;

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
        // Gestion des alias, c'est à dire des commandes qui ont plusieurs noms. La commande eval sert à changer une autre variable si nécéssaire.
        aliases.forEach(alias => {
            if (command === alias["nom"]) {
                command = alias["alias"];
                eval(alias["commande"]); 
                return;
            }
        })

        outils.verifierNaN([nbBouclesMax]);
        if (nbBouclesMax > 10 && message.author.id !== config.admin ) {
            nbBouclesMax = 5; // Pour eviter les abus, on limite le nombre de boucles à 5, le nombre de messages qui peut-être envoyé toutes les 5 secondes.
        }

        [args, envoyerPM, idMJ] = outils.verifierSiMJ(args, envoyerPM); // Avoir un ping au milieu d'un message peut poser problème, donc on l'enlève ici.

        while (nbBoucles < nbBouclesMax) {
            if (command === "code" || command === "source") {
                mesCommandes.outils.envoyerMessage(client, "https://github.com/Buwaro-bots/Discord-bots", message);
            }

            if (command === "patchnotes" || command === "changelog") { // C'est plus un changelog que des patch notes.
                mesCommandes.outils.envoyerMessage(client, "Mode d'emploi : <https://buwaro-bots.github.io/Discord-bots/?mode=patch>\r\nGithub : https://github.com/Buwaro-bots/Discord-bots/commits/main", message);
            }

            if (command === "help" || command === "aide" || command === "commande" || command === "commandes") {
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

            else if (command === "id") {
                outils.envoyerMessage(client, `L'id de ce serveur est ${message.guildId}.` , message)
            }

            /* Cette commande regarde le premier paramètre donné et regarde si une commande avec ce nom existe, si oui, le bot rajoute une emote qui permet
            à d'autres utilisateurs de faire la commande demandée. */
            else if (command === "everyone" && args.length > 0) {
                let commande = outils.normalisationString(args.shift());

                // Comme DnG a sa propre commande pour les rolls collectifs, on considère que l'utilisateur demandait ça.
                if (commande === "dng" && args.length === 0) {
                    mesCommandes.dng.dng(client, message, [], envoyerPM, idMJ);
                    return;
                }
                if (mesCommandes.hasOwnProperty(commande)) {
                    message.react("🎲");
                    let dummyMessage = message;

                    const collector = message.createReactionCollector({
                        time: 400 * 1000
                    });

                    collector.on('collect', (reaction, user) => {
                        if(!user.bot && reaction.emoji.name === "🎲") {
                            collector.resetTimer({time: 400 * 1000});
                            dummyMessage.author = user;
                            mesCommandes[commande][commande](client, dummyMessage, args, envoyerPM, idMJ);
                            reaction.users.remove(user);
                        }
                    });
                    collector.on('end', collected => {
                        message.reactions.removeAll();
                    });
                }
            }

            /* Cette commande permet de lancer une commande toutes les X minutes.
            On l'arrête si l'utilisateur clique sur l'emote, tape ;tempo stop, ou si l'admin tape ;tempo stop id-utilisateur.*/
            else if (command === "tempo" && args.length > 0) {
                if (args[0] === "stop") {
                    botReply = message.author.toString();
                    let idAuteur = args.length >=2 && message.author.id === config.admin ? args[1] : message.author.id;
                    for (const tempo in listeTempo[idAuteur]) {
                        clearInterval(tempo);
                        botReply += ` La commande de ce message a été arrêté : ${listeTempo[idAuteur][tempo]}\r\n`;
                    }
                    listeTempo[idAuteur] = {};
                    outils.envoyerMessage(client, botReply, message, envoyerPM);
                    return;
                }
                let timer = parseFloat(args.shift()) * 60 * 1000;
                let commande = args.shift();

                if (mesCommandes.hasOwnProperty(commande)) {
                    let dummyMessage = message;
                    function lancerTempo() {
                        mesCommandes[commande][commande](client, dummyMessage, args, envoyerPM, idMJ);
                    }
                    lancerTempo();
                    let id = setInterval(lancerTempo, timer);
                    if (!(message.author.id in listeTempo)) listeTempo[message.author.id] = {};
                    listeTempo[message.author.id][id] = message.url;

                    message.react("🛑");

                    const collector = message.createReactionCollector({
                        time: 101 * timer
                    });

                    collector.on('collect', (reaction, user) => {
                        if(!user.bot && reaction.emoji.name === "🛑") {
                            collector.resetTimer({time: 1});
                        }
                    });
                    collector.on('end', collected => {
                        message.reactions.removeAll();
                        clearInterval(id);
                        const index = listeTempo.indexOf(id);
                        listeTempo.splice(index, 1);
                    });
                }
            }

            else if (command === "isekai") {
                mesCommandes.isekai.isekai(client, message, args, envoyerPM, idMJ, null);
            }

            else if (command === "horoscope") {
                mesCommandes.horoscope.horoscope(client, message, args)
            }

            else if (command === "dng") {
                mesCommandes.dng.dng(client, message, args, envoyerPM, idMJ);
            }

            else if (command === "ins") { 
                mesCommandes.ins.ins(client, message, args, envoyerPM, idMJ);
            }

            else if (command === "num") { 
                mesCommandes.num.num(client, message, args, envoyerPM, idMJ);
            }

            else if (command === "roll") {
                mesCommandes.roll.roll(client, message, args, envoyerPM, idMJ);
            }

            else if (command === "log") {
                mesCommandes.log.log(client, message, args, envoyerPM, idMJ);
            }

            else if (command === "ramoloss") {
                async function speak() {
                    temps = 5*60*1000 + mesCommandes.outils.randomNumber(5*60*1000)// On attends 5 minutes, puis un temps aléatoire entre 1ms et 5 minutes.
                    console.log(temps/1000)
                    await mesCommandes.outils.sleep(temps); 
                    message.channel.send(`${message.author.toString()}`);
                    message.channel.send("https://tenor.com/view/confusedslow-gif-22074333")
                }
                speak();
            }

            else if (command === "troll") {
                args = [];
                let typeLancer = outils.randomNumber(100);
                let nombreLancer = outils.randomNumber(100);
                process.stdout.write(`(${typeLancer}) (${nombreLancer})`);

                if (typeLancer <= 40) {
                    nombreLancer = nombreLancer > 12 ? ["check"] : ["cheat", (((nombreLancer % 6) + 1) * 111).toString()];
                    mesCommandes.ins.ins(client, message, nombreLancer, envoyerPM, idMJ);
                }
                else if (typeLancer <= 65) {
                    nombreLancer = nombreLancer > 80 ? "4" : (nombreLancer > 20 ? "3" : "2");
                    mesCommandes.dng.dng(client, message, [nombreLancer], envoyerPM, idMJ);
                }
                else if (typeLancer <= 84) {
                    nombreLancer = nombreLancer > 30 ? "100" : (nombreLancer > 10 ? "2d20" : "4d6 - 3");
                    mesCommandes.roll.roll(client, message, [nombreLancer], envoyerPM, idMJ);
                }
                else if (typeLancer <= 92) {
                    args = nombreLancer <= 25 ? ["5"] : [];
                    command === "tarot"
                }
                else {
                    mesCommandes.isekai.isekai(client, message, ["DnG"], envoyerPM, idMJ, null);
                }
            }

            if (command === "tarot") {
                tarot = ["I le magicien", "II la grande prêtresse", "III l'impératrice", "IV l'empereur", "V l'hiérophante", "VI les amoureux", "VII le chariot", "VIII la justice", "IX l'ermite", "X la roue de fortune", "XI la force",
                "XII le pendu", "XIII la mort", "XIV la tempérance", "XV le diable", "XVI la maison dieu", "XVII l'étoile", "XVIII la lune", "XIX le soleil", "XX le jugement", "XXI le monde", "le fou"]
                
                outils.verifierNaN(args);
                nombreCartes = args.length > 0 ? args[0] : 1;
                phraseCartes = nombreCartes > 1 ? "les cartes" : "la carte";

                cartesTirées = tarot.sort(() => Math.random() - 0.5);
                cartesTirées = cartesTirées.slice(0, nombreCartes);
                cartesTirées = cartesTirées.join(",  ");

                outils.envoyerMessage(client, `${message.author.toString()} a tiré ${phraseCartes} : ${cartesTirées}`, message, envoyerPM, idMJ);
                outils.logLancer(message, cartesTirées, "tarot", envoyerPM);
            }

            else if (command === "ouija") {
                let texte = "";
                let nombreDeMots = outils.randomNumber(3) + 2;
                let consonnes = ["b", "b", "b", "c", "c", "c", "d", "d", "d",
                "f", "f", "g", "g", "h", "h",  "j", "k", "l", "l" , "l" , "l" , "l" , "l" , "l" , "l",
                "m", "m", "m", "n", "n", "n", "n", "p", "p", "q", "r", "r", "r", "r",
                "s", "s", "s", "s", "t", "t", "t", "t", "t", "t",  "v", "v", "w", "x", "z"];
                let voyelles = ["a", "a", "a", "a", "a", "a", "a", "i", "i", "i", "i", "i", "i",
                "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e",
                "o", "o", "o", "o", "o", "o", "u", "u", "u", "u", "u",  "y"]
                for (let i = 0; i < nombreDeMots ; i++) {
                    let nombreDeLettres = outils.randomNumber(6) + 2;
                    let serieConsonne = 0;
                    for (let j = 0; j < nombreDeLettres; j++) {
                        let tauxConsonne = 0.6 -serieConsonne / 4;
                        if (Math.random() < tauxConsonne) {
                            texte+= consonnes[outils.randomNumber(consonnes.length) -1];
                            serieConsonne = serieConsonne > 0 ? serieConsonne += 1 : 1;
                        }
                        else {
                            texte += voyelles[outils.randomNumber(voyelles.length) -1];
                            serieConsonne = serieConsonne < 0 ? serieConsonne -= 1 : -1;
                        }
                    }
                    texte += " ";
                }
                texte += ".";
                outils.envoyerMessage(client, texte, message, envoyerPM, idMJ);
            }

            else if (command === "8ball") {
                botReply = message.author.toString();
                lancer = outils.randomNumber(100);
                if (lancer <= 40) {
                    botReply += " Oui.";
                }
                else if (lancer < 75) {
                    botReply += " Non.";
                }
                else {
                    botReply += " Peut-être."
                }
                outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
            }


            else if (command === "fermer" && message.author.id === config.admin) {
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