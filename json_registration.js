const utils = require('myscripts_utils');
const validators = require('myscripts_validators');

function validate(task) {
    if (!validators.isMissing(validators.mustObjectOrMissing(task.operator, "operator"))) {
        validators.mustObject(task.operator, "operator");
        validators.mustString(task.operator.name, "operator.name");
        validators.mustStringOrMissing(task.operator.vatin, "operator.vatin");
    }

    validators.mustBooleanOrMissing(task.electronically, "electronically");

    var organization = validators.mustObject(task.organization, "organization");
    ["name", "vatin", "email", "address"].forEach(function (item, index) {
        validators.mustStringOrMissing(organization[item], "organization." + item);
    });
    var tts = validators.mustArrayOrMissing(organization.taxationTypes, "organization.taxationTypes");
    if (!validators.isMissing(tts)) {
        for (var i = 0; i < tts.length; ++i) {
            try {
                validators.mustStringValues(tts[i], "", Object.keys(utils.TAXATION_TYPES));
            } catch (e) {
                if (e.name === "InvalidJsonValueError") {
                    throw new validators.InvalidJsonValueError(utils.makeDotPath("organization.taxationTypes[" + i + "]", e.path), e.value);
                } else if (e.name === "InvalidJsonTypeError") {
                    throw new validators.InvalidJsonTypeError(utils.makeDotPath("organization.taxationTypes[" + i + "]", e.path), e.expectedType);
                } else if (e.name === "JsonValueNotFoundError") {
                    throw new validators.JsonValueNotFoundError(utils.makeDotPath("organization.taxationTypes[" + i + "]", e.path));
                } else {
                    throw e;
                }
            }
        }
    }
    var agents = validators.mustArrayOrMissing(organization.agents, "organization.agents");
    if (!validators.isMissing(agents)) {
        for (var i = 0; i < agents.length; ++i) {
            try {
                validators.mustStringValues(agents[i], "", ["bankPayingAgent", "bankPayingSubagent",
                    "payingAgent", "payingSubagent", "attorney",
                    "commissionAgent", "another"]);
            } catch (e) {
                if (e.name === "InvalidJsonValueError") {
                    throw new validators.InvalidJsonValueError(utils.makeDotPath("organization.agents[" + i + "]", e.path), e.value);
                } else if (e.name === "InvalidJsonTypeError") {
                    throw new validators.InvalidJsonTypeError(utils.makeDotPath("organization.agents[" + i + "]", e.path), e.expectedType);
                } else if (e.name === "JsonValueNotFoundError") {
                    throw new validators.JsonValueNotFoundError(utils.makeDotPath("organization.agents[" + i + "]", e.path));
                } else {
                    throw e;
                }
            }
        }
    }

    var device = validators.mustObject(task.device, "device");
    ["registrationNumber", "fnsUrl", "machineNumber", "paymentsAddress"].forEach(function (item, index) {
        validators.mustStringOrMissing(device[item], "device." + item);
    });
    ["offlineMode", "machineInstallation", "bso", "encryption",
        "autoMode", "internet", "service", "excise", "gambling", "lottery",
        "pawnShop", "insurance", "marking"].forEach(function (item, index) {
        validators.mustBooleanOrMissing(device[item], "device." + item);
    });
    validators.mustStringOrMissingValues(device.defaultTaxationType, "device.defaultTaxationType",
        tts);
    validators.mustStringOrMissingValues(device.ofdChannel, "device.ofdChannel",
        ["usb", "ethernet", "wifi", "gsm", "proto", "tcpipOsStack"]);
    validators.mustStringValues(device.ffdVersion, "device.ffdVersion",
        Object.keys(utils.FFD_VERSIONS));

    var ofd = validators.mustObject(task.ofd, "ofd");
    for (var field in ["name", "vatin", "host", "dns"]) {
        validators.mustStringOrMissing(ofd[field], "ofd." + field);
    }
    validators.mustNumberOrMissing(ofd.port, "ofd.port");
}

function validateTask(task) {
    try {
        validate(task);
    } catch (e) {
        if (e.name === "InvalidJsonValueError") {
            return Fptr.result(Fptr.LIBFPTR_ERROR_RECEIPT_PARSE_ERROR, "Некорректное значение поля \"" + e.path + "\" (" + e.value + ")")
        } else if (e.name === "InvalidJsonTypeError") {
            return Fptr.result(Fptr.LIBFPTR_ERROR_RECEIPT_PARSE_ERROR, "Поле \"" + e.path + "\" имеет неверный тип (ожидается \"" + e.expectedType + "\")");
        } else if (e.name === "JsonValueNotFoundError") {
            return Fptr.result(Fptr.LIBFPTR_ERROR_RECEIPT_PARSE_ERROR, "Поле \"" + e.path + "\" отсутствует");
        } else {
            throw e;
        }
    }
    return Fptr.ok();
}

