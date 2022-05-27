const requireDir = require('require-dir');
const mesCommandes = requireDir('./Commandes');
const config = require('./config.json');
const ancienLancerParDefaut = config.lancerParDefault;
const fs = require('fs');

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
messageAdmin.author.id = config.admin;

process.on('uncaughtException', function (exception) {
	console.log(exception);
   });

if (process.argv.length > 2) {
	let arguments = process.argv.slice(2);
	let commande = arguments.shift();
	try{mesCommandes[commande][commande](null, message, arguments, false, false);}
	catch(e){
		if (!(e.toString().includes("(reading 'then')"))) console.log(e);
	}
}
else {
	let paramJoueurs = JSON.parse(fs.readFileSync(__dirname + '/./Données/param-joueurs.json', 'utf-8'));
	if (paramJoueurs.ins.listeAutoVerifications.includes("test")) {
		const index = paramJoueurs.ins.listeAutoVerifications.indexOf("test");
		paramJoueurs.ins.listeAutoVerifications.splice(index, 1);
	}
	if (paramJoueurs.dng.listeAutoVerifications.includes("test")) {
		const index = paramJoueurs.dng.listeAutoVerifications.indexOf("test");
		paramJoueurs.dng.listeAutoVerifications.splice(index, 1);
	}
	let writer = JSON.stringify(paramJoueurs, null, 4); // On sauvegarde le fichier.
	fs.writeFileSync('./Données/param-joueurs.json', writer);

	const listeCommandes = { 
		"dng" :   [
			{
				args : ["3"],
				commentaire : "Un simple roll de dng"
			},
			{
				args : ["3", "2"],
				commentaire : "Deux rolls de dng"
			},
			{
				args : ["autocheck"],
				commentaire : "Activation de l'autocheck"
			},
			{
				args : ["5"],
				commentaire : "Un simple roll de dng avec autocheck"
			},
			{
				args : ["5", "2"],
				commentaire : "Deux rolls de dng"
			},
			{
				args : ["4", "dd5"],
				commentaire : "Vérification du dd"
			},
			{
				args : ["1", "dd5", "+3"],
				commentaire : "Vérification avec 3 avantages"
			},
			{
				args : ["5", "-3", "dd0"],
				commentaire : "Vérification avec 3 désavantages"
			},
			{
				args : ["autocheck"],
				commentaire : "Désctivation de l'autocheck"
			},
			{
				args : ["6"],
				commentaire : "Roll sans autocheck, et message pour dire que la stat est supérieur à 5"
			},
			{
				args : ["ini", "3+4"],
				commentaire : "Roll d'initiative avec 3 et 4"
			},
			{
				args : ["ini", "1", "5"],
				commentaire : "Roll d'initiative avec 1 et 5"
			},
			{
				args : ["ini", "4"],
				commentaire : "Roll d'initiative avec deux fois 4"
			},
			{
				args : ["ini", "4", "+5"],
				commentaire : "Roll d'initiative avec 4 et 5"
			},
			{
				args : ["pc", "10"],
				commentaire : "Roll d'une puissance cachée de 10"
			},
			{
				args : ["pc", "10", "+5"],
				commentaire : "Roll d'une puissance cachée de 10 +5"
			},
			{
				args : ["pc", "21"],
				commentaire : "Erreur avec une pc de 21"
			},
			{
				args : ["pokemon", "Kaiminus"],
				commentaire : "Affiche les données de Kaiminus"
			},
			{
				args : ["pokemon", "Goupix d'Alola"],
				commentaire : "Affiche les données de Goupix d'Alola"
			},
			{
				args : ["pokemon", "bbbbbbbbbbbbbbbbbb"],
				commentaire : "Renvoie une erreur"
			},
			{
				args : ["trait", "gecko"],
				commentaire : "Renvoie le trait gecko"
			},
		],
		"ins" : [
			{
				args : [],
				commentaire : "Un lancer classique de ins"
			},
			{
				args : ["autocheck"],
				commentaire : "Activation de l'autocheck"
			},
			{
				args : [],
				commentaire : "Un lancer avec autocheck"
			},
			{
				args : ["+4"],
				commentaire : "Un lancer avec +4"
			},
			{
				args : ["-4"],
				commentaire : "Un lancer avec -4"
			},
			{
				args : ["autocheck"],
				commentaire : "Désactivation de l'autocheck"
			},
			{
				args : [],
				commentaire : "Un lancer sans autocheck"
			},
			{
				args : ["message", "421", "kek"],
				commentaire : "Ajout d'un message"
			},
			{
				args : ["message", "liste"],
				commentaire : "Liste des messages"
			},
			{
				args : ["cheat", "421"],
				commentaire : "Vérification du message"
			},
			{
				args : ["message", "421", "deletethis"],
				commentaire : "Suppression du message"
			},
			{
				args : ["message", "liste"],
				commentaire : "Liste des messages sans le 421"
			},
			{
				args : ["gacha"],
				commentaire : "Fait un jet de gacha"
			}
		],

		"isekai" : [ 
			{
				args : [],
				commentaire : "Isekai simple"
			},
			{
				args : ["Feu"],
				commentaire : "Isekai avec un pokémon feu"
			},
			{
				args : ["Eau", "Sol"],
				commentaire : "Isekai avec un pokémon eau sol"
			},
			{
				args : ["aaaaaaaa"],
				commentaire : "Isekai qui renvoit une erreur"
			},
		],
		"roll" : [
			{
				args : [],
				commentaire : "Roll simple"
			},
			{
				args : ["10"],
				commentaire : "Roll avec un dé précis"
			},
			{
				args : ["1d10", "+", "1d20"],
				commentaire : "Roll avec deux dés précis"
			},
			{
				args : ["1d10", "+", "1d20", "*", "2"],
				commentaire : "Roll avec deux dés précis et un facteur"
			},
			{
				args : ["aaaaaaaa"],
				commentaire : "Roll qui renvoit une erreur"
			},
			{
				args : ["setup", "20"],
				commentaire : "Mets le roll par défaut à 1d20"
			},
			{
				args : [],
				commentaire : "Nouveau lancer par défaut"
			},
			{
				args : ["setup", ancienLancerParDefaut],
				commentaire : "Remets le lancer à son état initial"
			},
		],
		"log" : [
			{
				args : ["1"],
				commentaire : "Affichage des logs"
			},
		]
	}
	for (let commande in listeCommandes) {
		console.log('\x1b[31m%s\x1b[0m', `     ${commande}`);
		for (let i = 0; i < listeCommandes[commande].length; i++) {
			let args = listeCommandes[commande][i].args;
			try{mesCommandes[commande][commande](null, message, args, false, false);}
			catch(e){
				if (!(e.toString().includes("(reading 'then')")) && !(e.toString().includes("(reading 'channels')")) ) console.log(e);
			}
			console.log('\x1b[36m%s\x1b[0m', "=> " + listeCommandes[commande][i].commentaire + "\r\n");
		}
	}
}

let statsLancers = require('./Données/stats.json');
delete statsLancers.test;
fs.writeFileSync('./Données/stats.json', JSON.stringify(statsLancers, null, 4));
