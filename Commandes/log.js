const fs = require('fs');
const outils = require("./outils.js");
const config = require('../config.json');
const binomialProbability = require('binomial-probability')

module.exports = {
    log : function(client, message, args, envoyerPM, idMJ) {
    // Si l'argument est effacer et que l'utilisateur est l'admin, on effectue une copie de sauvegarde en mettant la date du jour, puis on efface les logs
    if (args[0] === "effacer" && message.author.id === config.admin) {

        let date = new Date();
        let jour = outils.pad(date.getDate());
        let mois = outils.pad(date.getMonth() + 1);
        let annee = date.getFullYear();
        let heure = outils.pad(date.getHours());
        let minute = outils.pad(date.getMinutes());
        let seconde = outils.pad(date.getSeconds());
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
    let mj = "";
    let joueurUnique = "";
    for (let i = 0 ; i + 1 < args.length; i++) {
        if (args[i] === "mj") {
            mj = args[i+1];
        }
        if (args[i] === "joueur") {
            joueurUnique = args[i+1];
        }
    }

    // Si l'utilisateur n'est pas l'admin, on limite les horaires possibles.
    nombreHeures = message.author.id === config.admin ? nombreHeures : Math.min(Math.max(nombreHeures, 1), 24);

    let listeJoueurs = module.exports.listeJoueurs(nombreHeures, estCouleurs, canal, mj, joueurUnique);
    let nomsJoueurs  = Object.keys(listeJoueurs).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'})); // Tri sans faire attention à la casse
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
    },

    // Pour l'instant je ne rajoute pas de fonctionalité pour récupérer les PM.
    listeJoueurs : function(nombreHeures, estCouleurs = false, canal = null, mj = "", joueurUnique = "",recupererPM = false) {
    let jets = JSON.parse(fs.readFileSync(__dirname + '/../Données/stats.json', 'utf-8'))
    let listeJoueurs = {};
    let nombreD100Lancers = 0;
    let nombreD100ReussitesCrit = 0;
    let nombreD100EchecsCrit = 0;
    let nombreDNGlancers = 0;
    let DNGLancers = { 1 : [0,0], 2 : [0,0], 3 : [0,0], 4 : [0,0], 5 : [0,0], "crit" : 0}; // Un tableau est reussite / lancers
    let nombreINSLancers = 0;
    let INSLancers = { 1 : [0,0], 2 : [0,0], 3 : [0,0], 4 : [0,0], 5 : [0,0], 6 : [0,0]};
    let INSLancersChiffres = { 1 : 0, 2 : 0, 3 : 0, 4 : 0, 5 : 0, 6 : 0};
    mj = mj === "" ? "": outils.rattrapageFauteOrthographe(jets, mj);
    joueurUnique = joueurUnique === "" ? "": outils.rattrapageFauteOrthographe(jets, joueurUnique);

    for (let [key, value] of Object.entries(jets)) {
        // Je vérifie si le joueur avec un if au lieu de modifier le tableau pour éviter un accident si jamais un jour j'essaye de sauvegarder dedans
        if (joueurUnique === "" || key === joueurUnique) {
            if (estCouleurs) {
                // Si l'utilisateur est le mj, on le mets d'une couleur différente, mettre une couleur différente permets aussi de le mettre en bas dans l'ordre alphabétique.
                let nomJoueur = key == mj ? `\`\`\`ansi\r\n\u001b[0;36m${key}\u001b[0;37m` :  `\`\`\`ansi\r\n\u001b[0;34m${key}\u001b[0;37m`;
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

                        if (key !== mj) {
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
                            else if (roll["type"].includes("INS") && !(roll["lancer"].includes("gacha"))) {
                                let lancer = roll["lancer"];
                                let premierDe = parseInt(lancer[1])
                                nombreINSLancers += 1;
                                INSLancers[premierDe][0] += 1;
                                INSLancers[premierDe][1] += lancer === `[${premierDe}${premierDe}]+[${premierDe}]` ? 1 : 0;

                                INSLancersChiffres[parseInt(lancer[1])] += 1;
                                INSLancersChiffres[parseInt(lancer[2])] += 1;
                                INSLancersChiffres[parseInt(lancer[6])] += 1;
                            }
                        }
                    }

                    if (listeLancers.length > 920) {
                        nomJoueur = `\`\`\`ansi\r\n\u001b[0;34m${key} \u001b[0;36m(partie ${numeroPartie})\u001b[0;37m`;
                        // nomJoueur = key == mj ? `\`\`\`ansi\r\n\u001b[0;36m${key} \u001b[0;34m(partie ${numeroPartie})\u001b[0;37m` : `\`\`\`ansi\r\n\u001b[0;34m${key} \u001b[0;36m(partie ${numeroPartie})\u001b[0;37m`;
                        numeroPartie += 1;
                        let nombreCaracteres = Math.min(listeLancers.length-2, 998 - 20 - key.length);
                        listeLancers = listeLancers.slice(0,nombreCaracteres) + "\r\n\`\`\`";
                        listeJoueurs[nomJoueur] = listeLancers;
                        listeLancers = "";
                        nomJoueur = `\`\`\`ansi\r\n\u001b[0;34m${key} \u001b[0;36m(partie ${numeroPartie})\u001b[0;37m`;
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
                    }
                }
                if (listeLancers.length > 0) {
                    listeJoueurs[nomJoueur] = listeLancers;
                }
            }
        }
	}
    let mentionDuMJ = mj === "" ? "" : "(sans le mj)";
    let nomJoueur = `\`\`\`ansi\r\n\u001b[1;32mStatistiques ${mentionDuMJ}\u001b[0;37m`
    let listeLancers = "";
    if (nombreD100Lancers > 7) {
        listeLancers += `\r\nNombre de d100 : ${nombreD100Lancers}\r\n`;
        listeLancers += `\u001b[0;32mNombre de réussites critiques : ${nombreD100ReussitesCrit} (Probabilité d'en faire au moins autant : ${Math.round( 1000 - binomialProbability.cumulative(nombreD100Lancers, nombreD100ReussitesCrit -1, 0.05)*1000) / 10}%)\r\n`;
        listeLancers += `\u001b[0;31mNombre d'échecs critiques : ${nombreD100EchecsCrit} (Probabilité d'en faire au moins autant : ${Math.round( 1000 - binomialProbability.cumulative(nombreD100Lancers, nombreD100EchecsCrit -1, 0.05)*1000 ) / 10}%)\u001b[0;37m\r\n`;
    }
    if (nombreDNGlancers > 4) {
        listeLancers += "\r\nStats pour DnG (nombre de 4+ sur les jets de caractéristique):\r\n"
        if (DNGLancers[1][1] > 0) listeLancers += `\u001b[0;31mSur une stat de 1 : ${DNGLancers[1][0]}/${DNGLancers[1][1]} (${Math.round(DNGLancers[1][0]/DNGLancers[1][1] * 1000) / 10}% / 25%)\r\n`
        if (DNGLancers[2][1] > 0) listeLancers += `\u001b[0;33mSur une stat de 2 : ${DNGLancers[2][0]}/${DNGLancers[2][1]} (${Math.round(DNGLancers[2][0]/DNGLancers[2][1] * 1000) / 10}% / 50%)\r\n`
        if (DNGLancers[3][1] > 0) listeLancers += `\u001b[0;32mSur une stat de 3 : ${DNGLancers[3][0]}/${DNGLancers[3][1]} (${Math.round(DNGLancers[3][0]/DNGLancers[3][1] * 1000) / 10}% / 62%)\r\n`
        if (DNGLancers[4][1] > 0) listeLancers += `\u001b[0;36mSur une stat de 4 : ${DNGLancers[4][0]}/${DNGLancers[4][1]} (${Math.round(DNGLancers[4][0]/DNGLancers[4][1] * 1000) / 10}% / 70%)\r\n`
        if (DNGLancers[5][1] > 0) listeLancers += `\u001b[0;34mSur une stat de 5 : ${DNGLancers[5][0]}/${DNGLancers[5][1]} (${Math.round(DNGLancers[5][0]/DNGLancers[5][1] * 1000) / 10}% / 75%)\r\n`
        listeLancers += `\u001b[0;35mNombre de critiques : ${DNGLancers["crit"]} / ${nombreDNGlancers} (${Math.round(DNGLancers["crit"] / nombreDNGlancers * 1000) / 10}% / 10%) \r\n`;
    }
    if (nombreINSLancers > 4) {
        listeLancers += `\r\nStats pour INS (premier dé de chaque lancer, triples, et totaux des trois dés.):\r\nNombre de lancers : ${nombreINSLancers}\r\n`
        if (INSLancers[1][0] > 0) listeLancers += `\u001b[0;36mLancers de 1x : ${INSLancers[1][0]} ${INSLancers[1][1] > 0 ? "dont " + INSLancers[1][1] + " '111'" : ""} [${INSLancersChiffres[1]}]\r\n`
        if (INSLancers[2][0] > 0) listeLancers += `\u001b[0;34mLancers de 2x : ${INSLancers[2][0]}  [${INSLancersChiffres[2]}]\r\n`
        if (INSLancers[3][0] > 0) listeLancers += `\u001b[0;32mLancers de 3x : ${INSLancers[3][0]} ${INSLancers[3][1] > 0 ? "dont " + INSLancers[3][1] + " '333'" : ""} [${INSLancersChiffres[3]}]\r\n`
        if (INSLancers[4][0] > 0) listeLancers += `\u001b[0;33mLancers de 4x : ${INSLancers[4][0]} ${INSLancers[4][1] > 0 ? "dont " + INSLancers[4][1] + " '444'" : ""} [${INSLancersChiffres[4]}]\r\n`
        if (INSLancers[5][0] > 0) listeLancers += `\u001b[0;35mLancers de 5x : ${INSLancers[5][0]}  [${INSLancersChiffres[5]}]\r\n`
        if (INSLancers[6][0] > 0) listeLancers += `\u001b[0;31mLancers de 6x : ${INSLancers[6][0]} ${INSLancers[6][1] > 0 ? "dont " + INSLancers[6][1] + " '666'" : ""} [${INSLancersChiffres[6]}]\r\n`
    }

    if (listeLancers.length > 0) {
        listeLancers += "\`\`\`"
        listeJoueurs[nomJoueur] = listeLancers;
    }
    return listeJoueurs;
    }
}