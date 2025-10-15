const path = require("path");
const express = require("express");
const router = express.Router();
const urlParser = express.urlencoded({ extended: true });

const assFunc = require("../assist_function");
const db = require('../db_config');
router.get("/editor/device", async function (req, res) {
   let device = await assFunc.deviceById(req.query.id);
   device.where = JSON.parse(device.where);
   let models = await assFunc.deviceModelsList();
   res.render("editors/device_editor", {user:res.getHeaders().username, device: device, models: models});
});
router.post("/editor/device", urlParser, async function(req, res){
    
})
router.get("/db/que", async function(req, res){
    let que = await assFunc.probAdminTableGet();
    res.render('all_queries', {user:res.getHeaders().username, que:que[0], adm:que[1], us:que[2], print:que[3]})
});
router.get("/db/tables", async function(req, res) {
    let devices = await assFunc.deviceList();
    let models = await assFunc.deviceModelsList();
    let parts = await assFunc.partsList();
    res.render('adm/tables', {user:res.getHeaders().username, models:models, parts:parts, devices:devices});
});
router.get("/device", async function(req, res){
    if (req.query.id != undefined) {
        let device =  await assFunc.deviceById(req.query.id);
        let parts = await assFunc.partsByDeviceId(device.id);
        res.render('adm/adm_device', {user:res.getHeaders().username, device:device, parts:parts});
    }
    else res.redirect(`/adm/db/tables`);
});
router.post("/db/device", urlParser, async function(req, res){
    switch (req.body.type) {
        case 'parts':
            let x = await assFunc.partById(req.body.id);
            x = JSON.parse(x.avail);
            x[req.body.cabinet] -= Number(req.body.count);
            x['util'] += Number(req.body.count);
            x = JSON.stringify(x);
            await db.Parts.update({avail: x}, {where: {id: req.body.id}});
            res.redirect(`/adm/device?id=${req.body.device_id}`);
            break;
    }
})
router.get("/downloads", async function(req, res){
    if (req.query.f == undefined) {
        res.render('adm/downloads', {user:res.getHeaders().username});
    }
    else {
        res.download(path.join(__dirname, `../static/share/${req.query.f}`));
    }

});
router.get("/", async function(req, res){
    let inp =  await assFunc.probAdminTableGet();
    res.render('adm/adm_main', {user:res.getHeaders().username, inp:inp})
});

module.exports = router;