global.serveurProd = true;

if (process.argv.length > 2) {
    if (process.argv.includes("dev")) {
        global.serveurProd = false;
    }
}

const fs = require('fs');
const config = require('./config.json'); // Ce fichier contient le token de connection et d'autres infos nécéssaires à différentes commandes
const outils = require("./Commandes/outils.js");
[global.aliases, global.aliasesPerso] = outils.genererAliases();
const {recherchercommande} = require('./Commandes/meta.js')
const {renvoyerFonction} = require('./Commandes/meta.js')

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_VOICE_STATES], partials: ["CHANNEL"]});

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Penser à gérer correctment les erreurs 400 un jour.");
});

let prefix = global.serveurProd ? config.prefix : "§";
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
    let commandBody = message.content.slice(prefix.length);
    let args = commandBody.split(/ +/); // Regular expression pour empêcher les double espaces de faire planter.
    let command = outils.normalisationString(args.shift());
    [args, envoyerPM, idMJ] = outils.verifierSiMJ(args, envoyerPM); // Avoir un ping au milieu d'un message peut poser problème, donc on l'enlève ici. (Note le mettre en dessous du foreach a causé un bug une fois.)

    let aliasUtilisateurs;
    if (aliasesPerso.hasOwnProperty(message.author.id)) {
        aliasUtilisateurs = aliasesPerso[message.author.id].concat(aliases);
    }
    else {
        aliasUtilisateurs = aliases;
    }
    // Gestion des alias, c'est à dire des commandes qui ont plusieurs noms. Il peut rajouter des paramètres si l'alias était un raccourci vers une commande plus longue.
    aliasUtilisateurs.forEach(alias => {
        if (command === alias["nom"]) {
            command = alias["alias"];
            if (alias.hasOwnProperty("unshift")) { // Le tableau est lu à l'envers pour qu'il soit plus lisible par un humain.
                for (let i = alias.unshift.length -1 ; i >= 0; i--) {
                    args.unshift(alias.unshift[i]);
                }
            }
            if (alias.hasOwnProperty("perso") && alias.perso === true) {
                message.react("🔒")
            }
            return;
        }
    })

    try {
        const fonction = recherchercommande(command);
        fonction(client, message, args, envoyerPM, idMJ);
        return;
    }

    catch(err) {
        if (typeof(err) === "string") {
            outils.envoyerMessage(client, `${err}\r\nVous pouvez supprimer ce message en cliquant sur la petite croix.`, message, envoyerPM, null, true);
        }
        else {
            outils.envoyerMessage(client, "Erreur interne.", message, envoyerPM, null);
            console.log(err/*.substring(0, 200)*/);
        }
    }
});
 
client.login(config.botToken);

// https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
process.stdin.resume();//so the program will not close instantly

function exitHandler() {
    const fonction = recherchercommande("fermer");
    fonction(client, null);
}
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind());

const dummyMessageAdmin = {
	channelId: '1',
	guildId: '1',
	id: '1',
	createdTimestamp: Date.now(),
	content: '',
	author: {
	  id: config.admin,
	  username: 'admin',
	  discriminator: 'admin',
	}
}
dummyMessageAdmin.author.toString = function () {return "admin";};

var stdin = process.stdin;

console.log("Pour lancer des commandes ici, c'est l pour les logs (l pour 5 heures, L pour 24 heures), h pour l'historique isekai, d pour avoir l'état du rng.");

