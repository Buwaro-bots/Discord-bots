const outils = require("./outils.js");
const pokedex = require('../Données/pokedex.json');
const disable = require('../Données/disable-isekai.json');
const fs = require('fs');

// Note : La liste des tags doit être mise à jour à chaque fois que j'en rajoute un.
let listeTags = ["Plante", "Poison", "DnG", "Base", "Starter", "Final", "Feu", "Vol", "Eau", "Insecte", "Normal", "Ténèbres",
"Forme", "Alola", "Electrique", "Psy", "Sol", "Glace", "Acier", "Femelle", "Mâle", "Fée", "PasDnG", "Galar", "Combat", "Roche", "Hisui", "Nouveau", "Spectre", "Dragon",
"Gen1", "Gen2", "Gen3", "Gen4", "Gen5", "Gen6", "Gen7", "Gen8", "Gen9", "Légendaire", "Non-pokemon", "Digimon"]

exports.isekai = function(client, message, args, envoyerPM, idMJ, messageReroll = null, nombreReroll = 0) {

    let timerSpoiler = 4000 - 800 * Math.sqrt(nombreReroll);

    /* En % le taux de forcer un nouveau pokémon, je conseille de mettre entre 1 et 5. 
    (pour Hisui, 3 jusqu'au 1er Mai, 2 jusqu'au 1er Juillet, puis 1 jusqu'à la 9G, puis retirer les tags nouveau sur les Hisui.) */
    let tauxDeNouveau = 2;
    let rollNouveau = outils.randomNumber(100);

    if (args.length === 0 && rollNouveau <= tauxDeNouveau) {
        args = ["Nouveau"];
    }

    let pokemonChoisi = this.tiragePokemon(args, nombreReroll);
    let rollShiny = outils.randomNumber(100 * 1.5 ** nombreReroll);
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
    process.stdout.write(`${pokemonNomForme}${estShiny} [${rollNouveau}][${rollShiny}] => `);
    outils.logLancer(message.author.username, `${pokemonNomForme}${estShiny}`, `isekai${args.length > 0 ? " " + args.join(" ") : ""}${nombreReroll > 0 ? " *reroll n°" + nombreReroll + "*" : ""}`, envoyerPM);

    if (messageReroll === null) {
        outils.envoyerMessage(client, `${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumero} qui est ||${pokemonNom}${suffixe}||.`, message, envoyerPM, idMJ)
        .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
            setTimeout(function() {
                if (pokemonChoisi["tags"].includes("Digimon")) {
                    msg.edit(`${message.author.toString()} va être isekai en le digimon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}.`);
                }
                else {
                    msg.edit(`${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}.`);

                }

                msg.react("🎲");
            }, timerSpoiler)
            const collector = msg.createReactionCollector({
                time: 40 * 1000
            });
            collector.on('collect', (reaction, user) => {
                if(user.id === message.author.id && reaction.emoji.name === "🎲") {
                    collector.resetTimer({time: 40 * 1000});
                    nombreReroll += 1;
                    module.exports.isekai(client, message, args, envoyerPM, idMJ, msg, nombreReroll);
                    setTimeout(function() {
                        reaction.users.remove(user);
                    }, 4200 - 800 * Math.sqrt(nombreReroll));
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
                    msg.edit(messageOriginel + `${message.author.toString()} va être isekai en le digimon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}.`);
                }
                else {
                    msg.edit(messageOriginel + `${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}.`);
                }
                
            }, timerSpoiler)
        });
    }
    return;
};

exports.tiragePokemon = function(listeTagsDemandes, nombreReroll) {

    let pokemonChoisi = null;
    let listePokemon = pokedex;

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
            if (valide) {nouvelleListe.push(pokedex[i]);}
        }

        if (nouvelleListe.length === 0) { // Si il n'y a pas de pokémon correspondant, on renvoit une erreur
            console.log(listeTagsDemandes);
            throw("Aucun pokémon avec ses tags");
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
            process.stdout.write(`[${nouveauPokemon.hasOwnProperty("nomForme") ? nouveauPokemon.nomForme : nouveauPokemon.nom }]`);
        }
    }

    return pokemonChoisi;
};