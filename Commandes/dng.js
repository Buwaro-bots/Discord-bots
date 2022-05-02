let dexDng = require('../Données/dex-dng.json');
const { verifierNaN } = require("./outils.js");
const outils = require("./outils.js");
const roll = require('./roll.js');
let strings = require('../Données/textes-privés.json');

exports.dng = function(client, message, args, envoyerPM, idMJ) {

    if (["aide", "help", "commandes", "commande"].includes(args[0])) {
        let espaces = "                ";
        let botReply = "." + // Nécéssaire pour que discord n'enlève pas les espaces.
        espaces + "**Liens utiles**\r\n" +
        "**Mode d'emploi du bot** : <https://buwaro-bots.github.io/Discord-bots/?mode=dng>\r\n" +
        strings["DnG-Help"] +
        " \r\n" +
        espaces + "**Commandes**\r\n" +
        "**;dng table** pour la table des types.\r\n" +
        "**;dng trait** pour avoir la description complète d'un trait. **;dex *espèce*** permet de vous rappeler les traits que vous avez.\r\n" +
        " \r\n" +
        "**;dng *stat*** pour un jet normal, la stat doit normalement être entre 1 et 5.\r\n" +
        "**;dng ini *instinct* + *agilité*** pour un jet d'initiative.\r\n" +
        "**;dng pc *stat* *+modificateur*** pour un jet de puissance cachée."

        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
        return;
    }
    if (args[0] === "table" || args[0] === "types" || args[0] === "type") {
        outils.envoyerMessage(client, "https://cdn.discordapp.com/attachments/730133304237359157/958476687090262066/unknown.png", message, envoyerPM, idMJ);
        return;
    }

    // Cette commande recherche le pokémon demandé dans la base de données de DnG.
    if (args[0] === "pokemon") {
        args.shift();
        let pokemonDemande = args.join(" ");
        if (!(dexDng.Pokemons.hasOwnProperty(pokemonDemande))) {
            try {
                pokemonDemande = outils.rattrapageFauteOrthographe(dexDng.Pokemons, pokemonDemande, "fort");
            } catch (e) {
                // On regarde si le pokémon existe dans la commande isekai pour donner un meilleur message d'erreur. Le dex de la commande isekai étant complet, il a plus de chance de retrouver le nom.
                let dexIsekai = require('../Données/pokedex.json');
                let listePokemons = [];
                for (let i = 0; i < dexIsekai.length; i++) {
                    if (dexIsekai[i].tags.includes("PasDnG")) {
                        listePokemons.push(dexIsekai[i].nom);
                    }
                }
                pokemonDemande = outils.normalisationString(args.join(" "));
                pokemonDemande = outils.rattrapageFauteOrthographe(listePokemons, pokemonDemande);
                outils.envoyerMessage(client, `Désolé, mais ${pokemonDemande} n'est pas dans DnG.`, message, envoyerPM, idMJ);
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
            outils.envoyerMessage(client, listeTraits, message, envoyerPM, idMJ);
            return;
        }
        args.shift();
        let trait = args.join(" ");
        let botReply = `${message.author.toString()} `;
        if (!dexDng.Traits.hasOwnProperty(trait)) {
            trait = outils.rattrapageFauteOrthographe(dexDng.Traits, trait);
        }
        botReply += `${trait} : ${dexDng.Traits[trait].DescriptionLongue}`;

        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
        return;
    }

    if (["ini", "init", "initiative"].includes(args[0])) {
        if (args.length === 1) {
            outils.envoyerMessage(client, "Pour faire un jet d'initiative, les stats sont l'instinct et l'agilité, la commande est **;dng ini *instinct* + *agilité***.", message, false, null);
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
        outils.logLancer(message.author.username, `${lancerAAfficher} = ${reponseSomme}`, `dng ini ${stat1} + ${stat2}`);
        return;
    }
    if (args[0] === "pc") {
        if (args.length === 1) {
            outils.envoyerMessage(client, "Pour faire un jet de PC, la commande est **;dng pc *niveau de jauge* + *(points ajoutés)***.", message, false, null);
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
            throw("Stat incorrecte");
        }

        let lancer = `${dexDng.LancersPC[stat]} ${modificateur}`;
        roll.roll(client, message, [lancer], envoyerPM, idMJ, `roll ${lancer}`);
        return;
    }

    outils.verifierNaN(args);

    let stat = args.length > 0 ? parseInt(args[0]) : 3; // Si aucune information est donnée, on assume que la stat est de 3 et le dd de 3. Si ça pose problème de toute façon le bot le mentionne.
    let nombreLancers = args.length > 1 ? Math.max(Math.min(parseInt(args[1]), 5), 1) : 1; // Si l'utilisateur ne mentionne pas le nombre de lancer, il n'en fait qu'un.
    let alerteStatLimite = stat > 5 ? "(Attention, normalement les stats ne dépassent pas 5.)" : "";
    
    let lancerCritique = outils.randomNumber(20);
    let lancerCaracteristique = "";

    if (nombreLancers === 1) {
        lancerCaracteristique = outils.randomNumber((1+stat)*2);
    }
    else {
        let listeLancers = [];
        for (let i = 0; i < nombreLancers ; i++) {
            listeLancers.push(outils.randomNumber((1+stat)*2));
        }
        
        let meilleurLancer = Math.max.apply(Math, listeLancers); // On récupère le meilleur lancer pour le mettre en gras après.
        lancerCaracteristique = listeLancers.join(", ");
        lancerCaracteristique = lancerCaracteristique.replace(meilleurLancer, `**${meilleurLancer}**`);
    }

    let botReply = `${message.author.toString()} avec une stat de ${stat}, a lancé [${lancerCaracteristique}] [${lancerCritique}]. ${alerteStatLimite}`;
    outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
    outils.logLancer(message.author.username, `[${lancerCaracteristique}] [${lancerCritique}]`, `dng ${stat}`);


}
    //#region 
    /*
    let calculer_reussite = false; // On ne dit si c'est une réussite ou pas que si le dd ou l'avantage est donné.
    let dd = 3;
    let avantage = 0;
    let avantage_mis = false;

    for (let i = 0; i < args.length; i++) { // On regarde la liste des paramètres données, on peut les mettre dans n'importe quel ordre car les trois ont leur propre nomenclature.
        if (args[i][0] === "+" || args[i][0] === "-") { // Si ça commence par + ou -, c'est des avantages / désavantages
            avantage_mis = true;
            calculer_reussite = true;
            avantage = parseInt(args[i]);
        }
        else if (args[i].includes("dd")) { // Si ça commence par dd, c'est le dd.
            calculer_reussite = true;
            dd = parseInt(args[i][2])
        }
        else {
            stat = parseInt(args[i]) // Sinon c'est la stat.
        }
    }
    outils.verifierNaN([stat, dd, avantage]);
    */


    /*
    let message_reussite_un = "";
    let message_reussite_deux = "";
    if (calculer_reussite) {
        message_reussite_un = ` un dd de ${dd}`;
        if (avantage_mis) {
            message_reussite_un += avantage > 0 ? ` et ${avantage} avantages` : ` et ${-avantage} désavantages`
        }

        message_reussite_deux = (dices[0] > dd && dices[1] >= avantage * -4 )|| dices[1] <= avantage * 4 ? `C'est une réussite !` : `C'est un échec !`

    }

    let botReply = `${message.author.toString()} avec une stat de ${stat},${message_reussite_un} a lancé [${dices[0]}] [${dices[1]}]. ${message_reussite_deux} ${alerteStatLimite}`;
    */
   //#endregion