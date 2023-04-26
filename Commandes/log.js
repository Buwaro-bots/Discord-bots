const fs = require('fs');
const outils = require("./outils.js");
const binomialProbability = require('binomial-probability')

module.exports = {
    log : function(client, message, args, envoyerPM, idMJ) {
    // Si l'argument est effacer et que l'utilisateur est l'admin, on effectue une copie de sauvegarde en mettant la date du jour, puis on efface les logs
    if (args[0] === "archiver" && outils.verifierSiAdmin(message.author.id)) {
        module.exports.archiver();
        return;
    }

    nombreHeures = args.length > 0 && !isNaN(args[0]) ? parseFloat(args[0]) : 5;
    outils.verifierNaN([nombreHeures]);
    let estCouleurs = args.includes("couleur");
    let canal = args.includes("canal") ? message.channelId : null;
    let [mj] = outils.rechercheDoubleParametre(args, "mj");
    let [joueurUnique] = outils.rechercheDoubleParametre(args, "joueur");

    // Si l'utilisateur n'est pas l'admin, on limite les horaires possibles.
    nombreHeures = outils.verifierSiAdmin(message.author.id) ? nombreHeures : Math.min(Math.max(nombreHeures, 1), 24);

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
    let jets = outils.getHistoriqueLancers();
    let listeJoueurs = {};
    let nombreD100Lancers = 0;
    let nombreD100ReussitesCrit = 0;
    let nombreD100EchecsCrit = 0;
    let nombreDNGlancers = 0;
    let DNGLancers = { 1 : [0,0], 2 : [0,0], 3 : [0,0], 4 : [0,0], 5 : [0,0], "crit" : 0}; // Un tableau est reussite / lancers
    let nombreINSLancers = 0;
    let INSLancers = { 1 : [0,0], 2 : [0,0], 3 : [0,0], 4 : [0,0], 5 : [0,0], 6 : [0,0]};
    let INSLancersChiffres = { 1 : 0, 2 : 0, 3 : 0, 4 : 0, 5 : 0, 6 : 0};
    let INSMedianes = {};
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
                let calculMediane = [];
                for (roll of value) {
                    if (roll.timestamp > (Date.now() - (nombreHeures * 3600 * 1000))
                    && (recupererPM || roll.estPM === false)
                    && (canal === null || roll.canal === canal) ){
                        let texte;
                        if (roll.estReussite === null) {
                            texte = `${roll["lancer"]}`;
                            texte += roll["type"] == "1d100" ? ", " : ` \u001b[0;33m(${roll["type"]})\u001b[0;37m, `;
                        }
                        else if (roll.estReussite) {
                            texte = `\u001b[0;32m${roll["lancer"]}`;
                            texte += roll["type"] == "1d100" ? "\u001b[0;37m, " : ` (${roll["type"]})\u001b[0;37m, `;
                        }
                        else {
                            texte = `\u001b[0;31m${roll["lancer"]}`;
                            texte += roll["type"] == "1d100" ? "\u001b[0;37m, " : ` (${roll["type"]})\u001b[0;37m, `;
                        }
                        if (texte.length + listeLancers.length >= 900 && listeLancers.length < 900) {
                            listeLancers += `\r\n${texte}`;
                        }
                        else {
                            listeLancers += texte;
                        }

                        if (true /*key !== mj*/) {
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
                            else if (roll["type"].includes("INS") && !(roll["type"].includes("gacha"))) {
                                let lancer = roll["lancer"];
                                let premierDe = parseInt(lancer[1])
                                nombreINSLancers += 1;
                                INSLancers[premierDe][0] += 1;
                                INSLancers[premierDe][1] += lancer === `[${premierDe}${premierDe}]+[${premierDe}]` ? 1 : 0;

                                INSLancersChiffres[parseInt(lancer[1])] += 1;
                                INSLancersChiffres[parseInt(lancer[2])] += 1;
                                INSLancersChiffres[parseInt(lancer[6])] += 1;

                                calculMediane.push((parseInt(lancer[1])) * 6 + parseInt(lancer[2]));
                            }
                        }
                    }

                    if (listeLancers.length > 1720) { // Il y a une limite de 1000 caractères par lignes en plus de la limite de 2000 caractères par message.
                        nomJoueur = `\`\`\`ansi\r\n\u001b[0;34m${key} \u001b[0;36m(partie ${numeroPartie})\u001b[0;37m`;
                        // nomJoueur = key == mj ? `\`\`\`ansi\r\n\u001b[0;36m${key} \u001b[0;34m(partie ${numeroPartie})\u001b[0;37m` : `\`\`\`ansi\r\n\u001b[0;34m${key} \u001b[0;36m(partie ${numeroPartie})\u001b[0;37m`;
                        numeroPartie += 1;
                        let nombreCaracteres = Math.min(listeLancers.length-2, 1798 - 20 - key.length);
                        listeLancers = listeLancers.slice(0,nombreCaracteres) + "\r\n\`\`\`";
                        listeJoueurs[nomJoueur] = listeLancers;
                        listeLancers = "";
                        nomJoueur = `\`\`\`ansi\r\n\u001b[0;34m${key} \u001b[0;36m(partie ${numeroPartie})\u001b[0;37m`;
                    }
                }
                if (listeLancers.length > 0) {
                    let nombreCaracteres = Math.min(listeLancers.length-2, 1798);
                    listeLancers = listeLancers.slice(0,nombreCaracteres) + "\r\n\`\`\`";
                    listeJoueurs[nomJoueur] = listeLancers;
                }

                calculMediane = calculMediane.sort(function(a,b){return a-b;});
                if (calculMediane.length > 4) {
                    if (calculMediane.length % 2 == 0) {
                        INSMedianes[key] = Math.floor((calculMediane[calculMediane.length/2 -1] + calculMediane[calculMediane.length/2]) / 2);
                    }
                    else {
                        INSMedianes[key] = calculMediane[Math.round(calculMediane.length / 2) -1]
                    }
                }
            }
            
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
    let mentionDuMJ = ""; // mj === "" ? "" : "(sans le mj)";
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
        let padLancers = 1;
        let padChiffres = 1;
        for (let i = 1; i < 7; i++) {
            if (INSLancers[i][0].toString().length > padLancers) padLancers = INSLancers[i][0].toString().length;
            if (INSLancersChiffres[i].toString().length > padChiffres) padChiffres = INSLancersChiffres[i].toString().length;
        }

        listeLancers += `\r\nStats pour INS (premier dé de chaque lancer, triples, et totaux des trois dés.):\r\nNombre de lancers : ${nombreINSLancers}\r\n`
        listeLancers += `\u001b[0;36mLancers de 1x : ${outils.pad(INSLancers[1][0], padLancers, " ")} [${outils.pad(INSLancersChiffres[1], padChiffres, " ")}]${INSLancers[1][1] > 0 ? " (dont " + INSLancers[1][1] + " '111')" : ""}\r\n`;
        listeLancers += `\u001b[0;34mLancers de 2x : ${outils.pad(INSLancers[2][0], padLancers, " ")} [${outils.pad(INSLancersChiffres[2], padChiffres, " ")}]\r\n`;
        listeLancers += `\u001b[0;32mLancers de 3x : ${outils.pad(INSLancers[3][0], padLancers, " ")} [${outils.pad(INSLancersChiffres[3], padChiffres, " ")}]${INSLancers[3][1] > 0 ? " (dont " + INSLancers[3][1] + " '333')" : ""} \r\n`;
        listeLancers += `\u001b[0;33mLancers de 4x : ${outils.pad(INSLancers[4][0], padLancers, " ")} [${outils.pad(INSLancersChiffres[4], padChiffres, " ")}]\r\n`;
        listeLancers += `\u001b[0;35mLancers de 5x : ${outils.pad(INSLancers[5][0], padLancers, " ")} [${outils.pad(INSLancersChiffres[5], padChiffres, " ")}]\r\n`;
        listeLancers += `\u001b[0;31mLancers de 6x : ${outils.pad(INSLancers[6][0], padLancers, " ")} [${outils.pad(INSLancersChiffres[6], padChiffres, " ")}]${INSLancers[6][1] > 0 ? " (dont " + INSLancers[6][1] + " '666')" : ""}\r\n`;
        listeLancers += "\u001b[0;0mMedianes : ";
        keysSorted = Object.keys(INSMedianes).sort(function(a,b){return INSMedianes[a]-INSMedianes[b]})
        for (let i = 0; i < keysSorted.length; i++) {
            let mediane = Math.floor(INSMedianes[keysSorted[i]] / 6) * 10 + INSMedianes[keysSorted[i]] % 6;
            if (mediane % 10 == 0) mediane -= 4;
            listeLancers+= `${keysSorted[i]} (${mediane}) `;
        }
    }

    if (listeLancers.length > 0) {
        listeLancers += "\`\`\`"
        listeJoueurs[nomJoueur] = listeLancers;
    }
    return listeJoueurs;
    },

    archiver : function() {
        let date = new Date();
        let jour = outils.pad(date.getDate());
        let mois = outils.pad(date.getMonth() + 1);
        let annee = date.getFullYear();
        let heure = outils.pad(date.getHours());
        let minute = outils.pad(date.getMinutes());
        let seconde = outils.pad(date.getSeconds());
        let dateString = `${annee}-${mois}-${jour}_${heure}-${minute}-${seconde}`;
        let ancienHistorique = outils.getHistoriqueLancers();
        let nouvelHistorique = {};

        let timeStampLimite = Date.now() - 2 * 24 * 60 * 60 * 1000;

        let listeUtilisateurs = Object.keys(ancienHistorique);
        for (let i = 0; i < listeUtilisateurs.length; i++) {
            let nomUtilisateur = listeUtilisateurs[i];
            let ancienUtilisateur = ancienHistorique[nomUtilisateur];
            if (ancienUtilisateur[ancienUtilisateur.length - 1].timestamp > timeStampLimite) { // Si le dernier roll est plus récent que la limite...
                nouvelHistorique[nomUtilisateur] = [];
                let nouvelUtilisateur = nouvelHistorique[nomUtilisateur];
                while (ancienUtilisateur.length > 0 && ancienUtilisateur[ancienUtilisateur.length - 1].timestamp > timeStampLimite) { // On enlève les rolls les plus récents pour les mettre dans le nouvel historique...
                    nouvelUtilisateur.unshift(ancienUtilisateur.pop());
                }
            }
        }
        outils.setHistoriqueLancers(nouvelHistorique); // Pour pouvoir garder les rolls récents dans l'historique...
        let writer = JSON.stringify(ancienHistorique, null, 4);
        fs.writeFileSync(`./Données/Archives/Logs_${dateString}.json`, writer); // Et n'archiver que les anciens
    },

    checkDernierArchivage : function() {
        let timeStampLimite = Date.now() - 7 * 24 * 60 * 60 * 1000;
        let historique = outils.getHistoriqueLancers();

        let listeUtilisateurs = Object.keys(historique);
        for (let i = 0; i < listeUtilisateurs.length; i++) {
            if (historique[listeUtilisateurs[i]][0].timestamp < timeStampLimite) {
                module.exports.archiver();
                console.log("Lancers archivés.");
                return;
            }
        }
    }
}

if (global.serveurProd) {
    module.exports.checkDernierArchivage();
}