function execute(task) {
    v = validateTask(task);
    if (v.isError) {
        return v;
    }

    // Если не дозакрыть документ закрытия смены, то проверка состояния смены может вернуть, что смена все еще открыта
    Fptr.continuePrint();

    // Отменяем текущий открытый документ
    if (Fptr.cancelReceipt() < 0 && !utils.isNormalCancelError(Fptr.errorCode())) {
        return Fptr.error();
    }

    // В открытой смене сразу выдаем ошибку
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_STATUS);
    if (Fptr.queryData() < 0) {
        return Fptr.error();
    }
    if (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_STATE) !== Fptr.LIBFPTR_SS_CLOSED) {
        return Fptr.result(Fptr.LIBFPTR_ERROR_DENIED_IN_OPENED_SHIFT);
    }

    var offlineMode = task.device.offlineMode;


    var ffdVersion = utils.FFD_VERSIONS[task.device.ffdVersion];

    // Корректируем версию ФФД в задании
    // Отказываемся от необязательности ffdVersion (RNDACP-2660), пока оставим код для восстановления
    // if (ffdVersion === undefined) {
    //     Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
    //     if (Fptr.fnQueryData() < 0) {
    //         return Fptr.error();
    //     }
    //
    //     var currentFfdVersion = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FFD_VERSION);
    //     if (currentFfdVersion === Fptr.LIBFPTR_FFD_UNKNOWN) {
    //         currentFfdVersion = Fptr.LIBFPTR_FFD_1_0_5;
    //     }
    //     ffdVersion = currentFfdVersion;
    // }

    if (!validators.isMissing(task.operator) && task.operator.name) {
        Fptr.setParam(1021, task.operator.name);
        Fptr.setParam(1203, task.operator.vatin, Fptr.IGNORE_IF_EMPTY);
        if (Fptr.operatorLogin() < 0) {
            return Fptr.error();
        }
    }

    // Сначала выставляем настройки ККТ
    // Адрес ОФД
    if (!validators.isMissing(task.ofd.host) && task.ofd.host) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 273);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, task.ofd.host);
        if (Fptr.writeDeviceSetting() < 0 && Fptr.errorCode() !== Fptr.LIBFPTR_ERROR_NOT_SUPPORTED && !offlineMode) {
            return Fptr.error();
        }
    }

    // Порт ОФД
    if (!validators.isMissing(task.ofd.port) && task.ofd.port >= 0) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 274);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, task.ofd.port);
        if (Fptr.writeDeviceSetting() < 0 && Fptr.errorCode() !== Fptr.LIBFPTR_ERROR_NOT_SUPPORTED && !offlineMode) {
            return Fptr.error();
        }
    }

    // DNS ОФД
    if (!validators.isMissing(task.ofd.dns) && task.ofd.dns) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 275);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, task.ofd.dns);
        if (Fptr.writeDeviceSetting() < 0 && Fptr.errorCode() !== Fptr.LIBFPTR_ERROR_NOT_SUPPORTED && !offlineMode) {
            return Fptr.error();
        }
    }
    // Канал обмена с ОФД
    if (!validators.isMissing(task.device.ofdChannel) && task.device.ofdChannel) {
        switch (task.device.ofdChannel) {
            case "usb":
                Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, 1);
                break;
            case "ethernet":
                Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, 2);
                break;
            case "wifi":
                Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, 3);
                break;
            case "gsm":
                Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, 4);
                break;
            case "proto":
                Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, 5);
                break;
            case "tcpipOsStack":
                Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, 6);
                break;
            default:
                return Fptr.result(Fptr.LIBFPTR_ERROR_RECEIPT_PARSE_ERROR, "Некорректное значение поля \"device.ofdChannel\" (" + device.ofdChannel + ")");
        }

        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 276);
        if (Fptr.writeDeviceSetting() < 0 && Fptr.errorCode() !== Fptr.LIBFPTR_ERROR_NOT_SUPPORTED && !offlineMode) {
            return Fptr.error();
        }
    }

    if (ffdVersion >= Fptr.LIBFPTR_FFD_1_2) {
        if (!validators.isMissing(task.ism)) {
            // Адрес ИСМ
            if (!validators.isMissing(task.ism.host) && task.ism.host) {
                Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 1000);
                Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, task.ism.host);
                if ((Fptr.writeDeviceSetting() < 0) && (Fptr.errorCode() !== Fptr.LIBFPTR_ERROR_NOT_SUPPORTED) && !offlineMode) {
                    return Fptr.error();
                }
            }

            // Порт ИСМ
            if (!validators.isMissing(task.ism.port) && (task.ism.port >= 0)) {
                Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 1001);
                Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, task.ism.port);
                if ((Fptr.writeDeviceSetting() < 0) && (Fptr.errorCode() !== Fptr.LIBFPTR_ERROR_NOT_SUPPORTED) && !offlineMode) {
                    return Fptr.error();
                }
            }
        }
    }

    // СНО по умолчанию
    if (!validators.isMissing(task.device.defaultTaxationType) && task.device.defaultTaxationType) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 50);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, utils.TAXATION_TYPES[task.device.defaultTaxationType]);
        if (Fptr.writeDeviceSetting() < 0 &&
            Fptr.errorCode() !== Fptr.LIBFPTR_ERROR_NOT_SUPPORTED &&
            Fptr.errorCode() !== Fptr.LIBFPTR_ERROR_INVALID_SCRIPT_NUMBER) {
            return Fptr.error();
        }
    }

    if (Fptr.commitSettings() < 0) {
        return Fptr.error();
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_OPERATION_TYPE, Fptr.LIBFPTR_FNOP_REGISTRATION);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_REPORT_ELECTRONICALLY, task.electronically, Fptr.IGNORE_IF_EMPTY);
    if (ffdVersion === Fptr.LIBFPTR_FFD_1_0_5) {
        Fptr.setParam(1101, 0);
    } else {
        Fptr.setParam(1205, 0);
    }

    // Корректируем ИНН ОФД для офлайн-режима работы
    if (task.device.offlineMode) {
        task.ofd.vatin = "0".repeat(12);
    }

    Fptr.setParam(1037, task.device.registrationNumber, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1018, task.organization.vatin, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1017, task.ofd.vatin, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1046, task.ofd.name, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1048, task.organization.name, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1009, task.organization.address, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1117, task.organization.email, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1187, task.device.paymentsAddress, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1002, task.device.offlineMode, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1056, task.device.encryption, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1109, task.device.service, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1207, task.device.excise, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1193, task.device.gambling, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1126, task.device.lottery, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1110, task.device.bso, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1108, task.device.internet, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1221, task.device.machineInstallation, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1060, task.device.fnsUrl, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1001, task.device.autoMode, Fptr.IGNORE_IF_EMPTY);
    if (task.device.autoMode) {
        Fptr.setParam(1036, task.device.machineNumber, Fptr.IGNORE_IF_EMPTY);
    }
    Fptr.setParam(1209, ffdVersion);

    var taxationTypes = 0;
    if (!validators.isMissing(task.organization.taxationTypes)) {
        for (var i = 0; i < task.organization.taxationTypes.length; i++) {
            taxationTypes |= utils.TAXATION_TYPES[task.organization.taxationTypes[i]];
        }
    }
    Fptr.setParam(1062, taxationTypes);

    if (ffdVersion < Fptr.LIBFPTR_FFD_1_2) {
        var agentTypes = 0;
        if (!validators.isMissing(task.organization.agents)) {
            for (var i = 0; i < task.organization.agents.length; i++) {
                agentTypes |= utils.AGENT_TYPES[task.organization.agents[i]];
            }
        }
        Fptr.setParam(1057, agentTypes);
    }
    else
    {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_PAWN_SHOP_ACTIVITY, task.device.pawnShop, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_INSURANCE_ACTIVITY, task.device.insurance, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_TRADE_MARKED_PRODUCTS, task.device.marking, Fptr.IGNORE_IF_EMPTY);
    }

    if (Fptr.fnOperation() < 0) {
        var e = Fptr.error();
        if (e.error === Fptr.LIBFPTR_ERROR_DENIED_IN_CLOSED_SHIFT) {
            return e;
        }

        Fptr.checkDocumentClosed();
        if (!Fptr.getParamBool(Fptr.LIBFPTR_PARAM_DOCUMENT_CLOSED)) {
            return e;
        }

        Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_STATUS);
        Fptr.queryData();
        if (!Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FISCAL)) {
            return e;
        }
    }

    return utils.getFiscalDocumentResult();
}
