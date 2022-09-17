const outils = require("./outils.js");
const config = require('../config.json');

const { createAudioResource, StreamType, createAudioPlayer, joinVoiceChannel, getVoiceConnection, AudioPlayerStatus  } = require('@discordjs/voice'); 
let listeServeurs = {};
let listeChansons = require("./../données/musique.json");
let listeUtilisateursGlobale = Object.keys(listeChansons);

module.exports = {
    musique: function(client, message, args, envoyerPM, idMJ) {
        if (message.author.id !== config.admin) return;
        if (args[0] === "stop") {
            const connection = getVoiceConnection(message.guild.id)
            connection.destroy();
            delete listeServeurs[message.guildId];
            return;
        }
        if (args[0] === "skip") {
            let serveur = listeServeurs[message.guildId];
            serveur.player.stop();
            return;
        }
        if (args[0] === "pause") {
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
        
        serveur = {
            player : player,
            enCours : true,
            enPause : false,
            listeChansons : JSON.parse(JSON.stringify(listeChansons))
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
        player.on(AudioPlayerStatus.Idle, () => {
            if (serveur.enCours === true) {
                if (listeChansonsEnCours.length === 0) {
                    let botReply = "```ansi\r\n";
                    liste = message.guild.members.cache.filter(member => member.voice.channel);
                    listeUtilisateursConnectés = Array.from(liste.keys());
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
                            botReply += `\u001b[0;34m${utilisateurEnCours.nom} \u001b[0;36m${chansonARajouter.replace(/^.*[\\\/]/, '')}\r\n`;
                            listeChansonsEnCours.push(chansonARajouter);
                            for (let j = 1; j < listeUtilisateursGlobale.length; j++) {
                                if (serveur.listeChansons[listeUtilisateursGlobale[j]].liste.includes(chansonARajouter)) {
                                    serveur.listeChansons[listeUtilisateursGlobale[j]].liste.splice(serveur.listeChansons[listeUtilisateursGlobale[j]].liste.indexOf(chansonARajouter), 1);
                                }
                            }
                        }
                    }
                    botReply += "\u001b[0m```"
                    outils.envoyerMessage(client, botReply, message);
                }
                let chansonAJouer = listeChansonsEnCours.shift();
                resource = createAudioResource(chansonAJouer);
                player.play(resource);
            }
        });
    },


    bot: function(client, message, args, envoyerPM, idMJ) {

    }
}