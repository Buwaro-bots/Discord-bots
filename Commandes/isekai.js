const outils = require("./outils.js");
const pokedex = require('../Données/pokedex.json');
const disable = require('../Données/disable-isekai.json');
const fs = require('fs');

// Note : La liste des tags doit être mise à jour à chaque fois que j'en rajoute un.
let listeTags = ["Plante", "Poison", "DnG", "Base", "Starter", "Final", "Feu", "Vol", "Eau", "Insecte", "Normal", "Ténèbres",
"Forme", "Alola", "Electrique", "Psy", "Sol", "Glace", "Acier", "Femelle", "Mâle", "Fée", "PasDnG", "Galar", "Combat", "Roche", "Hisui", "Nouveau", "Spectre", "Dragon",
"Gen1", "Gen2", "Gen3", "Gen4", "Gen5", "Gen6", "Gen7", "Gen8", "Gen9", "Non-pokemon", "Digimon"]

exports.isekai = function(client, message, args, envoyerPM, idMJ, messageReroll = null) {

    if (args[0] === "disable") {
        if (!disable.hasOwnProperty(message.author.id)) {
            disable[message.author.id] = {"pokemons" : [], "tags" : []}; 
        }
        if (args[1] === "tags") {
            for(let i = 2; i < args.length; i++) {
                tagADisable = outils.rattrapageFauteOrthographe(listeTags, args[i]);
                disable[message.author.id].tags.push(tagADisable);
            }
        }
        else {
            let listePokemon = [];
            for (let i = 0; i < pokedex.length; i++) {
                listePokemon.push(pokedex[i].nom);
            }
            for(let i = 1; i < args.length; i++) {
                pokemonADisable = outils.rattrapageFauteOrthographe(listePokemon, args[i]);
                if (disable[message.author.id].pokemons.length < 150) {
                    disable[message.author.id].pokemons.push(pokemonADisable);
                }
                else {
                    outils.envoyerMessage(client, botReply, "Vous avez déjà atteint la limite de pokemons à désactiver. Vous pouvez désactiver uniquement 150 pokemons à la fois.");
                    break;
                }
            }
        }

        let botReply = `${message.author.toString()} Liste des pokémons disabled : `
        for (let i = 0; i < disable[message.author.id].pokemons.length; i++) {
            botReply += `${disable[message.author.id].pokemons[i]}, `;
        }

        botReply += "\nListe des tags disabled : ";
       for (let i = 0; i < disable[message.author.id].tags.length; i++) {
            botReply += `${disable[message.author.id].tags[i]}, `;
        }

        let writer = JSON.stringify(disable, null, 4); // On sauvegarde le fichier.
        fs.writeFileSync('./Données/disable-isekai.json', writer);

        outils.envoyerMessage(client, botReply, message);
        return;
    }
    /* En % le taux de forcer un nouveau pokémon, je conseille de mettre entre 1 et 5. 
    (pour Hisui, 3 jusqu'au 1er Mai, 2 jusqu'au 1er Juillet, puis 1 jusqu'à la 9G, puis retirer les tags nouveau sur les Hisui.) */
    let tauxDeNouveau = 2;
    let rollNouveau = outils.randomNumber(100);

    if (args.length === 0 && rollNouveau <= tauxDeNouveau) {
        args = ["Nouveau"];
    }

    let pokemonChoisi = this.tiragePokemon(args, message.author.id);
    let rollShiny = outils.randomNumber(128);
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
    outils.logLancer(message.author.username, `${pokemonNomForme}${estShiny}`, `isekai ${args.join(" ")}`);

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
            }, 4500)
            const collector = msg.createReactionCollector({
                time: 1 * 60 * 1000
            });
            collector.on('collect', (reaction, user) => {
                if(user.id === message.author.id && reaction.emoji.name === "🎲") {
                    reaction.users.remove(user);
                    module.exports.isekai(client, message, args, envoyerPM, idMJ, msg);
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
                
            }, 4500)
        });
    }
    return;
};

exports.tiragePokemon = function(listeTagsDemandes, idUtilisateur = null) {

    let pokemonChoisi = null;
    let listePokemon = pokedex;

    if (listeTagsDemandes.length > 0) { // Si l'utilisateur mets un tag, on recherche les pokémons avec ses tags
        let tagsEnvoye = [];
        for (let i = 0; i < listeTagsDemandes.length; i++) {
            tagsEnvoye.push(outils.rattrapageFauteOrthographe(listeTags, listeTagsDemandes[i]));
        } 

        // Etablissement de la disable list
        let disablePokemons = [];
        let disableTags = [];

        if (idUtilisateur != null && disable.hasOwnProperty(idUtilisateur)) {
            disablePokemons = disable[idUtilisateur].pokemons;
            disableTags = disable[idUtilisateur].tags;
        }

        let nouvelleListe = [];
        for (let i = 0; i < pokedex.length; i++) { // On fait une boucle sur tout le pokédex
            if (!disablePokemons.includes(pokedex[i]["nom"])) { // Si le pokémon n'est pas disabled
                let valide = true;
                for (let j = 0; j < tagsEnvoye.length ; j++) { // On fait une deuxième boucle sur la liste des tags
                    if (!pokedex[i]["tags"].includes(tagsEnvoye[j])) {
                        valide = false; // Si le pokémon n'a pas l'un des tags, on ne l'incluera pas dans la liste
                    }
                }
                for (let j = 0; j < disableTags.length ; j++) { // On fait une troisième boucle sur la liste des tags disabled
                    if (pokedex[i]["tags"].includes(disableTags[j])) {
                        valide = false; // Si le pokémon a l'un des tags, on ne l'incluera pas dans la liste
                    }
                }

                if (valide) {
                    nouvelleListe.push(pokedex[i]);
                }
            }
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
        if (!("probabilite" in nouveauPokemon) || nouveauPokemon.probabilite > Math.random()) {
            pokemonChoisi = nouveauPokemon;
        }    
        else {
            process.stdout.write(`[${nouveauPokemon.hasOwnProperty("nomForme") ? nouveauPokemon.nomForme : nouveauPokemon.nom }]`);
        }
    }

    return pokemonChoisi;
};