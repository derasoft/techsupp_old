const fs = require("fs");
const path = require('path');
const CryptoJS = require('crypto-js');
const db = require('./db_config');
const expr = require('./express_config');
const {Parts} = require("./db_config");

function parseNestedQuery(x) {
    let y = JSON.stringify(x, null, 2);
    y = JSON.parse(y);
    return y;
}
async function deviceList() {
    let res = await db.Devices.findAll({order: [['id', 'ASC']], raw:false, include:{all:true, nested:true}});
    return parseNestedQuery(res);
}
async function userByLog(x) {
    let users = await db.Users.findOne({where:{log: x}, raw:true})
    return users;
}
async function userById(x) {
    let users = await db.Users.findOne({where:{id: x}, raw:true})
    return users;
}
async function deviceById(x) {
    let r = await db.Devices.findOne({where:{id: x}, raw:true, nest:true, include:{all:true, nested:true}});
    return r;
}
async function partById(x) {
    let r = await db.Parts.findOne({where:{id: x}, raw:true, nest:true, include:{all:true, nested:true}});
    return r;
}
async function partsByDeviceId(x) {
    let r = await deviceById(x);
    r = JSON.parse(r.model_data.json).parts;
    let r2 = [];
    for (let c in r) {
        r2[c] = await db.Parts.findAll({where:{id: r[Number(c)]}, raw:true});
        r2[c] = r2[c][0];
    }
    return r2;
}

// Возвращает массив заявок
async function probUserTableGet(id) {
    let x = await db.Problems.findAll({raw:true, nest:true, include:{all:true, nested:true}, where:{user_id: id}});
    for (let c in x) {
        x[c] = parseNestedQuery(x[c]);
    }
    return x;
}
// Возвращает массив всех зявок.  Индекс массива пользователя соответствует его id.
async function probAdminTableGet() {
    let x = await db.Problems.findAll({raw:true, nest:true, include:{all:true, nested:true}});
    return x;
}

expr.app.get("/logout", function(request, response){
    response.setHeader('Set-Cookie', `attechl=die; max-age=0; HttpOnly; Path=/; SameSite=Strict`);
    response.redirect("/");
});
expr.app.get("/reg", function(request, response){
    response.render("reg_form");
});
expr.app.post("/reg", expr.urlencodedParser, async function (req, response) {
    let log = req.body.log;
    let pass = req.body.pass;
    let check_log = await userByLog(log);
    if (check_log == undefined) {
        await db.Users.create({
            log: log,
            pass: CryptoJS.HmacMD5(pass, 'ATALENTKEY').toString()
        })
        response.redirect('/login')
    }
    else {response.send('Имя пользователя уже используется<br><button onclick="window.history.back()">Назад</button>')}
});
expr.app.get("/login", function(request, response){
    response.render("login_form");
});
expr.app.post("/login", expr.urlencodedParser, function (request, response) {
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

// Авторизация пользователя происходит здесь. 
expr.app.use(async function(req, res, next){
    let cystr_orig = req.cookies.attechl;
    try {
        if (cystr_orig != null) {
            let cystr = CryptoJS.AES.decrypt(cystr_orig, "Secret Passphrase").toString(CryptoJS.enc.Utf8);
            cystr = JSON.parse(cystr);
            userByLog(cystr.log).then(users=>{
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
// Страница проверки запросов
expr.app.get("/q_test", async function(req, res){
    let user = res.getHeaders().username;
    let que = await deviceById(1);
    res.render('helpers_test', {user:user, inp:que});
});

// Админская секция
expr.app.post("/adm/db/change_json", expr.urlencodedParser,  async function(req, res){
    await Parts.update({avail: req.body.value}, {where: {id: req.body.id}});
    res.redirect(`/adm/device`);
})
expr.app.get("/adm/db/change_json", expr.urlencodedParser,  async function(req, res){
    let log = res.getHeaders().username;
    if (log == undefined) {res.redirect('/login');}
    else {
        let inp =  await partById(req.query.id);
        res.render('adm/part_json_edit', {user:res.getHeaders().username, inp:inp})
    }
})
expr.app.post("/adm/db/change", expr.urlencodedParser,  async function(req, res){
    switch (req.body.type) {
        case 'parts':
            let x = await partById(req.body.id);
            x = JSON.parse(x.avail);
            x[req.body.cabinet] -= Number(req.body.count);
            x['util'] += Number(req.body.count);
            x = JSON.stringify(x);
            await Parts.update({avail: x}, {where: {id: req.body.id}});
            res.redirect(`/adm/device?id=${req.body.device_id}`);
        break;
    }

})
expr.app.get("/adm/db/que", async function(req, res){
    let que = await probAdminTableGet();
    res.render('all_queries', {user:res.getHeaders().username, que:que[0], adm:que[1], us:que[2], print:que[3]})
});
expr.app.get("/adm/db/mtp", async function(req, res){
    let models = await db.DeviceModels.findAll({order: [['id', 'ASC']], raw:false, include:{all:true, nested:true}});
    let parts = await db.Parts.findAll({order: [['id', 'ASC']], raw:false, include:{all:true, nested:true}});
    res.render('adm/mtp', {user:res.getHeaders().username, models:models, parts:parts});
});
expr.app.get("/adm/device", async function(req, res){
    if (req.query.id != undefined) {
        let device =  await deviceById(req.query.id);
        let parts = await partsByDeviceId(device.id);
        res.render('adm/adm_device', {user:res.getHeaders().username, device:device, parts:parts});
    }
    else {
        let inp = await deviceList();
        res.render('adm/adm_device_list', {user:res.getHeaders().username, inp:inp});
    }

});
expr.app.get("/adm/downloads", async function(req, res){
    if (req.query.f == undefined) {
        res.render('adm/downloads', {user:res.getHeaders().username});
    }
    else {
        res.download(path.join(__dirname, `static/share/${req.query.f}`));
    }
    
});
expr.app.get("/adm", async function(req, res){
    let inp =  await probAdminTableGet();
    res.render('adm/adm_main', {user:res.getHeaders().username, inp:inp})
});

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
        let user = await userByLog(log);
        let que = await probUserTableGet(user.id);
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
        let que = await deviceList();
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
    let y = await userByLog(res.getHeaders().username)
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