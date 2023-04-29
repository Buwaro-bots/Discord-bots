const outils = require("./outils.js");
const fs = require('fs');
let Parser = require('rss-parser');
let parser = new Parser();
let listeFlux = {};
let interval = null

module.exports = {
    rss : function(client, message, args, envoyerPM, idMJ) {
        if (args[0] === "actualiser") {
            message.react('👍');
            module.exports.checkerLesFlux();
            return;
        }
        listeFlux[args[0]] = {
            timestampDernierPost: Date.now() - 20 * 60 * 1000,
            nombreJoursAprèsDernierPost: parseInt(args[1]) - 2/24,
            timestampProchaineVérification: 1,
            listeCanaux: {}
        }
        listeFlux[args[0]]["listeCanaux"][message.channel.id] = {
            listeCréateurs: [
                message.author.id
            ],
            listeMentions: []
        }

        message.react('👍');
        module.exports.checkerUnFlux(args[0], listeFlux[args[0]]);
        module.exports.sauvegarderJSON();  
},

    checkerUnFlux : async function(adresse, objet) {
        let heureActuelle = Date.now();
        if (heureActuelle > objet.timestampProchaineVérification) {
            let feed = [];
            try {
                feed = await parser.parseURL(adresse);
            }
            catch(err) {
                console.log(err);
            }
            

            let listeNouveauxPosts = [];
            let timeStampMaximum = objet.timestampDernierPost;
          
            feed.items.forEach(item => {
                let timeStampItem = new Date(item.isoDate).getTime()
                if (timeStampItem > objet.timestampDernierPost) {
                    listeNouveauxPosts.push(item);
                    if (timeStampItem > timeStampMaximum) {
                        objet.timestampDernierPost = timeStampItem;
                    }
                }
            });

            if (listeNouveauxPosts.length === 0) {
                objet.timestampProchaineVérification = heureActuelle + 59 * 60 * 1000;
                //let heure = outils.pad(heureActuelle.getHours()) + ':' + outils.pad(heureActuelle.getMinutes()) + ':' + outils.pad(heureActuelle.getSeconds());
                console.log(`Pas de nouveau post pour ${adresse}`);
                return;
            }
            else {
                while (listeNouveauxPosts.length > 0) {
                    let nouveauPost = listeNouveauxPosts.pop();
                    for (let [canal, objetCanal] of Object.entries(objet.listeCanaux)) {
                        outils.envoyerMessageAUnCanal(outils.getClient(), `${nouveauPost.link}`, canal)
                    }
                }
                //Insérer mentions ici.
                objet.timestampProchaineVérification = heureActuelle + objet.nombreJoursAprèsDernierPost * 24 * 60 * 60 * 1000 - 60 * 1000;
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
                    console.log("La liste des flux RSS a bien été chargée.");
                };
            });

            interval = setInterval(function() {
                module.exports.checkerLesFlux();
            }, 15 * 60 * 1000);
        }
        else {
            listeFlux = {
                "https://e926.net/posts.atom": {
                    timestampDernierPost: Date.now() - 5 * 60 * 1000, 
                    nombreJoursAprèsDernierPost : 0.001,
                    timestampProchaineVérification : 1,
                    listeCanaux : {
                        "620582176483704872" : {
                            listeCréateurs: ["1"],
                            listeMentions: [],
                        }
                    }
                }
            }
            module.exports.checkerLesFlux();
        }
    }
}

module.exports.initialiserJSON();