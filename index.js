const config = require('./config.json'); // Ce fichier contient le token de connection et d'autres infos nécéssaires à différentes commandes
const aliases = require('./Données/aliases.json'); // Ce fichier contient les noms alternatifs des commandes
const outils = require("./Commandes/outils.js");

const requireDir = require('require-dir');
const mesCommandes = requireDir('./Commandes'); // Ces deux lignes importent mes commandes du dossier commande.

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES], partials: ["CHANNEL"]});

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Penser à gérer correctment les erreurs 400 un jour.");
    });

let prefix = ";"; // Set the prefix
console.log("Ready!");

client.on("messageCreate", (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;     // Exit and stop if the prefix is not there or if user is a bot
    
    process.stdout.write(`${message.author.username}#${message.author.discriminator} ${message.content} => `);
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
    if (message.content.includes('d') && !isNaN(message.content.substring(message.content.indexOf('d') + 1))) {
        message.content = ";roll " +  message.content.substring(1);
    }


    /* Note pour moi même :
    commandBody : string qui représente le message tel qu'il est entré moins le préfix.
    args        : tableau qui contient tout les paramètres après la commande
    command     : string qui est la commande après le préfix
    */
    let commandBody = message.content.slice(prefix.length);     // Cette partie sert à séparer la commande des arguments.
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
            nbBouclesMax = 5;
        }

        [args, envoyerPM, idMJ] = outils.verifierSiMJ(args, envoyerPM);

        while (nbBoucles < nbBouclesMax) {
            if (command === "code" || command === "source") {
                mesCommandes.outils.envoyerMessage(client, "https://github.com/Buwaro-bots/Discord-bots", message);
            }

            if (command === "patchnotes") {
                mesCommandes.outils.envoyerMessage(client, "https://github.com/Buwaro-bots/Discord-bots/commits/main", message);
            }

            if (command === "help" || command === "aide" || command === "commande" || command === "commandes") {
                botReply = "**;roll** pour faire des jets. Il est possible de juste mettre le nombre de faces comme **;roll *20***, des commandes plus compliquées comme **;roll *1d10 + 1d8 + 3***, " +
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
                            "**;isekai** pour vous faire réincarner en pokémon. Il est possible de roll dans une catégorie telle que les types, Femelle/Mâle, gen1, DnG. " +
                            "**;isekai disable** permet d'enlever des pokémons de vos rolls, soit en les listant ou en listant les tags.\r\n" +
                mesCommandes.outils.envoyerMessage(client, botReply , message, envoyerPM);
                return;
            }

            else if (command === "isekai") {
                mesCommandes.isekai.isekai(client, message, args, command);
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
                mesCommandes.roll.roll(client, message, args, envoyerPM, idMJ, commandBody);
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
                    mesCommandes.dng.dng(client, message, [], envoyerPM, idMJ);
                }
                else if (typeLancer <= 84) {
                    nombreLancer = nombreLancer > 30 ? "100" : (nombreLancer > 10 ? "2d20" : "4d6 - 3");
                    mesCommandes.roll.roll(client, message, [nombreLancer], envoyerPM, idMJ, `roll ${nombreLancer}`);
                }
                else if (typeLancer <= 92) {
                    args = nombreLancer <= 25 ? ["5"] : [];
                    command === "tarot"
                }
                else {
                    mesCommandes.isekai.isekai(client, message, ["DnG"], "isekai");
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
                outils.logLancer(message.author.username, cartesTirées, "tarot");
            }

            else if (command === "test") { 
                mesCommandes.roll.roll(client, message, ["100"], envoyerPM, idMJ, commandBody);

                const filter = (reaction, user) => {
                    return true;//reaction.emoji.name === '👍' && user.id === message.author.id;
                };
                const collector = message.createReactionCollector({ filter, time: 15000 });
                
                collector.on('collect', (reaction, user) => {
                    console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
                });
                
                collector.on('end', collected => {
                    console.log(`Collected ${collected.size} items`);
                });
            }

            else if (command === "fermer" && message.author.id === config.admin) {
                console.log("ok");
                client.destroy();
            }

            nbBoucles += 1;
        }
    }

    catch(err) {
        if (err.charAt(0).match(/^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udff3\udff4]|\ud83c[\udf00-\udfff]|\ud83e[\udd00-\uddff])$/)) {
            message.react(err.charAt(0));
        }
        message.react('❌');
        console.log(err/*.substring(0, 200)*/);
        }
});
 
client.login(config.botToken);
