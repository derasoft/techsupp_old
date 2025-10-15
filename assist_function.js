import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const db = require('./db_config');

export function parseNestedQuery(x) {
    let y = JSON.stringify(x, null, 2);
    y = JSON.parse(y);
    return y;
}
// ----------РАБОТА С УСТРОЙСТВАМИ И ДЕТАЛЯМИ----------
// получить список всех устройств
export async function deviceList() {
    let res = await db.Devices.findAll({order: [['id', 'ASC']], raw:false, include:{all:true, nested:true}});
    return parseNestedQuery(res);
}
export async function deviceModelsList() {
    let res = await db.DeviceModels.findAll({order: [['id', 'ASC']], raw:false, include:{all:true, nested:true}});
    return parseNestedQuery(res);
}
export async function partsList() {
    let res = await db.Parts.findAll({order: [['id', 'ASC']], raw:false, include:{all:true, nested:true}});
    return parseNestedQuery(res);
}
// Получить нечто по id
export async function deviceById(x) {
    let r = await db.Devices.findOne({where:{id: x}, raw:true, nest:true, include:{all:true, nested:true}});
    return r;
}
export async function partById(x) {
    let r = await db.Parts.findOne({where:{id: x}, raw:true, nest:true, include:{all:true, nested:true}});
    return r;
}
// Найти все запчасти устройства
export async function partsByDeviceId(x) {
    let r = await deviceById(x);
    r = JSON.parse(r.model_data.json).parts;
    let r2 = [];
    for (let c in r) {
        r2[c] = await db.Parts.findAll({where:{id: r[Number(c)]}, raw:true});
        r2[c] = r2[c][0];
    }
    return r2;
}

// ----------РАБОТА С ПОЛЬЗОВАТЕЛЯМИ----------
// Получить пользователя с указанным логином
export async function userByLog(x) {
    let users = await db.Users.findOne({where:{log: x}, raw:true})
    return users;
}
// Получить пользователя с указанным id
export async function userById(x) {
    let users = await db.Users.findOne({where:{id: x}, raw:true})
    return users;
}

// ----------РАБОТА С ЗАЯВКАМИ----------
// Возвращает массив заявок
export async function probUserTableGet(id) {
    let x = await db.Problems.findAll({raw:true, nest:true, include:{all:true, nested:true}, where:{user_id: id}});
    for (let c in x) {
        x[c] = parseNestedQuery(x[c]);
    }
    return x;
}
// Возвращает массив всех зявок. Индекс массива пользователя соответствует его id.
export async function probAdminTableGet() {
    let x = await db.Problems.findAll({raw:true, nest:true, include:{all:true, nested:true}});
    return x;
}