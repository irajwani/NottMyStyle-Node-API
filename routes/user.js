module.exports = {
    getProfile: (req, res) => {
        let {uid} = req.params;
        firebase.database().ref('/Users/' + uid + '/').on("value", async (snapshot) => {
            let currentUser = snapshot.val(), data;
            var backgroundColor = "#87d720";
            if(currentUser.color) {
                backgroundColor = currentUser.color;
            }
            
            var {country, insta, name, size, uri} = currentUser.profile

            var comments;
            if(currentUser.comments) {
                comments = currentUser.comments;
                data = { name, country, uri, insta, numberProducts, soldProducts, backgroundColor, comments, isGetting: false }
                
            }
            else {
                data = { name, country, uri, insta, numberProducts, soldProducts, backgroundColor, noComments: true, isGetting: false };
            }

            res.send(data);
            // res.status(200).json(data);
        })
    }
}