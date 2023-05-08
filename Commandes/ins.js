const outils = require("./outils.js");
const INSdata = require('../Données/ins.json');
const fs = require('fs');
const { ins: aide } = require("./aide.js");


module.exports = {
    ins : function(message, args, envoyerPM, idMJ) {
    let paramJoueurs = JSON.parse(fs.readFileSync(__dirname + '/../Données/param-joueurs.json', 'utf-8'))

    /* Etant donné que j'ai eu deux jdr différents dans deux serveurs différents, il a été considére comme plus pratique de regarder dans quel serveur
    a lieu le lancer au lieu de faire un système de personnages. Par simplicité, le fichier .json a un serveur "aucun" qui contient les messages par défaut
    pour ne pas avoir à vérifier si le message a un serveur déjà existant ou pas. */
    let serverID = message.guildId in paramJoueurs.ins.lancersSpeciaux ? message.guildId : "aucun";

    if (["aide", "help", "commandes", "commande"].includes(args[0])) {
        aide(message, args, envoyerPM, idMJ);
        return;
    }

    if (["table","tum","TUM"].includes(args[0])) {
        outils.envoyerMessage("https://media.discordapp.net/attachments/678319564685180930/695726135836934312/Screenshot_2020-03-30-20-20-37-1.png", message, envoyerPM, null, true);
        return;
    }

    if (args.length > 0 && ["purge","purgé","purger"].includes(args[0].toString().toLowerCase())) {
        let botReply = `${message.author.toString()} a purgé :  \`\`\``;
        let INSLancers = { 1 : [0,0], 2 : [0,0], 3 : [0,0], 4 : [0,0], 5 : [0,0], 6 : [0,0]};
        let INSLancersChiffres = { 1 : 0, 2 : 0, 3 : 0, 4 : 0, 5 : 0, 6 : 0};
        while (botReply.length < 1989) {
            let dices = [outils.lancerDéPondéré("ins",6), outils.randomNumber(6), outils.randomNumber(6)];
            botReply += `[${dices[0]}${dices[1]}]+[${dices[2]}]  `;
            INSLancers[dices[0]][0] += 1;
            INSLancers[dices[0]][1] += dices[0] === dices[1] && dices[1] === dices[2] ? 1 : 0;
            INSLancersChiffres[dices[0]] += 1;
            INSLancersChiffres[dices[1]] += 1;
            INSLancersChiffres[dices[2]] += 1;
        }
        botReply = botReply.slice(0,-2) + "\`\`\`"
        outils.envoyerMessage(botReply, message, envoyerPM, idMJ, true);

        botReply = `\`\`\`ansi\r\nStats pour INS (premier dé de chaque lancer, triples, et totaux des trois dés.):\r\n`
        botReply += `\u001b[0;36mLancers de 1x : ${INSLancers[1][0]} ${INSLancers[1][1] > 0 ? "dont " + INSLancers[1][1] + " '111'" : ""} [${INSLancersChiffres[1]}]\r\n`
        botReply += `\u001b[0;34mLancers de 2x : ${INSLancers[2][0]}  [${INSLancersChiffres[2]}]\r\n`
        botReply += `\u001b[0;32mLancers de 3x : ${INSLancers[3][0]} ${INSLancers[3][1] > 0 ? "dont " + INSLancers[3][1] + " '333'" : ""} [${INSLancersChiffres[3]}]\r\n`
        botReply += `\u001b[0;33mLancers de 4x : ${INSLancers[4][0]}  [${INSLancersChiffres[4]}]\r\n`
        botReply += `\u001b[0;35mLancers de 5x : ${INSLancers[5][0]}  [${INSLancersChiffres[5]}]\r\n`
        botReply += `\u001b[0;31mLancers de 6x : ${INSLancers[6][0]} ${INSLancers[6][1] > 0 ? "dont " + INSLancers[6][1] + " '666'" : ""} [${INSLancersChiffres[6]}]\u001b[0;0m\r\n`
        botReply += "```"
        outils.envoyerMessage(botReply, message, envoyerPM, idMJ, true);
        return;
    }

    if (args[0] === "message") { // Commande permettant à quelqu'un de rajouter un message personalisé
        if (args.length === 1) {
            let botReply = "Pour rajouter un message, veuillez consulter le mode d'emploi, partie \"Messages personalisés\". \r\nhttps://buwaro-bots.github.io/Discord-bots/?mode=ins\r\n"
            + "Si vous souhaitez rajouter un message par mp ou pour un autre serveur, il faut rajouter l'id du serveur comme ça : **;ins message 421 id_du_serveur Ceci est un message**. Pour avoir l'id du serveur, vous pouvez taper **;id**. ";
            outils.envoyerMessage(botReply, message, envoyerPM, idMJ);
            return;
        }
        if (serverID === "aucun") {
            if (args[2] in paramJoueurs.ins.lancersSpeciaux) {
                serverID = args[2];
                args.splice(2,1);
            }
            else {
                outils.envoyerMessage("Vous essayez de rajouter un message, soit par mp, soit sur un serveur qui n'a pas de messages personalisés." +
                " Dans cette situation, utilisez cette commande sur le bon serveur, soit rajoutez l'id du serveur entre le lancer et le message." + 
                " Comme **;ins message 421 id_du_serveur Ceci est un message**. Pour avoir l'id du serveur, vous pouvez taper **;id**.", message, envoyerPM, idMJ, true);
                return;
            }
        }
        
        if (args[1] === "liste") {
            let botReply = "";
            if (serverID in paramJoueurs.ins.lancersSpeciaux && serverID !== "aucun") {
                for (const lancer in paramJoueurs.ins.lancersSpeciaux[serverID]) {
                    if (paramJoueurs.ins.lancersSpeciaux[serverID][lancer].hasOwnProperty(message.author.id)) {
                        botReply += `${lancer} : ${paramJoueurs.ins.lancersSpeciaux[serverID][lancer][message.author.id]}\r\n`;
                    }
                    else if (paramJoueurs.ins.lancersSpeciaux[serverID][lancer].hasOwnProperty("autre")) {
                        botReply += `*${lancer}* : ${paramJoueurs.ins.lancersSpeciaux[serverID][lancer]["autre"]}\r\n`;
                    }
                }
            }
            else {
                botReply = "Ce serveur n'a pas de message personalisé.";
            }
            outils.envoyerMessage(botReply, message, true, idMJ, true);
            return;
        }

        // Il faut que le premier paramètre après message soit le lancer, après l'utilisateur écrit le message, si c'est delete this, on supprime le message existant à la place.
        let lancer = outils.verifierRegex(args[1], ['[1-6]{3}', '[1-6]{2}x'], 3);

        if (args[2] === "deletethis") {
            delete paramJoueurs.ins.lancersSpeciaux[serverID][lancer][message.author.id];
            let botReply = `${message.author.toString()} : Votre message pour le lancer ${lancer} a été supprimé.`;	
            outils.envoyerMessage(botReply, message, envoyerPM, idMJ, true);
        }
        else {
            if (!(lancer in paramJoueurs.ins.lancersSpeciaux[serverID])) { // Si le lancer n'existait pas dans la base, on le rajoute
                paramJoueurs.ins.lancersSpeciaux[serverID][lancer] = {};
            }

            phrase = " "; // Très mauvaise manière de récupérer la phrase qui a été découpée avant, à revoir
            for (let i= 2; i < args.length; i++) {
                phrase += args[i] + " ";
            }
            paramJoueurs.ins.lancersSpeciaux[serverID][lancer][message.author.id] = phrase; // On rajoute le message dans la base de données
            let botReply = `${message.author.toString()} : Maintenant, pour le lancer ${lancer}, je vais afficher le message : ${phrase}`;

            outils.envoyerMessage(botReply, message, envoyerPM, idMJ, true);
            let client = outils.getClient();
            if (client !== null && outils.getConfig("paramètres.canalLogs") !== null) client.channels.cache.get(outils.getConfig("paramètres.canalLogs")).send(botReply);
        }

        let writer = JSON.stringify(paramJoueurs, null, 4); // On sauvegarde le fichier.
        fs.writeFileSync('./Données/param-joueurs.json', writer);
        

        return;
    }

    if (args[0] === "autocheck") {
        let botReply = message.author.toString() + outils.gestionAutocheck("ins", message.author.id);
        outils.envoyerMessage(botReply, message, envoyerPM, idMJ, true);
        return;
    }

    if (args[0] === "gacha") {

        let lancer = outils.lancerDéPondéré("ins",6) * 10 +  outils.randomNumber(6);
        let resultat = INSdata.gacha[lancer];
        let botReply = `${message.author.toString()} a lancé au gacha [${lancer}] ce qui correspond à : ||${resultat}||`;

        outils.envoyerMessage(botReply, message, envoyerPM, idMJ)
        .then((msg)=> {
            setTimeout(function() {
                msg.edit(`${message.author.toString()} a lancé au gacha [${lancer}] ce qui correspond à : ${resultat}`);
            }, 4000)
        });

        outils.logLancer(message, `[${lancer}]`, "INS gacha", envoyerPM);
        return;
    }

    let typeLancer = "INS";
    let dices = [outils.lancerDéPondéré("ins",6), outils.randomNumber(6), outils.randomNumber(6)];
    let lancerSpecial = false;
    let verbe = "lancé";

    if (args.includes("cheat")) {
        let désTrichés;
        [désTrichés, args] = outils.rechercheDoubleParametre(args, "cheat");
        dices = outils.verifierRegex(désTrichés, ['[1-6]{3}'], 3).split('');
        dices = [parseInt(dices[0]), parseInt(dices[1]), parseInt(dices[2])];
        verbe = "triché avec";
        typeLancer += " cheat"
    }
    let dicesSum = dices[0]*100 + dices[1]*10 + dices[2]; // Nécéssaire parce qu'on ne peut pas comparer des tableaux directement.

    let botReply = `${message.author.toString()} a ${verbe} [${dices[0]}${dices[1]}] + [${dices[2]}].`;


    let lancerX = `${dices[0]}${dices[1]}x`;
    if (dicesSum in paramJoueurs.ins.lancersSpeciaux[serverID]) {
        if (message.author.id in paramJoueurs.ins.lancersSpeciaux[serverID][dicesSum]) {
            botReply += paramJoueurs.ins.lancersSpeciaux[serverID][dicesSum][message.author.id];
            lancerSpecial = true; // Si le lancer est "spécial", c'est à dire qu'il a un message perso, on n'a pas besoin de préciser si c'est une réussite ou pas.
        }
        else if ("autre" in paramJoueurs.ins.lancersSpeciaux[serverID][dicesSum]) {
            botReply += paramJoueurs.ins.lancersSpeciaux[serverID][dicesSum]["autre"];
        }
    }
    else if (lancerX in paramJoueurs.ins.lancersSpeciaux[serverID] && message.author.id in paramJoueurs.ins.lancersSpeciaux[serverID][lancerX]) {
        botReply += paramJoueurs.ins.lancersSpeciaux[serverID][lancerX][message.author.id];
        lancerSpecial = true;
    }

    if (args[0] == "opposition") {
        let i = 0;
        while (dicesSum > INSdata.tum[i]["lancer"]) {
            i += 1;
        }
        let relative = INSdata.tum[i]["relative"];
        relative = relative > 0 ? `+${relative}` : relative;
        botReply += ` Réussite à partir d'une différence de stat de ${relative}.`;
        typeLancer += " (opposition)";
    }

    else if (args[0] === "check" || args[0] === "verif" || paramJoueurs.ins.listeAutoVerifications.includes(message.author.id) && lancerSpecial === false) { // Check dit à partir de quelle stat le jet réussi, Verif dit si un jet est réussi en fonction de la stat
        let minimumStat = -2 ;
        let nomMinimumStat = "" ;
        let maximumRoll = 110;
        let i = 0;
        while (dicesSum > maximumRoll) {
            maximumRoll = INSdata.tum[i]["lancer"];
            i += 1;
        }
        i -= 1; // Je fais ça en attendant d'avoir une solution

        if ((paramJoueurs.ins.listeAutoVerifications.includes(message.author.id) && args.length >= 1) || (args[0] === "check" && args.length >= 2) || (args[0] === "verif" && args.length >= 3)) { // On regarde si on demande une modifications du nombre de jets de colonnes.
            outils.verifierNaN([args[args.length-1]]);
            let rowBonus = -parseInt(args[args.length-1]);
            i += rowBonus;
            i = Math.max(Math.min(i, INSdata.tum.length -1), 0); // On vérifie qu'après les modifs de colonnes, qu'on ne sorte pas du tableau.
        }
        minimumStat = INSdata.tum[i]["stat"];
        nomMinimumStat = INSdata.tum[i]["nomStat"];

        if (args[0] === "check" || paramJoueurs.ins.listeAutoVerifications.includes(message.author.id)) { // Si la commande est stat, on rajoute dans le message à quel stat le jet réussi. Sinon la commande est vérif, on cherche la stat demandée et on la compare avec la stat minimum pour réussir
            if (dicesSum >= 112 && dicesSum <= 116) {
                botReply += ` Réussite systématique.`;
                if (minimumStat > 0) botReply += ` (ou avec une stat d'au minimum ${nomMinimumStat})`;
            }
            else if (dicesSum >= 661 && dicesSum <= 665) {
                botReply += ` Echec systématique. (ou réussite avec une stat d'au minimum ${nomMinimumStat})`;
            }
            else if (minimumStat <= 0 ) {
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


    outils.envoyerMessage(botReply, message, envoyerPM, idMJ);

    outils.logLancer(message, `[${dices[0]}${dices[1]}]+[${dices[2]}]`, typeLancer, envoyerPM);
    }
}