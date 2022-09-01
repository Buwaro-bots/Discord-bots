const fs = require('fs');
const outils = require("./outils.js");
const requireDir = require('require-dir');
let mesCommandes = requireDir('../Commandes');
const config = require('../config.json');

let listeTempo = {};

module.exports = {
    recherchercommande: function(commande, renvoyerErreur = true) {
        commande = outils.normalisationString(commande);
        if (mesCommandes.hasOwnProperty(commande)) {
            return mesCommandes[commande][commande];
        }
        else if (mesCommandes.autres.hasOwnProperty(commande)) {
            return mesCommandes.autres[commande];
        }
        else if (module.exports.hasOwnProperty(commande)) {
            return module.exports[commande];
        }
        else {
            if (renvoyerErreur) {
                throw("Commande invalide.");
            }
            else {
                return null;
            }
        }
    },

    renvoyerFonction: function(fichier, commande) {
        if (fichier === "meta") {
            return module.exports[commande];
        }
        else {
            return mesCommandes[fichier][commande];
        }
    },

    meta: function(client, message, args, envoyerPM, idMJ) {
        let commande = outils.normalisationString(args.shift());
        if (module.exports.hasOwnProperty(commande)) {
            module.exports[commande](client, message, args, envoyerPM, idMJ);
        }
    },

    repeter: function(client, message, args, envoyerPM, idMJ) {
        let nombreBoucles = args.shift();
        outils.verifierNaN([nombreBoucles]);
        if (nombreBoucles > 10 && message.author.id !== config.admin ) {
            nombreBoucles = 5; // Pour eviter les abus, on limite le nombre de boucles à 5, le nombre de messages qui peut-être envoyé toutes les 5 secondes.
        }
        let commande = args.shift();
        let fonctionCommande = module.exports.recherchercommande(commande);
        if (outils.normalisationString(commande) === "repeter") throw ("Blocage d'utiliser repeter sur repeter.")
        for (let i = 0; i < nombreBoucles; i++) {
            copyArgs = args.slice(0); // Nécéssaire pour les commandes qui modifient les paramètres. https://stackoverflow.com/a/6612410
            fonctionCommande(client, message, copyArgs, envoyerPM, idMJ);
        }
        
    },

    /* Cette commande regarde le premier paramètre donné et regarde si une commande avec ce nom existe, si oui, le bot rajoute une emote qui permet
    à d'autres utilisateurs de faire la commande demandée. */
    everyone: function(client, message, args, envoyerPM, idMJ) {
        let commande = outils.normalisationString(args.shift());

        // Comme DnG a sa propre commande pour les rolls collectifs, on considère que l'utilisateur demandait ça.
        if (commande === "dng" && args.length === 0) {
            mesCommandes.dng.dng(client, message, [], envoyerPM, idMJ);
            return;
        }
        let fonctionCommande = module.exports.recherchercommande(commande);
        message.react("🎲");
        let dummyMessage = message;

        const collector = message.createReactionCollector({
            time: 400 * 1000
        });

        collector.on('collect', (reaction, user) => {
            if(!user.bot && reaction.emoji.name === "🎲") {
                collector.resetTimer({time: 400 * 1000});
                dummyMessage.author = user;
                fonctionCommande(client, dummyMessage, args, envoyerPM, idMJ);
                reaction.users.remove(user);
            }
        });
        collector.on('end', collected => {
            message.reactions.removeAll();
        });
    },

    /* Cette commande permet de lancer une commande toutes les X minutes.
    On l'arrête si l'utilisateur clique sur l'emote, tape ;tempo stop, ou si l'admin tape ;tempo stop id-utilisateur.*/
    tempo: function(client, message, args, envoyerPM, idMJ) {
        if (args.length === 0 || args[0] === "aide") {
            let botReply = "Pour faire une commande toutes les x minutes, la commande est ;tempo [nombre de minutes] [nom de la commande (roll, ins, etc.)] [le reste de la commande si besoin comme des bonus au jet].\r\n" +
            "Par exemple **;tempo 60 ins**, ou **;tempo 10 dng 3**."
            outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
        }

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

        let fonctionCommande = module.exports.recherchercommande(commande);
        let dummyMessage = message;
        function lancerTempo() {
            fonctionCommande(client, dummyMessage, args, envoyerPM, idMJ);
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
            if (listeTempo[message.author.id].hasOwnProperty(id)) delete listeTempo[message.author.id][id];
        });
    },

    troll: function(client, message, args, envoyerPM, idMJ) {
        let typeLancer = outils.randomNumber(100);
        let nombreLancer = outils.randomNumber(100);
        process.stdout.write(`(${typeLancer}) (${nombreLancer})`);

        if (typeLancer <= 40) {
            nombreLancer = nombreLancer > 12 ? [] : ["cheat", (((nombreLancer % 6) + 1) * 111).toString()];
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
            mesCommandes.autres.tarot(client, message, args, envoyerPM, idMJ);
        }
        else {
            mesCommandes.isekai.isekai(client, message, ["DnG"], envoyerPM, idMJ);
        }
    },

    combiner: function(client, message, args, envoyerPM, idMJ) {
        let argsGlobal = [...args];
        // TODO : Refuser si deux fois répéter sauf si admin
        while (argsGlobal.length > 0) {
            let commandeEnCours = argsGlobal.shift();
            let argsEnCours = [];
            while (argsGlobal.length > 0 && argsGlobal[0] !== ";") {
                argsEnCours.push(argsGlobal.shift())
            }
            argsGlobal.shift();
            let fonctionCommande = module.exports.recherchercommande(commandeEnCours);
            fonctionCommande(client, message, argsEnCours, envoyerPM, idMJ);
        }
    },

    reload: function(client, message, args, envoyerPM, idMJ) {
        if (message.author.id === config.admin) {
            historiqueIsekai = mesCommandes.isekai.getHistorique();
            mesCommandes = requireDir('../Commandes', { noCache: true });
            mesCommandes.isekai.setHistorique(historiqueIsekai);
            global.aliases = outils.genererAliases();

            message.react('👍');
        }
    },

    fermer: function(client, message, args, envoyerPM, idMJ) {
        if (message === null || message.author.id === config.admin) {
            historiqueIsekai = mesCommandes.isekai.getHistorique();
            let writer = JSON.stringify(historiqueIsekai, null, 4); // On sauvegarde le fichier.
            fs.writeFileSync('./Données/temp.json', writer, function(err, result) {
                if(err) console.log('error', err);
              });
            client.destroy();
            process.exit();
        }
    },

    initialiser: function(client, message, args, envoyerPM, idMJ) {
        if (client === null || message.author.id === config.admin) {
            fichier = "./Données/temp.json"
            fs.access(fichier, fs.constants.F_OK, (manque) => {
                if (!manque) {
                    historiqueIsekai = JSON.parse(fs.readFileSync('./Données/temp.json', 'utf-8'));
                    mesCommandes.isekai.setHistorique(historiqueIsekai);
                    console.log(historiqueIsekai[0]);
                    fs.unlink('./Données/temp.json', (err) => {
                        if (err) throw err;
                        console.log("L'historique a bien été archivé et le fichier supprimé.");
                    });
                }
            });
        }
    },

    alias: function(client, message, args, envoyerPM, idMJ) {
        let listeAliasPersos = JSON.parse(fs.readFileSync('./Données/aliases-perso.json', 'utf-8'));
        if (args.length >= 2 && args[0] == "effacer" && message.author.id === config.admin) {
            for (let i = 0; i < listeAliasPersos.length; i++) {
                if (listeAliasPersos[i].nom === args[1]) {
                    listeAliasPersos.splice(i, 1);
                    botReply = `${message.author.toString()} La commande ${args[1]} a bien été effacée.`;
                    outils.envoyerMessage(client, botReply, message, envoyerPM);
                    break;
                }
            }
        }
        else if (args.length > 2 && module.exports.recherchercommande(args[0], false) === null) {
            module.exports.recherchercommande(args[1]) // On utiliser ça pour vérifier que la première commande existe.
            let nom = args.shift();
            let alias = args.shift();
            let unshift = args;
            let createur = `${message.author.username}#${message.author.discriminator}`;
            let createurId = message.author.id;

            listeAliasPersos.push({
                "nom": nom,
                "alias": alias,
                "unshift" : unshift,
                "createur": createur,
                "createurId" : createurId
            })
            botReply = `${message.author.toString()} La commande ${nom} a bien été enregistrée.`;
            outils.envoyerMessage(client, botReply, message, envoyerPM);
        }
        else {
            throw("Commande alias mal utilisée.")
        }
        let writer = JSON.stringify(listeAliasPersos, null, 4); // On sauvegarde le fichier.
        fs.writeFileSync('./Données/aliases-perso.json', writer);
        global.aliases = outils.genererAliases();
    },

}

module.exports.initialiser(null);