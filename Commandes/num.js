const outils = require("./outils.js");
const fs = require('fs');

exports.num = function(client, message, args, envoyerPM, idMJ, commandBody) {

    args = args.length === 0 ? [3] : args;
    let test = args[0];
    outils.verifierNaN(args)

    let lancer = outils.randomNumber(20) ;
    let botReply = `${message.author.toString()} sur un test de ${test} a lancé **${lancer}**. `;
    let estReussite = lancer >= test * 3;

    botReply += estReussite ? "C'est une réussite" : "C'est un échec";
    let affichageLancer = estReussite ? `**${lancer}**` : `*${lancer}*`;
    botReply += lancer === 1 || lancer === 20 ? " **critique !**" : ".";

    outils.envoyerMessage(client, botReply, message, envoyerPM, idMJ);
    outils.logLancer(message.author.username, affichageLancer, `test de ${test}`, envoyerPM);
}