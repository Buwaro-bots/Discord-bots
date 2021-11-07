const outils = require("./outils.js");
const pokedex = require('../Données/pokedex.json');

exports.isekai = function(client, message, args, command){
    let pokemonChoisi = null;
    let listePokemon = pokedex;
    if (args.length > 0){ // Si l'utilisateur mets un tag, on recherche les pokémons avec ses tags

        let listeSubstitues = {"Electrik": "Electrique", "Électrik": "Electrique", "Électrique": "Electrique", "Fee": "Fée", "Insect" : "Insecte", "Derg" : "Dragon", "Dng" : "DnG", "Pasdng" : "PasDnG"}
        for (let i = 0; i < args.length; i++){
            args[i] = args[i].charAt(0).toUpperCase() + args[i].slice(1); // On met la première lettre en majuscule
            args[i] = args[i] in listeSubstitues ? listeSubstitues[args[i]] : args[i] // On corrige les fautes courantes
        }

        let nouvelleListe = [];
        for (let i = 0; i < pokedex.length; i++){ // On fait une boucle sur tout le pokédex
            let valide = true;
            for (let j = 0; j < args.length ; j++){ // Puis une deuxième sur la liste des tags
                if(!pokedex[i]["tags"].includes(args[j])){
                    valide = false; // Si le pokémon n'a pas l'un des tags, on ne l'incluera pas dans la liste
                }
            }
            if (valide){
                nouvelleListe.push(pokedex[i]);
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
        if (!("probabilite" in nouveauPokemon) || nouveauPokemon.probabilite > Math.random()){
            pokemonChoisi = nouveauPokemon;
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
        if (pokemonChoisi.tags.includes("Forme")){
            pokemonNumeroForme = pokemonChoisi.numeroForme;
            pokemonNomForme = pokemonChoisi.nomForme;
        }
        console.log(`${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny} [${rollShiny}].`); // Console.log pour pas faire bugger le then
        message.channel.send(`${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumero} qui est ||${pokemonNom}||.`)
        .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
            setTimeout(function(){
                msg.edit(`${message.author.toString()} va être isekai en le pokémon numéro ${pokemonNumeroForme} qui est ${pokemonNomForme}${estShiny}.`);
            }, 4000)
        });
    }

    return;
}

