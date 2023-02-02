const {verify} = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    const accessToken = req.cookies["accessToken"];
    try {
        if(accessToken) {
            const validToken = verify(accessToken, "jwtsecretplschange");
            if(validToken) {
                req.authenticated = true;
                req.tokenData = validToken;
                return next();
            }
        } else {
            req.authenticated = false;
            return next();
        }

    } catch(error) {
        return res.status(400).json({error: error});
    }
}

module.exports = {validateToken};