// https://stackoverflow.com/a/12506613
stdin.setRawMode( true ); // without this, we would only get streams once enter is pressed
stdin.resume(); // resume stdin in the parent process (node app won't quit all by itself unless an error or process.exit() happens)
stdin.setEncoding( 'utf8' ); // i don't want binary, do you?
stdin.on( 'data', function( key ){ // on any data into stdin
    if ( key === '\u0003' ) {   // ctrl-c ( end of text )
        const fonction = recherchercommande("fermer");
        fonction(client, null);
    }
    // process.stdout.write( key );   // write the key to stdout all normal like
    if (key === "l") {
        let fonction = recherchercommande("log");
        fonction(null, dummyMessageAdmin, ["couleur"], false, null);
    }
    else if (key === "L") {
        let fonction = recherchercommande("log");
        fonction(null, dummyMessageAdmin, ["24", "couleur"], false, null);
    }
    else if (key === "h") {
        let fonction = renvoyerFonction("isekai", "getHistorique");
        let historique = fonction();
        let tableau = {};
        for (let [utilisateur, historiquePerso] of Object.entries(historique)) {
            if (utilisateur == "dernierIsekai") {
                tableau[utilisateur] = historiquePerso
            }
            else {
                liste = []
                for (let i = 0; i < historiquePerso.length; i++) {
                    liste.push(historiquePerso[i]["nom"]);
                }
                tableau[utilisateur] = liste;
            }
        }
        console.log(tableau);
    }
    else if (key === "d") {
        let fonctionGet = renvoyerFonction("outils", "getDésPondérés");
        let fonctionGénérer = renvoyerFonction("outils", "générerDésPondérés");
        let listeDés = fonctionGet();
        for (const [nom, dés] of Object.entries(listeDés)) {
            let liste = dés.liste;
            if (liste.length === 0) {
                fonctionGénérer(nom);
            }
            let infos = `(${liste.length} lancers restants) [${dés.nombreDeDésAléatoires} dés aléatoires vs ${dés.nombreDeSeries * dés.nombreDeFaces} dés non-aléatoires]`
            if (nom === "ins") {
                console.log(`\u001b[0;0mins ${infos}\r\n`+
                `\u001b[0;36mLancers de 1x : ${liste.filter(x => x==1).length}\r\n`+
                `\u001b[0;34mLancers de 2x : ${liste.filter(x => x==2).length}\r\n`+
                `\u001b[0;32mLancers de 3x : ${liste.filter(x => x==3).length}\r\n`+
                `\u001b[0;33mLancers de 4x : ${liste.filter(x => x==4).length}\r\n`+
                `\u001b[0;35mLancers de 5x : ${liste.filter(x => x==5).length}\r\n`+
                `\u001b[0;31mLancers de 6x : ${liste.filter(x => x==6).length}\r\n`
                )
            }
            else if (nom === "dng crit") {
                console.log(`\u001b[0;0mCritiques de DnG ${infos}\r\n`+
                `\u001b[0;36mLancers à 4-    : ${liste.filter(x => x<=4).length} (${Math.round(liste.filter(x => x<=4).length / liste.length * 100)}% / 20%)\r\n`+
                `\u001b[0;32mLancers normaux : ${liste.filter(x => x>4 && x<19).length} (${Math.round(liste.filter(x => x>4 && x<19).length / liste.length * 100)}% / 70%)\r\n`+
                `\u001b[0;31mLancers à 19+   : ${liste.filter(x => x>=19).length} (${Math.round(liste.filter(x => x>=19).length / liste.length * 100)}% / 10%)\r\n`
                )
            }
            else if (nom.includes("dng")) {
                let stat = parseInt(nom.slice(-1));
                let déMax = (stat + 1) * 2;
                console.log(`\u001b[0;0mJets de DnG avec une stat de ${stat} ${infos}\r\n`+
                `\u001b[0;33mLancers à 2+ : ${liste.filter(x => x>=2).length} (${Math.round(liste.filter(x => x>=2).length / liste.length * 100)}% / ${Math.round((déMax - 1) / déMax * 100)}%)\r\n`+
                `\u001b[0;32mLancers à 4+ : ${liste.filter(x => x>=4).length} (${Math.round(liste.filter(x => x>=4).length / liste.length * 100)}% / ${Math.round((déMax - 3) / déMax * 100)}%)\r\n`+
                `\u001b[0;36mLancers à 6+ : ${liste.filter(x => x>=6).length} (${Math.round(liste.filter(x => x>=6).length / liste.length * 100)}% / ${Math.round((déMax - 5) / déMax * 100)}%)\r\n`
                )
            }
            else {
                console.log(dés);
            }
        }
    }
    else if (key === "D") {
        let fonctionGet = renvoyerFonction("outils", "getDésPondérés");
        let fonctionGénérer = renvoyerFonction("outils", "générerDésPondérés");
        let listeDés = fonctionGet();
        for (const [nom, dés] of Object.entries(listeDés)) {
            if (dés.liste.length === 0) {
                fonctionGénérer(nom);
            }
        }
        console.log(listeDés);
    }
});
