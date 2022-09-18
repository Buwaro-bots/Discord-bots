const outils = require("./outils.js");
const config = require('../config.json');

const { createAudioResource, StreamType, createAudioPlayer, joinVoiceChannel, getVoiceConnection, AudioPlayerStatus  } = require('@discordjs/voice'); 
let listeServeurs = {};
let listeChansons = require("./../données/musique.json");
let listeUtilisateursGlobale = Object.keys(listeChansons);


module.exports = {
    musique: function(client, message, args, envoyerPM, idMJ) {
        //if (message.author.id !== config.admin) return;
        if (args[0] === "stop") {
            module.exports.verifierSiUtilisateurConnecté(message);
            let serveur = listeServeurs[message.guildId];
            let messageEnCours = serveur.message
            if (messageEnCours !== null) {
            let botReply = messageEnCours.content.replaceAll("\u001b[0;36m", "\u001b[0;30m");
            botReply = botReply.replace("\u001b[1;35m", "\u001b[0;30m");
            botReply = botReply.replace("\u001b[0;35m            Liste en cours", "\u001b[0;30m            Liste interrompue");
            messageEnCours.edit(botReply);
            }

            const connection = getVoiceConnection(message.guild.id)
            // serveur.player.stop(true); // test
            connection.destroy();
            delete listeServeurs[message.guildId];
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
        
        const player = createAudioPlayer(); 
        
        let serveur = {
            player : player,
            canal : message.member.voice.channel.id,
            enPause : false,
            estSkip : false,
            listeChansons : JSON.parse(JSON.stringify(listeChansons)),
            message : null,
        };
        listeServeurs[message.guildId] = serveur;

        joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator
        }).subscribe(player)
        //message.guild.me.voice.setRequestToSpeak(true);
        let numeroIntro = outils.randomNumber(serveur.listeChansons.intro.liste.length)-1;
        let resource = createAudioResource(serveur.listeChansons.intro.liste[numeroIntro]);
        
        player.play(resource)

        delete serveur.listeChansons.intro;

        player.on('error', error => {
            console.error(error);
        });
        
        listeChansonsEnCours = [];
        let messageEnCours = null;
        let botReply;
        let premièreOSTListe;
        player.on(AudioPlayerStatus.Idle, () => {
            if (listeChansonsEnCours.length === 0) {
                if (messageEnCours !== null) {
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
                    for (let i = 1; i < listeUtilisateursGlobale.length; i++) {
                        let utilisateurEnCours = serveur.listeChansons[listeUtilisateursGlobale[i]];
                        
                        if ( (listeUtilisateursConnectés.includes(listeUtilisateursGlobale[i]) && Math.random() < utilisateurEnCours.probabilité_present)
                        || Math.random() < utilisateurEnCours.probabilité_absent) {
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
                            botReply += `\u001b[0;34m${utilisateurEnCours.nom}${"           ".slice(utilisateurEnCours.nom.length)} \u001b[0;36m${chansonARajouter.replace(/^.*[\\\/]/, '').slice(0,-4)}\r\n`;
                            listeChansonsEnCours.push(chansonARajouter);
                            for (let j = 1; j < listeUtilisateursGlobale.length; j++) {
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
                    messageEnCours = msg;
                    serveur.message = msg;
                });
            }
            if (!premièreOSTListe) {
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
        });
    },


    verifierSiUtilisateurConnecté: function(message) {
        if (message.member.voice.channel.id !== listeServeurs[message.guildId].canal) {
            throw("Utilisateur non connecté au canal audio.")
        }
    }
}