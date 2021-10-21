module.exports = {
    randomNumber: function(maximum){
        // Cette fonction sert à tirer un nombre au pif de 1 à x, j'en ai beaucoup besoin.
        return Math.floor(Math.random() * maximum) + 1;
    },

    verifierNaN: function(array) {
        for(let i = 0; i < array.length; i++)
        if (isNaN(array[i])) {
        throw 'nan error';
        }
    },

    sleep: function(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },  

    // Cette fonction a été faite pour pouvoir enregistrer dans la console les réponses du bot. Si la réponse doit être par mp, envoyerPM doit être égal à true
    envoyerMessage: function(client, botReply, message, envoyerPM = false, idMJ = null){
        console.log(botReply.substring(0, 100));
        if (envoyerPM){
            message.author.send(botReply);
            if (idMJ != null){
                client.users.cache.get(idMJ).send(botReply);
            }
            message.react('📬');
        }
        else {
            message.channel.send(botReply);
        }
    },

    verifierSiMJ: function(args, envoyerPM){
        longueur = args.length;
        if (longueur > 0 && args[longueur -1].startsWith('<@!')){
            idMJ = args.pop();
            idMJ = idMJ.substring(3, idMJ.length-1);
            return [args, true, idMJ];
        }
        return [args, envoyerPM, null];
    }
}