global.serveurProd = false;
const outils = require("./Commandes/outils.js");
const requireDir = require('require-dir');
let fichiers = requireDir('./Commandes');
let listeDesTests = require('./Données/tests-de-fonctions.json');

let message = {
	channelId: '1',
	guildId: '1',
	id: '1',
	createdTimestamp: Date.now(),
	type: 'DEFAULT',
	system: false,
	content: '',
	author: {
	  id: "test",
	  bot: false,
	  system: false,
	  username: 'test',
	  discriminator: 'test',
	  avatar: 'a',
	  banner: undefined,
	  accentColor: undefined
	}
}

message.author.toString = function () {return "utilisateur";};
let messageAdmin = JSON.parse(JSON.stringify(message));
messageAdmin.author.toString = function () {return "admin";};
messageAdmin.author.id = outils.getConfig("paramètres.admin");

process.on('uncaughtException', function (exception) {
	console.log(exception);
});

for (let i = 0; i < listeDesTests.length; i++) {
    commande = listeDesTests[i];
    console.log(commande);
    console.log(fichiers[commande.fichier][commande.fonction](...commande.arguments));
}

/*
(async () => {
await outils.sleep(2000); 
    console.log(
        fichiers.rss.rss(null, ["statut"])
    );
})();
*/

/*
console.log(outils.dateHeureFrançaise());
console.log(outils.dateHeureFrançaise(1682763857000));


console.log(
    outils.dateHeureFrançaise(fichiers.rss.calculerDateProchaineMAJ(["Samedi"]))
);
*/