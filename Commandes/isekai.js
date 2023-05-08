const outils = require("./outils.js");
const pokedex = require('../Données/pokedex.json');
const fs = require('fs');
let historique = {"collectif" : [], "dernierIsekai" : {}};
let listeIsekaisEnCours = [];

// Note : La liste des tags doit être mise à jour à chaque fois que j'en rajoute un.
let listeTags = ["Plante", "Poison", "DnG", "Base", "Starter", "Starter+", "Final", "Feu", "Vol", "Eau", "Insecte", "Normal", "Ténèbres",
"Forme", "Alola", "Electrique", "Psy", "Sol", "Glace", "Acier", "Femelle", "Mâle", "Fée", "PasDnG", "Galar", "Combat", "Roche", "Hisui", "Paldea", "Nouveau", "Spectre", "Dragon",
"Gen1", "Gen2", "Gen3", "Gen4", "Gen5", "Gen6", "Gen7", "Gen8", "Gen9", "Légendaire", "Non-pokemon", "Digimon", "Spoiler"]

module.exports = {
    isekai : function(message, args, envoyerPM, idMJ) {

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
            let estShiny = outils.randomNumber(outils.getConfig("isekai.tauxShinyEquipe")) == 1 ? " **shiny**" : ""
            if (!(pokemonChoisi.tags.includes("Légendaire")) || Math.random() < probabiliteLegendaire) {
                // Note : Les pokémons spoilers ne peuvent pas être roll dans une équipe à cause des balises retirées. Quand une génération est révélée, je préfère attendre qu'elle sorte avant d'être ajouté dans les équipes.
                if ( !(pokemonChoisi.tags.includes("Non-pokemon") || listeNomsDejaTires.includes(pokemonChoisi.nom) || pokemonChoisi.tags.includes("Spoiler") )) {
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
                    if (nombreProblemes > 20) throw("Il n'y a pas assez de pokémons.");
                }
            }
            else {
                process.stdout.write(`\x1b[90m[${pokemonChoisi.nom}]\x1b[0m`);
            }
        }
        outils.logLancer(message, pokemonsTires.join(", "), `isekai roll ${nombreLancers}`, envoyerPM);
        outils.envoyerMessage(botReply, message, envoyerPM, idMJ)
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
    if (args.length > 0 && args[0] === "dernier") {
        if (historique.dernierIsekai.hasOwnProperty(message.author.id)) {
            let isekaiEnCours = historique.dernierIsekai[message.author.id];
            let botReply = `${message.author.toString()}`;
            if (isekaiEnCours.timestamp > Date.now() - (24 * 4 * 3600 * 1000)) {
                botReply += ` s'est actuellement fait isekai en **${isekaiEnCours.pokémon}**.`;
                outils.envoyerMessage(botReply, message, envoyerPM, idMJ);
            }
            else {
                let date = new Date(isekaiEnCours.timestamp);
                botReply += ` est isekai en ${isekaiEnCours.pokémon} depuis le ${date.getDate()}/${outils.pad(date.getMonth()+1)}/${date.getFullYear()}.`;
                outils.envoyerMessage(botReply, message, envoyerPM, idMJ)
                .then((msg)=> {
                    msg.react("🎲");
                    const collector = msg.createReactionCollector({
                        time: 40 * 1000
                    });
                    collector.on('collect', (reaction, user) => {
                        if(user.id === message.author.id && reaction.emoji.name === "🎲") {
                            collector.resetTimer({time: 1});
                            module.exports.isekai(message, [], envoyerPM, idMJ);
                        }
                    });
                    collector.on('end', collected => {
                        msg.reactions.removeAll();
                    });
                })
                // fin
            }
            return;
        }
        else {
            args.shift();
        }
    }
    if (args.length > 0 && args[0] === "liste") {
            let botReply = "";
            //historique.dernierIsekai.forEach(utilisateur => {
            for (let [id, isekaiEnCours] of Object.entries(historique.dernierIsekai)) {
                if (isekaiEnCours.timestamp > Date.now() - (24 * 14 * 3600 * 1000)) {
                    botReply += `**${isekaiEnCours.nom}** s'est actuellement fait isekai en **${isekaiEnCours.pokémon}**.\r\n`;
                }
            }
            outils.envoyerMessage(botReply, message, envoyerPM, idMJ);
            return;
    }

    let isekaiEnCours;
    if (!(listeIsekaisEnCours.hasOwnProperty(message.id))) {
        isekaiEnCours = {
            messageEnvoyé : null,
            contenuMessage : "",
            listePokemonsDejaTires : []
        };
        listeIsekaisEnCours[message.id] = isekaiEnCours;
    }
    else {
        isekaiEnCours = listeIsekaisEnCours[message.id]
    }
    let nombreReroll = isekaiEnCours.listePokemonsDejaTires.length;
    let timerSpoiler = 4000; 
    [timerSpoiler, args] = outils.rechercheDoubleParametre(args, "timer", timerSpoiler);
    outils.verifierNaN([timerSpoiler]);

    let modeSimple = false;
    if (args[0] === "simple") {
        modeSimple = true;
        args.shift();
    }

    let tauxDeNouveau = outils.getConfig("isekai.tauxNouveau");
    let rollNouveau = outils.randomNumber(100);
    let pokemonChoisi;

    if (args.length === 0 && rollNouveau <= tauxDeNouveau) {
        pokemonChoisi = module.exports.tiragePokemon(["Nouveau"], isekaiEnCours.listePokemonsDejaTires, message.author.id);
    }
    else if ( (args.length === 0 && outils.randomNumber(100) <= nombreReroll - outils.getConfig("isekai.rollsAvantApparitionsDigimon")) || nombreReroll > outils.getConfig("isekai.rollsMaximum") )  {
        pokemonChoisi = module.exports.tiragePokemon(["Digimon"], isekaiEnCours.listePokemonsDejaTires, message.author.id);
    }
    else {
        pokemonChoisi = module.exports.tiragePokemon(args, isekaiEnCours.listePokemonsDejaTires, message.author.id);
    }

    let estShiny = outils.randomNumber(outils.getConfig("isekai.tauxShiny") * 1.5 ** nombreReroll) === 1;
    isekaiEnCours.listePokemonsDejaTires.push(pokemonChoisi);

    if (args.length === 0) {
        let nomPokémonHistorique = pokemonChoisi.hasOwnProperty("nomForme") ? pokemonChoisi.nomForme : pokemonChoisi.nom;
        if (estShiny) nomPokémonHistorique += " shiny";
        historique.dernierIsekai[message.author.id] = {
            "nom" : message.author.username,
            "pokémon" : nomPokémonHistorique,
            "timestamp" : message.createdTimestamp
        }
    }
    
    if (modeSimple) {
        botReply = module.exports.genererPhraseReponse(message, pokemonChoisi, false, estShiny);
        outils.envoyerMessage(botReply, message, envoyerPM, idMJ);
        delete listeIsekaisEnCours[message.id];
    }

    else if (isekaiEnCours.messageEnvoyé === null) {
        isekaiEnCours.contenuMessage = module.exports.genererPhraseReponse(message, pokemonChoisi, true, estShiny);
        outils.envoyerMessage(isekaiEnCours.contenuMessage, message, envoyerPM, idMJ)
        .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
            isekaiEnCours.messageEnvoyé = msg;
            isekaiEnCours.contenuMessage = module.exports.genererPhraseReponse(message, pokemonChoisi, false, estShiny);
            setTimeout(function() {
                msg.edit(isekaiEnCours.contenuMessage);
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
                    let dernierPokemon = module.exports.isekai(message, args.concat(["timer", timerSpoiler]), envoyerPM, idMJ);
                    if ( !(dernierPokemon.tags.includes("Digimon")) ) {
                        outils.retirerReaction(message, reaction, user, timerSpoiler);
                    }
                    else {
                        collector.resetTimer({time: 400});
                    }
                }
                else if (user.id === message.author.id && reaction.emoji.name === "🖼️") {
                    outils.retirerReaction(message, reaction, user);

                    let dernierPokemon = isekaiEnCours.listePokemonsDejaTires.slice(-1)[0];
                    let dernierPokemonNumero =  parseInt(dernierPokemon.numero) < 1000 ? outils.pad(dernierPokemon.numero, 3) : dernierPokemon.numero;
                    if (dernierPokemon.hasOwnProperty("numeroForme")) { dernierPokemonNumero += "-" + dernierPokemon.numeroForme.slice(dernierPokemon.numeroForme.length -1);}

                    if (dernierPokemon.hasOwnProperty("image")) {
                        if (dernierPokemon.tags.includes("Spoiler")) {
                            isekaiEnCours.contenuMessage += ` ||<${dernierPokemon.image}>||`;
                        }
                        else {
                            isekaiEnCours.contenuMessage += ` <${dernierPokemon.image}>`;
                        }
                    }
                    else {
                        if (dernierPokemon.tags.includes("Spoiler")) {
                            isekaiEnCours.contenuMessage += ` (|| https://www.serebii.net/pokedex-sv/icon/${dernierPokemonNumero}.png || <https://www.serebii.net/pokemon/art/${dernierPokemonNumero}.png>)`;
                        }
                        else {
                            isekaiEnCours.contenuMessage += ` (https://www.serebii.net/pokedex-sv/icon/${dernierPokemonNumero}.png <https://www.serebii.net/pokemon/art/${dernierPokemonNumero}.png>)`;
                        }
                    }
                    if (!(msg.content.includes("|| "))){
                        msg.edit(isekaiEnCours.contenuMessage);
                    }
                }
            });
            collector.on('end', collected => {
                delete listeIsekaisEnCours[message.id];
                msg.reactions.removeAll();
            });
        })
    }
    else {
        let messageTemporaire = `${isekaiEnCours.contenuMessage}\r\n${module.exports.genererPhraseReponse(message, pokemonChoisi, true, estShiny)}`
        isekaiEnCours.contenuMessage += `\r\n${module.exports.genererPhraseReponse(message, pokemonChoisi, false, estShiny)}`;
        isekaiEnCours.messageEnvoyé.edit(messageTemporaire)
        .then((msg)=> { 
            setTimeout(function() {
                msg.edit(isekaiEnCours.contenuMessage);
            }, timerSpoiler)
        });
    }
    return pokemonChoisi;
},

    tiragePokemon : function(listeTagsDemandes, listePokemonsDejaTires = [], idAuteur = "0") {

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
            throw("Aucun pokémon trouvé avec ses tags.");
        }
        
        listePokemon = nouvelleListe;
    }
    else {
        let nouvelleListe = [];
        let pokemonsARetirer = listePokemonsDejaTires.concat(historique.collectif);
        if (historique.hasOwnProperty(idAuteur)) pokemonsARetirer = pokemonsARetirer.concat(historique[idAuteur]);
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
    }

    if (listeTagsDemandes.length === 0 && Math.random() < 0.6) historique.collectif.push(pokemonChoisi);
    if (historique.collectif.length > 40) historique.collectif.shift();
    if (idAuteur !== "0") {
        if (!(historique.hasOwnProperty(idAuteur))) historique[idAuteur] = [];
        historique[idAuteur].push(pokemonChoisi);
        if (historique[idAuteur].length > 25) historique[idAuteur].shift();
    }

    return pokemonChoisi;
    },
    
    genererPhraseReponse :function(message, pokémon, estMasqué, estShiny) {
        let intro = `${message.author.toString()} va être isekai en le`;
        let type = estMasqué || !(pokémon.tags.includes("Digimon")) ? "pokémon" : "digimon";
        let [numéro, espèce] = estMasqué || !(pokémon.hasOwnProperty("nomForme") || pokémon.tags.includes("Digimon")) ? [pokémon.numero, pokémon.nom] : [pokémon.numeroForme, pokémon.nomForme];
        let masque = estMasqué || pokémon.tags.includes("Spoiler") ? "||" : "";
        let lienDigimon = estMasqué || !(pokémon.tags.includes("Digimon")) ? "" : ` (https://digimon.fandom.com/wiki/${pokémon.nomForme})`
        let suffixe;
        if (estMasqué){
            suffixe = estShiny? "✨": "";
            if (pokémon.hasOwnProperty("nomForme")) {
                suffixe += pokémon.tags.includes("Alola") ? "🏝️" : "";
                suffixe += pokémon.tags.includes("Galar") ? "🍵" : "";
                suffixe += pokémon.tags.includes("Hisui") ? "🍙" : "";
                suffixe += pokémon.tags.includes("Paldea") ? "💃" : "";
                suffixe += pokémon.tags.includes("Digimon") ? "🖥️" : "";
            }
        }
        else {
            suffixe = estShiny? " **shiny**" : "";
            let nombreReroll = listeIsekaisEnCours[message.id].listePokemonsDejaTires.length;
            outils.logLancer(message, `${espèce}${estShiny ? "shiny" : ""}`, `${message.content.slice(1,900)}${nombreReroll > 1 ? ` *reroll n°${nombreReroll-1}*` : ""}`, false);
        }
        return `${intro} ${type} numéro ${numéro} qui est ${masque}${espèce}${suffixe}${masque}.${lienDigimon}`;
    },

    setHistorique : function(nouvelHistorique) {
        historique = nouvelHistorique;
    },

    getHistorique : function() {
        return historique;
    },

    initialiserHistorique : function() {
        if (global.serveurProd) {
            fichier = "./Données/tempIsekai.json"
            fs.access(fichier, fs.constants.F_OK, (manque) => {
                if (!manque) {
                    let pokedexComplet = {};
                    for (let i = 0; i < pokedex.length; i++) {
                        if (pokedex[i].hasOwnProperty("numeroForme")) {
                            pokedexComplet[pokedex[i].numeroForme] = pokedex[i]
                        }
                        else {
                            pokedexComplet[pokedex[i].numero] = pokedex[i]
                        }
                    }

                    let jsonIsekai = JSON.parse(fs.readFileSync('./Données/tempIsekai.json', 'utf-8'));
                    let historiqueIsekai = {};
                    historiqueIsekai["dernierIsekai"] = jsonIsekai["dernierIsekai"];
                    delete jsonIsekai["dernierIsekai"];

                    for (let [utilisateur, historiquePerso] of Object.entries(jsonIsekai)) {
                        nouvelHistorique = []
                        for (let i = 0; i < historiquePerso.length; i++) {
                            if (historiquePerso[i].hasOwnProperty("numeroForme")) {
                                nouvelHistorique.push(pokedexComplet[historiquePerso[i].numeroForme]);
                            }
                            else {
                                nouvelHistorique.push(pokedexComplet[historiquePerso[i].numero]);
                            }
                        }
                        historiqueIsekai[utilisateur] = nouvelHistorique;
                    }

                    module.exports.setHistorique(historiqueIsekai);
                    fs.unlink('./Données/tempIsekai.json', (err) => {
                        if (err) throw err;
                        console.log("L'historique a bien été archivé et le fichier supprimé.");
                    });
                }
            });
        }
    }
}

module.exports.initialiserHistorique();