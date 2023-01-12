let statsLancers = require('../Données/stats.json');
const fs = require('fs');
const levenshtein = require('js-levenshtein');
let listeDésPondérés = {
    "ins" : {nombreDeFaces : 6, nombreDeSeries : 3, nombreDeDésAléatoires : 30, liste : []},
    "dng 1" : {nombreDeFaces : 4, nombreDeSeries : 1, nombreDeDésAléatoires : 8, liste : []},
    "dng 2" : {nombreDeFaces : 6, nombreDeSeries : 2, nombreDeDésAléatoires : 12, liste : []},
    "dng 3" : {nombreDeFaces : 8, nombreDeSeries : 2, nombreDeDésAléatoires : 16, liste : []},
    "dng 4" : {nombreDeFaces : 10, nombreDeSeries : 2, nombreDeDésAléatoires : 12, liste : []},
    "dng 5" : {nombreDeFaces : 12, nombreDeSeries : 1, nombreDeDésAléatoires : 6, liste : []},
    "dng crit" : {nombreDeFaces : 20, nombreDeSeries : 2, nombreDeDésAléatoires : 60, liste : []},
    "num" : {nombreDeFaces : 20, nombreDeSeries : 1, nombreDeDésAléatoires : 40, liste : []},
}

module.exports = {
    outils:function(){throw("Cette fonction n'est pas censé être appelée.");},

    randomNumber: function(maximum) {
        if (maximum < 2) {
            throw 'Dé demandé inférieur à 2.';
        }
        // Cette fonction sert à tirer un nombre au pif de 1 à x, j'en ai beaucoup besoin.
        return Math.floor(Math.random() * maximum) + 1;
    },

    lancerDéPondéré: function(type, nombreDeFaces) {
        if (!(type in listeDésPondérés)) {
            return module.exports.randomNumber(nombreDeFaces);
        }
        let listeDés = listeDésPondérés[type].liste;
        if (listeDés.length === 0) {
            module.exports.générerDésPondérés(type);
        }
        return listeDés.pop();
    },

    générerDésPondérés: function(type) {
        if (!(type in listeDésPondérés)) throw("Type de lancer à générer invalide.");
        let listeDés = listeDésPondérés[type];
        for (let i = 0; i < listeDés.nombreDeSeries; i++) {
            for (let j = 1; j <= listeDés.nombreDeFaces; j++) {
                listeDés.liste.push(j);
            }
        }
        for (let i = 0; i < listeDés.nombreDeDésAléatoires; i++) {
            listeDés.liste.push(Math.floor(Math.random() * listeDés.nombreDeFaces) + 1);
        }
        listeDés.liste = module.exports.shuffleFisherYates(listeDés.liste);
    },

    getDésPondérés : function() {
        return listeDésPondérés;
    },

    setDésPondérés : function(nouveauxDés) {
        listeDésPondérés = nouveauxDés;
    },

    initialiserDésPondérés : function() {
        fichier = "./Données/tempDés.json"
        fs.access(fichier, fs.constants.F_OK, (manque) => {
            if (!manque) {
                let jsonHistorique = JSON.parse(fs.readFileSync('./Données/tempDés.json', 'utf-8'));
                module.exports.setDésPondérés(jsonHistorique);
                fs.unlink('./Données/tempDés.json', (err) => {
                    if (err) throw err;
                    console.log("L'historique a bien été archivé et le fichier supprimé.");
                });
            }
        });
    },

    pad: function(nombre, longueur = 2) {
        return ("0".repeat(longueur) + nombre).slice(-longueur);
    },

    // Cette fonction vérifie un tableau de nombre pour être sûr que ça ne renvoie pas NaN. Un tableau.
    verifierNaN: function(array) {
        for(let i = 0; i < array.length; i++)
            if (isNaN(parseInt(array[i]))) {
                throw "Le nombre attendu n'est pas valide.";
            }
        },

    sleep: function(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },  

    // Cette fonction a été faite pour pouvoir enregistrer dans la console les réponses du bot et à centraliser la gestion de si le message doit être envoyé par mp ou pas, et à un MJ.
    envoyerMessage: function(client, botReply, message, envoyerPM = false, idMJ = null, aSupprimer = false) {
        if (client === null) {console.log(botReply.length);console.log('\x1b[32m%s\x1b[0m', botReply); return;}
  
        module.exports.loggerMessage(botReply, message);

        if (envoyerPM) {
            if (idMJ != null) {
                client.users.cache.get(idMJ).send(botReply);
            }
            message.react('📬');
            return message.author.send(botReply);
        }
        else {
            if (aSupprimer) { // Le if est ici sinon le return n'a pas lieu à temps, oui je sais que je devrais faire de l'async.
                message.channel.send(botReply)
                .then((msg) => {
                        msg.react('❌');
                        let estSupprimé = false

                        const collector = msg.createReactionCollector({
                            time: 300 * 1000
                        });
                        collector.on('collect', (reaction, user) => {
                            if(user.id === message.author.id && reaction.emoji.name === "❌") {
                                estSupprimé = true;
                                collector.resetTimer({time: 1});
                            }
                        })
                        collector.on('end', collected => {
                            if (estSupprimé) {
                                message.delete();
                                msg.delete();
                            }
                            else {
                                msg.reactions.removeAll();
                            }
                        });
                    return msg;
                })
            }
            else {
                return message.channel.send(botReply);
            }
        }
    },

    // Cette fonction a été faite juste pour mettre des couleurs dans le console.log du message de l'utilisateur et la réponse. Sa longueur fait que je l'ai séparé de envoyerMessage.
    loggerMessage: function(botReply, message) {
        if (botReply.includes("```ansi")) {
            console.log(botReply + "\x1b[0m");
        }
        else {
            let copieBotReply = "";
            const longueur = Math.min(botReply.length, 120);
            let cacaterePrecentNumerique = false;
            let estGras = false;
            for (let i = 0; i < longueur; i++) {
                if (isNaN(botReply[i])) {
                    if (cacaterePrecentNumerique) {
                        cacaterePrecentNumerique = false;
                        copieBotReply += "\x1b[0m";
                    }
                }
                else {
                    if (!cacaterePrecentNumerique) {
                        cacaterePrecentNumerique = true;
                        copieBotReply += "\x1b[33m";
                    }
                }
                if (i+1 < longueur && botReply[i] === "*" && botReply[i+1] === "*") {
                    if (estGras) {
                        copieBotReply += "\x1b[24m";
                        estGras = false;
                    }
                    else {
                        copieBotReply += "\x1b[4m";
                        estGras = true;
                    }
                    i += 1;
                }
                else {
                    copieBotReply += botReply[i];
                }
            }
            // Si la réponse commence par un ping, je le remplace par le nom de l'utilisateur.
            if (copieBotReply.startsWith("<@")) {
                copieBotReply = `\x1b[96m${message.author.username}\x1b[0m${copieBotReply.substring(copieBotReply.indexOf(">")+1)}\x1b[0m`
            }
            console.log(copieBotReply);
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
            return [args, true, idMJ]; // S'il y a un ping, le message sera forcément envoyé par mp à l'utilisateur
        }
        return [args, envoyerPM, null]; // S'il n'y a pas de ping, on ne touche pas à envoyerPM parce que la fonctionne ne sait pas si l'utilisateur avait demandé un mp ou pas.
    },

    logLancer: function(message, lancer, typeLancer, estPM = false, estReussite = null) {
        let auteur = message.author.username;
        let canal = message.channelId;
        if (!(auteur in statsLancers)) { // Si le lancer n'existait pas dans la base, on le rajoute
            statsLancers[auteur] = [];
        }
        
        dateHeure = new Date();
        dateHeure = module.exports.pad(dateHeure.getDate()) + '/' + module.exports.pad(dateHeure.getMonth() + 1) + '/' + dateHeure.getFullYear() + ' ' + module.exports.pad(dateHeure.getHours()) + ':' + module.exports.pad(dateHeure.getMinutes()) + ':' + module.exports.pad(dateHeure.getSeconds());

        statsLancers[auteur].push({"lancer": lancer, "type": typeLancer, "date": dateHeure, "timestamp": Date.now(), "estPM": estPM, "estReussite": estReussite, "canal": canal});
    
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
        entree = module.exports.normalisationString(entree);
        for (let i = 0; i < liste.length; i++) {
            let elementTableau = module.exports.normalisationString(liste[i]);
            if (force === "faible") {
                let distance = levenshtein(entree.substring(0, 5), elementTableau.substring(0, 5)) + levenshtein(entree.substring(5, 100), elementTableau.substring(5, 100)) / 100;

                if (distance < 3) {
                    process.stdout.write(liste[i] + " " + distance + " ; ");
                }

                if (distance < min) {
                    min = distance;
                    minIndex = i;
                }
            }
            else {
                let distance = levenshtein(entree, elementTableau);
                if (distance < entree.length / 3) {
                    process.stdout.write(liste[i] + " " + distance + " ; ");
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
            throw("Aucun résultat trouvé.");
        }
    },

    // Cette fonction permet d'enlever les accents et majuscules d'une chaîne de caractères.
    normalisationString : function(string) {
        return string.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    gestionAutocheck : function(mode, idJoueur) {
        let paramJoueurs = JSON.parse(fs.readFileSync(__dirname + '/../Données/param-joueurs.json', 'utf-8'));

        let botReply = "";
        if (paramJoueurs[mode].listeAutoVerifications.includes(idJoueur)) {
            const index = paramJoueurs[mode].listeAutoVerifications.indexOf(idJoueur);
            paramJoueurs[mode].listeAutoVerifications.splice(index, 1);
            botReply = " : Vous avez désactivé la vérification automatique.";
        }
        else {
            paramJoueurs[mode].listeAutoVerifications.push(idJoueur)
            botReply = " : Vous avez activé la vérification automatique.";
        }

        let writer = JSON.stringify(paramJoueurs, null, 4); // On sauvegarde le fichier.
        fs.writeFileSync('./Données/param-joueurs.json', writer);

        return botReply;
    },

    /**
     * @description Cette fonction recherche un paramètre dans ceux du message pour renvoyer la valeur suivante. Utile pour des commandes du genre ;test vitesse 10.
     * @param {array} args @param {string} parametreRecherché @param {any} valeurParDefaut
     * @returns {Array} [valeurParDefaut (Si la paramètre est trouvé, renvoit la valeur suivante, sinon la valeur par défaut, sinon ""),
     *                  args (Renvoit les arguments, moins les deux paramètres utilisés si elles existaient.)]
     */
    rechercheDoubleParametre : function(args, parametreRecherché, valeurParDefaut = "") {
        for (let i = 0 ; i < args.length -1 ; i++) {
            if (args[i] === parametreRecherché) {
                valeurParDefaut = args[i+1];
                args.splice(i,2);
                break;
            }
        }
        return [valeurParDefaut, args]
    },

    genererAliases : function() {
        aliasBases = JSON.parse(fs.readFileSync('./Données/aliases.json', 'utf-8')); // Ce fichier contient les noms alternatifs des commandes
        aliasPerso = JSON.parse(fs.readFileSync('./Données/aliases-perso.json', 'utf-8')); // Ce fichier contient les noms alternatifs des commandes
        return [aliasBases.concat(aliasPerso.global), aliasPerso];
    },

    /**
     * @description Cette fonction prend une entrée, un tableau de regexp (et eventuellement une longueur maximale),
     * et renvoit soit l'entrée si le regexp est validé, soit une erreur.
     */
    verifierRegex : function(entrée, listeRegex, longueur = 0) {
        if (longueur > 0) {
            entrée = entrée.substring(0,longueur);
        }
        for (let i = 0; i < listeRegex.length; i++) {
            let regex = new RegExp(listeRegex[i]);
            if (regex.test(entrée)) {
                return entrée;
            }
        }
        throw(`L'entrée n'est pas dans le bon format.`);
    },

    // https://sebhastian.com/fisher-yates-shuffle-javascript/
    shuffleFisherYates: function(array) {
        let i = array.length;
        while (--i > 0) {
          let randIndex = Math.floor(Math.random() * (i + 1));
          [array[randIndex], array[i]] = [array[i], array[randIndex]];
        }
        return array;
    },

    retirerReaction: function(message, reaction, user, timer = 1000) {
        if (message.guildId !== null) { // Si le serveur est null, c'est que c'est un MP.
            setTimeout(function() {
                reaction.users.remove(user);
            }, timer);
        }
    }
}

if (global.serveurProd) {
    module.exports.initialiserDésPondérés();
}