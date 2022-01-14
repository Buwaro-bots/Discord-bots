const outils = require("./outils.js");
const config = require('../config.json');
const fs = require('fs');

exports.roll = function(client, message, args, envoyerPM, idMJ, commandBody){
    [args, envoyerPM, idMJ] = outils.verifierSiMJ(args, envoyerPM);

    if (args[0] == "setup"){
        config.lancerParDefault = args[1];
        let writer = JSON.stringify(config, null, 4); // On sauvegarde le fichier.
        fs.writeFileSync('./config.json', writer);
        outils.envoyerMessage(client, `Le lancer par défaut est maintenant ${args[1]}.`, message);
        return;
    }


    if (args.length == 0){ // Si il y a juste roll, je fais le lancer par défaut
        args = [config.lancerParDefault];
        commandBody += " " + config.lancerParDefault;
    }
    

    if (args.length == 1 && (!args[0].toLowerCase().includes("d") || args[0].toLowerCase().includes("1d") || args[0].toLowerCase().charAt(0) == "d")){ // Si une personne envoit juste un nombre sans écrire "d" ou "d100", dans ce cas on lance un dé.
        args[0] = args[0].toLowerCase().replace("1d", "");
        args[0] = args[0].toLowerCase().replace("d", "");
        outils.verifierNaN(args)
        let lancer = parseInt(args[0]);
        if (lancer > 9000000000000000) throw("Nombre trop grand");
        let resultat = outils.randomNumber(lancer) ;
        let botReply = `${message.author.toString()} sur 1d${lancer} a lancé **${resultat}**.`;
        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
        outils.logLancer(message.author.username, resultat, `1d${lancer}`);
    }

    else {
        let listeCommandes = []; // [commande, bool estLancer, [lancers], somme]
        let listeOperateurs = ["+","-","*","/","(",")",">","<"];

        args = commandBody // On refait args pour pouvoir séparer mieux
        for (let i = 0; i < listeOperateurs.length; i+=1){
            args = args.split(`${listeOperateurs[i]}`).join(` ${listeOperateurs[i]} `);
        }
        args = args.toLowerCase().split(/ +/);
        args.shift(); if(commandBody.startsWith("repeat")){args.shift();} // Si la commande ;repeat x est utilisée, il faut aussi enlever le premier paramètre
        if (idMJ != null) { args = args.splice(0, args.length-4) }


        for (let i = 0; i < args.length; i++){ // On cherche ce que sont chaque commande
            if(args[i].includes("d")){ // Si la commande a d...
                args[i] = args[i].charAt(0) === "d" ? "1" + args[i] : args[i];
                args[i] = args[i].split("d");
                if(args[i].length == 2 && !isNaN(args[i][0]) && !isNaN(args[i][1]) && parseInt(args[i][0]) > 0 && parseInt(args[i][1]) > 1){ // On regarde si il y a bien deux nombres qui soient valide
                    let lancer = 0;
                    let lancers = [];
                    let somme = 0;
                    
                    for (let j = 0; j < args[i][0]; j++){ // On lance les deux
                        lancer = outils.randomNumber(args[i][1]);
                        lancers.push(lancer);
                        somme += lancer;                                
                    }
                    listeCommandes.push([args[i][0] +"d" + args[i][1], true, lancers, somme]); // On rajoute la commande, les lancers et le résultat du lancers dans la liste des commandes
                }
            }
            else if(listeOperateurs.includes(args[i]) || !isNaN(parseInt(args[i]))){ // Sinon si c'est un opréateur, on rajoute tout simplement dans la liste des commandes
                listeCommandes.push([args[i], false])
            }
            
        }
        let reponseCommandes = "";
        let reponseLancers = "";
        let reponseSomme = "";

        for (let i = 0; i < listeCommandes.length; i++){ // On écrit la réponse
            reponseCommandes += listeCommandes[i][0];
            if (listeCommandes[i][1]){ // Si la commande est un lancer, alors la liste des lancers doit s'afficher sans la liste des lancers et dans la formule de calcul
                reponseLancers += `[${listeCommandes[i][2]}] `;
                reponseSomme += listeCommandes[i][3]
            }
            else{ // Sinon on affiche l'opérateur
                reponseLancers += listeCommandes[i][0] + " ";
                reponseSomme += listeCommandes[i][0]
            }
        }
        //console.log(reponseSomme);
        reponseSomme = Math.round(eval(reponseSomme)*100)/100; // On calcule le résultat...
        let botReply = `${message.author.toString()} sur ${reponseCommandes} a lancé ${reponseLancers}, ce qui donne **${reponseSomme}**.`;
        if (botReply.length >= 2000) throw("Réponse trop longue"); // Puis on vérifie que la réponse ne soit pas trop longue.
        if (reponseSomme > 9000000000000000) throw("Nombre trop grand");
        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
        outils.logLancer(message.author.username, `${reponseLancers}= ${reponseSomme}` , reponseCommandes);
    }
}