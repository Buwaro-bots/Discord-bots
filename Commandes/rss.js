const outils = require("./outils.js");
const fs = require('fs');
let Parser = require('rss-parser');
let parser = new Parser();
let listeFlux = {};
let interval = null

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

/* A faire :
- Commande hiatus qui retarde le prochain check de X jours.
*/
module.exports = {
    rss : function(message, args, envoyerPM, idMJ) {
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
                module.exports.checkerLesFlux();
            }
            return;
        }
        else if (args[0] === "nouveau") {
            listeFlux[args[1]] = {
                titre: null,
                timestampDernierPost: 0,
                joursAvecUpdate: 2,
                timestampProchaineVérification: 1,
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
            if (args.length > 0) {
                let nom = args.join(" ");
                if (!(listeDeTitres.hasOwnProperty(nom))) nom = outils.rattrapageFauteOrthographe(listeDeTitres, nom, "inclure");
                let fluxActuel = listeFlux[listeDeTitres[nom]];
                let joursDesMAJ = typeof fluxActuel.joursAvecUpdate === "number" ? `Estimé à tout les ${fluxActuel.joursAvecUpdate} jours.` : `Le ${fluxActuel.joursAvecUpdate.join(", ")}.`
                let botReply = `Titre : **${fluxActuel.titre}** \r\n` +
                `Dernière mise à jour : <${fluxActuel.lienDernièreUpdate}> \r\n` +
                `Date de la dernière MAJ : Le ${outils.dateHeureFrançaise(fluxActuel.timestampDernierPost)}. \r\n` +
                `Dates des MAJ : ${joursDesMAJ} \r\n` +
                `Date de la prochaine vérification par le bot : Le ${outils.dateHeureFrançaise(fluxActuel.timestampProchaineVérification)}. \r\n`;
                outils.envoyerMessage(botReply, message, envoyerPM, null, true);
            }
            else {
                let botReply = "";
                for (let [adresse, objet] of Object.entries(listeFlux)) {
                    if (objet.listeCanaux.hasOwnProperty(message.channel.id)) {
                        let listeJours = typeof objet.joursAvecUpdate === "number" ? "" : ` [${objet.joursAvecUpdate.join(", ")}]`;
                        botReply += `**${objet.titre}** : Le ${outils.dateHeureFrançaise(objet.timestampDernierPost)}${listeJours} (<${objet.lienDernièreUpdate}>).\r\n`
                        if (botReply.length > 1800) {
                            outils.envoyerMessage(botReply, message, envoyerPM, null, true);
                            let botReply = "";
                        }
                    }
                }
                outils.envoyerMessage(botReply, message, envoyerPM, null, true);
            }
            return;
        }
        else {
            throw("Commande non reconnu.") // Rajouter ici commande aide.
        }
},

    checkerUnFlux : async function(adresse, objet, forcerVerification = false) {
        let heureActuelle = Date.now();
        if (heureActuelle > objet.timestampProchaineVérification || forcerVerification) {
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
                if (typeof objet.joursAvecUpdate === "number") objet.timestampProchaineVérification = module.exports.calculerDateProchaineMAJ(1);
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
                        outils.envoyerMessageAUnCanal(outils.getClient(), `${nouveauPost.link}`, canal)
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
                                            outils.envoyerMessageAUnCanal(outils.getClient(), botReply, canal);
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
                                            outils.envoyerMessageAUnCanal(outils.getClient(), botReply, canal);
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
                            outils.envoyerMessageAUnCanal(outils.getClient(), botReply, canal);
                    }
                    }
                }
                objet.timestampProchaineVérification = module.exports.calculerDateProchaineMAJ(objet.joursAvecUpdate);
                outils.logPermanent(`Post trouvé, prochaine vérification le : ${new Date(objet.timestampProchaineVérification).toLocaleString()}`);
                return;
            }
        }
    },
    
    checkerLesFlux :async function() {
        for (let [adresse, objet] of Object.entries(listeFlux)) {
            await module.exports.checkerUnFlux(adresse, objet);
        }
        module.exports.sauvegarderJSON();
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
                };
            });

            interval = setInterval(function() {
                module.exports.checkerLesFlux();
            }, 30 * 60 * 1000);
        }
        else {
            listeFlux = {
                /*
                "https://e926.net/posts.atom": {
                    timestampDernierPost: 0, 
                    joursAvecUpdate : 0.001,
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
            module.exports.checkerLesFlux();
        }
    },

    modifierTitre: function(adresse, titre) {
        listeFlux[adresse].titre = titre;
        listeDeTitres[titre] = adresse;
        module.exports.sauvegarderJSON();
        return;
    },

    calculerDateProchaineMAJ: function(délai) {
        let heureActuelle = new Date();
        if (typeof délai === "number") {
            return heureActuelle.getTime() + délai * 3 * 60 * 60 * 1000;
        }
        else {
            let nombreDeJoursMinimum = 7;
            let numeroAujourdhui = heureActuelle.getDay();
            for (let i = 0; i < délai.length; i++){
                let numeroAChecker = joursDelaSemaine[délai[i]];
                let nombreDeJours = (numeroAChecker - numeroAujourdhui +7) % 7;
                if (nombreDeJours != 0 && nombreDeJours < nombreDeJoursMinimum) {
                    nombreDeJoursMinimum = nombreDeJours;
                }
            }
            return heureActuelle.getTime() + nombreDeJoursMinimum * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000;
        }
    }
}

module.exports.initialiserJSON();