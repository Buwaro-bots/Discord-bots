global.serveurProd = false;
const outils = require("./Commandes/outils.js");
const requireDir = require('require-dir');
let fichiers = requireDir('./Commandes');


/*
(async () => {
await outils.sleep(2000); 
    console.log(
        fichiers.rss.rss(null, null, ["statut"])
    );
})();
*/

/*
console.log(outils.dateHeureFrançaise());
console.log(outils.dateHeureFrançaise(1682763857000));
*/

console.log(
    outils.dateHeureFrançaise(fichiers.rss.calculerDateProchaineMAJ(["Samedi"]))
);