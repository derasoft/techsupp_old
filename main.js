const fs = require("fs");
const path = require('path');
const CryptoJS = require('crypto-js');

const db = require('./db_config');
const expr = require('./express_config');
const assFunc = require('./assist_function');

const logRouter = require('./routes/log');
const adminRouter = require('./routes/adm');

// Роутер авторизации
expr.app.use('/log', logRouter);
// Авторизация пользователя происходит здесь. Чтобы не дать посторонним зайти по адресу,
// добавь следущую конструкцию в адрес. В дальнейшем нужно будет сделать это через мидлвари.
//      let log = res.getHeaders().username;
//      if (log == undefined) {res.redirect('/login');}
//      else {...}
expr.app.use(async function(req, res, next){
    let cystr_orig = req.cookies.attechl;
    try {
        if (cystr_orig != null) {
            let cystr = CryptoJS.AES.decrypt(cystr_orig, "Secret Passphrase").toString(CryptoJS.enc.Utf8);
            cystr = JSON.parse(cystr);
            assFunc.userByLog(cystr.log).then(users=>{
                let check = users;
                if (cystr.log == check.log && cystr.pass == check.pass) {
                    res.setHeader('passme', 'true');
                    res.setHeader('username', cystr.log)
                    next();
                }
                else {
                    console.log('Неправильная печенька');
                    res.setHeader('passme', 'false');
                    response.setHeader('Set-Cookie', `attechl=die; max-age=0; HttpOnly; Path=/; SameSite=Strict`);
                    next();
                }
            }).catch(err=>{
                console.log(err)
                console.log('Неправильная печенька');
                res.setHeader('passme', 'false');
                res.setHeader('Set-Cookie', `attechl=die; max-age=0; HttpOnly; Path=/; SameSite=Strict`);
                next();
            });
        }
        else {
            next();
        }
    }
    catch (err) {
        res.setHeader('passme', 'null');
        console.log(err);
        next();
    }
});
// Роутер админов
expr.app.use('/adm', adminRouter);

// Юзерская секция
expr.app.post("/profile", expr.urlencodedParser, function(req, response){
    let headers = response.getHeaders();
    db.Users.update(
        { 
            name:req.body.name, 
            cabinet:req.body.cabinet, 
            avaya:req.body.avaya, 
            phone:req.body.phone, 
            email:req.body.email 
        }, 
        {
            where: {log: headers.username}
        }
    ).then((res) => {response.redirect('/profile');});
});
expr.app.get("/profile", async function(req, res){
    let log = res.getHeaders().username;
    if (log == undefined) {res.redirect('/login');}
    else {
        let user = await assFunc.userByLog(log);
        let que = await assFunc.probUserTableGet(user.id);
        res.render(
            'profile', {
                title: 'Профиль',
                user: log,
                name: user.name,
                cabinet: user.cabinet,
                avaya: user.avaya,
                phone: user.phone,
                email: user.email,
                que:que, 
                id: user.id,
            }
        );
    }
});
expr.app.get("/que/new", async function(req, res){
    let log = res.getHeaders().username;
    if (log == undefined) {res.redirect('/login');}
    else {
        let que = await assFunc.deviceList();
        res.render('que_new', {user:res.getHeaders().username, inp:que});
    }
});
expr.app.post("/que/new", expr.urlencodedParser, async function(req, res){
    let problem = req.body;
    let x = {
        ptype: problem.generalType,
        printerProblem: problem.printerProblem,
        device_id: problem.deviceID,
        comment: problem.other,
    }
    let y = await assFunc.userByLog(res.getHeaders().username)
    x = JSON.stringify(x);
    db.Problems.create({
        user_id: y.id,
        json: x,
        status: 0,
    })
    res.redirect('/');
});
expr.app.get("/", function(req, res){
    res.render('index', {user:res.getHeaders().username, title:'Главная'});
});