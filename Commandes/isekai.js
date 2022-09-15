const outils = require("./outils.js");
const pokedex = require('../Données/pokedex.json');
const fs = require('fs');
let historique = [];

// Note : La liste des tags doit être mise à jour à chaque fois que j'en rajoute un.
let listeTags = ["Plante", "Poison", "DnG", "Base", "Starter", "Final", "Feu", "Vol", "Eau", "Insecte", "Normal", "Ténèbres",
"Forme", "Alola", "Electrique", "Psy", "Sol", "Glace", "Acier", "Femelle", "Mâle", "Fée", "PasDnG", "Galar", "Combat", "Roche", "Hisui", "Nouveau", "Spectre", "Dragon",
"Gen1", "Gen2", "Gen3", "Gen4", "Gen5", "Gen6", "Gen7", "Gen8", "Gen9", "Légendaire", "Non-pokemon", "Digimon"]

module.exports = {
    isekai : function(client, message, args, envoyerPM, idMJ, messageReroll = null, listePokemonsDejaTires = []) {

    if (args.length > 0 && args[0] === "roll") {
        args.shift();
        let nombreLancers = parseInt(args.shift());
        outils.verifierNaN([nombreLancers]);
        nombreLancers = nombreLancers > 1 && nombreLancers < 13 ? nombreLancers : 6;
        let botReply = `${message.author.toString()} : Vos ${nombreLancers} pokémons sont : \r\n`;
        let listeNomsDejaTires = [];
        let pokemonsTires = [];
        let nombreProblemes = 0;
        let probabiliteLegendaire = (outils.randomNumber(111) + 14) / 100;
        let timerSpoiler = 2500; 
        [timerSpoiler, args] = outils.rechercheDoubleParametre(args, "timer", timerSpoiler);
        timerSpoiler = parseInt(timerSpoiler);
        let longueurSaut = nombreLancers <= 6? 1 : 2;
        outils.verifierNaN([timerSpoiler]);
        [longueurSaut, args] = outils.rechercheDoubleParametre(args, "saut", longueurSaut);
        outils.verifierNaN([longueurSaut]);
        longueurSaut = longueurSaut < 1 ? 1 : parseInt(longueurSaut);
        let nombreDeBoucles = Math.ceil(nombreLancers / longueurSaut);
        process.stdout.write(`\x1b[90m[${probabiliteLegendaire}] \x1b[0m`);
        while (listeNomsDejaTires.length < nombreLancers) {
            let pokemonChoisi = listeNomsDejaTires.length +1 === nombreLancers && Math.random() < probabiliteLegendaire - 1 ?
            module.exports.tiragePokemon(args.concat("Légendaire"), [], message.author.id) : module.exports.tiragePokemon(args, [], message.author.id);
            let estShiny = outils.randomNumber(400) == 1 ? " **shiny**" : ""
            if (!(pokemonChoisi.tags.includes("Légendaire")) || Math.random() < probabiliteLegendaire) {
                // Note : J'empêche de roll la génération 9 jusqu'à sa sortie
                if ( !(pokemonChoisi.tags.includes("Non-pokemon") || listeNomsDejaTires.includes(pokemonChoisi.nom) || pokemonChoisi.tags.includes("Gen9") )) {
                    listeNomsDejaTires.push(pokemonChoisi.nom);
                    if (pokemonChoisi.tags.includes("Forme")) {
                        botReply += `${listeNomsDejaTires.length}) Le pokémon numéro ${pokemonChoisi.numeroForme} qui est ||${pokemonChoisi.nomForme}${estShiny}||.\r\n`
                        pokemonsTires.push(pokemonChoisi.nomForme + estShiny);
                    }
                    else {
                        botReply += `${listeNomsDejaTires.length}) Le pokémon numéro ${pokemonChoisi.numero} qui est ||${pokemonChoisi.nom}${estShiny}||.\r\n`
                        pokemonsTires.push(pokemonChoisi.nom + estShiny);
                    }
                }
                else {
                    nombreProblemes += 1;
                    if (nombreProblemes > 20) throw("Plus de 20 tentatives ratées.");
                }
            }
            else {
                process.stdout.write(`\x1b[90m[${pokemonChoisi.nom}]\x1b[0m`);
            }
        }
        outils.logLancer(message, pokemonsTires.join(", "), `isekai roll ${nombreLancers}`, envoyerPM);
        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ)
        .then((msg)=> {
            for (let i = 0; i < nombreDeBoucles ; i++) {
                setTimeout(function() {
                    for (let j = 0; j < longueurSaut * 2; j++) {
                        botReply = botReply.replace("||", "");
                    }
                    msg.edit(botReply);
                }, timerSpoiler + timerSpoiler * 0.6 * i)
            }
        })
        return;
    }

    let nombreReroll = listePokemonsDejaTires.length;
    let timerSpoiler = 4000; 
    [timerSpoiler, args] = outils.rechercheDoubleParametre(args, "timer", timerSpoiler);
    outils.verifierNaN([timerSpoiler]);

    let modeSimple = false;
    if (args[0] === "simple") {
        modeSimple = true;
        args.shift();
    }

    /* En % le taux de forcer un nouveau pokémon, je conseille de mettre entre 1 et 5. 
    (pour Hisui, 3 jusqu'au 1er Mai, 2 jusqu'au 1er Juillet, puis 1 jusqu'à la 9G, puis retirer les tags nouveau sur les Hisui.) */
    let tauxDeNouveau = 0;
    let rollNouveau = outils.randomNumber(100);
    let pokemonChoisi;

    if (args.length === 0 && rollNouveau <= tauxDeNouveau) {
        pokemonChoisi = module.exports.tiragePokemon(["Nouveau"], listePokemonsDejaTires);
    }
    else if ( (args.length === 0 && nombreReroll > 3 && outils.randomNumber(100) <= nombreReroll - 3) || nombreReroll > 15 )  {
        pokemonChoisi = module.exports.tiragePokemon(["Digimon"], listePokemonsDejaTires);
    }
    else {
        pokemonChoisi = module.exports.tiragePokemon(args, listePokemonsDejaTires);
    }

    let rollShiny = outils.randomNumber(64 * 1.5 ** nombreReroll);
    let estShiny = "";
    let suffixe = "";

    if (rollShiny === 1) {
        estShiny = " **shiny**";
        suffixe += "✨";
    }

    let pokemonNumero = pokemonChoisi.numero; let pokemonNumeroForme = pokemonNumero;
    let pokemonNom = pokemonChoisi.nom; let pokemonNomForme = pokemonNom;
    if (pokemonChoisi.hasOwnProperty("nomForme")) {
        pokemonNumeroForme = pokemonChoisi.numeroForme;
        pokemonNomForme = pokemonChoisi.nomForme;
        suffixe += pokemonChoisi.tags.includes("Alola") ? "🏝️" : "";
        suffixe += pokemonChoisi.tags.includes("Galar") ? "🍵" : "";
        suffixe += pokemonChoisi.tags.includes("Hisui") ? "🍙" : "";
        suffixe += pokemonChoisi.tags.includes("Espagne (nom temporaire") ? "💃" : "";
        suffixe += pokemonChoisi.tags.includes("Digimon") ? "🖥️" : "";
    }
    process.stdout.write(`\x1b[90m${pokemonNomForme}${estShiny} [${rollNouveau}][${rollShiny}] => \x1b[0m`);
    outils.logLancer(message, `${pokemonNomForme}${estShiny}`, `isekai${args.length > 0 ? " " + args.join(" ") : ""}${nombreReroll > 0 ? " *reroll n°" + nombreReroll + "*" : ""}`, envoyerPM);
    listePokemonsDejaTires.push(pokemonChoisi);
    
    if (modeSimple) {
        botReply = `${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}.`;
        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ)
    }

    else if (messageReroll === null) {
        outils.envoyerMessage(client, `${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumero} qui est ||${pokemonNom}${suffixe}||.`, message, envoyerPM, idMJ)
        .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
            setTimeout(function() {
                if (pokemonChoisi["tags"].includes("Digimon")) {
                    msg.edit(`${message.author.toString()} va être isekai en le digimon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}. (https://digimon.fandom.com/wiki/${pokemonNomForme})`);
                }
                else if ( !(pokemonChoisi["tags"].includes("Spoiler"))) {
                    msg.edit(`${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}.`);
                }
                if (!(args.includes("starter+"))) {msg.react("🎲").then(() => msg.react("🖼️"))};
            }, timerSpoiler)
            const collector = msg.createReactionCollector({
                time: 40 * 1000
            });
            collector.on('collect', (reaction, user) => {
                if(user.id === message.author.id && reaction.emoji.name === "🎲") {
                    collector.resetTimer({time: 40 * 1000});
                    nombreReroll += 1;
                    timerSpoiler = timerSpoiler / 1.25 + 100;
                    let dernierPokemon = module.exports.isekai(client, message, args.concat(["timer", timerSpoiler]), envoyerPM, idMJ, msg, listePokemonsDejaTires);
                    if ( !(dernierPokemon.tags.includes("Digimon")) ) {
                        setTimeout(function() {
                            reaction.users.remove(user);
                        }, timerSpoiler);
                    }
                    else {
                        collector.resetTimer({time: timerSpoiler + 200});
                    }
                }
                else if (user.id === message.author.id && reaction.emoji.name === "🖼️") {
                    reaction.users.remove(user);

                    let dernierPokemon = listePokemonsDejaTires[listePokemonsDejaTires.length - 1];
                    let dernierPokemonNumero = outils.pad(dernierPokemon.numero, 3);
                    if (dernierPokemon.hasOwnProperty("numeroForme")) { dernierPokemonNumero += "-" + dernierPokemon.numeroForme.slice(dernierPokemon.numeroForme.length -1);}

                    let messageEdite = msg.content;
                    if (dernierPokemon.hasOwnProperty("image")) {
                        if (dernierPokemon.tags.includes("Spoiler")) {
                            messageEdite += ` ||<${dernierPokemon.image}>||`;
                        }
                        else {
                            messageEdite += ` <${dernierPokemon.image}>`;
                        }
                    }
                    else {
                        messageEdite += ` (https://www.serebii.net/pokedex-swsh/icon/${dernierPokemonNumero}.png <https://www.serebii.net/pokemon/art/${dernierPokemonNumero}.png>)`
                    }
                    msg.edit(messageEdite);
                }
            });
            collector.on('end', collected => {
                msg.reactions.removeAll();
            });
        })
    }
    else {
        let messageOriginel = messageReroll.content + "\r\n";
        messageReroll.edit(messageOriginel + `${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumero} qui est ||${pokemonNom}${suffixe}||.`)
        .then((msg)=> { 
            setTimeout(function() {
                if (pokemonChoisi["tags"].includes("Digimon")) {
                    msg.edit(messageOriginel + `${message.author.toString()} va être isekai en le digimon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}.  (https://digimon.fandom.com/wiki/${pokemonNomForme})`);
                }
                else {
                    msg.edit(messageOriginel + `${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}.`);
                }
                
            }, timerSpoiler)
        });
    }
    return pokemonChoisi;
},

    tiragePokemon : function(listeTagsDemandes, listePokemonsDejaTires = []) {

    let pokemonChoisi = null;
    let listePokemon = pokedex;
    let nombreReroll = listePokemonsDejaTires.length;

    if (listeTagsDemandes.length > 0) { // Si l'utilisateur mets un tag, on recherche les pokémons avec ses tags
        let tagsEnvoye = [];
        for (let i = 0; i < listeTagsDemandes.length; i++) {
            tagsEnvoye.push(outils.rattrapageFauteOrthographe(listeTags, listeTagsDemandes[i]));
        } 

        let nouvelleListe = [];
        for (let i = 0; i < pokedex.length; i++) { // On fait une boucle sur tout le pokédex
            let valide = true;
            for (let j = 0; j < tagsEnvoye.length ; j++) { // On fait une boucle sur la liste des tags
                if (!pokedex[i]["tags"].includes(tagsEnvoye[j])) {
                    valide = false; // Si le pokémon n'a pas l'un des tags, on ne l'incluera pas dans la liste
                }
            }
            if (listePokemonsDejaTires.includes(pokedex[i]) ) {valide = false;}
            if (valide) {nouvelleListe.push(pokedex[i]);}
        }

        if (nouvelleListe.length === 0) { // Si il n'y a pas de pokémon correspondant, on renvoit une erreur
            console.log(listeTagsDemandes);
            throw("Aucun pokémon avec ses tags");
        }
        
        listePokemon = nouvelleListe;
    }
    else {
        let nouvelleListe = [];
        let pokemonsARetirer = listePokemonsDejaTires.concat(historique);
        for (let i = 0; i < pokedex.length; i++) {
            if ( !(pokemonsARetirer.includes(pokedex[i]))) {
                nouvelleListe.push(pokedex[i]);
            }
        }

        listePokemon = nouvelleListe;
    }

    let nouveauPokemon;
    const tailleListe = listePokemon.length;
    while (pokemonChoisi === null) {
        nouveauPokemon = tailleListe === 1? listePokemon[0] : listePokemon[outils.randomNumber(tailleListe)-1];
        if ( (!("probabilite" in nouveauPokemon) || nouveauPokemon.probabilite > Math.random()) && // Le pokémon est pris s'il n'a pas de probabilité ou si il réussi le roll,
        !(nouveauPokemon.tags.includes("Légendaire") && Math.random() > 0.9 ** (nombreReroll ** 2) ) ) { // s'il est un légendaire un autre roll doit être fait en fonction du nombre de rerolls
            pokemonChoisi = nouveauPokemon;
        }    
        else {
            process.stdout.write(`\x1b[90m[${nouveauPokemon.hasOwnProperty("nomForme") ? nouveauPokemon.nomForme : nouveauPokemon.nom }]\x1b[0m`);
        }
    }

    if (listeTagsDemandes.length === 0 && Math.random() < 0.6) historique.push(pokemonChoisi);
    if (historique.length > 40) historique.shift();

    return pokemonChoisi;
    },

    setHistorique : function(nouvelHistorique) {
        historique = nouvelHistorique;
    },

    getHistorique : function() {
        return historique;
    }
}