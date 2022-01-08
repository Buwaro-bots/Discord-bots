const outils = require("./outils.js");
const INSdata = require('../Données/ins.json');
const config = require('../config.json');
const fs = require('fs');

exports.ins = function(client, message, args, envoyerPM, idMJ){
    [args, envoyerPM, idMJ] = outils.verifierSiMJ(args, envoyerPM);

    if(["aide", "help", "commandes", "commande"].includes(args[0])){
        outils.envoyerMessage(client, 
            "**;ins** permet de faire un jet normal.\r\n" +
            ";ins **check** permet de savoir à partir de quelle stat le jet réussi. Il est possible de mentionner des colonnes de bonus ou de malus, par exemple **;ins check +3**.\r\n" +
            ";ins **autocheck** permet d'activer automatiquement la vérification des rolls. (ou de le désactiver en réutilisant cette commande).\r\n" +            
            ";ins **verif** ***stat*** permet de savoir si le jet réussi en précisant la stat, par example **;ins verif 2+**. Il est possible de préciser un bonus ou malus de colonne.\r\n" +
            ";ins **message** ***lancer*** ***phrase*** permet d'ajouter un message personnalisé sur un résultat, par exemple **;ins 665 :lul:**. Les emotes doivent être disponibles sur un serveur où ce bot se trouve.\r\n" +
            ";ins **cheat** ***dé1*** ***dé2*** ***dé3*** permet de forcer un jet, seulement utile pour vérifier un message.\r\n" +
            ";ins **tum** affiche la table unique multiple.\r\n"+
            ";ins **purge** permet de purger un nombre incroyable de **196** lancers en une seule commande !\r\n"+
            ";ins **opposition** :construction:"
            , message, envoyerPM
        )
        return;
    }

    if (["table","tum","TUM"].includes(args[0])){
        outils.envoyerMessage(client, "https://media.discordapp.net/attachments/678319564685180930/695726135836934312/Screenshot_2020-03-30-20-20-37-1.png", message);
        return;
    }

    if (args.length > 0 && ["purge","purgé","purger"].includes(args[0].toString().toLowerCase())){
        let botReply = `${message.author.toString()} a purgé :  \`\`\``;
        while (botReply.length < 1989){
            let dices = [outils.randomNumber(6), outils.randomNumber(6), outils.randomNumber(6)];
            botReply += `[${dices[0]}${dices[1]}]+[${dices[2]}]  `;
        }
        botReply = botReply.slice(0,-2) + "\`\`\`"
        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
        return;
    }

    if (args[0] == "message"){ // Commande permettant à quelqu'un de rajouter un message personalisé
        if (args[2] == "deletethis"){
            // A faire
        }
        else{
            if(!(args[1] in INSdata.lancersSpeciaux)){ // Si le lancer n'existait pas dans la base, on le rajoute
                INSdata.lancersSpeciaux[args[1]] = {};
            }

            phrase = " "; // Très mauvaise manière de récupérer la phrase qui a été découpée avant, à revoir
            for (let i= 2; i < args.length; i++){
                phrase += args[i] + " ";
            }
            INSdata.lancersSpeciaux[args[1]][message.author.id] = phrase; // On rajoute le message dans la base de données
            let botReply = `${message.author.toString()} : Maintenant, pour le lancer ${args[1]}, je vais afficher le message : ${phrase}`;

            outils.envoyerMessage(client, botReply, message);
            client.channels.cache.get(config.canalLogs).send(botReply);
        }

        let writer = JSON.stringify(INSdata, null, 4); // On sauvegarde le fichier.
        fs.writeFileSync('./Données/ins.json', writer);
        

        return;
    }

    if (args[0] == "autocheck"){
        let botReply = "";
        if (INSdata.listeAutoVerifications.includes(message.author.id)){
            const index = INSdata.listeAutoVerifications.indexOf(message.author.id);
            INSdata.listeAutoVerifications.splice(index, 1);
            botReply = `${message.author.toString()} : Vous avez désactivé la vérification automatique.`;
        }
        else {
            INSdata.listeAutoVerifications.push(message.author.id)
            botReply = `${message.author.toString()} : Vous avez activé la vérification automatique.`;
        }

        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
        let writer = JSON.stringify(INSdata, null, 4); // On sauvegarde le fichier.
        fs.writeFileSync('./Données/ins.json', writer);
        
        return;
    }


    if (args[0] == "gacha"){

        let lancer = outils.randomNumber(6) * 10 +  outils.randomNumber(6);
        let resultat = INSdata.gacha[lancer];

        console.log(`${message.author.toString()} a lancé au gacha [${lancer}] ce qui correspond à : ${resultat}`);
        message.channel.send(`${message.author.toString()} a lancé au gacha [${lancer}] ce qui correspond à : ||${resultat}||`)
        .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
            setTimeout(function(){
                msg.edit(`${message.author.toString()} a lancé au gacha [${lancer}] ce qui correspond à : ${resultat}`);
            }, 4000)
        });
        return;
    }

    let dices = [outils.randomNumber(6), outils.randomNumber(6), outils.randomNumber(6)];
    let lancerSpecial = false;
    let verbe = "lancé";

    if (args[0] === "cheat" && args.length >= 4) {
        dices = [parseInt(args[1]), parseInt(args[2]), parseInt(args[3])]; // Penser à mettre modulo / int pour demander 666 au lieu de 6 6 6.
        outils.verifierNaN(dices);
        verbe = "triché avec";
    }
    let dicesSum = dices[0]*100 + dices[1]*10 + dices[2]; // Nécéssaire parce qu'on ne peut pas comparer des tableaux directement.

    let botReply = `${message.author.toString()} a ${verbe} [${dices[0]}${dices[1]}] + [${dices[2]}].`;


    if (dicesSum in INSdata.lancersSpeciaux){
        if (message.author.id in INSdata.lancersSpeciaux[dicesSum]){
            botReply += INSdata.lancersSpeciaux[dicesSum][message.author.id];
            lancerSpecial = true; // Si le lancer est "spécial", c'est à dire qu'il a un message perso, on n'a pas besoin de préciser si c'est une réussite ou pas.
        }
        else if("autre" in INSdata.lancersSpeciaux[dicesSum]){
            botReply += INSdata.lancersSpeciaux[dicesSum]["autre"];
        }
    }

    if (args[0] === "check" || args[0] === "verif" || INSdata.listeAutoVerifications.includes(message.author.id) && lancerSpecial == false) { // Check dit à partir de quelle stat le jet réussi, Verif dit si un jet est réussi en fonction de la stat
        let minimumStat = -2 ;
        let nomMinimumStat = "" ;
        let maximumRoll = 110;
        let i = 0;
        while (dicesSum > maximumRoll) {
            maximumRoll = INSdata.tum[i]["lancer"];
            i += 1;
        }
        i -= 1; // Je fais ça en attendant d'avoir une solution

        if ((args[0] === "check" && args.length >= 2) || (args[0] === "verif" && args.length >= 3)) { // On regarde si on demande une modifications du nombre de jets de colonnes.
            let rowBonus = 0;
            if (args[0] === "check") {
                rowBonus = -parseInt(args[1]);
            }
            else {
                rowBonus = -parseInt(args[2]);
            }
            i += rowBonus
            i = Math.max(Math.min(i, INSdata.tum.length -1), 0); // On vérifie qu'après les modifs de colonnes, qu'on ne sorte pas du tableau.
        }
        minimumStat = INSdata.tum[i]["stat"];
        nomMinimumStat = INSdata.tum[i]["nomStat"];

        if(args[0] === "check" || INSdata.listeAutoVerifications.includes(message.author.id)) { // Si la commande est stat, on rajoute dans le message à quel stat le jet réussi. Sinon la commande est vérif, on cherche la stat demandée et on la compare avec la stat minimum pour réussir
            if (minimumStat <= 0 ) {
                botReply += ` Réussite quelque soit la stat.`;    
            }
            else {
                botReply += ` Réussite avec une stat d'au minimum ${nomMinimumStat}.`;
            }
        }

        else {
            let playerStat = parseInt(args[1]);
            if ( args[1].endsWith("+")) {
                playerStat += 0.5;
            }

            if (playerStat >= minimumStat) {
                botReply += ` Ce jet est une réussite.`;
            }
            else {
                botReply += ` Ce jet est un échec.`;
            }
        }

    }


    outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);

    outils.logLancer(message.author.username, `[${dices[0]}${dices[1]}]+[${dices[2]}]`, "INS");
}