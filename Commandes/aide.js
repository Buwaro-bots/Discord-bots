const outils = require("./outils.js");
let strings = require('../Données/textes-privés.json');

module.exports = {
    aide: function(message, args, envoyerPM, idMJ) {
        if (args.length > 0 && module.exports.hasOwnProperty(args[0]) && args[0] !== "aide") {
            module.exports[args[0]](message, args, envoyerPM, idMJ);
            return;
        }
        let botReply =  "Mode d'emploi : <https://buwaro-bots.github.io/Discord-bots/?mode=roll>\r\n" +
                        "\r\n" +
                        "**;roll** ou **;r** pour faire des jets. Il est possible de juste mettre le nombre de faces comme **;roll *20***, des commandes plus compliquées comme **;roll *1d10 + 1d8 + 3***, " +
                        "Ne pas mettre de dé équivaut à lancer un dé 100. **;d20** ou **;2d100** est un raccourci pour faire un jet simple, mais il n'est possible de lancer qu'un seul type de dés.\r\n" +
                        "\r\n" +
                        "**;ins** pour faire un jet pour In Nomine Satanis / Magna Veritas. **;ins commandes** a la liste des commandes spécifiques.\r\n"+
                        "**;dng stat** pour faire un jet pour Donjons et Groudon, **;ins commandes** a la liste des commandes spécifiques et une aide rapide pour les lancers.\r\n" +
                        "**;num *test*** pour faire un lancer de numénera. \r\n" +
                        "\r\n" +
                        "=> Pour les lancers de jdr, rajouter un ping à la fin du message permet d'envoyer le roll en privé à vous et à la personne pingée. Sinon mettre deux **;** envoit le résultat en privé.\r\n" +
                        "**;repeat** permet de faire plusieurs fois la même commandes comme **;repeat 3 dng 4** pour faire 3 rolls de dng avec une stat de 4.\r\n" +
                        "\r\n" +
                        "**;isekai** pour vous faire réincarner en pokémon. Il est possible de roll dans une catégorie telle que les types, Femelle/Mâle, gen1, DnG. ";
        outils.envoyerMessage(botReply , message, envoyerPM, idMJ, true);
    },

    roll: function(message, args, envoyerPM, idMJ) {
        let botReply =  "Mode d'emploi : <https://buwaro-bots.github.io/Discord-bots/?mode=roll>\r\n" +
                        "\r\n" +
                        "**;roll** pour faire des jets. Il est possible de juste mettre le nombre de faces comme **;roll *20***, des commandes plus compliquées comme **;roll *1d10 + 1d8 + 3***, " +
                        "ou juste **;roll** pour avoir la commande par défaut qui en général est 100.  Il est aussi possible d'abréger en **;r**.\r\n" +
                        "**;d20** ou **;2d100** est un raccourci pour faire un jet simple, mais il n'est possible de lancer qu'un seul type de dés. .\r\n" +
                        "**;roll setup *1d10 + 1d8*** permets de changer le roll par défaut.\r\n";
        outils.envoyerMessage(botReply , message, envoyerPM, idMJ, true);
    },

    dng: function(message, args, envoyerPM, idMJ) {
        let espaces = "                ";
        let botReply = "." + // Nécéssaire pour que discord n'enlève pas les espaces.
        espaces + "**Liens utiles**\r\n" +
        "**Mode d'emploi du bot** : <https://buwaro-bots.github.io/Discord-bots/?mode=dng>\r\n" +
        strings["DnG-Help"] +
        " \r\n" +
        espaces + "**Commandes**\r\n" +
        "**;dng *stat*** pour un jet normal, la stat doit normalement être entre 1 et 5. (et **dd** *3* pour le dd, et +1/-1 pour les avantages)\r\n" +
        "**;dng ini *instinct* + *agilité*** pour un jet d'initiative.\r\n" +
        "**;dng pc *stat* *+modificateur*** pour un jet de puissance cachée." +
        " \r\n" +
        "**;dng table** pour la table des types.\r\n" +
        "**;dng trait** pour avoir la description complète d'un trait. **;dex *espèce*** permet de vous rappeler les traits que vous avez.\r\n"

        outils.envoyerMessage(botReply, message, envoyerPM, idMJ, true);
        return;
    },

    ins: function(message, args, envoyerPM, idMJ) {
        let botReply = "Mode d'emploi : <https://buwaro-bots.github.io/Discord-bots/?mode=ins>\r\n" +
        "**;ins** permet de faire un jet normal.\r\n" +
        ";ins **opposition** pour indiquer la différence de stat nécéssaire pour battre un autre perso.\r\n" +
        ";ins **autocheck** permet d'activer automatiquement la vérification des rolls. (ou de le désactiver en réutilisant cette commande).\r\n" +
        ";ins **gacha** pour faire un jet de gacha. (wow)\r\n" +
        "\r\n" +
        ";ins **message** ***lancer*** ***phrase*** permet d'ajouter un message personnalisé sur un résultat, par exemple **;ins 665 :lul:**. Les emotes doivent être disponibles sur un serveur où ce bot se trouve, si de la mise en forme est utilisé il n'est pas nécéssaire d'échapper les \* avec des \\.\r\n" +
        ";ins **tum** affiche la table unique multiple.\r\n"+
        ";ins **purge** permet de purger un nombre incroyable de **196** lancers en une seule commande !\r\n";
        outils.envoyerMessage(botReply, message, envoyerPM, idMJ, true);

    },

    musique: function(message, args, envoyerPM, idMJ) {
        let botReply = "**;musique** permet de lancer le bot musical.\r\n" +
        "**;pause** permet de le mettre sur pause ou de le relancer.\r\n" +
        "**;skip** permet de passer à la musique suivante.\r\n" +
        "**;stop** permet d'arrêter le bot musical, il se déconnecte automatiquement après le générique de fin.\r\n" +
        "\r\n" +
        "**;chercher** ***mot ou phrase*** permet de chercher une musique disponible dans le bot. S'il y a plus de 5 résultats, la réponse sera envoyé par MP. S'il y a trop de résultats seuls les premiers seront affichés.\r\n" +
        "**;jouer** ***nom exact d'une musique*** permet de rajouter dans la playlist la musique demandée, si le bot n'était pas lancé il se lance. Le nom doit être tel qu'il apparait dans la playlist ou la commande rechercher.\r\n"+
        "\r\n" +
        "A cause de contraintes technique, le bot ne peut pas être lancé sur deux serveurs différents en même temps. Si vous devez vraiment l'utiliser dans deux serveurs différents, contactez l'admin pour lancer le bot deux fois.\r\n" +
        "Commandes exclusives à l'admin : ;musique activer / désactiver / reset / vérifier / maj.";
        outils.envoyerMessage(botReply, message, envoyerPM, idMJ, true);

    },

    isekai: function(message, args, envoyerPM, idMJ) {
        botReply = "A venir";
        outils.envoyerMessage(botReply, message, envoyerPM, idMJ, true);
    },

    source: function(message, args, envoyerPM, idMJ) {
        outils.envoyerMessage("https://github.com/Buwaro-bots/Discord-bots", message, envoyerPM, idMJ, true);
    },

    changelog: function(message, args, envoyerPM, idMJ) {
        let botReply = "Mode d'emploi : <https://buwaro-bots.github.io/Discord-bots/?mode=patch>\r\nGithub : https://github.com/Buwaro-bots/Discord-bots/commits/main";
        outils.envoyerMessage(botReply, message, envoyerPM, idMJ, true);
    },

    iceberg: function(message, args, envoyerPM, idMJ) {
        let botReply = strings.Iceberg;
        outils.envoyerMessage(botReply, message, envoyerPM, idMJ);
        return;
    },
}