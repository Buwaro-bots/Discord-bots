let dexDng = require('../Données/dex-dng.json');
const { verifierNaN } = require("./outils.js");
const { dng: aide } = require("./aide.js");

const outils = require("./outils.js");
const roll = require('./roll.js');
const isekai = require('./isekai.js');
const fs = require('fs');

module.exports = {
    dng : function(client, message, args, envoyerPM, idMJ) {
    let paramJoueurs = JSON.parse(fs.readFileSync(__dirname + '/../Données/param-joueurs.json', 'utf-8'))

    if (["aide", "help", "commandes", "commande"].includes(args[0])) {
        aide(client, message, args, envoyerPM, idMJ);
        return;
    }
    if (args[0] === "table" || args[0] === "types" || args[0] === "type") {
        outils.envoyerMessage(client, "https://cdn.discordapp.com/attachments/730133304237359157/958476687090262066/unknown.png", message, envoyerPM, idMJ, true);
        return;
    }

    // Cette commande recherche le pokémon demandé dans la base de données de DnG.
    if (args[0] === "pokemon") {
        args.shift();
        let pokemonDemande;
        if (args.length === 0 || args[0] === "alea") {
            args.length === 0 ? args.push("base") : args.shift();
            args.push("DnG");
            let nouveauPokemon = isekai.tiragePokemon(args);
            if (nouveauPokemon.hasOwnProperty("nomForme")) {
                pokemonDemande = nouveauPokemon.nomForme;
            }
            else {
                pokemonDemande = nouveauPokemon.nom;
            }
        }
        else {
            pokemonDemande = args.join(" ");
        }
        if (!(dexDng.Pokemons.hasOwnProperty(pokemonDemande))) {
            try {
                let resultat = outils.rattrapageFauteOrthographe(dexDng.Pokemons, pokemonDemande, "fort");
                pokemonDemande = resultat;
            } catch (e) {
                // On regarde si le pokémon existe dans la commande isekai pour donner un meilleur message d'erreur. Le dex de la commande isekai étant complet, il a plus de chance de retrouver le nom.
                let dexIsekai = require('../Données/pokedex.json');
                let listePokemons = [];
                for (let i = 0; i < dexIsekai.length; i++) {
                    if (dexIsekai[i].tags.includes("PasDnG")) {
                        dexIsekai[i].hasOwnProperty("nomForme") ? listePokemons.push(dexIsekai[i].nomForme) : listePokemons.push(dexIsekai[i].nom);
                    }
                }
                pokemonDemande = outils.rattrapageFauteOrthographe(listePokemons, pokemonDemande);
                outils.envoyerMessage(client, `Désolé, mais ${pokemonDemande} n'est pas dans DnG.`, message, envoyerPM, idMJ, true);
                return;
            }
        }

        let botReply = `**${pokemonDemande}**\r\n`;
        let pokemon = dexDng.Pokemons[pokemonDemande];
        botReply += pokemon.types.length > 1 ? `Types : **${pokemon.types[0]} / ${pokemon.types[1]}**\r\n` : `Type : **${pokemon.types[0]}**\r\n`;
        botReply += `Style : **${pokemon.style}**\r\n`;
        botReply += `Grade : **${pokemon.grade}**\r\n`;
        botReply += `Arbres : **${pokemon.arbres}**\r\n\r\n`;
        botReply += `Traits :\r\n`;
        // On parcourt les traits du pokémon pour afficher la description courte.
        for (let numero in pokemon.traits) {
            let trait = pokemon.traits[numero];
            let description = "";
            if (dexDng.Traits.hasOwnProperty(trait)) {
                description = ` : ${dexDng.Traits[trait].DescriptionCourte}`;
            }
            botReply += `**${trait}**${description}\r\n`;
        }

        outils.envoyerMessage(client, botReply, message, envoyerPM);
        return;
    }

    if (args[0] === "trait") {
        // Si l'utilisateur d'envoit pas de trait, on affiche la liste entière pour ne pas renvoyer d'erreur.
        if (args.length === 1) {
            let listeTraits = "La liste des traits est : ";
            for (let trait in dexDng.Traits) {
                listeTraits += trait + ", ";
            }
            outils.envoyerMessage(client, listeTraits, message, envoyerPM, idMJ, true);
            return;
        }
        args.shift();
        let trait = args.join(" ");
        let botReply = `${message.author.toString()} `;
        if (!dexDng.Traits.hasOwnProperty(trait)) {
            trait = outils.rattrapageFauteOrthographe(dexDng.Traits, trait);
        }
        botReply += `${trait} : ${dexDng.Traits[trait].DescriptionLongue}`;

        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ, true);
        return;
    }

    if (["ini", "init", "initiative"].includes(args[0])) {
        if (args.length === 1) {
            outils.envoyerMessage(client, "Pour faire un jet d'initiative, les stats sont l'instinct et l'agilité, la commande est **;dng ini *instinct* + *agilité***.", message, false, null, true);
            return;
        }

        let stat1; let stat2; let de1; let de2;
        let stats = {"1": "4", "2": "6", "3": "8", "4": "10", "5": "12"};

        // Si l'utilisateur écrit quelque chose comme 4+3, il faut rechercher le premier et dernier caractère, sinon on part du principe qu'il a bien séparé les stats par un espace.
        if (args.length === 2) {
            stat1 = parseInt(args[1][0]);
            stat2 = parseInt(args[1][args[1].length -1]);
        }
        else {
            stat1 = parseInt(args[1]);
            stat2 = parseInt(args[args.length -1]);
        }
        de1 = stats[stat1]; de2 = stats[stat2];
        verifierNaN([de1, de2]);
        let lancer = `1d${de1} + 1d${de2} + (1d10-1) / 10`; // On lance un d10 pour accélérer les jets, étant donné qu'il y a pas mal d'égalités.
        let [reponseCommandes, listeLancers, reponseLancers, reponseSomme] =  roll.commandeComplexe(lancer);
        let lancerAAfficher = `[${listeLancers[0]} + ${listeLancers[1]}] + [${listeLancers[2] - 1}]`
        let botReply = `${message.author.toString()} Avec des stats de ${stat1} et ${stat2}, vous avez fait ${lancerAAfficher} ce qui donne : **${reponseSomme}**`;
        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
        outils.logLancer(message, `${lancerAAfficher} = ${reponseSomme}`, `dng ini ${stat1} + ${stat2}`, envoyerPM);
        return;
    }
    if (args[0] === "pc") {
        if (args.length === 1) {
            outils.envoyerMessage(client, "Pour faire un jet de PC, la commande est **;dng pc *niveau de jauge* + *(points ajoutés)***.", message, false, null, true);
            return;
        }
        let stat;
        let modificateur;

        if (args.length === 2) {
            if (args[1].includes("+")) {
                stat = parseInt(args[1].split("+")[0]);
                modificateur = parseInt(args[1].split("+")[1]);
            }
            else {
                stat = parseInt(args[1]);
                modificateur = 0;
            }
        }
        else {
            stat = parseInt(args[1]);
            modificateur = parseInt(args[args.length -1]);
        }

        verifierNaN([stat, modificateur]);
        modificateur = modificateur === 0 ? "" : `+ ${modificateur}`;

        if ( stat < 1 || stat > 20 ) {
            throw("La stat envoyée est incorrecte.");
        }

        let lancer = `${dexDng.LancersPC[stat]} ${modificateur}`;
        roll.roll(client, message, [lancer], envoyerPM, idMJ);
        return;
    }

    if (args[0] === "autocheck") {
        let botReply = message.author.toString() + outils.gestionAutocheck("dng", message.author.id);
        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ, true);
        return;
    }

    if (args.length === 0 || args[0].includes("dd")) {
        message.react("1️⃣").then(() => message.react("2️⃣").then(() => message.react("3️⃣").then(() => message.react("4️⃣").then(() => message.react("5️⃣")))));
        let dummyMessage = message;
        let dd = args.length > 0? args[0] : "1";

        const collector = message.createReactionCollector({
            time: 400 * 1000
        });
        collector.on('collect', (reaction, user) => {
            if(!user.bot) {
                listeReactions = {"1️⃣": "1", "2️⃣": "2", "3️⃣": "3", "4️⃣": "4", "5️⃣": "5"};
                if (listeReactions.hasOwnProperty(reaction.emoji.name)) {
                    collector.resetTimer({time: 400 * 1000});
                    dummyMessage.author = user;
                    module.exports.dng(client, dummyMessage, [listeReactions[reaction.emoji.name], dd], envoyerPM, idMJ);
                    outils.retirerReaction(message, reaction, user);
                }
            }
        });
        collector.on('end', collected => {
            message.reactions.removeAll();
        });
        return;
    }

    let stat = parseInt(args[0]);
    outils.verifierNaN([stat]);

    let nombreLancers = args.length > 1 && !(args[1].includes("dd")) ? Math.max(Math.min(parseInt(args[1]), 5), 1) : 1; // Si l'utilisateur ne mentionne pas le nombre de lancer, il n'en fait qu'un.
    let alerteStatLimite = stat > 5 ? "(Attention, normalement les stats ne dépassent pas 5.)" : "";
    
    let lancerCritique = outils.lancerDéPondéré("dng crit",20);
    let lancerCaracteristique = "";
    let meilleurLancer = "";

    if (nombreLancers === 1) {
        lancerCaracteristique = outils.lancerDéPondéré(`dng ${stat}`,(1+stat)*2);
        meilleurLancer = lancerCaracteristique;
    }
    else {
        let listeLancers = [];
        for (let i = 0; i < nombreLancers ; i++) {
            listeLancers.push(outils.lancerDéPondéré(`dng ${stat}`,(1+stat)*2));
        }
        
        meilleurLancer = Math.max.apply(Math, listeLancers); // On récupère le meilleur lancer pour le mettre en gras après.
        lancerCaracteristique = listeLancers.join(", ");
        lancerCaracteristique = lancerCaracteristique.replace(meilleurLancer, `**${meilleurLancer}**`);
    }

    let botReply = `${message.author.toString()} avec une stat de ${stat}, a lancé [${lancerCaracteristique}] [${lancerCritique}]. ${alerteStatLimite}`;

    let message_reussite;
    let estReussite = null;
    if (paramJoueurs.dng.listeAutoVerifications.includes(message.author.id)) {
        [message_reussite, estReussite] = module.exports.verificationReussite(meilleurLancer, lancerCritique, args);
        botReply += message_reussite;
    }


    let affichageLancerDemande = "dng " + args.toString().replace(",", " ");


    outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
    outils.logLancer(message, `[${lancerCaracteristique}] [${lancerCritique}]`, affichageLancerDemande, envoyerPM, estReussite);
    },

    verificationReussite : function(lancerCaracteristique, lancerCritique, args) {
    let dd = 3;
    let avantage = 0;
    let avantage_mis = false;
    let estReussite;

    for (let i = 0; i < args.length; i++) { // On regarde la liste des paramètres données, on peut les mettre dans n'importe quel ordre car les trois ont leur propre nomenclature.
        if (args[i][0] === "+" || args[i][0] === "-") { // Si ça commence par + ou -, c'est des avantages / désavantages
            avantage_mis = true;
            avantage = parseInt(args[i]);
        }
        else if (args[i].includes("dd")) { // Si ça commence par dd, c'est le dd.
            dd = parseInt(args[i][2])
        }
    }
    outils.verifierNaN([dd, avantage]);

    let message_reussite = ` Avec un dd de ${dd}`;
    if (avantage_mis) {
        message_reussite += avantage > 0 ? ` et ${avantage} avantage${avantage > 1 ? "s" : ""}` : ` et ${-avantage} désavantage${avantage < -1 ? "s" : ""}`
    }

    if ( (lancerCaracteristique > dd && lancerCritique > avantage * -4) || lancerCritique <= avantage * 4 ) {
        message_reussite += ", c'est une réussite";
        estReussite = true;
    }
    else {
        message_reussite += ", c'est un échec";
        message_reussite += ( lancerCaracteristique <= dd && lancerCritique <= 12 && lancerCritique <= (avantage+1) * 4) || ( lancerCaracteristique > dd && lancerCritique > (avantage + 1) * -4 ) ? " *(sauf avec un avantage supplémentaire)*" : "";
        estReussite = false;
    }
    message_reussite += lancerCritique >= 19 ? " **critique** !" : ".";

    return [message_reussite, estReussite];
    }    
}