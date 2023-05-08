const outils = require("./outils.js");
const fs = require('fs');
const { verifierNaN } = require("./outils.js");

module.exports = {
    roll: function(message, args, envoyerPM, idMJ) {
        if (args[0] === "setup") {
            outils.setConfig("roll.lancerParDefault", args[1])
            outils.envoyerMessage(`Le lancer par défaut est maintenant ${args[1]}.`, message);
            return;
        }


        if (args.length === 0) { // Si il y a juste roll, je fais le lancer par défaut
            args = [outils.getConfig("roll.lancerParDefault")];
        }
        
        if (args.length === 1 && args[0].includes("^")) args[0] = String(parseInt(args[0]) ** 2);

        if (args.length === 1 && !args[0].includes("+") && !args[0].includes("-") && (!args[0].toLowerCase().includes("d") || args[0].toLowerCase().includes("1d") || args[0].toLowerCase().charAt(0) === "d")) { // Si une personne envoit juste un nombre sans écrire "d" ou "d100", dans ce cas on lance un dé.
            args[0] = args[0].toLowerCase().replace("1d", "");
            args[0] = args[0].toLowerCase().replace("d", "");
            outils.verifierNaN(args);
            let lancer = parseInt(args[0]);
            if (lancer > 9000000000000000) throw("Résultat trop grand.");
            let resultat = outils.randomNumber(lancer) ;
            let botReply = `${message.author.toString()} sur 1d${lancer} a lancé **${resultat}**.`;
            outils.envoyerMessage(botReply, message, envoyerPM, idMJ);
            outils.logLancer(message, resultat, `1d${lancer}`, envoyerPM);
        }

        else {
            let commandeLancer = args.join(" ");
            let [reponseCommandes, listeLancers, reponseLancers, reponseSomme] = module.exports.commandeComplexe(commandeLancer);

            let botReply = `${message.author.toString()} sur ${reponseCommandes}a lancé ${reponseLancers}, ce qui donne **${reponseSomme}**.`;
            if (botReply.length > 2000) throw ("Réponse trop longue.");
            outils.envoyerMessage(botReply, message, envoyerPM, idMJ);
            let reponseALogger = `${reponseLancers}= ${reponseSomme}`;
            if (reponseALogger.length + reponseCommandes.length > 950) {
                reponseCommandes = reponseCommandes.slice(0,100);
                reponseALogger = `${reponseALogger.slice(0, 880 - reponseCommandes.length)} [...] ${reponseALogger.slice(reponseALogger.length - 15, reponseALogger.length)}`;
            }
            outils.logLancer(message, reponseALogger , reponseCommandes, envoyerPM);
            return;
        }
    },

/**
 * @param {string} commandeLancer 
 * @returns {Array} [reponseCommandes (le lancer tel qu'il a été entré après épuration), listeLancers (contient la liste brute des lancers),
 *                  reponseLancers (les lancers de dés tels qu'ils sont affichés avec la commande roll), reponseSomme]
 * @description Cette fonction permet d'effectuer un lancer complexe et de renvoyer les éléments pour qu'elles puissent être réutiliser par d'autres commandes.
 * 
 * Exemple : 1d20+1d10+1 renvoit "1d20 + 1d10 + 1" ; [8, 6] ; "[8] + [6] + 1" ; 15
 */
    commandeComplexe: function(commandeLancer) {
        let listeCommandes = []; // [commande, bool estLancer, [lancers], somme]
        let listeOperateurs = ["+","-","*","/","(",")",">","<"];

        for (let i = 0; i < listeOperateurs.length; i+=1) {
            commandeLancer = commandeLancer.split(`${listeOperateurs[i]}`).join(` ${listeOperateurs[i]} `);
        }
        commandeLancer = commandeLancer.toLowerCase().split(/ +/);
        let listeLancers = [];

        for (let i = 0; i < commandeLancer.length; i++) { // On cherche ce que sont chaque commande
            if (commandeLancer[i].includes("d")) { // Si la commande a d...
                commandeLancer[i] = commandeLancer[i].charAt(0) === "d" ? "1" + commandeLancer[i] : commandeLancer[i];
                commandeLancer[i] = commandeLancer[i].split("d");
                verifierNaN(commandeLancer[i]);
                if (commandeLancer[i].length === 2 && parseInt(commandeLancer[i][0]) > 0) { // On regarde si il y a bien deux nombres qui soient valides
                    let lancer = 0;
                    let lancers = [];
                    let somme = 0;
                    
                    for (let j = 0; j < commandeLancer[i][0]; j++) { // On lance les dés
                        lancer = outils.randomNumber(commandeLancer[i][1]);
                        lancers.push(lancer);
                        listeLancers.push(lancer);
                        somme += lancer;                                
                    }
                    listeCommandes.push([commandeLancer[i][0] +"d" + commandeLancer[i][1], true, lancers.join(", "), somme]); // On rajoute la commande, les lancers et le résultat du lancers dans la liste des commandes
                }
            }
            else if (listeOperateurs.includes(commandeLancer[i]) || !isNaN(parseInt(commandeLancer[i]))) { // Sinon si c'est un opréateur, on rajoute tout simplement dans la liste des commandes
                listeCommandes.push([commandeLancer[i], false]);
            }
            
        }
        let reponseCommandes = "";
        let reponseLancers = "";
        let reponseSomme = "";

        for (let i = 0; i < listeCommandes.length; i++) { // On écrit la réponse
            reponseCommandes += listeCommandes[i][0] + " ";
            if (listeCommandes[i][1]) { // Si la commande est un lancer, alors la liste des lancers doit s'afficher sans la liste des lancers et dans la formule de calcul
                reponseLancers += `[${listeCommandes[i][2]}] `;
                reponseSomme += listeCommandes[i][3];
            }
            else { // Sinon on affiche l'opérateur
                reponseLancers += listeCommandes[i][0] + " ";
                reponseSomme += listeCommandes[i][0];
            }
        }
        //console.log(reponseSomme);
        reponseSomme = Math.round(eval(reponseSomme)*100)/100; // On calcule le résultat...
        reponseCommandes = reponseCommandes.replaceAll('*', '\\*');
        reponseLancers = reponseLancers.replaceAll('*', '\\*');
        
        outils.verifierNaN([reponseSomme]);
        if (Math.abs(reponseSomme) > 9000000000000000) throw("Résultat trop grand.");

        return [reponseCommandes, listeLancers, reponseLancers, reponseSomme];    
    }
}