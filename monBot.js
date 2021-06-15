const config = require('./config.json');
const pokedex = require('./pokedex.json');
const INSdata = require('./ins.json');
const tarot = require('./tarot.json');

const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');
    //const canalLogs = client.channels.cache.get(config.canalLogs); // Envoyer un message dans le canal log avec => canalLogs.send("message");


function randomNumber(maximum){
    // Cette fonction sert à tirer un nombre au pif de 1 à x, j'en ai beaucoup besoin.
    return Math.floor(Math.random() * maximum) + 1;
}

function verifierNaN(array) {
    for(let i = 0; i < array.length; i++)
    if (isNaN(array[i])) {
      throw '';
    }
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
    try {
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
            let calculer_reussite = false; // On ne dit si c'est une réussite ou pas que si le dd ou l'avantage est donné.
            let stat = 3; // Si aucune information est donnée, on assume que la stat est de 3 et le dd de 3. Si ça pose problème de toute façon le bot le mentionne.
            let dd = 3;
            let avantage = 0;
            let avantage_mis = false;

            for (let i = 0; i < args.length; i++){ // On regarde la liste des paramètres données, on peut les mettre dans n'importe quel ordre car les trois ont leur propre nomenclature.
                if (args[i][0] == "+" || args[i][0] == "-"){ // Si ça commence par + ou -, c'est des avantages / désavantages
                    avantage_mis = true;
                    calculer_reussite = true;
                    avantage = parseInt(args[i]);
                }
                else if (args[i].includes("dd")){ // Si ça commence par dd, c'est le dd.
                    calculer_reussite = true;
                    dd = parseInt(args[i][2])
                }
                else {
                    stat = parseInt(args[i]) // Sinon c'est la stat.
                }
            }

            verifierNaN([stat, dd, avantage]);

            let dices = [randomNumber((1+stat)*2), randomNumber(20)] ;
            
            let message_reussite_un = "";
            let message_reussite_deux = "";
            if (calculer_reussite){
                message_reussite_un = ` un dd de ${dd}`;
                if (avantage_mis){
                    message_reussite_un += avantage > 0 ? ` et ${avantage} avantages` : ` et ${-avantage} désavantages`
                }

                message_reussite_deux = (dices[0] > dd && dices[1] >= avantage * -5 )|| dices[1] <= avantage * 5 ? `C'est une réussite !` : `C'est un échec !`

            }
            let botReply = `${message.author.toString()} avec une stat de ${stat},${message_reussite_un} a lancé [${dices[0]}] [${dices[1]}]. ${message_reussite_deux}`;
            
            
            message.channel.send(botReply);

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
            if(["aide","help","commandes"].includes(args[0])){
                message.channel.send(
                    "**;ins** permet de faire un jet normal.\r\n" +
                    ";ins **stats** permet de savoir à partir de quelle stat le jet réussi. Il est possible de mentionner des colonnes de bonus ou de malus, par exemple **;ins stats +3**.\r\n" +
                    ";ins **verif** ***stat*** permet de savoir si le jet réussi en précisant la stat, par example **;ins stats 2+**. Il est possible de préciser un bonus ou malus de colonne.\r\n" +
                    ";ins **message** ***lancer*** ***phrase*** permet d'ajouter un message personnalisé sur un résultat, par exemple **;ins 665 :lul:**. Les emotes doivent être disponibles sur un serveur où ce bot se trouve.\r\n" +
                    ";ins **cheat** ***dé1*** ***dé2*** ***dé3*** permet de forcer un jet, seulement utile pour vérifier un message.\r\n" +
                    ";ins **tum** affiche la table unique multiple."
                )
                return;
            }

            if (["table","tum","TUM"].includes(args[0])){
                message.channel.send("https://media.discordapp.net/attachments/678319564685180930/695726135836934312/Screenshot_2020-03-30-20-20-37-1.png");
                return;
            }

            if (args[0] == "message"){ // Commande permettant à quelqu'un de rajouter un message personalisé
                if (args[2] == "deletethis"){
                    // A faire
                }
                else{
                    if(!(args[1] in INSdata.lancersSpeciaux)){ // Si le lancer n'existait pas dans la base, on le rajoute
                        INSdata.lancersSpeciaux[args[1]] = {};
                    }

                    phrase = " "; // Très mauvaise manière de récupérer la phrase qui a été découpée avant, à revoir
                    for (let i= 2; i < args.length; i++){
                        phrase += args[i] + " ";
                    }
                    INSdata.lancersSpeciaux[args[1]][message.author.id] = phrase; // On rajoute le message dans la base de données
                    let botReply = `${message.author.toString()} : Maintenant, pour le lancer ${args[1]}, je vais afficher le message : ${phrase}`;

                    message.channel.send(botReply);
                    client.channels.cache.get(config.canalLogs).send(botReply);
                }

                let writer = JSON.stringify(INSdata, null, 4); // On sauvegarde le fichier.
                fs.writeFileSync('./ins.json', writer);
                

                return;
            }

            let dices = [randomNumber(6), randomNumber(6), randomNumber(6)];
            let lancerSpecial = false;

            if (args[0] === "cheat" && args.length >= 4) {
                dices = [parseInt(args[1]), parseInt(args[2]), parseInt(args[3])];
                verifierNaN(dices);
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
            // let writer = JSON.stringify(tarot, null, 4); // On sauvegarde le fichier.
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
    }

    catch(err) {
        message.react('❌');
        console.log(err);
        }

});
 
client.login(config.botToken);