const outils = require("./outils.js");
const liste = require("../Données/autres.json");
const horoscope = liste.horoscope;
const lol = liste.lol;
const {exec} = require('child_process');

module.exports = {
    id: function(client, message, args, envoyerPM, idMJ) {
        outils.envoyerMessage(client, `L'id de ce serveur est ${message.guildId}.` , message, envoyerPM, idMJ, true);
    },
    ramoloss: function(client, message, args, envoyerPM, idMJ) {
        async function speak() {
            temps = 5*60*1000 + outils.randomNumber(5*60*1000)// On attends 5 minutes, puis un temps aléatoire entre 1ms et 5 minutes.
            console.log(temps/1000)
            await outils.sleep(temps); 
            message.channel.send(`${message.author.toString()}`);
            message.channel.send("https://tenor.com/view/confusedslow-gif-22074333")
        }
        speak();
    },

    tarot: function(client, message, args, envoyerPM, idMJ) {
        tarot = ["I le magicien", "II la grande prêtresse", "III l'impératrice", "IV l'empereur", "V l'hiérophante", "VI les amoureux", "VII le chariot", "VIII la justice", "IX l'ermite", "X la roue de fortune", "XI la force",
        "XII le pendu", "XIII la mort", "XIV la tempérance", "XV le diable", "XVI la maison dieu", "XVII l'étoile", "XVIII la lune", "XIX le soleil", "XX le jugement", "XXI le monde", "le fou"]
        
        outils.verifierNaN(args);
        nombreCartes = args.length > 0 ? args[0] : 1;
        nombreCartes = nombreCartes > 0 ? nombreCartes : 1;
        phraseCartes = nombreCartes > 1 ? "les cartes" : "la carte";

        cartesTirées = tarot.sort(() => Math.random() - 0.5);
        cartesTirées = cartesTirées.slice(0, nombreCartes);
        cartesTirées = cartesTirées.join(",  ");

        outils.envoyerMessage(client, `${message.author.toString()} a tiré ${phraseCartes} : ${cartesTirées}`, message, envoyerPM, idMJ);
        outils.logLancer(message, cartesTirées, "tarot", envoyerPM);
    },

    ouija: function(client, message, args, envoyerPM, idMJ) {
        let texte = "";
        let nombreDeMots = outils.randomNumber(3) + 2;
        let consonnes = ["b", "b", "b", "c", "c", "c", "d", "d", "d",
        "f", "f", "g", "g", "h", "h",  "j", "k", "l", "l" , "l" , "l" , "l" , "l" , "l" , "l",
        "m", "m", "m", "n", "n", "n", "n", "p", "p", "q", "r", "r", "r", "r",
        "s", "s", "s", "s", "t", "t", "t", "t", "t", "t",  "v", "v", "w", "x", "z"];
        let voyelles = ["a", "a", "a", "a", "a", "a", "a", "i", "i", "i", "i", "i", "i",
        "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e",
        "o", "o", "o", "o", "o", "o", "u", "u", "u", "u", "u",  "y"]
        for (let i = 0; i < nombreDeMots ; i++) {
            let nombreDeLettres = outils.randomNumber(6) + 2;
            let serieConsonne = 0;
            for (let j = 0; j < nombreDeLettres; j++) {
                let tauxConsonne = 0.6 -serieConsonne / 4;
                if (Math.random() < tauxConsonne) {
                    texte+= consonnes[outils.randomNumber(consonnes.length) -1];
                    serieConsonne = serieConsonne > 0 ? serieConsonne += 1 : 1;
                }
                else {
                    texte += voyelles[outils.randomNumber(voyelles.length) -1];
                    serieConsonne = serieConsonne < 0 ? serieConsonne -= 1 : -1;
                }
            }
            texte += " ";
        }
        texte += ".";
        outils.envoyerMessage(client, texte, message, envoyerPM, idMJ);
    },

    ball_8: function(client, message, args, envoyerPM, idMJ) {
        botReply = message.author.toString();
        lancer = outils.randomNumber(100);
        if (lancer <= 40) {
            botReply += " Oui.";
        }
        else if (lancer < 75) {
            botReply += " Non.";
        }
        else {
            botReply += " Peut-être."
        }
        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
    },

    horoscope: function(client, message, args, envoyerPM, idMJ) {
        let nbBoucle = 1
        if (args.length > 0 && args[0] === "hybride") {
            if (args.length > 1) {
                nbBoucle = parseInt(args[1]);
            }
            else {
                nbBoucle = 2;
            }
        }
    
        let animal = "";
        let boucleEnCours = 1;
    
        while (boucleEnCours <= nbBoucle) {
            let continuer = true;
            let alea = 0;
    
            let famille = horoscope;
            while (continuer) {
                alea = outils.randomNumber(100);
                process.stdout.write(`${alea} => `);
                let nouvelleFamille;
                famille.forEach(element => {
                    if (alea > 0 && alea <= element["probabilité"]) {
                        nouvelleFamille = element["liste"];
                        if (element["type"] === "liste") {
                            continuer = false;
                        }
                    }
                    alea -= element["probabilité"];
                });
                famille = nouvelleFamille
            }
    
            animal += famille[outils.randomNumber(famille.length)-1];
            if (boucleEnCours < nbBoucle) {
                animal += "-";
            }
            boucleEnCours += 1;
        }
        outils.envoyerMessage(client, `${message.author.toString()} Votre signe du jour est : ${animal}.`, message, envoyerPM, idMJ);
    },
    lol: function(client, message, args, envoyerPM, idMJ) {
        let dé = outils.randomNumber(lol.length) - 1;
        let champion = lol[dé];
        let botReply = `${message.author.toString()} : ${champion}`;
        outils.logLancer(message, champion, "lol", envoyerPM);
        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ)
        .then((msg)=> {
            msg.react("🖼️");
            const collector = msg.createReactionCollector({
                time: 400 * 1000
            });
            collector.on('collect', (reaction, user) => {
                if(reaction.emoji.name === "🖼️" && !(user.bot)) {
                    collector.resetTimer({time: 1});
                    champion = champion.replaceAll("'","-");
                    champion = champion.replaceAll(" ","-");
                    champion = champion.replaceAll(".","-");
                    champion = champion.toLowerCase();
                    let lien = ` ( https://www.leagueoflegends.com/fr-fr/champions/${champion}/ )`
                    botReply += lien;
                    msg.edit(botReply);
                }
            });
            collector.on('end', collected => {
                msg.reactions.removeAll();
            });
            
        })
    },

    renommer: function(client, message, args, envoyerPM, idMJ) {
        const voiceChannelID = message.member.voice.channelId;
        if (voiceChannelID !== null && outils.verifierSiAdmin(message.author.id)) {
            client.channels.fetch(voiceChannelID)
                .then(channel => channel.setName(args[0]));}
    },

    bot: function(client, message, args, envoyerPM, idMJ) {
        if (outils.verifierSiAdmin(message.author.id)) {
            let listeBots = outils.getConfig("autresBots");
            if (listeBots.hasOwnProperty(args[0])) {
                exec(`start cmd /c ${listeBots[args[0]].fichier}`, (err, stdout, stderr) => {
                    if (err) {
                      console.error(err);
                      return;
                     }
                     console.log(stdout);
                    }
                   );
                outils.envoyerMessage(client, listeBots[args[0]].message, message, envoyerPM, idMJ);
            }
        }
    },

    play: function(client, message, args, envoyerPM, idMJ) {
        let botreply = `${message.author.toString()} C'est **;play** scrogneugneu. (╯°□°)╯︵ ┻━┻`;
        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
    },

    config: function(client, message, args, envoyerPM, idMJ) {
        if (!(outils.verifierSiAdmin(message.author.id))) {
            outils.envoyerMessage(client, "Seul un admin peut utiliser cette commande.", message);
            return;
        }
        let clef = args.shift();
        let valeur = args.join(".");
        outils.setConfig(clef, valeur);
        outils.envoyerMessage(client, `La configuration de ${clef} est maintenant "${valeur}".`, message, envoyerPM, false, true);
    }
}