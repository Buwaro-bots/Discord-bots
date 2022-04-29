let statsLancers = require('../Données/stats.json');
const fs = require('fs');
const levenshtein = require('js-levenshtein');

module.exports = {
    randomNumber: function(maximum) {
        if (maximum < 2) {
            throw '󠀾2️⃣⬆️dé inférieur à 2';
        }
        // Cette fonction sert à tirer un nombre au pif de 1 à x, j'en ai beaucoup besoin.
        return Math.floor(Math.random() * maximum) + 1;
    },

    // Cette fonction vérifie un tableau de nombre pour être sûr que ça ne renvoie pas NaN. Un tableau.
    verifierNaN: function(array) {
        for(let i = 0; i < array.length; i++)
        if (isNaN(array[i])) {
        throw '🔢nan error';
        }
    },

    sleep: function(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },  

    // Cette fonction a été faite pour pouvoir enregistrer dans la console les réponses du bot. Si la réponse doit être par mp, envoyerPM doit être égal à true
    envoyerMessage: function(client, botReply, message, envoyerPM = false, idMJ = null) {
        console.log(botReply.substring(0, 100));
        if (envoyerPM) {
            message.author.send(botReply);
            if (idMJ != null) {
                client.users.cache.get(idMJ).send(botReply);
            }
            message.react('📬');
        }
        else {
            message.channel.send(botReply);
        }
    },

    verifierSiMJ: function(args, envoyerPM) {
        longueur = args.length;
        if (longueur > 0 && args[longueur -1].startsWith('<@')) {
            idMJ = args.pop();
            idMJ = idMJ.substring(2, idMJ.length-1);
            if (idMJ.startsWith("!")) { // Les pings sur téléphone visiblement ne mettent pas de ! donc il faut les enlever à part ?
                idMJ = idMJ.slice(1);
            }
            return [args, true, idMJ];
        }
        return [args, envoyerPM, null];
    },

    logLancer: function(auteur, lancer, typeLancer) {
        if (!(auteur in statsLancers)) { // Si le lancer n'existait pas dans la base, on le rajoute
            statsLancers[auteur] = [];
        }
        
        // variable with one leading zero if only one digit
        function pad(n) {
            return n < 10 ? '0' + n : n;
        }

        dateHeure = new Date();
        dateHeure = pad(dateHeure.getDate()) + '/' + pad(dateHeure.getMonth() + 1) + '/' + dateHeure.getFullYear() + ' ' + pad(dateHeure.getHours()) + ':' + pad(dateHeure.getMinutes()) + ':' + pad(dateHeure.getSeconds());

        statsLancers[auteur].push({"lancer": lancer, "type": typeLancer, "date": dateHeure});
    
        let writer = JSON.stringify(statsLancers, null, 4); // On sauvegarde le fichier.
        fs.writeFileSync('./Données/stats.json', writer);
    },

    logLancerEffacer: function() {
        statsLancers = {}
        let writer = JSON.stringify(statsLancers, null, 4); // On sauvegarde le fichier.
        fs.writeFileSync('./Données/stats.json', writer);
        console.log("Lancers effacés.")
    },

    rattrapageFauteOrthographe: function(liste, entree, force = "faible") {
        if (!Array.isArray(liste)) {
            liste = Object.keys(liste);
        }
        let min = 1000;
        let minIndex = 0;
        entree = this.normalisationString(entree);
        for (let i = 0; i < liste.length; i++) {
            let elementTableau = this.normalisationString(liste[i]);
            if (force === "faible") {
                let distance = levenshtein(entree.substring(0, 5), elementTableau.substring(0, 5)) + levenshtein(entree.substring(5, 100), elementTableau.substring(5, 100)) / 100;

                if (distance < 3) {
                    console.log(liste[i] + " " + distance);
                }

                if (distance < min) {
                    min = distance;
                    minIndex = i;
                }
            }
            else {
                let distance = levenshtein(entree, elementTableau);
                if (distance < entree.length / 2) {
                    console.log(liste[i] + " " + distance);
                    if (distance < min) {
                        min = distance;
                        minIndex = i;
                    }
                }
            }
        }
        if (min < 3 || (force === "fort" && min < 1000)) {
            return liste[minIndex];
        }
        else {
            throw("✍️🤷Aucun résultat trouvé");
        }
    },

    // Cette fonction permet d'enlever les accents et majuscules d'une chaîne de caractères.
    normalisationString : function(string) {
        return string.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
}