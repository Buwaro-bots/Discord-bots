const outils = require("./outils.js");
const config = require('../config.json');
const fs = require('fs');

const { createAudioResource, StreamType, createAudioPlayer, joinVoiceChannel, getVoiceConnection, AudioPlayerStatus  } = require('@discordjs/voice'); 
let listeServeurs = {};
let listeChansons = require("./../données/musique.json");
let listeUtilisateursGlobale = Object.keys(listeChansons);
let indexIntro = listeUtilisateursGlobale.indexOf("intro"); listeUtilisateursGlobale.splice(indexIntro, 1);
let indexOuttro = listeUtilisateursGlobale.indexOf("outtro"); listeUtilisateursGlobale.splice(indexOuttro, 1);
let listeAdresses = {};

module.exports = {
    musique: function(client, message, args, envoyerPM, idMJ) {
        // A utiliser quand le bot est en travaux.
        if (false){//message.author.id !== config.admin) {
            outils.envoyerMessage(client, /*"En travaux. Pingez l'admin pour en savoir plus."*/ "JDR en cours, revenez plus tard.", message);
            return;
        }
        if (args[0] === "verifier") {
            if (message.author.id === config.admin) {
                for (let i = 0; i < listeUtilisateursGlobale.length; i++) {
                    let listeChansonsUtilisateur = listeChansons[listeUtilisateursGlobale[i]].liste;
                    for (let j = 0; j < listeChansonsUtilisateur.length; j++) {
                        let chanson = listeChansonsUtilisateur[j];
                        fs.access(chanson, fs.constants.F_OK, (manque) => {
                            if (manque || !(chanson.includes("."))) {
                                console.log(chanson)
                            }
                        })
                    }
                }
            }
            console.log("Verification faite.")
            return;
        }

        // Penser à mettre une vérification que le serveur a un lecteur en cours / est dans l'historique pour toutes ces commandes.
        else if (args[0] === "stop") {
            module.exports.verifierSiUtilisateurConnecté(message);
            let serveur = listeServeurs[message.guildId];
            let messageEnCours = serveur.message
            if (messageEnCours !== null) {
                let botReply = messageEnCours.content.replaceAll("\u001b[0;36m", "\u001b[0;30m");
                botReply = botReply.replace("\u001b[1;35m", "\u001b[0;30m");
                botReply = botReply.replace("\u001b[0;35m            Liste en cours", "\u001b[0;30m            Liste interrompue");
                messageEnCours.edit(botReply);
            }

            const connection = getVoiceConnection(message.guild.id);
            const subscription = serveur.subscription;
            serveur.estStop += 1;
            serveur.player.stop(); // test
            //subscription.unsubscribe();
            //connection.destroy();
            //delete listeServeurs[message.guildId];
            return;
        }
        else if (args[0] === "reset") {
            module.exports.verifierSiUtilisateurConnecté(message);
            let serveur = listeServeurs[message.guildId];
            let messageEnCours = serveur.message
            if (messageEnCours !== null) {
                let botReply = messageEnCours.content.replaceAll("\u001b[0;36m", "\u001b[0;30m");
                botReply = botReply.replace("\u001b[1;35m", "\u001b[0;30m");
                botReply = botReply.replace("\u001b[0;35m            Liste en cours", "\u001b[0;30m            Liste interrompue");
                messageEnCours.edit(botReply);
                serveur.message = null;
            }

            while (serveur.listeChansonsEnCours.length > 0){
                serveur.listeChansonsEnCours.shift();
            }
            serveur.player.stop(); // test
            //subscription.unsubscribe();
            //connection.destroy();
            //delete listeServeurs[message.guildId];
            return;
        }
        else if (args[0] === "skip") {
            module.exports.verifierSiUtilisateurConnecté(message);
            let serveur = listeServeurs[message.guildId];
            serveur.estSkip = true;
            serveur.player.stop();
            return;
        }
        else if (args[0] === "pause") {
            module.exports.verifierSiUtilisateurConnecté(message);
            let serveur = listeServeurs[message.guildId];
            if (serveur.enPause) {
                serveur.player.unpause();
            }
            else {
                serveur.player.pause();
            }
            serveur.enPause = !(serveur.enPause);
            return;
        }
        else if (args[0] === "liste") {
            let listeidServeurs = [message.guildId];
            if (args.length > 1 && args[1] === "totale") {
                listeidServeurs = Object.keys(listeServeurs);
            }
            for (let i = 0; i < listeidServeurs.length; i++){
                console.log(`Serveur n° ${listeidServeurs[i]}`);
                let botReply = "Liste des utilisateurs sur ce serveur :\r\n";
                for (let j = 0; j < listeUtilisateursGlobale.length; j++) {
                    let utilisateurEnCours = listeServeurs[listeidServeurs[i]].listeChansons[listeUtilisateursGlobale[j]];
                        if (utilisateurEnCours.serveurs.length === 0 || utilisateurEnCours.serveurs.includes(message.guild.id)) {
                            console.log(`${utilisateurEnCours.nom} : ${utilisateurEnCours.liste.length} / ${listeChansons[listeUtilisateursGlobale[j]].liste.length}`);
                            if (listeChansons[listeUtilisateursGlobale[j]].liste.length > 0) {
                                botReply += `${utilisateurEnCours.nom} : ${utilisateurEnCours.liste.length} / ${listeChansons[listeUtilisateursGlobale[j]].liste.length}\r\n`;
                            }
                        }
                }
                if (listeidServeurs[i] === message.guildId) {
                    outils.envoyerMessage(client, botReply, message, envoyerPM);
                }
                console.log(listeServeurs[listeidServeurs[i]]);
            }
            return;
        }
        else if (args[0] === "reset" && message.author.id === config.admin) {
            listeServeurs[message.guildId].listeChansons = JSON.parse(JSON.stringify(listeChansons));
            return;
        }

        else if (args[0] === "maj" && message.author.id === config.admin) {
            // Note : Le fichier ne doit pas comporter les intros et les outtris à rajouter, ceci est seulement pour les musiques d'utilisateurs.
            let musiquesARajouter = JSON.parse(fs.readFileSync(__dirname + '/../Données/musique-a-rajouter.json', 'utf-8'));
            for (let [idUtilisateur, utilisateurModifications] of Object.entries(musiquesARajouter)) {
                if (listeUtilisateursGlobale.includes(idUtilisateur)) {
                    for (let [idServeur, serveur] of Object.entries(listeServeurs)) {
                        let utilisateurEnCours = serveur.listeChansons[idUtilisateur];
                        utilisateurEnCours.nom = utilisateurModifications.nom;
                        utilisateurEnCours.probabilité_present = utilisateurModifications.probabilité_present;
                        utilisateurEnCours.probabilité_absent = utilisateurModifications.probabilité_absent;
                        utilisateurEnCours.serveurs = utilisateurModifications.serveurs;
                        for (let i = 0; i < utilisateurModifications.rajouts.length; i++) {
                            utilisateurEnCours.liste.push(utilisateurModifications.rajouts[i]);
                        }
                        utilisateurEnCours.liste = utilisateurEnCours.liste.sort();
                    }

                    let utilisateurEnCours = listeChansons[idUtilisateur];
                    utilisateurEnCours.nom = utilisateurModifications.nom;
                    utilisateurEnCours.probabilité_present = utilisateurModifications.probabilité_present;
                    utilisateurEnCours.probabilité_absent = utilisateurModifications.probabilité_absent;
                    utilisateurEnCours.serveurs = utilisateurModifications.serveurs;
                    for (let i = 0; i < utilisateurModifications.rajouts.length; i++) {
                        utilisateurEnCours.liste.push(utilisateurModifications.rajouts[i]);
                    }
                    utilisateurEnCours.liste = utilisateurEnCours.liste.sort();
                    utilisateurModifications.rajouts = [];
                }
                else {
                    let utilisateurEnCours = JSON.parse(JSON.stringify(utilisateurModifications))
                    utilisateurEnCours.liste = utilisateurEnCours.rajouts.sort();
                    delete utilisateurEnCours.rajouts;
                    delete utilisateurEnCours.retraits;
                    delete utilisateurEnCours.modifications;
                    for (let [idServeur, serveur] of Object.entries(listeServeurs)) {
                        serveur.listeChansons[idUtilisateur] = utilisateurEnCours;
                    }
                    listeChansons[idUtilisateur] = utilisateurEnCours;
                    utilisateurModifications.rajouts = [];
                    listeUtilisateursGlobale.push(idUtilisateur);
                }
            }
            let writer = JSON.stringify(musiquesARajouter, null, 4); // On sauvegarde le fichier.
            fs.writeFileSync('./Données/musique-a-rajouter.json', writer);
            writer = JSON.stringify(listeChansons, null, 4); // On sauvegarde le fichier.
            fs.writeFileSync('./Données/musique.json', writer);
            message.react('👍');
            return;
        }

        else if (args[0] === "rajouter") {
            module.exports.verifierSiUtilisateurConnecté(message);
            args.shift();
            let serveur = listeServeurs[message.guildId];
            if (serveur.estStop === -1 && serveur.message.content.length < 1850) {
                let proposition = args.join(" ");
                if (proposition in listeAdresses) {
                    if (!(serveur.listeChansonsEnCours.includes(listeAdresses[proposition])) || message.author.id === config.admin) {
                        serveur.listeChansonsEnCours.push(listeAdresses[proposition]);
                        let messageEnCours = serveur.message
                        let botReply = messageEnCours.content;
                        let rajoutMessage = `\u001b[0;34m${message.author.username}${"           ".slice(message.author.username.length)}\u001b[0;36m ${proposition}\r\n\u001b[0m\`\`\``
                        botReply = botReply.replace("\u001b[0m```", rajoutMessage);
                        messageEnCours.edit(botReply);
                        message.react("👍")
                    }
                }
            }
            return;
        }
        
        let serveur;
        let listeChansonsEnCours = [];
        let botReply;
        let premièreOSTListe = true;

        if (listeServeurs.hasOwnProperty(message.guildId)) {
            serveur = listeServeurs[message.guildId];
            if (serveur.estStop < 2) {
                outils.envoyerMessage(client, "Le bot musical est déjà en route sur ce serveur.", message);
                return;
            }
            serveur.estStop = -1;
            listeChansonsEnCours = serveur.listeChansonsEnCours;
            if (listeChansonsEnCours.length > 0) {
                botReply = "```ansi\r\n\u001b[0;35m            Liste en cours (reprise de la playlist précedente)\r\n";
                for (let i = 0; i < listeChansonsEnCours.length; i++){
                    let nomChansonARajouter = listeChansonsEnCours[i].replace(/^.*[\\\/]/, '').slice(0,-4);
                    nomChansonARajouter = nomChansonARajouter.replaceAll("_", " ");
                    nomChansonARajouter = nomChansonARajouter.replaceAll("  ", " ");
                    botReply += `\u001b[0;34mReprise    \u001b[0;36m ${nomChansonARajouter}\r\n`;
                }
                botReply += "\u001b[0m```";
                botReply = botReply.replace("\u001b[0;36m", "\u001b[1;35m");
                outils.envoyerMessage(client, botReply, message)
                .then((msg)=> {
                    serveur.message = msg;
                });
            }
            else {
                serveur.message = null;
            }
        }
        else {
            serveur = {
                listeChansons : JSON.parse(JSON.stringify(listeChansons)),
                listeChansonsEnCours : [],
                message : null,
            };
            delete serveur.listeChansons.intro;
            delete serveur.listeChansons.outtro;
            listeServeurs[message.guildId] = serveur;
        }
        const player = createAudioPlayer(); 
        serveur.player = player;
        serveur.canal = message.member.voice.channel.id
        serveur.enPause = false;
        serveur.estSkip = false;
        serveur.estStop = -1; // -1 En cours de lecture. 0 L'outtro doit jouer. +1 L'outtro est en train de jouer. +2 Le bot est arrêté.

        const subscription = joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator
        }).subscribe(player)
        serveur.subscription = subscription;
        //message.guild.me.voice.setRequestToSpeak(true);
        let numeroIntro = outils.randomNumber(listeChansons.intro.liste.length)-1;
        console.log(listeChansons.intro.liste[numeroIntro]);
        outils.logLancer(message, listeChansons.intro.liste[numeroIntro].replace(/^.*[\\\/]/, '').slice(0,-4), "musique opening");
        let resource = createAudioResource(listeChansons.intro.liste[numeroIntro]);
        
        player.play(resource)

        

        player.on('error', error => {
            console.error(error);
        });
        

        player.addListener("stateChange", (oldOne, newOne) => {
            if (newOne.status == "idle") {
                if (serveur.estStop >= 1) {
                    serveur.estStop += 1;
                    const connection = getVoiceConnection(message.guild.id);
                    subscription.unsubscribe();
                    connection.destroy();
                    return;
                }
                else if (serveur.estStop === 0){
                    let numeroOuttro = outils.randomNumber(listeChansons.outtro.liste.length)-1;
                    console.log(listeChansons.outtro.liste[numeroOuttro])
                    outils.logLancer(message, listeChansons.outtro.liste[numeroOuttro].replace(/^.*[\\\/]/, '').slice(0,-4), "musique ending");
                    resource = createAudioResource(listeChansons.outtro.liste[numeroOuttro]);
                    serveur.estStop += 1;
                    player.play(resource);
                }
                else {
                    if (listeChansonsEnCours.length === 0) {
                        if (serveur.message !== null) {
                            let messageEnCours = serveur.message;
                            botReply = messageEnCours.content;
                            botReply = botReply.replace("\u001b[0;35m            Liste en cours", "\u001b[0;30m            Liste terminée");
                            if (serveur.estSkip) {
                                botReply = botReply.replace("\u001b[1;35m", "\u001b[0;30m");
                                serveur.estSkip = false;
                            }
                            else {
                                botReply = botReply.replace("\u001b[1;35m", "\u001b[0;33m");
                            }
                            messageEnCours.edit(botReply);
                        }
                        botReply = "```ansi\r\n\u001b[0;35m            Liste en cours\r\n";
                        premièreOSTListe = true;
                        let liste = message.guild.members.cache.filter(member => member.voice.channel);
                        let listeUtilisateursConnectés = Array.from(liste.keys());
                        while (listeChansonsEnCours.length < 10){
                            for (let i = 0; i < listeUtilisateursGlobale.length; i++) {
                                let utilisateurEnCours = serveur.listeChansons[listeUtilisateursGlobale[i]];
                                
                                if ( ((listeUtilisateursConnectés.includes(listeUtilisateursGlobale[i]) && Math.random() < utilisateurEnCours.probabilité_present)
                                || Math.random() < utilisateurEnCours.probabilité_absent)
                                && (utilisateurEnCours.serveurs.length === 0 || utilisateurEnCours.serveurs.includes(message.guild.id)) ) {
                                    if (utilisateurEnCours.liste.length === 0) {
                                        console.log(utilisateurEnCours.nom);
                                        utilisateurEnCours.liste = JSON.parse(JSON.stringify(listeChansons[listeUtilisateursGlobale[i]].liste));
                                    }
                                    let chansonARajouter = "";
                                    if (utilisateurEnCours.liste.length === 1) {
                                        chansonARajouter = utilisateurEnCours.liste[0];
                                    }
                                    else {
                                        let numeroChansonARajouter = outils.randomNumber(utilisateurEnCours.liste.length) - 1;
                                        chansonARajouter = utilisateurEnCours.liste[numeroChansonARajouter];
                                    }
                                    let nomChansonARajouter = chansonARajouter.replace(/^.*[\\\/]/, '').slice(0,-4);
                                    nomChansonARajouter = nomChansonARajouter.replaceAll("_", " ");
                                    nomChansonARajouter = nomChansonARajouter.replaceAll("  ", " ");
                                    botReply += `\u001b[0;34m${utilisateurEnCours.nom}${"           ".slice(utilisateurEnCours.nom.length)}\u001b[0;36m ${nomChansonARajouter}\r\n`;
                                    listeChansonsEnCours.push(chansonARajouter);
                                    for (let j = 0; j < listeUtilisateursGlobale.length; j++) {
                                        if (serveur.listeChansons[listeUtilisateursGlobale[j]].liste.includes(chansonARajouter)) {
                                            serveur.listeChansons[listeUtilisateursGlobale[j]].liste.splice(serveur.listeChansons[listeUtilisateursGlobale[j]].liste.indexOf(chansonARajouter), 1);
                                        }
                                    }
                                }
                            }
                        }
                        botReply += "\u001b[0m```";
                        botReply = botReply.replace("\u001b[0;36m", "\u001b[1;35m");
                        outils.envoyerMessage(client, botReply, message)
                        .then((msg)=> {
                            serveur.message = msg;
                        });
                    }
                    if (!premièreOSTListe) {
                        let messageEnCours = serveur.message;
                        botReply = messageEnCours.content;
                        if (serveur.estSkip) {
                            botReply = botReply.replace("\u001b[1;35m", "\u001b[0;30m");
                            serveur.estSkip = false;
                        }
                        else {
                            botReply = botReply.replace("\u001b[1;35m", "\u001b[0;33m");
                        }
                        botReply = botReply.replace("\u001b[0;36m", "\u001b[1;35m");
                        messageEnCours.edit(botReply);
                    }
                    premièreOSTListe = false;
                    let chansonAJouer = listeChansonsEnCours.shift();
                    resource = createAudioResource(chansonAJouer);
                    player.play(resource);
                }
            }
        });
    },


    verifierSiUtilisateurConnecté: function(message) {
        if (message.member.voice.channel.id !== listeServeurs[message.guildId].canal && message.author.id !== config.admin) {
            throw("Utilisateur non connecté au canal audio.")
        }
    },

    setHistorique : function(nouvelHistorique) {
        listeServeurs = nouvelHistorique;
    },

    getHistorique : function() {
        let listeTempServeurs = {};
        let listeIDServeurs = Object.keys(listeServeurs);
        for (let i = 0; i < listeIDServeurs.length; i++) {
            listeTempServeurs[listeIDServeurs[i]] = {
                listeChansons : listeServeurs[listeIDServeurs[i]].listeChansons,
                listeChansonsEnCours : listeServeurs[listeIDServeurs[i]].listeChansonsEnCours,
            }
        }
        return listeTempServeurs;
    },

    initialiserHistorique : function() {
        fichier = "./Données/tempMusique.json"
        fs.access(fichier, fs.constants.F_OK, (manque) => {
            if (!manque) {
                let jsonHistorique = JSON.parse(fs.readFileSync('./Données/tempMusique.json', 'utf-8'));
                module.exports.setHistorique(jsonHistorique);
                fs.unlink('./Données/tempMusique.json', (err) => {
                    if (err) throw err;
                    console.log("L'historique a bien été archivé et le fichier supprimé.");
                });
            }
        });
    },

    initialiserAdresses : function(listeAdresses) {
        for (let i = 0; i < listeUtilisateursGlobale.length; i++) {
            let listeChansonsUtilisateur = listeChansons[listeUtilisateursGlobale[i]].liste;
            for (let j = 0; j < listeChansonsUtilisateur.length; j++) {
                let adresseChanson = listeChansonsUtilisateur[j];
                let nomChanson = adresseChanson.replace(/^.*[\\\/]/, '').slice(0,-4);
                nomChanson = nomChanson.replaceAll("_", " ");
                nomChanson = nomChanson.replaceAll("  ", " ");
                if (nomChanson in listeAdresses && listeAdresses[nomChanson] !== adresseChanson) {
                    console.log(`${nomChanson} se trouve potentiellement en double.`);
                }
                else {
                    listeAdresses[nomChanson] = adresseChanson;
                }
            }
        }
    }
}

if (global.serveurProd) {
    module.exports.initialiserHistorique();
    module.exports.initialiserAdresses(listeAdresses);
}