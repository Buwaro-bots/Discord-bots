const fs = require('fs');
const outils = require("./outils.js");
const config = require('../config.json');

exports.log = function(client, message, args, envoyerPM, idMJ) {
    // Si l'argument est effacer et que l'utilisateur est l'admin, on effectue une copie de sauvegarde en mettant la date du jour, puis on efface les logs
    if (args[0] === "effacer" && message.author.id === config.admin) {
        function pad(n) {
            return n < 10 ? '0' + n : n;
        }

        let date = new Date();
        let jour = pad(date.getDate());
        let mois = pad(date.getMonth() + 1);
        let annee = date.getFullYear();
        let heure = pad(date.getHours());
        let minute = pad(date.getMinutes());
        let seconde = pad(date.getSeconds());
        let dateString = `${annee}-${mois}-${jour}_${heure}-${minute}-${seconde}`;
        fs.copyFileSync('./Données/stats.json', `./Données/Archives/Logs_${dateString}.json`);
        outils.logLancerEffacer();
        message.react('👍');
        return;
    }

    nombreHeures = args.length > 0 ? parseInt(args[0]) : 4;
    outils.verifierNaN([nombreHeures]);

    let listeJoueurs = this.listeJoueurs(nombreHeures);
    let nomsJoueurs  = Object.keys(listeJoueurs).sort();
    let botReply = `Liste des lancers des ${nombreHeures} dernières heures :\n\n`;
    for (let i = 0; i < nomsJoueurs.length; i++) {
        let ajout = `${nomsJoueurs[i]} : ${listeJoueurs[nomsJoueurs[i]]}\n\n`;
        if (botReply.length + ajout.length > 2000) {
            outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
            botReply = "";
        }
        if (ajout.length > 2000) {
            outils.envoyerMessage(client, message, ajout.slice(0,2000), envoyerPM, idMJ);
        }
        else {
            botReply += ajout;
        }
    }
    console.log(botReply);
    outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
}

exports.listeJoueurs = function(nombreHeures) {
    let jets = JSON.parse(fs.readFileSync(__dirname + '/../Données/stats.json', 'utf-8'))
    let listeJoueurs = {};

    for (let [key, value] of Object.entries(jets)) {
		nomJoueur = `${key}`;
        listeLancers = [];
		for (roll of value) {
            if (roll.timestamp > (Date.now() - (nombreHeures * 3600 * 1000))) {
				texte = ` ${roll["lancer"]}`;
				texte += roll["type"] == "1d100" ? "" : ` (${roll["type"]})`;
                listeLancers.push(texte);
            }
		}
        if (listeLancers.length > 0) {
            listeJoueurs[nomJoueur] = listeLancers;
        }
	}

    return listeJoueurs;
}