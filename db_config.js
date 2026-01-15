import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const Sequelize = require("sequelize");

export const db = new Sequelize({
    dialect: "sqlite",
    storage: "db.db",
    logging: false,
    define: {
        timestamps: false,
    }
});

export const Users = db.define("users", {
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false},
    log: {type: Sequelize.STRING, allowNull: false},
    pass: {type: Sequelize.STRING, allowNull: false},
    name: {type: Sequelize.STRING, allowNull: true},
    cabinet: {type: Sequelize.STRING, allowNull: true},
    avaya: {type: Sequelize.STRING, allowNull: true},
    phone: {type: Sequelize.STRING, allowNull: true},
    email: {type: Sequelize.STRING, allowNull: true},
    is_it: {type: Sequelize.BOOLEAN, allowNull: true},
});
export const Devices = db.define("devices", {
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false},
    name: {type: Sequelize.STRING, allowNull: false},
    cab: {type: Sequelize.STRING},
    inv: {type: Sequelize.STRING},
    ip: {type: Sequelize.STRING},
    mac: {type: Sequelize.STRING},
    // model
});
export const DeviceModels = db.define("device_models", {
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false},
    name: {type: Sequelize.STRING, allowNull: false},
    json: {type: Sequelize.STRING, allowNull: false},
    // type_id
});
export const DeviceTypes = db.define("device_types", {
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false},
    name: {type: Sequelize.STRING, allowNull: false},
});
export const Parts = db.define("parts", {
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false},
    name: {type: Sequelize.STRING, allowNull: false},
    avail:{type: Sequelize.STRING,},
    descr:{type: Sequelize.STRING,},
    // device_id
});
export const Problems = db.define("problems", {
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false},
    json: {type: Sequelize.STRING,},
    status: {type: Sequelize.INTEGER, allowNull: false},
    // user_id
    // taken_by
});
Problems.belongsTo(Users, {foreignKey:'user_id', as: 'user'});
Problems.belongsTo(Users, {foreignKey:'taken_by', as: 'taken'});
DeviceModels.belongsTo(DeviceTypes, {foreignKey:'type_id', as: 'type'});
Devices.belongsTo(DeviceModels, {foreignKey:'model', as: 'model_data'});
Parts.belongsTo(Devices, {foreignKey:'device_id'});


db.sync({force: false}).then(result=>{
    // console.log(result); \
    for (let c=0;c<20;c++) {
        console.log('НЕ ЗАКРЫВАЙ МЕНЯ НЕ ЗАКРЫВАЙ МЕНЯ НЕ ЗАКРЫВАЙ МЕНЯ НЕ ЗАКРЫВАЙ МЕНЯ НЕ ЗАКРЫВАЙ МЕНЯ ');
    }
    
}).catch(err=> console.log(err));