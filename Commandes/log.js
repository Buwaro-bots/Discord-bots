const fs = require('fs');
const outils = require("./outils.js");
const config = require('../config.json');

exports.log = function(client, message, args, envoyerPM, idMJ) {
    // Si l'argument est effacer et que l'utilisateur est l'admin, on effectue une copie de sauvegarde en mettant la date du jour, puis on efface les logs
    if (args[0] === "effacer" && message.author.id === config.admin) {
        function pad(n) {
            return n < 10 ? '0' + n : n;
        }

        let date = new Date();
        let jour = pad(date.getDate());
        let mois = pad(date.getMonth() + 1);
        let annee = date.getFullYear();
        let heure = pad(date.getHours());
        let minute = pad(date.getMinutes());
        let seconde = pad(date.getSeconds());
        let dateString = `${annee}-${mois}-${jour}_${heure}-${minute}-${seconde}`;
        fs.copyFileSync('./Données/stats.json', `./Données/Archives/Logs_${dateString}.json`);
        outils.logLancerEffacer();
        message.react('👍');
        return;
    }
}