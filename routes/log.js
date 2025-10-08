const express = require("express");
const CryptoJS = require("crypto-js");
const router = express.Router();
const urlParser = express.urlencoded({ extended: true });

const assFunc = require("../assist_function");

router.get("/logout", function(request, response){
    response.setHeader('Set-Cookie', `attechl=die; max-age=0; HttpOnly; Path=/; SameSite=Strict`);
    response.redirect("/");
});
router.get("/reg", function(request, response){
    response.render("reg_form");
});
router.post("/reg", urlParser, async function (req, response) {
    let log = req.body.log;
    let pass = req.body.pass;
    let check_log = await assFunc.userByLog(log);
    if (check_log == undefined) {
        await db.Users.create({
            log: log,
            pass: CryptoJS.HmacMD5(pass, 'ATALENTKEY').toString()
        })
        response.redirect('/login')
    }
    else {response.send('Имя пользователя уже используется<br><button onclick="window.history.back()">Назад</button>')}
});
router.get("/login", function(request, response){
    response.render("login_form");
});
router.post("/login", urlParser, function (request, response) {
    if(!request.body) return response.sendStatus(400);
    let log  = request.body.log;
    let pass = request.body.pass;
    let check = null;
    pass = CryptoJS.HmacMD5(pass, 'ATALENTKEY').toString();
    db.Users.findAll({where:{log: log}, raw:true}).then(users=>{
        check = users[0];
        if (check.log == log && check.pass == pass) {
            let data = JSON.stringify({log:log, pass:pass});
            let enc = CryptoJS.AES.encrypt(data, "Secret Passphrase").toString();
            response.setHeader('Set-Cookie', `attechl=${enc}; HttpOnly; Path=/; SameSite=Strict; expires=Tue, 19 Jan 2037 03:14:07 GMT;`);
            response.redirect('/');
        }
        else response.send(`Неверный логин и/или пароль... Или вы ещё не зарегестрировались. На этом портале вам нужен отдельный аккаунт, если у вас его ещё нет.<br><button onclick="window.history.back()">Назад</button>`);
    }).catch(err=>{console.log(err)
        response.redirect('/login');
    });
});

module.exports = router;