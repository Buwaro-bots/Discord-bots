const tarot = require('./tarot.json');

if (message.content.startsWith("$") && message.guild.id === "846473259478024242") {
    outils.envoyerMessage(client, "Je ne suis pas mudae. <:monkaS:411272701022568458>", message, envoyerPM);
    return;
}

else if(command === "tarot" ){
    if (args[0] === "mélanger") { // Pour mélanger le tarot on dit que chaque carte n'a pas été piochée.
        for (let i = 0; i < tarot.length; i++){
            tarot[i]["piochee"] = false;
        }
        message.channel.send("Le tarot a été remélangée.");
    }
    else {
        let carte = "";
        while (carte === ""){ // On initialise carte, tant que la carte est vide...
            numeroCarte = randomNumber(tarot.length).toString();    // On tire un numéro au hasard...
            for (let i = 0; i < tarot.length; i++){ // On recherche la carte correspondante...
                if (tarot[i]["piochee"] === false && tarot[i]["numero"] === numeroCarte){ // Et si la carte n'a pas été tirée on attribue la carte à la variable carte et on sort de la boucle.
                    carte = tarot[i];
                    tarot[i]["piochee"] = true;
                    break;
                }
            }
        }
        
        nombreCartesRestantes = 0; // On calcule le nombre de cartes restantes
        for (let i = 0; i < tarot.length; i++){
            if (tarot[i]["piochee"] === false){
                nombreCartesRestantes += 1;
            }
        }
                
        message.channel.send(`${message.author.toString()} a pioché la carte ${carte["numero"]}, le ${carte["nom"]}.\nIl reste ${nombreCartesRestantes} cartes.`);
    }
    let writer = JSON.stringify(tarot, null, 4); // On sauvegarde le fichier.
    fs.writeFileSync('./tarot.json', writer);
}