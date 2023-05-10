const outils = require("./outils.js");
const fs = require('fs');
const { musique: aide } = require("./aide.js");


const { createAudioResource, StreamType, createAudioPlayer, joinVoiceChannel, getVoiceConnection, AudioPlayerStatus  } = require('@discordjs/voice'); 
let listeServeurs = {};
let listeChansons = require("./../données/musique.json");
let listeUtilisateursGlobale = Object.keys(listeChansons);
let indexIntro = listeUtilisateursGlobale.indexOf("intro"); listeUtilisateursGlobale.splice(indexIntro, 1);
let indexOuttro = listeUtilisateursGlobale.indexOf("outtro"); listeUtilisateursGlobale.splice(indexOuttro, 1);
let listeAdresses = {};
let botEnCours = false;
let botEstDésactivé = false;

module.exports = {
    musique: function(message, args, envoyerPM, idMJ) {
        if (["aide", "help", "commandes", "commande"].includes(args[0])) {
            aide(message, args, envoyerPM, idMJ);
            return;
        }

        if (args[0] === "activer" && outils.verifierSiAdmin(message.author.id)) {
            botEstDésactivé = false;
            outils.envoyerMessage("Le bot musical est réactivé.", message, envoyerPM, null, true);
            return
        }
        if (args[0] === "désactiver" && outils.verifierSiAdmin(message.author.id)) {
            botEstDésactivé = true;
            outils.envoyerMessage("Le bot musical est désactivé.", message, envoyerPM, null, true);
            return
        }
        if (botEstDésactivé){
            outils.envoyerMessage("JDR en cours, revenez plus tard.", message, envoyerPM, null, true);
            return;
        }
        if (args[0] === "vérifier" && outils.verifierSiAdmin(message.author.id)) {
            if (outils.verifierSiAdmin(message.author.id)) {
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
        else if (args[0] === "reset" && outils.verifierSiAdmin(message.author.id)) {
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
            serveur.player.stop();
            return;
        }
        else if (args[0] === "terminer") {
            module.exports.verifierSiUtilisateurConnecté(message);
            let serveur = listeServeurs[message.guildId];
            if (serveur.estStop === -1) {
                serveur.estStop = -0.5;
                message.react('👍')
            }
            else if (serveur.estStop === -0.5) {
                serveur.estStop = -1;
                message.react('👍')
            }
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
        /*
        else if (args[0] === "np") {
            module.exports.verifierSiUtilisateurConnecté(message);
            let serveur = listeServeurs[message.guildId];
            if (serveur.estStop === -1) {
                console.log(serveur.player.state.resource.playbackDuration);
            }

            return;
        }
        */
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
                    outils.envoyerMessage(botReply, message, envoyerPM, null, true);
                }
                console.log(listeServeurs[listeidServeurs[i]]);
            }
            return;
        }
        else if (args[0] === "reset" && outils.verifierSiAdmin(message.author.id)) {
            listeServeurs[message.guildId].listeChansons = JSON.parse(JSON.stringify(listeChansons));
            return;
        }
        else if (args[0] === "maj" && outils.verifierSiAdmin(message.author.id)) {
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
                        for (let i = 0; i < utilisateurModifications.modifications.length; i++) {
                            let position = utilisateurEnCours.liste.indexOf(utilisateurModifications.modifications[i][0]);
                            if (position > -1) {
                                utilisateurEnCours.liste[position] = utilisateurModifications.modifications[i][1];
                            }
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
                    for (let i = 0; i < utilisateurModifications.modifications.length; i++) {
                        let position = utilisateurEnCours.liste.indexOf(utilisateurModifications.modifications[i][0]);
                        if (position > -1) {
                            utilisateurEnCours.liste[position] = utilisateurModifications.modifications[i][1];
                        }
                    }
                    utilisateurEnCours.liste = utilisateurEnCours.liste.sort();
                    utilisateurModifications.rajouts = [];
                    utilisateurModifications.modifications = [];
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
            if (global.serveurProd) {
                let writer = JSON.stringify(musiquesARajouter, null, 4); // On sauvegarde le fichier.
                fs.writeFileSync('./Données/musique-a-rajouter.json', writer);
                writer = JSON.stringify(listeChansons, null, 4); // On sauvegarde le fichier.
                fs.writeFileSync('./Données/musique.json', writer);
                listeAdresses = module.exports.initialiserAdresses()
                message.react('👍');
            }
            return;
        }
        else if (args[0] === "chercher") {
            args.shift();
            if (!(message.guildId in listeServeurs)) throw("Serveur non existant.");
            let serveur = listeServeurs[message.guildId];
            serveur.recherche = [];
            let listeEnCours = serveur.recherche;

            let proposition = outils.normalisationString(args.join(" "));
            let botReply = "";
            let nombreChansonsTrouvées = 0;
            let nombreMessagesEnvoyés = 0;
            let nombreChansonsZapées = 0;
            let listeNoms = Object.keys(listeAdresses);
            for (let i = 0; i < listeNoms.length; i++) {
                if (outils.normalisationString(listeNoms[i]).includes(proposition)) {
                    listeEnCours.push(listeNoms[i]);
                    if (botReply.length + listeNoms[i].length > 1980) {
                        if (nombreMessagesEnvoyés >= 4) {
                            nombreChansonsZapées += 1;
                        }
                        else {
                            nombreMessagesEnvoyés += 1;
                            outils.envoyerMessage(botReply, message, true, null, true);
                            nombreChansonsTrouvées += 1;
                            botReply = `${nombreChansonsTrouvées}) ${listeNoms[i]}\r\n`;
                        }
                    }
                    else {
                        nombreChansonsTrouvées += 1;
                        botReply += `${nombreChansonsTrouvées}) ${listeNoms[i]}\r\n`;
                    }
                }
            }
            if (nombreChansonsZapées > 0) {
                botReply += `**+${nombreChansonsZapées}**`
            }

            if (nombreChansonsTrouvées === 0) {
                botReply = `Désolé votre recherche n'a pas de résultat.`
                outils.envoyerMessage(botReply, message, envoyerPM, null, true);
            }
            else if ((nombreChansonsTrouvées <= 11 || outils.verifierSiAdmin(message.author.id)) && nombreMessagesEnvoyés == 0) {
                outils.envoyerMessage(botReply, message, envoyerPM, null, true);
            }
            else {
                outils.envoyerMessage(botReply, message, true, null, true);
            }
            return;
        }
        else if (args[0] === "jouer") {
            // Corriger bug où on ne peut pas lancer le bot avec cette commande
            if (!(message.guildId in listeServeurs)) throw("Serveur non existant.");
            args.shift();
            let serveur = listeServeurs[message.guildId];
            let proposition = args.join(" ");

            let regex = new RegExp('^[0-9]+$');
            if (regex.test(proposition)) {
                proposition = parseInt(proposition) - 1;
                if (proposition > serveur.recherche) {
                    outils.envoyerMessage(`La recherche en cours ne contient que ${serveur.recherche.length} éléments.`, envoyerPM, null, true);
                }
                proposition = serveur.recherche[proposition];
            }

            if (!(proposition in listeAdresses)) throw("Ce nom n'a pas été trouvé.");

            serveur.historique.push(listeAdresses[proposition]);
            if (serveur.historique.length > 200) serveur.historique.shift()
            
            if (serveur.estStop === -1) {
                module.exports.verifierSiUtilisateurConnecté(message);
                if ((!(serveur.listeChansonsEnCours.includes(listeAdresses[proposition])) || outils.verifierSiAdmin(message.author.id)) && serveur.message.content.length + proposition.length < 1940) {
                    serveur.listeChansonsEnCours.unshift(listeAdresses[proposition]);
                    let messageEnCours = serveur.message
                    let botReply = messageEnCours.content;
                    let rajoutMessage = `\u001b[0m\r\n\u001b[0;32m${message.author.username}${"           ".slice(message.author.username.length)}\u001b[0;36m ${proposition}\u001b[0m`
                    botReply = botReply.replace("\u001b[0m", rajoutMessage);
                    messageEnCours.edit(botReply);
                    message.react("👍");
                }
                return;
            }
            else if (!("estStop" in serveur) || serveur.estStop >= 2) {
                if (botEnCours /*|| outils.verifierSiAdmin(message.author.id)*/) {
                    outils.envoyerMessage("Le bot musical est déjà en route sur un serveur.", message, envoyerPM, null, true);
                    return;
                }
                if (message.member.voice.channelId === null) throw("Vous devez être connecté à un canal audio pour utiliser cette commande.");
                serveur.listeChansonsEnCours.unshift(listeAdresses[proposition]);
            }
            else {
                throw("Le bot est en train de s'éteindre");
            }
        }
        
        if (message.member.voice.channelId === null) throw("Vous devez être connecté à un canal audio pour utiliser cette commande.");
        
        if (botEnCours /*|| outils.verifierSiAdmin(message.author.id)*/) {
            outils.envoyerMessage("Le bot musical est déjà en route sur un serveur.", message, envoyerPM, null, true);
            return;
        }
        let serveur;
        let listeChansonsEnCours;
        let botReply;
        let premièreOSTListe = true;

        if (listeServeurs.hasOwnProperty(message.guildId)) {
            serveur = listeServeurs[message.guildId];
            if (serveur.estStop < 2) {
                outils.envoyerMessage("Le bot musical est déjà en route sur ce serveur.", message, envoyerPM, null, true);
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
                    botReply += `\u001b[0;34mReprise    \u001b[0;36m ${nomChansonARajouter}\u001b[0m\r\n`;
                }
                botReply += "\u001b[0m```";
                botReply = botReply.replace("\u001b[0;36m", "\u001b[1;35m");
                outils.envoyerMessage(botReply, message)
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
                historique : []
            };
            delete serveur.listeChansons.intro;
            delete serveur.listeChansons.outtro;
            listeServeurs[message.guildId] = serveur;
            listeChansonsEnCours = serveur.listeChansonsEnCours;
        }
        const player = createAudioPlayer(); 
        serveur.player = player;
        serveur.canal = message.member.voice.channel.id
        serveur.enPause = false;
        serveur.estSkip = false;
        serveur.estStop = -1; // -1 En cours de lecture. 0 L'outtro doit jouer. +1 L'outtro est en train de jouer. +2 Le bot est arrêté.
        serveur.recherche = [];

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
        botEnCours = true;
        

        player.on('error', error => {
            console.error(error);
        });
        

        const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            const newUdp = Reflect.get(newNetworkState, 'udp');
            clearInterval(newUdp?.keepAliveInterval);
        }

        const test = getVoiceConnection(message.guild.id);
        test.on('stateChange', (oldState, newState) => {
           const oldNetworking = Reflect.get(oldState, 'networking');
           const newNetworking = Reflect.get(newState, 'networking');

           oldNetworking?.off('stateChange', networkStateChangeHandler);
           newNetworking?.on('stateChange', networkStateChangeHandler);
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
                    botEnCours = false;
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
                        while (listeChansonsEnCours.length < outils.getConfig("musique.nombreMinimumDeMusiqueParListe")){
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
                                        utilisateurEnCours.liste.shift();
                                    }
                                    else {
                                        let numeroChansonARajouter;
                                        let listeRejets = [];
                                        // let numeroDansHistorique; (puis utiliser la variable pour ne pas avoir à refaire indexOf)
                                        while (listeRejets.length < 10) {
                                            numeroChansonARajouter = outils.randomNumber(utilisateurEnCours.liste.length) - 1;
                                            chansonARajouter = utilisateurEnCours.liste[numeroChansonARajouter];
                                            if (serveur.historique.includes(chansonARajouter)) {
                                                listeRejets.push(serveur.historique.indexOf(chansonARajouter));
                                            }
                                            else {
                                                break;
                                            }
                                            if (listeRejets.length >= 10) {
                                                let numeroHistorique = Math.max.apply(Math, listeRejets);
                                                chansonARajouter = serveur.historique[numeroHistorique];
                                                numeroChansonARajouter = utilisateurEnCours.liste.indexOf(chansonARajouter);
                                                break;
                                            }
                                        }
                                        utilisateurEnCours.liste.splice(numeroChansonARajouter, 1);
                                    }
                                    serveur.historique.push(chansonARajouter);
                                    if (serveur.historique.length > 200) serveur.historique.shift()
                                    let nomChansonARajouter = chansonARajouter.replace(/^.*[\\\/]/, '').slice(0,-4);
                                    nomChansonARajouter = nomChansonARajouter.replaceAll("_", " ");
                                    nomChansonARajouter = nomChansonARajouter.replaceAll("  ", " ");
                                    botReply += `\u001b[0;34m${utilisateurEnCours.nom}${"           ".slice(utilisateurEnCours.nom.length)}\u001b[0;36m ${nomChansonARajouter}\u001b[0m\r\n`;
                                    listeChansonsEnCours.push(chansonARajouter);
                                }
                            }
                        }
                        botReply += "\u001b[0m```";
                        botReply = botReply.replace("\u001b[0;36m", "\u001b[1;35m");
                        outils.envoyerMessage(botReply, message)
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
                        botReply = botReply.replace("\u001b[0m", "");
                        messageEnCours.edit(botReply);
                    }
                    premièreOSTListe = false;
                    let chansonAJouer = listeChansonsEnCours.shift();

                    fs.access(chansonAJouer, fs.constants.F_OK, (manque) => {
                        let dateHeure = new Date();
                        let heure = outils.pad(dateHeure.getHours()) + ':' + outils.pad(dateHeure.getMinutes()) + ':' + outils.pad(dateHeure.getSeconds());
                        process.stdout.write(`\x1b[92m${heure}  \x1b[94m`);
                        if (!manque) {
                            console.log(`Lecture en cours : ${chansonAJouer}\x1b[97m`);
                        }
                        else {
                            console.log(`Fichier manquant : ${chansonAJouer}\x1b[97m`);
                            setTimeout(function() {
                                let messageEnCours = serveur.message;
                                botReply = messageEnCours.content;
                                botReply = botReply.replace("\u001b[0;33m", "\u001b[0;31m");
                                messageEnCours.edit(botReply);
                            }, 1000)
                        }
                    })
                    resource = createAudioResource(chansonAJouer);
                    player.play(resource);

                    if (serveur.estStop === -0.5 && listeChansonsEnCours.length === 0) serveur.estStop = 0;
                }
            }
        });
    },


    verifierSiUtilisateurConnecté: function(message) {
        if (message.member.voice.channel.id !== listeServeurs[message.guildId].canal && !(outils.verifierSiAdmin(message.author.id))) {
            throw("Vous devez être connecté au canal audio pour utiliser cette commande.");
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
                historique : listeServeurs[listeIDServeurs[i]].historique
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

    initialiserAdresses : function() {
        listeAdresses = {};
        for (let i = 0; i < listeUtilisateursGlobale.length; i++) {
            let listeChansonsUtilisateur = listeChansons[listeUtilisateursGlobale[i]].liste;
            for (let j = 0; j < listeChansonsUtilisateur.length; j++) {
                let adresseChanson = listeChansonsUtilisateur[j];
                let nomChanson = adresseChanson.replace(/^.*[\\\/]/, '').slice(0,-4);
                nomChanson = nomChanson.replaceAll("_", " ");
                nomChanson = nomChanson.replaceAll("  ", " ");
                nomChanson = nomChanson.replaceAll("  ", " ");
                if (nomChanson in listeAdresses && listeAdresses[nomChanson] !== adresseChanson) {
                    console.log(`${nomChanson} se trouve potentiellement en double.`);
                }
                else {
                    listeAdresses[nomChanson] = adresseChanson;
                }
            }
        }
        return listeAdresses;
    }
}

if (global.serveurProd) {
    module.exports.initialiserHistorique();
    listeAdresses = module.exports.initialiserAdresses();
}