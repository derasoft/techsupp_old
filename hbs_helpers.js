const e = require('express');
const hbs = require('handlebars');

function get_type(x) {
    switch(x) {
        case 1: return "Проблема с принтером";
        case 2: return "Проблема с электронными ключами";
        default: return "Что-то нестандартное";
    }
}
function get_status(x) {
    switch (x) {
        case 0: return 'Отправлена'; 
        case 1: return 'Пытаемся связаться с вами';
        case 2: return 'В работе'; 
        case 3: return 'Завершена'; 
    }
}
module.exports = {
    // Список всех устройств
    devices_to_table: function(inp) {
        let x = `<table class="ttdd" id="devices">
            <tr>
                <td>id</td>
                <td>Имя устройства</td>
                <td>Где находится</td>
                <td>Модель</td>
                <td>Инвентарник</td>
                <td>Тип</td>
                <td>IP</td>
                <td>MAC</td>
            </tr>`;
        for (let c in inp) {
            let y = JSON.parse(inp[c].where);
            x += `<tr>
                <td>${inp[c].id}</td>
                <td><a href="/adm/device?id=${inp[c].id}">${inp[c].name}</a></td>
                <td>${y.cab}</td>
                <td>${inp[c].model_data.name}</td>
                <td>${y.inv}</td>
                <td>${inp[c].model_data.type.name}</td>
                <td>${y.ip}</td>
                <td>${y.mac}</td>
            </tr>`
        }
        x += '</table>'
        return x;
    },
    // Таблица заявок пользователя с конкретным ID
    prob_user: function(inp, id) {
        let que_string = 
        `<table class="ttdd">
            <tr>
                <td>№ Заяв.</td>
                <td>Тип</td>
                <td>№ Устр.</td>
                <td>Комментарий</td>
                <td>Статус заявки</td>
                <td>Мастер</td>
            </tr>`;
        for (c in inp) {
                let info = JSON.parse(inp[c].json);
                let y1 = get_type(info.ptype); 
                let y2 = get_status(inp[c].status); 
                que_string += 
                `<tr>
                    <td>${hbs.Utils.escapeExpression(inp[c].id)}</td>
                    <td>${hbs.Utils.escapeExpression(y1)}</td>
                    <td>${hbs.Utils.escapeExpression(info.device_id)}</td>
                    <td>${hbs.Utils.escapeExpression(info.comment)}</td>
                    <td>${hbs.Utils.escapeExpression(y2)}</td>
                    <td>${hbs.Utils.escapeExpression(inp[c].taken.name)}</td>
                </tr>`;
            }
        que_string += `</table>`;
        return new hbs.SafeString(que_string);
    },
    prob_raw: function(inp) {
        let que_string = 
        `<table class="ttdd">
            <tr>
                <td>id</td>
                <td>Пользователь</td>
                <td>№ устр.</td>
                <td>Тип</td>
                <td>Комментарий</td>
                <td>Статус</td>
                <td>Мастер</td>
                <td>Действие</td>
            </tr>`;
        for (let c in inp) {
            let info = JSON.parse(inp[c].json);
            let y1 = get_type(info.ptype); 
            let y2 = get_status(inp[c].status); 
            que_string += 
            `<tr>
                <td>${hbs.Utils.escapeExpression(inp[c].id)}</td>
                <td>${hbs.Utils.escapeExpression(inp[c].user.name)}</td>
                <td>${hbs.Utils.escapeExpression(info.device_id)}</td>
                <td>${hbs.Utils.escapeExpression(y1)}</td>
                <td>${hbs.Utils.escapeExpression(info.comment)}</td>
                <td>${hbs.Utils.escapeExpression(y2)}</td>
                <td>${hbs.Utils.escapeExpression((inp[c].taken_by != undefined) ? inp[c].taken.name : '---')} </td>
                <td></td>
            </tr>`
        }
        que_string += `</table>`;
        return new hbs.SafeString(que_string);
    },
    // Страница самого устройства
    device_info: function(device, parts) {
        let wh = JSON.parse(device.where);
        let r = `<h1>${device.name}</h1>
        <p>Тип: ${device.model_data.type.name}</p>
        <p>Модель: ${device.model_data.name}</p>
        <p>Сейчас находится в: ${wh.cab}</p>
        <p>Инвентарный номер: ${wh.inv}</p>`;
        switch (device.model_data.type.name) {
            case 'Принтер':
                let cartriges = [];
                for (let c in parts) {
                    cartriges.push(parts[c]);
                    parts[c].avail = JSON.parse(parts[c].avail);
                }
                let cartString = '';
                for (let c in cartriges) {
                    let cartAval = '';
                    let cartSelect = `<select name="cabinet">`;
                    for (let c2 in cartriges[c].avail) {
                        if (c2 == 'util') cartAval += `В утиле: ${cartriges[c].avail[c2]}<br>`
                        else {
                            cartAval += `В ${c2} есть ${cartriges[c].avail[c2]} штук<br>`;
                            cartSelect += `<option value="${c2}">${c2}</option>`
                        }
                    }
                    cartSelect += '</select>';
                    r += `<p>
                        <form action="/adm/db/device" method="post">${cartriges[c].descr} ${cartriges[c].name + '<br>' + cartAval + cartSelect}
                        <input hidden name="device_id" value="${device.id}" />
                        <input hidden name="id" value="${cartriges[c].id}" />
                        <input hidden name="type" value="parts" />
                        <input type="number" name="count" />
                        <input type="submit" value="Использовать" />
                        </form>
                    </p>`;
                }
            break
        }
        return r;
    },
    // Таблица "Детали-к-Устройствам"
    table_parts_to_components: function (models, parts) {
        let r = `<table class="ttdd" id="partsToComponents">
        <tr>
            <td>id</td>
            <td>Устройство</td>
            <td>Его части</td>
        </tr>`
        let x, y, z;
        for (let c in models) {
            y = JSON.parse(models[c].json).parts;
            z = '';
            for (let c2 in y) {
                for (let c3 in parts){
                    if (parts[c3].id == y[c2]) {
                        z += parts[c3].name + ' | ';
                        break;
                    }
                }
            }
            r += `<tr>
                <td>${models[c].id}</td> 
                <td>${models[c].name}</td>
                <td>${z}</td>
            </tr>`;
        }
        r += '</table>';
        return r;
    },
    // Полный перечень утиля
    util_cartriges: function (cartriges) {
        let r = `<table class="ttdd" id="util">
        <tr>
            <td>id</td>
            <td>Имя</td>
            <td>Кол-во</td>
        </tr>`
        for (c of cartriges) {
            let util = JSON.parse(c.avail).util;
            r += `<tr>
                <td>${c.id}</td>
                <td>${c.name}</td>
                <td>${util}</td>
            </tr>`;
        }
        return r;
    }
}