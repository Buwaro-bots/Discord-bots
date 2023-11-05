const outils = require("./outils.js");
const fs = require('fs');
let Parser = require('rss-parser');
let parser = new Parser();
let listeFlux = {};
const nombreDeMSEntreChaqueCheck = 60 * 60 * 1000;
let timestampDernièreVérification = Date.now();

const joursDelaSemaine = {
    "Dimanche": 0,
    "Lundi": 1,
    "Mardi": 2,
    "Mercredi": 3,
    "Jeudi": 4,
    "Vendredi": 5,
    "Samedi": 6
  };

let listeDeTitres = {}
let fluxàModifier = null

module.exports = {
    rss : function(message, args, envoyerPM, idMJ, options) {
        if (args[0] === "actualiser") {
            if (args.length > 1) {
                args.shift();
                let nom = args.join(" ");
                if (!(listeDeTitres.hasOwnProperty(nom))) nom = outils.rattrapageFauteOrthographe(listeDeTitres, nom, "inclure");
                module.exports.checkerUnFlux(listeDeTitres[nom], listeFlux[listeDeTitres[nom]], true);
                message.react('👍');
                module.exports.sauvegarderJSON();
            }
            else {
                message.react('👍');
                module.exports.checkerLesFlux(true, false);
            }
            return;
        }
        else if (args[0] === "nouveau") {
            listeFlux[args[1]] = {
                titre: null,
                timestampDernierPost: 0,
                lienDernièreUpdate: "",
                listeCanaux: {}
            }
            listeFlux[args[1]]["listeCanaux"][message.channel.id] = {
                listeCréateurs: [
                    message.author.id
                ],
                listeMentions: []
            }

            message.react('👍');
            module.exports.checkerUnFlux(args[1], listeFlux[args[1]]);
            module.exports.sauvegarderJSON(); 
            return; 
    }
        else if (args[0] === "statut") {
            args.shift();
            let botReply = ""
            if (args.length > 0) {
                let nom = args.join(" ");
                if (!(listeDeTitres.hasOwnProperty(nom))) nom = outils.rattrapageFauteOrthographe(listeDeTitres, nom, "inclure");
                let fluxActuel = listeFlux[listeDeTitres[nom]];
                botReply = `Titre : **${fluxActuel.titre}** \r\n` +
                `Dernière mise à jour : <${fluxActuel.lienDernièreUpdate}> \r\n` +
                `Date de la dernière MAJ : Le ${outils.dateHeureFrançaise(fluxActuel.timestampDernierPost)}. \r\n` +
                outils.envoyerMessage(botReply, message, envoyerPM, null, true);
            }
            else {
                for (let [adresse, objet] of Object.entries(listeFlux)) {
                    if (objet.listeCanaux.hasOwnProperty(message.channel.id)) {
                        botReply += `**${objet.titre}** : Le ${outils.dateHeureFrançaise(objet.timestampDernierPost)} (<${objet.lienDernièreUpdate}>).\r\n`
                        if (botReply.length > 1800) {
                            outils.envoyerMessage(botReply, message, envoyerPM, null, true);
                            botReply = "";
                        }
                    }
                }
                outils.envoyerMessage(botReply, message, envoyerPM, null, true);
            }
            return;
        }
        else if (args[0] === "modifier") {
            // Système qui recherche un flux, et la prochaine fois que tu fais la commande dans les 15 minutes qui suit tu peux modifier l'objet
            return;
        }
        else {
            throw("Commande non reconnu.") // Rajouter ici commande aide.
        }
},

    checkerUnFlux : async function(adresse, objet) {
        let listeNouveauxPosts = [];
        let timeStampMaximum = objet.timestampDernierPost;
        let feed = [];

        try {
            outils.logPermanent(`Vérification de ${adresse}`);
            feed = await parser.parseURL(adresse);
            if (objet.timestampDernierPost === 0) {
                listeNouveauxPosts.push(feed.items.shift());
                objet.timestampDernierPost = new Date(listeNouveauxPosts[0].isoDate).getTime();
                objet.lienDernièreUpdate = listeNouveauxPosts[0].link;
                module.exports.modifierTitre(adresse, feed.title);
            }
            else {
                feed.items.forEach(item => {
                    let timeStampItem = new Date(item.isoDate).getTime();
                    if (timeStampItem > timeStampMaximum) {
                        listeNouveauxPosts.push(item);
                        if (timeStampItem > objet.timestampDernierPost) {
                            objet.timestampDernierPost = timeStampItem;
                        }
                    }
                });
            }
        }
        catch(err) {
            console.log(err);
        }

        if (listeNouveauxPosts.length === 0) {
            outils.logPermanent(`Pas de nouveau post pour ${adresse}.`);
            return;
        }
        else {
            if (objet.titre === null) {
                module.exports.modifierTitre(adresse, feed.title);
                listeDeTitres[feed.title] = adresse;
            }
            while (listeNouveauxPosts.length > 0) {
                let nouveauPost = listeNouveauxPosts.pop();
                objet.lienDernièreUpdate = nouveauPost.link;
                for (let [canal, objetCanal] of Object.entries(objet.listeCanaux)) {
                    outils.envoyerMessageAUnCanal(`${nouveauPost.link}`, canal)
                    .then((msg)=> {
                        if (listeNouveauxPosts.length === 0) {
                            msg.react("🔔").then(() => msg.react("🔕"));
                            const collector = msg.createReactionCollector({
                                time: 4 * 60 * 60 * 1000
                            });
                            collector.on('collect', (reaction, user) => {
                                if (reaction.emoji.name === "🔔" && user.bot === false ) {
                                    if (!(objetCanal.listeMentions.includes(user.id))) {
                                        objetCanal.listeMentions.push(user.id);
                                        let botReply = `<@${user.id}> Vous êtes maintenant abonné`;
                                        botReply += objet.titre === null ? "." : ` à ${objet.titre}.`;
                                        outils.envoyerMessageAUnCanal(botReply, canal);
                                        module.exports.sauvegarderJSON(); 
                                    }
                                    reaction.users.remove(user);
                                }
                                if (reaction.emoji.name === "🔕" && user.bot === false ) {
                                    if (objetCanal.listeMentions.includes(user.id)) {
                                        const index = objetCanal.listeMentions.indexOf(user.id);
                                        objetCanal.listeMentions.splice(index, 1);
                                        let botReply = `<@${user.id}> Vous êtes maintenant désabonné`;
                                        botReply += objet.titre === null ? "." : ` de ${objet.titre}.`;
                                        outils.envoyerMessageAUnCanal(botReply, canal);
                                        module.exports.sauvegarderJSON(); 
                                    }
                                    reaction.users.remove(user);
                                }
                            });
                            collector.on('end', collected => {
                                msg.reactions.cache.forEach((reaction) => {
                                    if (reaction.message.author.bot) {
                                        reaction.remove().catch(console.error);
                                    }
                                });
                            });
                        }
                    })
                    if (objetCanal.listeMentions.length > 0) {
                        let botReply = "";
                        for (let i = 0; i < objetCanal.listeMentions.length; i++) {
                            botReply += `<@${objetCanal.listeMentions[i]}> `;
                        }
                        outils.envoyerMessageAUnCanal(botReply, canal);
                }
                }
            }
            outils.logPermanent(`Post trouvé.`);
            return;
        }
    },
    
    checkerLesFlux :async function(forcée = false, recursion = false) {
        if (forcée || Date.now() > timestampDernièreVérification) {
            for (let [adresse, objet] of Object.entries(listeFlux)) {
                await module.exports.checkerUnFlux(adresse, objet);
            }
            timestampDernièreVérification = module.exports.calculerHoraireProchaineVerification();
            module.exports.sauvegarderJSON();
        }
        if (recursion) {
            const timestamp = Date.now();
            let délai = nombreDeMSEntreChaqueCheck - (timestamp % nombreDeMSEntreChaqueCheck);
            setTimeout(module.exports.checkerLesFlux.bind(null, false, true), délai);
        }
    },

    sauvegarderJSON : function() {
        if (global.serveurProd) {
            let writer = JSON.stringify(listeFlux, null, 4);
            fs.writeFileSync('./Données/rss.json', writer, function(err, result) {
                if(err) console.log('error', err);
            });
            outils.logPermanent("Fichier json mis à jour.")
        }
    },

    initialiserJSON : function() {
        if (global.serveurProd) {
            fichier = "./Données/rss.json"
            fs.access(fichier, fs.constants.F_OK, (manque) => {
                if (manque) {
                    console.log("LA LISTE DES FLUX N'A PAS ETE CHARGEE!")
                    throw(manque);
                }
                else {
                    try {
                    listeFlux = JSON.parse(fs.readFileSync("./Données/rss.json", 'utf-8'));}
                    catch{ throw err;}

                    let listeDesAdresses = Object.keys(listeFlux);
                    for (let i = 0; i < listeDesAdresses.length; i++) {
                        if (listeFlux[listeDesAdresses[i]].titre !== null) {
                            listeDeTitres[listeFlux[listeDesAdresses[i]].titre] = listeDesAdresses[i];
                        }
                    }
                    console.log("La liste des flux RSS a bien été chargée.");
                    module.exports.checkerLesFlux(false, true);
                };
            });
        }
        else {
            listeFlux = {
                /*
                "https://e926.net/posts.atom": {
                    timestampDernierPost: 0, 
                    timestampProchaineVérification : 1,
                    listeCanaux : {
                        "620582176483704872" : {
                            listeCréateurs: ["1"],
                            listeMentions: [],
                        }
                    }
                }
                */
            }
            module.exports.checkerLesFlux(false, true);
        }
    },

    modifierTitre: function(adresse, titre) {
        listeFlux[adresse].titre = titre;
        listeDeTitres[titre] = adresse;
        module.exports.sauvegarderJSON();
        return;
    },

    calculerHoraireProchaineVerification: function() {
        let listeHoraires = outils.getConfig("rss.horairesDeVerifications");
        let nouvelleHeure = Math.min.apply(Math, listeHoraires)
        let prochainJour = true;
        let prochainHoraire = new Date();

        let heureActuelle = prochainHoraire.getHours();

        for (let i = 0; i < listeHoraires.length; i++) {
            if (heureActuelle < listeHoraires[i]) {
                prochainJour = false;
                nouvelleHeure = listeHoraires[i]
                break;
            }
        }
        prochainHoraire.setMilliseconds(0); prochainHoraire.setSeconds(0); prochainHoraire.setMinutes(0);
        prochainHoraire.setHours(nouvelleHeure);
        if (prochainJour) prochainHoraire.setDate(prochainHoraire.getDate() + 1);
        console.log(prochainHoraire.toLocaleString());
        return prochainHoraire.valueOf();
    }
}

timestampDernièreVérification = module.exports.calculerHoraireProchaineVerification();
module.exports.initialiserJSON();