const config = require('./config.json');
const pokedex = require('./pokedex.json');
const INSdata = require('./ins.json');
const horoscope = require('./horoscope.json');
const tarot = require('./tarot.json');
let statsLancers = require('./stats.json');

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
      throw 'nan error';
    }
  }

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}     

function envoyerMessage(botReply, message){ // Cette fonction a été faite pour pouvoir enregistrer dans la console les réponses du bot.
    console.log(botReply.substring(0, 100));
    message.channel.send(botReply);
}

let prefix = ";"; // Set the prefix
console.log("Ready!");

client.on("message", (message) => {
    if (message.content.startsWith("$") && message.guild.id === "846473259478024242") {
        envoyerMessage("Je ne suis pas mudae. <:monkaS:411272701022568458>", message);
        return;
    }
    
    if (!message.content.startsWith(prefix) || message.author.bot) return;     // Exit and stop if the prefix is not there or if user is a bot
    
    process.stdout.write(`${message.author.username}#${message.author.discriminator} ${message.content} => `);

    let commandBody = message.content.slice(prefix.length);     // Cette partie sert à séparer la commande des arguments.
    let args = commandBody.split(/ +/); // Regular expression pour empêcher les double espaces de faire planter.
    let command = args.shift().toLowerCase();

    try {
        if (command === "code" || command === "source"){
            envoyerMessage("https://github.com/Buwaro-bots/Discord-bots", message);
        }

        else if(command === "pokemon" || command === "isekai") {
            let number = 0;
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
                        nouvelleListe.push(pokedex[i]["numero"]);
                    }
                }

                if (nouvelleListe.length == 0){ // Si il n'y a pas de pokémon correspondant, on renvoit une erreur
                    throw("Aucun pokémon avec ses tags");
                }
                number = nouvelleListe[randomNumber(nouvelleListe.length)-1];
            }
            else{
                number = randomNumber(898); 
            }
            if (command === "pokemon") {
                console.log(`${message.author.toString()} a tiré le pokémon numéro ${number} qui est ${pokedex[number].nom}.`); // Console.log pour pas faire bugger le then
                message.channel.send(`${message.author.toString()} a tiré le pokémon numéro ${number} qui est ||${pokedex[number].nom}||.`)
                .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
                    setTimeout(function(){
                        msg.edit(`${message.author.toString()} a tiré le pokémon numéro ${number} qui est ${pokedex[number].nom}.`);
                    }, 5000)
                }); 
            }
            else if (command === "isekai") {
                let rollShiny = randomNumber(256);
                let estShiny = "";

                if (rollShiny === 1){
                    estShiny = " **shiny**"
                }

                console.log(`${message.author.toString()} va être isekai en le pokémon numéro ${number} qui est ${pokedex[number].nom}${estShiny} [${rollShiny}].`); // Console.log pour pas faire bugger le then
                message.channel.send(`${message.author.toString()} va être isekai en le pokémon numéro ${number} qui est ||${pokedex[number].nom}||.`)
                .then((msg)=> { // Cette fonction permet d'éditer le message au bout de 5 secondes.
                    setTimeout(function(){
                        msg.edit(`${message.author.toString()} va être isekai en le pokémon numéro ${number} qui est ${pokedex[number].nom}${estShiny}.`);
                    }, 5000)
                });
            }
        }

        else if(command === "horoscope"){

            let continuer = true;
            let alea = 0;

            let famille = horoscope;
            while (continuer){
                alea = randomNumber(100);
                process.stdout.write(`${alea} => `);
                let nouvelleFamille;
                famille.forEach(element => {
                    if (alea > 0 && alea <= element["probabilité"]){
                        nouvelleFamille = element["liste"];
                        if (element["type"] == "liste"){
                            continuer = false;
                        }
                    }
                    alea -= element["probabilité"];
                });
                famille = nouvelleFamille
            }

            let animal = famille[randomNumber(famille.length)-1];
            envoyerMessage(`${message.author.toString()} Votre signe du jour est : ${animal}.`, message);
            return;
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
            
            
            envoyerMessage(botReply, message);

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
        else if(command === "ins") { // A faire : Les jets d'opposition si Soraniak trouve ça utile et que j'ai eu le temps de lui demander
            if(["aide","help","commandes"].includes(args[0])){
                envoyerMessage(
                    "**;ins** permet de faire un jet normal.\r\n" +
                    ";ins **stats** permet de savoir à partir de quelle stat le jet réussi. Il est possible de mentionner des colonnes de bonus ou de malus, par exemple **;ins stats +3**.\r\n" +
                    ";ins **verif** ***stat*** permet de savoir si le jet réussi en précisant la stat, par example **;ins stats 2+**. Il est possible de préciser un bonus ou malus de colonne.\r\n" +
                    ";ins **message** ***lancer*** ***phrase*** permet d'ajouter un message personnalisé sur un résultat, par exemple **;ins 665 :lul:**. Les emotes doivent être disponibles sur un serveur où ce bot se trouve.\r\n" +
                    ";ins **cheat** ***dé1*** ***dé2*** ***dé3*** permet de forcer un jet, seulement utile pour vérifier un message.\r\n" +
                    ";ins **tum** affiche la table unique multiple.\r\n"+
                    ";ins **purge** permet de purger un nombre incroyable de **196** lancers en une seule commande !\r\n"+
                    ";ins **opposition** :construction:"
                    , message
                )
                return;
            }

            if (["table","tum","TUM"].includes(args[0])){
                envoyerMessage("https://media.discordapp.net/attachments/678319564685180930/695726135836934312/Screenshot_2020-03-30-20-20-37-1.png", message);
                return;
            }

            if (args.length > 0 && ["purge","purgé","purger"].includes(args[0].toString().toLowerCase())){
                let botReply = `${message.author.toString()} a purgé :  \`\`\``;
                while (botReply.length < 1989){
                    let dices = [randomNumber(6), randomNumber(6), randomNumber(6)];
                    botReply += `[${dices[0]}${dices[1]}]+[${dices[2]}]  `;
                }
                botReply = botReply.slice(0,-2) + "\`\`\`"
                envoyerMessage(botReply, message);
                return;
            }

            if (args[0] == "effacerstats" && message.author.id === config.admin ){
                statsLancers = {}

                let writer = JSON.stringify(statsLancers, null, 4); // On sauvegarde le fichier.
                fs.writeFileSync('./stats.json', writer);
                console.log("Lancers effacés.")
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

                    envoyerMessage(botReply, message);
                    client.channels.cache.get(config.canalLogs).send(botReply);
                }

                let writer = JSON.stringify(INSdata, null, 4); // On sauvegarde le fichier.
                fs.writeFileSync('./ins.json', writer);
                

                return;
            }

            let dices = [randomNumber(6), randomNumber(6), randomNumber(6)];
            let lancerSpecial = false;
            let verbe = "lancé";

            if (args[0] === "cheat" && args.length >= 4) {
                dices = [parseInt(args[1]), parseInt(args[2]), parseInt(args[3])]; // Penser à mettre modulo / int pour demander 666 au lieu de 6 6 6.
                verifierNaN(dices);
                verbe = "triché avec";
            }
            let dicesSum = dices[0]*100 + dices[1]*10 + dices[2]; // Nécéssaire parce qu'on ne peut pas comparer des tableaux directement.
            
            let botReply = `${message.author.toString()} a ${verbe} [${dices[0]}${dices[1]}] + [${dices[2]}].`;


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

            
            envoyerMessage(botReply, message);

            if(!(message.author.username in statsLancers)){ // Si le lancer n'existait pas dans la base, on le rajoute
                statsLancers[message.author.username] = [];
            }

            statsLancers[message.author.username].push(`[${dices[0]}${dices[1]}]+[${dices[2]}]`)

            let writer = JSON.stringify(statsLancers, null, 4); // On sauvegarde le fichier.
            fs.writeFileSync('./stats.json', writer);
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
                temps = 5*60*1000 + randomNumber(5*60*1000)// On attends 5 minutes, puis un temps aléatoire entre 1ms et 5 minutes.
                console.log(temps/1000)
                await sleep(temps); 
                message.channel.send(`${message.author.toString()}`);
                message.channel.send("https://i.gifer.com/7Skf.gif")
            }
            speak();
        }

        else if(command === "roll"){ // A FAIRE (Répétitions, et faire des rolls enregistrés ?)
            if (args[0] == "setup"){
                config.lancerParDefault = args[1];
                let writer = JSON.stringify(config, null, 4); // On sauvegarde le fichier.
                fs.writeFileSync('./config.json', writer);
                envoyerMessage(`Le lancer par défaut est maintenant ${args[1]}.`, message);
                return;
            }


            if (args.length == 0){ // Si il y a juste roll, je fais quand même un lancer
                args = [config.lancerParDefault];
                commandBody += " " + config.lancerParDefault;
            }
            

            if (args.length == 1 && (!args[0].toLowerCase().includes("d") || args[0].toLowerCase().charAt(0) == "d")){ // Si une personne envoit juste un nombre sans écrire "d" ou "d100", dans ce cas on lance un dé.
                args[0] = args[0].toLowerCase().replace("d", "");
                verifierNaN(args)
                let lancer = parseInt(args[0]);
                if (lancer > 9000000000000000) throw("Nombre trop grand");
                let botReply = `${message.author.toString()} sur 1d${lancer} a lancé **${randomNumber(lancer)}**.`;
                envoyerMessage(botReply, message);
            }

            else {
                let listeCommandes = []; // [commande, bool estLancer, [lancers], somme]
                let listeOperateurs = ["+","-","*","/","(",")",">","<"];

                args = commandBody // On refait args pour pouvoir séparer mieux
                for (let i = 0; i < listeOperateurs.length; i+=1){
                    args = args.split(`${listeOperateurs[i]}`).join(` ${listeOperateurs[i]} `);
                }
                args = args.toLowerCase().split(/ +/);
                args.shift();



                for (let i = 0; i < args.length; i++){ // On cherche ce que sont chaque commande
                    if(args[i].includes("d")){ // Si la commande a d...
                        args[i] = args[i].charAt(0) === "d" ? "1" + args[i] : args[i];
                        args[i] = args[i].split("d");
                        if(args[i].length == 2 && !isNaN(args[i][0]) && !isNaN(args[i][1]) && parseInt(args[i][0]) > 0 && parseInt(args[i][1]) > 1){ // On regarde si il y a bien deux nombres qui soient valide
                            let lancer = 0;
                            let lancers = [];
                            let somme = 0;
                            
                            for (let j = 0; j < args[i][0]; j++){ // On lance les deux
                                lancer = randomNumber(args[i][1]);
                                lancers.push(lancer);
                                somme += lancer;                                
                            }
                            listeCommandes.push([args[i][0] +"d" + args[i][1], true, lancers, somme]); // On rajoute la commande, les lancers et le résultat du lancers dans la liste des commandes
                        }
                    }
                    else if(listeOperateurs.includes(args[i]) || !isNaN(parseInt(args[i]))){ // Sinon si c'est un opréateur, on rajoute tout simplement dans la liste des commandes
                        listeCommandes.push([args[i], false])
                    }
                    
                }
                let reponseCommandes = "";
                let reponseLancers = "";
                let reponseSomme = "";

                for (let i = 0; i < listeCommandes.length; i++){ // On écrit la réponse
                    reponseCommandes += listeCommandes[i][0] + " ";
                    if (listeCommandes[i][1]){ // Si la commande est un lancer, alors la liste des lancers doit s'afficher sans la liste des lancers et dans la formule de calcul
                        reponseLancers += `[${listeCommandes[i][2]}] `;
                        reponseSomme += listeCommandes[i][3]
                    }
                    else{ // Sinon on affiche l'opérateur
                        reponseLancers += listeCommandes[i][0] + " ";
                        reponseSomme += listeCommandes[i][0]
                    }
                }
                //console.log(reponseSomme);
                reponseSomme = Math.round(eval(reponseSomme)*100)/100; // On calcule le résultat...
                let botReply = `${message.author.toString()} sur ${reponseCommandes} a lancé ${reponseLancers}, ce qui donne **${reponseSomme}**.`;
                if (botReply.length >= 2000) throw("Réponse trop longue"); // Puis on vérifie que la réponse ne soit pas trop longue.
                if (reponseSomme > 9000000000000000) throw("Nombre trop grand");
                envoyerMessage(botReply, message);
            }
        }

        else if(command === "fermer" && message.author.id === config.admin){
            console.log("ok");
            client.destroy();
        }
    }

    catch(err) {
        message.react('❌');
        console.log(err/*.substring(0, 200)*/);
        }

});
 
client.login(config.botToken);