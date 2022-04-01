const { verifierNaN } = require("./outils.js");
const outils = require("./outils.js");
const roll = require('./roll.js');
let strings = require('../Données/textes-privés.json');

exports.dng = function(client, message, args, envoyerPM, idMJ){

    if (["aide", "help", "commandes", "commande"].includes(args[0])){
        let espaces = "                ";
        let botReply = "." + 
        espaces + "**Liens utiles**\r\n" +
        strings["DnG-Help"] +
        " \r\n" +
        espaces + "**Commandes**\r\n" +
        "**;dng table** pour la table des types.\r\n" +
        "**;dng *stat*** pour un jet normal, la stat doit normalement être entre 1 et 5.\r\n" +
        "**;dng pc *stat* *+modificateur*** pour un jet de puissance cachée," +
        " la stat correspond à l'échelon entre 1 et 20. La jauge a 4 points de plus que le niveau de l'échelon. \r\n" +
        " \r\n" +
        espaces + "**Jets normaux**\r\n" +
        "Le premier lancer correspond au jet de caractéristique, le dé lancer correspond à votre stat. Pour une action normale, le jet est une réussite si le jet est supérieur à 3. (soit 4 ou plus).\r\n" +
        "Le second lancer correspond au jet de crtitique, plus le lancer est haut, plus la réussite ou l'échec est importante, en général un 19 ou un 20 vaut une réussite ou échec critique." +
        " Si un échec a un petit lancer de critique, il peut devenir une réussite si vous avez un avantage. Avec un avantage, un échec devient une réussite si le lancer de critique est entre 1 et 4. L'inverse est aussi vraie pour les petites réussites.\r\n";


        outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
        return;
    }
    if (args[0] === "table" || args[0] === "types"){
        outils.envoyerMessage(client, "https://cdn.discordapp.com/attachments/730133304237359157/958476687090262066/unknown.png", message, envoyerPM, idMJ);
        return;
    }
    if (args[0] == "pc" && args.length > 1){

        verifierNaN([args[1], args[args.length -1]]);
        let stat = parseInt(args[1]);
        let modificateur = args.length > 2 ? `+ ${parseInt(args[args.length -1])}` : "";

        if ( stat < 1 || stat > 20 ) {
            throw("Stat incorrecte");
        }

        let lancer = ""

        switch(stat){
            case 1:
                lancer = `2d4 ${modificateur}`;
                break;
            case 2:
                lancer = `1d4+1d6 ${modificateur}`;
                break;
            case 3: case 4:
                lancer = `2d6 ${modificateur}`;
                break;
            case 5: case 6:
                lancer = `1d6+1d8 ${modificateur}`;
                break;
            case 7: case 8: case 9:
                lancer = `2d8 ${modificateur}`;
                break;
            case 10: case 11: case 12:
                lancer = `1d8+1d10 ${modificateur}`;
                break;
            case 13: case 14: case 15:
                lancer = `2d10 ${modificateur}`;
                break;
            case 16: case 17: case 18: case 19:
                lancer = `1d10+1d12 ${modificateur}`;
                break;
            case 20:
                lancer = `2d12 ${modificateur}`;
                break;
        }
        roll.roll(client, message, [lancer], envoyerPM, idMJ, `roll ${lancer}`);
        return;
    }

    outils.verifierNaN(args);

    let stat = args.length > 0 ? parseInt(args[0]) : 3; // Si aucune information est donnée, on assume que la stat est de 3 et le dd de 3. Si ça pose problème de toute façon le bot le mentionne.
    let nombreLancers = args.length > 1 ? Math.max(Math.min(parseInt(args[1]), 5), 1) : 1;
    let alerteStatLimite = stat > 5 ? "(Attention, normalement les stats ne dépassent pas 5.)" : "";
    
    let lancerCritique = outils.randomNumber(20);
    let lancerCaracteristique = "";

    if (nombreLancers == 1) {
        lancerCaracteristique = outils.randomNumber((1+stat)*2);
    }
    else {
        let listeLancers = [];
        for (let i = 0; i < nombreLancers ; i++) {
            listeLancers.push(outils.randomNumber((1+stat)*2));
        }
        
        let meilleurLancer = Math.max.apply(Math, listeLancers);
        lancerCaracteristique = listeLancers.join(", ");
        console.log(lancerCaracteristique);
        console.log(meilleurLancer);
        lancerCaracteristique = lancerCaracteristique.replace(meilleurLancer, `**${meilleurLancer}**`);
    }

    let botReply = `${message.author.toString()} avec une stat de ${stat}, a lancé [${lancerCaracteristique}] [${lancerCritique}]. ${alerteStatLimite}`;
    outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
    outils.logLancer(message.author.username, `[${lancerCaracteristique}] [${lancerCritique}]`, `dng ${stat}`);


}
    //#region 
    /*
    let calculer_reussite = false; // On ne dit si c'est une réussite ou pas que si le dd ou l'avantage est donné.
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
    outils.verifierNaN([stat, dd, avantage]);
    */


    /*
    let message_reussite_un = "";
    let message_reussite_deux = "";
    if (calculer_reussite){
        message_reussite_un = ` un dd de ${dd}`;
        if (avantage_mis){
            message_reussite_un += avantage > 0 ? ` et ${avantage} avantages` : ` et ${-avantage} désavantages`
        }

        message_reussite_deux = (dices[0] > dd && dices[1] >= avantage * -4 )|| dices[1] <= avantage * 4 ? `C'est une réussite !` : `C'est un échec !`

    }

    let botReply = `${message.author.toString()} avec une stat de ${stat},${message_reussite_un} a lancé [${dices[0]}] [${dices[1]}]. ${message_reussite_deux} ${alerteStatLimite}`;
    */
   //#endregion