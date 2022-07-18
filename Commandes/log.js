const fs = require('fs');
const outils = require("./outils.js");
const config = require('../config.json');
const binomialProbability = require('binomial-probability')

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

    nombreHeures = args.length > 0 && !isNaN(args[0]) ? parseFloat(args[0]) : 5;
    outils.verifierNaN([nombreHeures]);
    let estCouleurs = args.includes("couleur");
    let canal = args.includes("canal") ? message.channelId : null;

    // Si l'utilisateur n'est pas l'admin, on limite les horaires possibles.
    nombreHeures = message.author.id === config.admin ? nombreHeures : Math.min(Math.max(nombreHeures, 1), 24);

    let listeJoueurs = this.listeJoueurs(nombreHeures, estCouleurs, canal);
    let nomsJoueurs  = Object.keys(listeJoueurs).sort();
    let botReply = `Liste des lancers des ${nombreHeures} dernières heures :\r\n\r\n`;
    let sautsDeLigne = estCouleurs ? "" : "\r\n\r\n";

    for (let i = 0; i < nomsJoueurs.length; i++) {
        let ajout = `${nomsJoueurs[i]} : ${listeJoueurs[nomsJoueurs[i]]}${sautsDeLigne}`;
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
exports.listeJoueurs = function(nombreHeures, estCouleurs = false, canal = null, recupererPM = false) {
    let jets = JSON.parse(fs.readFileSync(__dirname + '/../Données/stats.json', 'utf-8'))
    let listeJoueurs = {};
    let nombreD100Lancers = 0;
    let nombreD100ReussitesCrit = 0;
    let nombreD100EchecsCrit = 0;
    let nombreDNGlancers = 0;
    let DNGLancers = { 1 : [0,0], 2 : [0,0], 3 : [0,0], 4 : [0,0], 5 : [0,0], "crit" : 0}; // Un tableau est reussite / lancers


    for (let [key, value] of Object.entries(jets)) {
        if (estCouleurs) {
            let nomJoueur = `\`\`\`ansi\r\n\u001b[0;34m${key}\u001b[0;37m`;
            let listeLancers = "";
            let numeroPartie = 1;
            for (roll of value) {
                if (roll.timestamp > (Date.now() - (nombreHeures * 3600 * 1000))
                && (recupererPM || roll.estPM === false)
                && (canal === null || roll.canal === canal) ){
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

                    if (roll["type"] == "1d100") {
                        nombreD100Lancers += 1;
                        nombreD100ReussitesCrit += roll["lancer"] < 6 ? 1 : 0;
                        nombreD100EchecsCrit += roll["lancer"] > 95 ? 1 : 0;
                    }
                    else if (roll["type"].includes("dng") && !(roll["lancer"].includes(",")) && !(roll["lancer"].includes("ini"))) {
                        let lancer = roll["lancer"];
                        lancer = lancer.replaceAll("[","");
                        lancer = lancer.split("]");
                        let stat = parseInt(roll["type"][4]);
                        if (DNGLancers.hasOwnProperty(stat)) {
                            nombreDNGlancers += 1;
                            DNGLancers[stat][1] += 1;
                            if (parseInt(lancer[0]) > 3) DNGLancers[stat][0] += 1;
                            if (parseInt(lancer[1]) > 18) DNGLancers["crit"] += 1;
                        }
                    }

                }

                if (listeLancers.length > 950) {
                    let nombreCaracteres = Math.min(listeLancers.length-2, 998 - 20 - key.length);
                    listeLancers = listeLancers.slice(0,nombreCaracteres) + "\r\n\`\`\`";
                    listeJoueurs[nomJoueur] = listeLancers;
                    numeroPartie += 1;
                    nomJoueur = `\`\`\`ansi\r\n\u001b[0;34m${key} \u001b[0;36m(partie ${numeroPartie})\u001b[0;37m`;
                    listeLancers = "";
                }
            }
        if (listeLancers.length > 0) {
            let nombreCaracteres = Math.min(listeLancers.length-2, 998);
            listeLancers = listeLancers.slice(0,nombreCaracteres) + "\r\n\`\`\`";
            listeJoueurs[nomJoueur] = listeLancers;
        }}

        else {
            let nomJoueur = `${key}`;
            let listeLancers = [];
            for (roll of value) {
                if (roll.timestamp > (Date.now() - (nombreHeures * 3600 * 1000))
                && (recupererPM || roll.estPM === false)
                && (canal === null || roll.canal === canal) ){
                    let etoiles = "";
                    if ( !(roll.estReussite === null) ) {
                        etoiles = roll.estReussite ? "**" : "*";
                    }
                    let texte = ` ${etoiles}${roll["lancer"]}${etoiles}`;
                    texte += roll["type"] == "1d100" ? "" : ` (${roll["type"]})`;
                    listeLancers.push(texte);

                    if (roll["type"] == "1d100") {
                        nombreD100Lancers += 1;
                        nombreD100ReussitesCrit += roll["lancer"] < 6 ? 1 : 0;
                        nombreD100EchecsCrit += roll["lancer"] > 95 ? 1 : 0;
                    }
                }
            }
            if (listeLancers.length > 0) {
                listeJoueurs[nomJoueur] = listeLancers;
            }
        }
	}

    let nomJoueur = `\`\`\`ansi\r\n\u001b[0;34m~Statistiques\u001b[0;37m`
    let listeLancers = "";
    if (nombreD100Lancers > 7) {
        listeLancers += `\r\nNombre de d100 : ${nombreD100Lancers}\r\n`;
        listeLancers += `\u001b[0;32mNombre de réussites critiques : ${nombreD100ReussitesCrit} (Probabilité d'en faire au moins autant : ${Math.round( 100 - binomialProbability.cumulative(nombreD100Lancers, nombreD100ReussitesCrit -1, 0.05)*1000) / 10}%)\r\n`;
        listeLancers += `\u001b[0;31mNombre d'échecs critiques : ${nombreD100EchecsCrit} (Probabilité d'en faire au moins autant : ${Math.round( 100 - binomialProbability.cumulative(nombreD100Lancers, nombreD100EchecsCrit -1, 0.05)*1000 ) / 10}%)\u001b[0;37m\r\n`;
    }
    if (nombreDNGlancers > 7) {
        listeLancers += "\r\nStats pour DnG (nombre de 4+ sur les jets de caractéristique):\r\n"
        if (DNGLancers[1][1] > 0) listeLancers += `\u001b[0;31mSur une stat de 1 : ${DNGLancers[1][0]}/${DNGLancers[1][1]} (${Math.round(DNGLancers[1][0]/DNGLancers[1][1] * 1000) / 10}% / 25%)\r\n`
        if (DNGLancers[2][1] > 0) listeLancers += `\u001b[0;33mSur une stat de 2 : ${DNGLancers[2][0]}/${DNGLancers[2][1]} (${Math.round(DNGLancers[2][0]/DNGLancers[2][1] * 1000) / 10}% / 50%)\r\n`
        if (DNGLancers[3][1] > 0) listeLancers += `\u001b[0;32mSur une stat de 3 : ${DNGLancers[3][0]}/${DNGLancers[3][1]} (${Math.round(DNGLancers[3][0]/DNGLancers[3][1] * 1000) / 10}% / 62%)\r\n`
        if (DNGLancers[4][1] > 0) listeLancers += `\u001b[0;36mSur une stat de 4 : ${DNGLancers[4][0]}/${DNGLancers[4][1]} (${Math.round(DNGLancers[4][0]/DNGLancers[4][1] * 1000) / 10}% / 70%)\r\n`
        if (DNGLancers[5][1] > 0) listeLancers += `\u001b[0;34mSur une stat de 5 : ${DNGLancers[5][0]}/${DNGLancers[5][1]} (${Math.round(DNGLancers[5][0]/DNGLancers[5][1] * 1000) / 10}% / 75%)\r\n`
        listeLancers += `\u001b[0;35mNombre de critiques : ${DNGLancers["crit"]} / ${nombreDNGlancers} (${Math.round(DNGLancers["crit"] / nombreDNGlancers * 1000) / 10}% / 10%) \r\n`;
    }

    if (listeLancers.length > 0) {
        listeLancers += "\`\`\`"
        listeJoueurs[nomJoueur] = listeLancers;
    }
    return listeJoueurs;
}