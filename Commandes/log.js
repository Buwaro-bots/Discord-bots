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
    let estCouleurs = args.includes("couleur");
    // Si l'utilisateur n'est pas l'admin, on limite les horaires possibles.
    nombreHeures = message.author.id === config.admin ? nombreHeures : Math.min(Math.max(nombreHeures, 1), 24);

    let listeJoueurs = this.listeJoueurs(nombreHeures, estCouleurs);
    let nomsJoueurs  = Object.keys(listeJoueurs).sort();
    let botReply = `Liste des lancers des ${nombreHeures} dernières heures :\n\n`;
    for (let i = 0; i < nomsJoueurs.length; i++) {
        let ajout = `${nomsJoueurs[i]} : ${listeJoueurs[nomsJoueurs[i]]}\n\n`;
        if (botReply.length + ajout.length > 2000) {
            outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
            botReply = "";
        }
        if (ajout.length > 2000) {
            outils.envoyerMessage(client, ajout.slice(0,2000), message, envoyerPM, idMJ);
        }
        else {
            botReply += ajout;
        }
    }
    outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
    console.log("\x1b[0;37m");
}

// Pour l'instant je ne rajoute pas de fonctionalité pour récupérer les PM.
exports.listeJoueurs = function(nombreHeures, estCouleurs = false, recupererPM = false) {
    let jets = JSON.parse(fs.readFileSync(__dirname + '/../Données/stats.json', 'utf-8'))
    let listeJoueurs = {};

    for (let [key, value] of Object.entries(jets)) {
        if (estCouleurs) {
            let nomJoueur = `\`\`\`ansi\r\n\u001b[0;34m${key}\u001b[0;37m`;
            let listeLancers = "";
            for (roll of value) {
                if (roll.timestamp > (Date.now() - (nombreHeures * 3600 * 1000))
                && (recupererPM || roll.estPM === false)) {
                    if (roll.estReussite === null) {
                        let texte = `${roll["lancer"]}`;
                        texte += roll["type"] == "1d100" ? ", " : ` \u001b[0;33m(${roll["type"]})\u001b[0;37m, `;
                        listeLancers += texte;
                    }
                    else if (roll.estReussite) {
                        let texte = `\u001b[0;32m${roll["lancer"]}`;
                        texte += roll["type"] == "1d100" ? "\u001b[0;37m, " : ` (${roll["type"]})\u001b[0;37m, `;
                        listeLancers += texte;
                    }
                    else {
                        let texte = `\u001b[0;31m${roll["lancer"]}`;
                        texte += roll["type"] == "1d100" ? "\u001b[0;37m, " : ` (${roll["type"]})\u001b[0;37m, `;
                        listeLancers += texte;
                    }
                }
	    	}
            if (listeLancers.length > 0) {
                let nombreCaracteres = Math.min(listeLancers.length-2, 1997);
                listeLancers = listeLancers.slice(0,nombreCaracteres) + "\`\`\`";
                listeJoueurs[nomJoueur] = listeLancers;
            }
        }
        else {
            let nomJoueur = `${key}`;
            let listeLancers = [];
            for (roll of value) {
                if (roll.timestamp > (Date.now() - (nombreHeures * 3600 * 1000))
                && (recupererPM || roll.estPM === false)) {
                    let etoiles = "";
                    if ( !(roll.estReussite === null) ) {
                        etoiles = roll.estReussite ? "**" : "*";
                    }
                    let texte = ` ${etoiles}${roll["lancer"]}${etoiles}`;
                    texte += roll["type"] == "1d100" ? "" : ` (${roll["type"]})`;
                    listeLancers.push(texte);
                }
            }
            if (listeLancers.length > 0) {
                listeJoueurs[nomJoueur] = listeLancers;
            }
        }
	}

    return listeJoueurs;
}