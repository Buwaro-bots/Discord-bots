const outils = require("./outils.js");
const pokedex = require('../Données/pokedex.json');
const disable = require('../Données/disable-isekai.json');
const fs = require('fs');

exports.isekai = function(client, message, args, command){
    if (args[0] == "disable") {
        if(!disable.hasOwnProperty(message.author.id)){
            disable[message.author.id] = {"pokemons" : [], "tags" : []}; 
        }
        if (args[1] == "tags") {
            for(let i = 2; i < args.length; i++){
                disable[message.author.id].tags.push(args[i]);
            }
        }
        else {
            for(let i = 1; i < args.length; i++){
                disable[message.author.id].pokemons.push(args[i]);
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
    
    
    let pokemonChoisi = null;
    let listePokemon = pokedex;

    /* En % le taux de forcer un nouveau pokémon, je conseille de mettre entre 1 et 5. 
    (pour Hisui, 3 jusqu'au 1er Mai, 2 jusqu'au 1er Juillet, puis 1 jusqu'à la 9G, puis retirer les tags nouveau sur les Hisui.) */
    let tauxDeNouveau = 3; 
    let rollNouveau = outils.randomNumber(100);

    if (args.length == 0 && rollNouveau <= tauxDeNouveau) {
        args = ["Nouveau"];
    }
    if (args.length > 0){ // Si l'utilisateur mets un tag, on recherche les pokémons avec ses tags

        let listeSubstitues = {"Electrik": "Electrique", "Électrik": "Electrique", "Électrique": "Electrique", "Fee": "Fée", "Insect" : "Insecte", "Derg" : "Dragon", "Dng" : "DnG", "Pasdng" : "PasDnG"}
        for (let i = 0; i < args.length; i++){
            args[i] = args[i].charAt(0).toUpperCase() + args[i].slice(1); // On met la première lettre en majuscule
            args[i] = args[i] in listeSubstitues ? listeSubstitues[args[i]] : args[i] // On corrige les fautes courantes
        }

        // Etablissement de la disable list
        let disablePokemons = [];
        let disableTags = [];

        if (disable.hasOwnProperty(message.author.id) && command === "isekai") { // La disable list ne marche que sur la commande isekai
            disablePokemons = disable[message.author.id].pokemons;
            disableTags = disable[message.author.id].tags;
        }

        let nouvelleListe = [];
        for (let i = 0; i < pokedex.length; i++){ // On fait une boucle sur tout le pokédex
            if(!disablePokemons.includes(pokedex[i]["nom"])) { // Si le pokémon n'est pas disabled
                let valide = true;
                for (let j = 0; j < args.length ; j++){ // On fait une deuxième boucle sur la liste des tags
                    if(!pokedex[i]["tags"].includes(args[j])){
                        valide = false; // Si le pokémon n'a pas l'un des tags, on ne l'incluera pas dans la liste
                    }
                }
                for (let j = 0; j < disableTags.length ; j++){ // On fait une troisième boucle sur la liste des tags disabled
                    if(pokedex[i]["tags"].includes(disableTags[j])){
                        valide = false; // Si le pokémon a l'un des tags, on ne l'incluera pas dans la liste
                    }
                }

                if (valide){
                    nouvelleListe.push(pokedex[i]);
                }
            }
        }

        if (nouvelleListe.length == 0){ // Si il n'y a pas de pokémon correspondant, on renvoit une erreur
            throw("Aucun pokémon avec ses tags");
        }
        
        listePokemon = nouvelleListe;
    }

    let nouveauPokemon;
    const tailleListe = listePokemon.length;
    while (pokemonChoisi === null){
        nouveauPokemon = listePokemon[outils.randomNumber(tailleListe)-1];
        if (!("probabilite" in nouveauPokemon) || nouveauPokemon.probabilite > Math.random()) {
            pokemonChoisi = nouveauPokemon;
        }    
        else {
            process.stdout.write(`[${nouveauPokemon.hasOwnProperty("nomForme") ? nouveauPokemon.nomForme : nouveauPokemon.nom }]`);
        }
    }

    if (command === "pokemon") {
        console.log(`${message.author.toString()} a tiré le pokémon numéro ${pokemonChoisi.numero} qui est ${pokemonChoisi.nom}.`); // Console.log pour pas faire bugger le then
        message.channel.send(`${message.author.toString()} a tiré le pokémon numéro  ${pokemonChoisi.numero} qui est ||${pokemonChoisi.nom}||.`)
        .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
            setTimeout(function(){
                msg.edit(`${message.author.toString()} a tiré le pokémon numéro ${pokemonChoisi.numero} qui est ${pokemonChoisi.nom}.`);
            }, 5000)
        }); 
    }
    else if (command === "isekai") {
        let rollShiny = outils.randomNumber(128);
        let estShiny = "";

        if (rollShiny === 1){
            estShiny = " **shiny**"
        }

        let pokemonNumero = pokemonChoisi.numero; let pokemonNumeroForme = pokemonNumero;
        let pokemonNom = pokemonChoisi.nom; let pokemonNomForme = pokemonNom;
        if (pokemonChoisi.hasOwnProperty("nomForme")){
            pokemonNumeroForme = pokemonChoisi.numeroForme;
            pokemonNomForme = pokemonChoisi.nomForme;
        }
        console.log(`${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny} [${rollNouveau}][${rollShiny}].`); // Console.log pour pas faire bugger le then
        message.channel.send(`${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumero} qui est ||${pokemonNom}||.`)
        .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
            setTimeout(function(){
                msg.edit(`${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}.`);
            }, 4000)
        });
    }

    return;
}

