const outils = require("./outils.js");
const horoscope = require('../Données/horoscope.json');

exports.horoscope = function(client, message, args) {
    let nbBoucle = 1
    if (args.length > 0 && args[0] === "hybride") {
        if (args.length > 1) {
            nbBoucle = parseInt(args[1]);
        }
        else {
            nbBoucle = 2;
        }
    }

    let animal = "";
    let boucleEnCours = 1;

    while (boucleEnCours <= nbBoucle) {
        let continuer = true;
        let alea = 0;

        let famille = horoscope;
        while (continuer) {
            alea = outils.randomNumber(100);
            process.stdout.write(`${alea} => `);
            let nouvelleFamille;
            famille.forEach(element => {
                if (alea > 0 && alea <= element["probabilité"]) {
                    nouvelleFamille = element["liste"];
                    if (element["type"] === "liste") {
                        continuer = false;
                    }
                }
                alea -= element["probabilité"];
            });
            famille = nouvelleFamille
        }

        animal += famille[outils.randomNumber(famille.length)-1];
        if (boucleEnCours < nbBoucle) {
            animal += "-";
        }
        boucleEnCours += 1;
    }
    outils.envoyerMessage(client, `${message.author.toString()} Votre signe du jour est : ${animal}.`, message);
}