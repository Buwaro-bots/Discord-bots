const outils = require("./outils.js");

exports.dng = function(client, message, args, envoyerPM, idMJ){
    [args, envoyerPM, idMJ] = outils.verifierSiMJ(args, envoyerPM);

    let est_PC = false;
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
    outils.logLancer(message.author.username, `[${lancerCaracteristique}] [${lancerCritique}]`, `DNG ${stat}`);

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