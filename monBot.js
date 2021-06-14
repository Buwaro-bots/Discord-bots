const config = require('./config.json');
const pokedex = require('./pokedex.json');
const INSdata = require('./ins.json');
const tarot = require('./tarot.json');

const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');


function randomNumber(maximum){
    // Cette fonction sert à tirer un nombre au pif de 1 à x, j'en ai beaucoup besoin.
    return Math.floor(Math.random() * maximum) + 1;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}     

let prefix = ";"; // Set the prefix
console.log("Ready!");
client.on("message", (message) => {
    /*console.log(message);*/
    if (message.content.startsWith("$") && message.guild.id === "846473259478024242") {
        message.channel.send("Je ne suis pas mudae. <:monkaS:411272701022568458>");
        return;
    }

    if (!message.content.startsWith(prefix) || message.author.bot) return;     // Exit and stop if the prefix is not there or if user is a bot
 

    const commandBody = message.content.slice(prefix.length);     // Cette partie sert à séparer la commande des arguments.
    const args = commandBody.split(/ +/); // Regular expression pour empêcher les double espaces de faire planter.
    const command = args.shift().toLowerCase();

    if(command === "pokemon" || command === "isekai") {
        let number = randomNumber(898); 
        if (command === "pokemon") {
            message.channel.send(`${message.author.toString()} a tiré le pokémon numéro ${number} qui est ||${pokedex[number].nom}||.`)
            .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
                setTimeout(function(){
                    msg.edit(`${message.author.toString()} a tiré le pokémon numéro ${number} qui est ${pokedex[number].nom}.`);
                }, 5000)
            }); 
        }
        else if (command === "isekai") {
            message.channel.send(`${message.author.toString()} va être isekai en le pokémon numéro ${number} qui est ||${pokedex[number].nom}||.`)
            .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
                setTimeout(function(){
                    msg.edit(`${message.author.toString()} va être isekai en le pokémon numéro ${number} qui est ${pokedex[number].nom}.`);
                }, 5000)
            });
        }
    }

    else if(command === "dng"){
        let est_PC = false;
        let stat = 0;


        // Echelon Dé de puissance (Réussite de base de 10 ou 14 en fonction de si thème primaire ou secondaire)
        // 1 2d4
        // 2 1d4+1d6
        // 3 2d6
        // 5 1d6+1d8
        // 7 2d8
        // 10 1d8+1d10
        // 13 2d10
        // 16 1d10+1d12
        // 20 2d12
    }
    else if(command === "ins") {
        let dices = [randomNumber(6), randomNumber(6), randomNumber(6)];
        let lancerSpecial = false;

        if (args[0] === "cheat" && args.length >= 4) {
            dices = [parseInt(args[1]), parseInt(args[2]), parseInt(args[3])];
        }
        let dicesSum = dices[0]*100 + dices[1]*10 + dices[2]; // Nécéssaire parce qu'on ne peut pas comparer des tableaux directement.
        
        let botReply = `${message.author.toString()} a lancé [${dices[0]}${dices[1]}] + [${dices[2]}].`;


        if (dicesSum in INSdata.lancersSpeciaux){
            if (message.author.id in INSdata.lancersSpeciaux[dicesSum]){
                botReply += INSdata.lancersSpeciaux[dicesSum][message.author.id];
                lancerSpecial = true; // Si le lancer est "spécial", c'est à dire qu'il a un message perso, on n'a pas besoin de préciser si c'est une réussite ou pas.
            }
            else if("autre" in INSdata.lancersSpeciaux[dicesSum]){
                botReply += INSdata.lancersSpeciaux[dicesSum]["autre"];
            }
        }
        
        if (args[0] === "stats" || args[0] === "verif" && lancerSpecial == false) { // Stats dit à partir de quelle stat le jet réussi, Verif dit si un jet est réussi en fonction de la stat
            let minimumStat = -2 ;
            let nomMinimumStat = "" ;
            let maximumRoll = 110;
            let i = 0;
            while (dicesSum > maximumRoll) {
                maximumRoll = INSdata.tum[i]["lancer"];
                i += 1;
            }
            i -= 1; // Je fais ça en attendant d'avoir une solution

            if ((args[0] === "stats" && args.length >= 2) || (args[0] === "verif" && args.length >= 3)) { // On regarde si on demande une modifications du nombre de jets de colonnes.
                let rowBonus = 0;
                if (args[0] === "stats") {
                    rowBonus = -parseInt(args[1]);
                }
                else {
                    rowBonus = -parseInt(args[2]);
                }
                i += rowBonus
                i = Math.max(Math.min(i, INSdata.tum.length -1), 0); // On vérifie qu'après les modifs de colonnes, qu'on ne sorte pas du tableau.
            }
            minimumStat = INSdata.tum[i]["stat"];
            nomMinimumStat = INSdata.tum[i]["nomStat"];

            if(args[0] === "stats") { // Si la commande est stat, on rajoute dans le message à quel stat le jet réussi. Sinon la commande est vérif, on cherche la stat demandée et on la compare avec la stat minimum pour réussir
                if (minimumStat <= 0 ) {
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

        
        message.channel.send(botReply);
    }

    else if(command === "tarot" ){
        // if (args[0] === "mélanger") { // Pour mélanger le tarot on dit que chaque carte n'a pas été piochée.
        //     for (let i = 0; i < tarot.length; i++){
        //         tarot[i]["piochee"] = false;
        //     }
        //     message.channel.send("Le tarot a été remélangée.");
        // }
        // else {
        //     let carte = "";
        //     while (carte === ""){ // On initialise carte, tant que la carte est vide...
        //         numeroCarte = randomNumber(tarot.length).toString();    // On tire un numéro au hasard...
        //         for (let i = 0; i < tarot.length; i++){ // On recherche la carte correspondante...
        //             if (tarot[i]["piochee"] === false && tarot[i]["numero"] === numeroCarte){ // Et si la carte n'a pas été tirée on attribue la carte à la variable carte et on sort de la boucle.
        //                 carte = tarot[i];
        //                 tarot[i]["piochee"] = true;
        //                 break;
        //             }
        //         }
        //     }
            
        //     nombreCartesRestantes = 0; // On calcule le nombre de cartes restantes
        //     for (let i = 0; i < tarot.length; i++){
        //         if (tarot[i]["piochee"] === false){
        //             nombreCartesRestantes += 1;
        //         }
        //     }
                    
        //     message.channel.send(`${message.author.toString()} a pioché la carte ${carte["numero"]}, le ${carte["nom"]}.\nIl reste ${nombreCartesRestantes} cartes.`);
        // }
        // let writer = JSON.stringify(tarot); // On sauvegarde le fichier.
        // fs.writeFileSync('./tarot.json', writer);
    }
    else if(command === "ramoloss") {
        async function speak() {
            await sleep(5*60*1000 + randomNumber(5*60*1000)); // On attends 5 minutes, puis un temps aléatoire entre 1ms et 5 minutes.
            message.channel.send(`${message.author.toString()}`);
            message.channel.send("https://i.gifer.com/7Skf.gif")
        }
        speak();
    }

    else if(command === "fermer" && message.author.id === config.admin){
        console.log("ok");
        client.destroy();
    }

});
 
client.login(config.botToken);