const utils = require('myscripts_utils');

const reggieDate = /^(\d{4}).(\d{2}).(\d{2})$/;

/**
 * Проверяет наличие значения у поля
 * @param field Поле
 * @returns {boolean} true, если поле имеет значение
 */
exports.isMissing = function (field) {
    if ((field === null) || (field === undefined)) {
        return true;
    }
    if (typeof(field) === "object") {
        return (Object.keys(field).length === 0 && field.constructor === Object);
    }

    return false;
};

/**
 * Проверяет наличие overlay, подходящего для комбинированной печати QR-кода и текста
 * @param field Поле
 * @returns {boolean} true, если поле имеет подходящее значение overlay
 */
exports.isOverlayFor1006 = function (field) {
    // Если поле остутствует, то дальше не проверяем
    if (exports.isMissing(field)) {
        return false;
    }

    // Если поле есть, и это массив, проверяем что массив не пустой
    if (typeof(field) === "object" && Object.keys(field).length === 0) {
        return false;
    }

    // Проверяем, что ККТ поддерживает шаблоны (т.е. П5)
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_SCRIPTS_INFO);
    if (Fptr.queryData() < 0) {
        return false;
    }

    return true;
};


/**
 * Проверяет, задано ли значение поля
 * @param field Поле
 * @param name Наименование поля для исключения
 * @returns Значение поля
 * @throws JsonValueNotFoundError, если поле не найдено
 */
exports.mustValue = function(field, name) {
    if (exports.isMissing(field)) {
        throw new exports.JsonValueNotFoundError(name);
    }
    return field;
};
/**
 * Проверяет, что тип поля соответствует одному из указанных
 * @param field Поле
 * @param name Наименование поля для исключения
 * @param types Список типов
 * @returns Значение поля
 * @throws JsonValueNotFoundError, если поле не найдено
 * @throws InvalidJsonTypeError, если тип поля не входит список types
 */
exports.mustTypes = function(field, name, types) {
    exports.mustValue(field, name);
    if (types.indexOf(typeof(field)) < 0) {
        throw new exports.InvalidJsonTypeError(name, types.join("|"));
    }
    return field;
};
/**
 * Проверяет, что тип поля соответствует одному из указанных или отсутствует
 * @param field Поле
 * @param name Наименование поля для исключения
 * @param types Список типов
 * @returns Значение поля
 * @throws InvalidJsonTypeError, если тип поля не входит список types
 */
exports.mustTypesOrMissing = function(field, name, types) {
    types.push("undefined");
    if (field !== null && types.indexOf(typeof(field)) < 0) {
        throw new exports.InvalidJsonTypeError(name, types.join("|"));
    }
    return field;
};

/**
 * Проверяет, что поле - числовое
 * @param field Поле
 * @param name Наименование поля для исключения
 * @returns Значение поля
 * @throws JsonValueNotFoundError, если поле не найдено
 * @throws InvalidJsonTypeError, если значение поля - не число
 */
exports.mustNumber = function(field, name) {
    exports.mustTypes(field, name, ["number"]);
    return field
};
/**
 * Проверяет, что поле - логическое
 * @param field Поле
 * @param name Наименование поля для исключения
 * @returns Значение поля
 * @throws JsonValueNotFoundError, если поле не найдено
 * @throws InvalidJsonTypeError, если значение поля - не bool
 */
exports.mustBoolean = function(field, name) {
    exports.mustTypes(field, name, ["boolean"]);
    return field
};
/**
 * Проверяет, что поле - строковое
 * @param field Поле
 * @param name Наименование поля для исключения
 * @returns Значение поля
 * @throws JsonValueNotFoundError, если поле не найдено
 * @throws InvalidJsonTypeError, если значение поля - не строка
 */
exports.mustString = function(field, name) {
    exports.mustTypes(field, name, ["string"]);
    return field
};
/**
 * Проверяет, что поле - произвольный объект
 * @param field Поле
 * @param name Наименование поля для исключения
 * @returns Значение поля
 * @throws JsonValueNotFoundError, если поле не найдено
 * @throws InvalidJsonTypeError, если значение поля - не объект
 */
exports.mustObject = function(field, name) {
    exports.mustTypes(field, name, ["object"]);
    return field
};
/**
 * Проверяет, что поле - массив
 * @param field Поле
 * @param name Наименование поля для исключения
 * @return Поле
 * @throws JsonValueNotFoundError, если поле не найдено
 * @throws InvalidJsonTypeError, если значение поля - не массив
 */
exports.mustArray = function(field, name) {
    exports.mustValue(field, name);
    if (Object.prototype.toString.call(field) !== "[object Array]") {
        throw new exports.InvalidJsonTypeError(name, "array");
    }
    return field
};
/**
 * Проверяет, что поле - массив байтов
 * @param field Поле
 * @param name Наименование поля для исключения
 * @return Поле
 * @throws JsonValueNotFoundError, если поле не найдено
 * @throws InvalidJsonTypeError, если значение поля - не массив байтов
 */
exports.mustByteArray = function(field, name) {
    exports.mustValue(field, name);
    if (Object.prototype.toString.call(field) !== "[object Uint8Array]") {
        throw new exports.InvalidJsonTypeError(name, "array");
    }
    return field
};

/**
 * Проверяет, что поле - числовое или отсутствует
 * @param field Поле
 * @param name Наименование поля для исключения
 * @returns Значение поля
 * @throws InvalidJsonTypeError, если значение поля - не число
 */
exports.mustNumberOrMissing = function(field, name) {
    exports.mustTypesOrMissing(field, name, ["number"]);
    return field
};
/**
 * Проверяет, что поле - логическое или отсутствует
 * @param field Поле
 * @param name Наименование поля для исключения
 * @returns Значение поля
 * @throws InvalidJsonTypeError, если значение поля - не bool
 */
exports.mustBooleanOrMissing = function(field, name) {
    exports.mustTypesOrMissing(field, name, ["boolean"]);
    return field
};
/**
 * Проверяет, что поле - строковое или отсутствует
 * @param field Поле
 * @param name Наименование поля для исключения
 * @returns Значение поля
 * @throws InvalidJsonTypeError, если значение поля - не строка
 */
exports.mustStringOrMissing = function(field, name) {
    exports.mustTypesOrMissing(field, name, ["string"]);
    return field
};
/**
 * Проверяет, что поле - произвольный объект или отсутствует
 * @param field Поле
 * @param name Наименование поля для исключения
 * @return Поле
 * @throws InvalidJsonTypeError, если значение поля - не объект
 */
exports.mustObjectOrMissing = function(field, name) {
    exports.mustTypesOrMissing(field, name, ["object"]);
    return field
};
/**
 * Проверяет, что поле - массив или отсутствует
 * @param field Поле
 * @param name Наименование поля для исключения
 * @returns Значение поля
 * @throws InvalidJsonTypeError, если значение поля - не массив
 */
exports.mustArrayOrMissing = function(field, name) {
    if (!exports.isMissing(field) && Object.prototype.toString.call(field) !== "[object Array]") {
        throw new exports.InvalidJsonTypeError(name, "array|undefined");
    }
    return field
};

/**
 * Проверяет, что поле - строковое, и его значение соответствует одному из списка
 * @param field Поле
 * @param name Наименование поля для исключения
 * @param values Список возможных значений
 * @returns Значение поля
 * @throws JsonValueNotFoundError, если поле не найдено
 * @throws InvalidJsonTypeError, если значение поля - не строка
 * @throws InvalidJsonValueError, если значение поля не соответствуюет ни одному из values
 */
exports.mustStringValues = function(field, name, values) {
    exports.mustTypes(field, name, ["string"]);
    if (values.indexOf(field) < 0) {
        throw new exports.InvalidJsonValueError(name, field);
    }
    return field
};

/**
 * Проверяет, что поле - строковое и его значение соответствует одному из списка, либо отсутствует
 * @param field Поле
 * @param name Наименование поля для исключения
 * @param values Список возможных значений
 * @returns Значение поля
 * @throws InvalidJsonTypeError, если значение поля - не строка
 * @throws InvalidJsonValueError, если значение поля не соответствуюет ни одному из values
 */
exports.mustStringOrMissingValues = function(field, name, values) {
    exports.mustTypesOrMissing(field, name, ["string"]);
    if (!exports.isMissing(field) && field && values.indexOf(field) < 0) {
        throw new exports.InvalidJsonValueError(name, field);
    }
    return field
};

/**
 * Проверяет, что поле - произвольный объект, и проверяет его значение через переданный валидатор
 * @param field Поле
 * @param name Наименование поля для исключения
 * @param validator Валидатор
 * @returns Значение поля
 * @throws JsonValueNotFoundError, если поле не найдено
 * @throws InvalidJsonTypeError, если значение поля - не объект
 * @throws Исключения, которые возвращает переданный валидатор
 */
exports.mustObjectValidator = function(field, name, validator) {
    exports.mustObject(field, name);
    validator(field);
    return field
};

/**
 * Проверяет, что поле - произвольный объект, и проверяет его значение через переданный валидатор; либо поле отсутствует
 * @param field Поле
 * @param name Наименование поля для исключения
 * @param validator Валидатор
 * @returns Значение поля
 * @throws InvalidJsonTypeError, если значение поля - не объект
 * @throws Исключения, которые возвращает переданный валидатор
 */
exports.mustObjectOrMissingValidator = function(field, name, validator) {
    exports.mustObjectOrMissing(field, name);
    if (!exports.isMissing(field))
        validator(field);
    return field
};

/**
 * Проверяет, что поле - строковое или числовое и его значение соответствует либо ключу, либо значению словаря; либо отсутствует
 * @param field Поле
 * @param name Наименование поля для исключения
 * @param dict Словарь
 * @returns Значение поля
 * @throws InvalidJsonTypeError, если значение поля - не строка или число
 * @throws InvalidJsonValueError, если значение поля не соответствуюет ни одному из значений словаря
 */
exports.mustDictValueOrMissing = function(field, name, dict) {
    exports.mustTypesOrMissing(field, name, ["string", "number"]);
    if (!exports.isMissing(field) && field && (typeof(field) === "string") && Object.keys(dict).indexOf(field) < 0) {
        throw new exports.InvalidJsonValueError(name, field);
    }
    return field
};

/**
 * Проверяет, что поле - строковое или числовое и его значение соответствует либо ключу, либо значению словаря
 * @param field Поле
 * @param name Наименование поля для исключения
 * @param dict Словарь
 * @returns Значение поля
 * @throws InvalidJsonTypeError, если значение поля - не строка или число
 * @throws InvalidJsonValueError, если значение поля не соответствуюет ни одному из значений словаря
 */
exports.mustDictValue = function(field, name, dict) {
    exports.mustTypes(field, name, ["string", "number"]);
    if (!exports.isMissing(field) && field && (typeof(field) === "string") && Object.keys(dict).indexOf(field) < 0) {
        throw new exports.InvalidJsonValueError(name, field);
    }
    return field
};

/**
 * Исключение - некорректное значение поля в JSON-задании
 * @param path Путь к полю
 * @param value Текущее значение поля
 * @constructor
 */
exports.InvalidJsonValueError = function (path, value) {
    this.name = "InvalidJsonValueError";
    this.path = path;
    this.value = value;
};

/**
 * Исключение - некорректный тип поля в JSON-задании
 * @param path Путь к полю
 * @param expectedType Ожидаемый тип
 * @constructor
 */
exports.InvalidJsonTypeError = function (path, expectedType) {
    this.name = "InvalidJsonTypeError";
    this.path = path;
    this.expectedType = expectedType;
};

/**
 * Исключение - поле не найдено
 * @param path Путь к полю
 * @constructor
 */
exports.JsonValueNotFoundError = function (path) {
    this.name = "JsonValueNotFoundError";
    this.path = path;
};

/**
 * Исключение - слишком большое JSON задание
 * @param path Путь к полю
 * @param value Текущее значение поля
 * @constructor
 */
exports.JsonSizeToBig = function (value) {
    this.name = "JsonSizeToBig";
    this.value = value;
};

/**
 * Проверяет элемент документа (чека) "Текст"
 * @param item Текстовое поле
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validateTextItem = function(item) {
    exports.mustStringOrMissing(item.text, "text");
    exports.mustStringOrMissingValues(item.alignment, "alignment", ["left", "center", "right"]);
    exports.mustStringOrMissingValues(item.wrap, "wrap", ["none", "chars", "words"]);
    exports.mustNumberOrMissing(item.font, "font");
    exports.mustBooleanOrMissing(item.doubleWidth, "doubleWidth");
    exports.mustBooleanOrMissing(item.doubleHeight, "doubleHeight");
};

/**
 * Проверяет элемент "Текст" для скрипта 1006
 * @param item Текстовое поле
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validateText1006Item = function(item) {
    exports.mustStringOrMissing(item.text, "text");
    if (item.text.length > 400) {
        throw new exports.InvalidJsonValueError("text", "длина > 400 символов");
    }
};

/**
 * Проверяет элемент "QR-код" для скрипта 1006
 * @param item Текстовое поле
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validateQr1006Item = function(item) {
    exports.mustString(item.barcode, "barcode");
    exports.mustStringValues(item.barcodeType, "barcodeType", ["QR"]); // только QR-коды, никаких других здесь быть не может
    exports.mustStringOrMissingValues(item.alignment, "alignment", ["left", "right"]); // выравниевание "по центру" запрещаем
    exports.mustNumberOrMissing(item.scale, "scale");
    exports.mustNumberOrMissing(item.height, "height");
    exports.mustBooleanOrMissing(item.printText, "printText");
    if (item.barcode.length > 400) {
        throw new exports.InvalidJsonValueError("barcode", "длина > 400 символов");
    }
};


/**
 * Проверяет элемент документа (чека) "Штрихкод"
 * @param item Штрихкод
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validateBarcodeItem = function(item) {
    exports.mustString(item.barcode, "barcode");
    exports.mustStringValues(item.barcodeType, "barcodeType", [
        "EAN8", "EAN13", "UPCA", "UPCE", "CODE39", "CODE93", "CODE128",
        "CODABAR", "ITF", "ITF14", "GS1_128", "PDF417", "QR", "CODE39_EXTENDED"]);
    exports.mustStringOrMissingValues(item.alignment, "alignment", ["left", "center", "right"]);
    exports.mustNumberOrMissing(item.scale, "scale");
    exports.mustNumberOrMissing(item.height, "height");
    exports.mustBooleanOrMissing(item.printText, "printText");
    var overlay = exports.mustArrayOrMissing(item.overlay, "overlay");
    if (!exports.isMissing(overlay)) {
        for (var i = 0; i < overlay.length; ++i) {
            try {
                var type = exports.mustString(overlay[i].type, "type");
                if (type === "text") {
                    exports.validateTextItem(overlay[i]);
                }
            } catch (e) {
                if (e.name === "InvalidJsonValueError") {
                    throw new exports.InvalidJsonValueError(utils.makeDotPath("overlay[" + i + "]", e.path), e.value);
                } else if (e.name === "InvalidJsonTypeError") {
                    throw new exports.InvalidJsonTypeError(utils.makeDotPath("overlay[" + i + "]", e.path), e.expectedType);
                } else if (e.name === "JsonValueNotFoundError") {
                    throw new exports.JsonValueNotFoundError(utils.makeDotPath("overlay[" + i + "]", e.path));
                } else {
                    throw e;
                }
            }
        }
    }
};

/**
 * Проверяет пользовательский скрипт 1006 "Комбинированная печать текста с QR-кодом"
 * @param item Штрихкод
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validateBarcode1006Item = function(item) {
    exports.validateQr1006Item(item);
    var overlay = exports.mustArray(item.overlay, "overlay"); // это обязательное требование для комбинированной печати
    for (var i = 0; i < overlay.length; ++i) {
        try {
            var type = exports.mustString(overlay[i].type, "type");
            if (type === "text") {
                exports.validateText1006Item(overlay[i]);
            }
            exports.mustStringOrMissing(overlay[i].alignment, "alignment");
            exports.mustNumberOrMissing(overlay[i].font, "font");
            exports.mustBooleanOrMissing(overlay[i].doubleWidth, "doubleWidth");
            exports.mustBooleanOrMissing(overlay[i].doubleHeight, "doubleHeight");
        } catch (e) {
            if (e.name === "InvalidJsonValueError") {
                throw new exports.InvalidJsonValueError(utils.makeDotPath("overlay[" + i + "]", e.path), e.value);
            } else if (e.name === "InvalidJsonTypeError") {
                throw new exports.InvalidJsonTypeError(utils.makeDotPath("overlay[" + i + "]", e.path), e.expectedType);
            } else if (e.name === "JsonValueNotFoundError") {
                throw new exports.JsonValueNotFoundError(utils.makeDotPath("overlay[" + i + "]", e.path));
            } else {
                throw e;
            }
        }
    }
};



/**
 * Проверяет элемент документа (чека) "Картинка из памяти"
 * @param item Картинка из памяти
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validatePictureFromMemoryItem = function(item) {
    exports.mustNumber(item.pictureNumber, "pictureNumber");
    exports.mustStringOrMissingValues(item.alignment, "alignment", ["left", "center", "right"]);
};

/**
 * Проверяет элемент документа (чека) "Картинка (массив пикселей)"
 * @param item Массив пикселей
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validatePixelsItem = function(item) {
    exports.mustString(item.pixels, "pixels");
    try {
        Duktape.dec("base64", item.pixels)
    } catch (e) {
        throw new exports.InvalidJsonValueError("pixels", "not-base64-string")
    }
    exports.mustNumber(item.width, "width");
    exports.mustNumberOrMissing(item.scale, "scale");
    exports.mustStringOrMissingValues(item.alignment, "alignment", ["left", "center", "right"]);
};

/**
 * Проверяет структуру данных агента
 * @param agentInfo Данные агента
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validateAgentInfo = function(agentInfo) {
    try {
        var agents = exports.mustArrayOrMissing(agentInfo.agents, "agents");
        exports.mustBooleanOrMissing(agentInfo.agentsPrint, "agentsPrint");
        exports.mustBooleanOrMissing(agentInfo.agentDataPrint, "agentDataPrint");
        if (!exports.isMissing(agents)) {
            for (var i = 0; i < agents.length; ++i) {
                try {
                    exports.mustStringValues(agents[i], "", ["bankPayingAgent", "bankPayingSubagent",
                        "payingAgent", "payingSubagent", "attorney",
                        "commissionAgent", "another"]);
                } catch (e) {
                    if (e.name === "InvalidJsonValueError") {
                        throw new exports.InvalidJsonValueError(utils.makeDotPath("agents[" + i + "]", e.path), e.value);
                    } else if (e.name === "InvalidJsonTypeError") {
                        throw new exports.InvalidJsonTypeError(utils.makeDotPath("agents[" + i + "]", e.path), e.expectedType);
                    } else if (e.name === "JsonValueNotFoundError") {
                        throw new exports.JsonValueNotFoundError(utils.makeDotPath("agents[" + i + "]", e.path));
                    } else {
                        throw e;
                    }
                }
            }
        }

        exports.mustObjectOrMissingValidator(agentInfo.payingAgent, "payingAgent", function (payingAgent) {
            exports.mustStringOrMissing(payingAgent.operation, "payingAgent.operation");
            var phones = exports.mustArrayOrMissing(payingAgent.phones, "payingAgent.phones");
            if (!exports.isMissing(phones)) {
                for (var i = 0; i < phones.length; ++i) {
                    try {
                        exports.mustString(phones[i], "");
                    } catch (e) {
                        if (e.name === "InvalidJsonValueError") {
                            throw new exports.InvalidJsonValueError(utils.makeDotPath("payingAgent.phones[" + i + "]", e.path), e.value);
                        } else if (e.name === "InvalidJsonTypeError") {
                            throw new exports.InvalidJsonTypeError(utils.makeDotPath("payingAgent.phones[" + i + "]", e.path), e.expectedType);
                        } else if (e.name === "JsonValueNotFoundError") {
                            throw new exports.JsonValueNotFoundError(utils.makeDotPath("payingAgent.phones[" + i + "]", e.path));
                        } else {
                            throw e;
                        }
                    }
                }
            }
        });

        exports.mustObjectOrMissingValidator(agentInfo.receivePaymentsOperator, "receivePaymentsOperator", function (receivePaymentsOperator) {
            var phones = exports.mustArrayOrMissing(receivePaymentsOperator.phones, "receivePaymentsOperator.phones");
            if (!exports.isMissing(phones)) {
                for (var i = 0; i < phones.length; ++i) {
                    try {
                        exports.mustString(phones[i], "");
                    } catch (e) {
                        if (e.name === "InvalidJsonValueError") {
                            throw new exports.InvalidJsonValueError(utils.makeDotPath("receivePaymentsOperator.phones[" + i + "]", e.path), e.value);
                        } else if (e.name === "InvalidJsonTypeError") {
                            throw new exports.InvalidJsonTypeError(utils.makeDotPath("receivePaymentsOperator.phones[" + i + "]", e.path), e.expectedType);
                        } else if (e.name === "JsonValueNotFoundError") {
                            throw new exports.JsonValueNotFoundError(utils.makeDotPath("receivePaymentsOperator.phones[" + i + "]", e.path));
                        } else {
                            throw e;
                        }
                    }
                }
            }
        });

        exports.mustObjectOrMissingValidator(agentInfo.moneyTransferOperator, "moneyTransferOperator", function (moneyTransferOperator) {
            exports.mustStringOrMissing(moneyTransferOperator.name, "moneyTransferOperator.name");
            exports.mustStringOrMissing(moneyTransferOperator.address, "moneyTransferOperator.address");
            exports.mustStringOrMissing(moneyTransferOperator.vatin, "moneyTransferOperator.vatin");
            var phones = exports.mustArrayOrMissing(moneyTransferOperator.phones, "moneyTransferOperator.phones");
            if (!exports.isMissing(phones)) {
                for (var i = 0; i < phones.length; ++i) {
                    try {
                        exports.mustString(phones[i], "");
                    } catch (e) {
                        if (e.name === "InvalidJsonValueError") {
                            throw new exports.InvalidJsonValueError(utils.makeDotPath("moneyTransferOperator.phones[" + i + "]", e.path), e.value);
                        } else if (e.name === "InvalidJsonTypeError") {
                            throw new exports.InvalidJsonTypeError(utils.makeDotPath("moneyTransferOperator.phones[" + i + "]", e.path), e.expectedType);
                        } else if (e.name === "JsonValueNotFoundError") {
                            throw new exports.JsonValueNotFoundError(utils.makeDotPath("moneyTransferOperator.phones[" + i + "]", e.path));
                        } else {
                            throw e;
                        }
                    }
                }
            }
        });

    } catch (e) {
        if (e.name === "InvalidJsonValueError") {
            throw new exports.InvalidJsonValueError(utils.makeDotPath("agentInfo", e.path), e.value);
        } else if (e.name === "InvalidJsonTypeError") {
            throw new exports.InvalidJsonTypeError(utils.makeDotPath("agentInfo", e.path), e.expectedType);
        } else if (e.name === "JsonValueNotFoundError") {
            throw new exports.JsonValueNotFoundError(utils.makeDotPath("agentInfo", e.path));
        } else {
            throw e;
        }
    }
};

/**
 * Проверяет структуру данных поставщика
 * @param supplierInfo Данные поставщика
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validateSupplierInfo = function(supplierInfo) {
    try {
        exports.mustStringOrMissing(supplierInfo.name, "name");
        exports.mustStringOrMissing(supplierInfo.vatin, "vatin");
        exports.mustBooleanOrMissing(supplierInfo.supplierPrint, "supplierPrint");
        exports.mustBooleanOrMissing(supplierInfo.supplierVatinPrint, "supplierVatinPrint");
        var phones = exports.mustArrayOrMissing(supplierInfo.phones, "phones");
        if (!exports.isMissing(phones)) {
            for (var i = 0; i < phones.length; ++i) {
                try {
                    exports.mustString(phones[i], "");
                } catch (e) {
                    if (e.name === "InvalidJsonValueError") {
                        throw new exports.InvalidJsonValueError(utils.makeDotPath("phones[" + i + "]", e.path), e.value);
                    } else if (e.name === "InvalidJsonTypeError") {
                        throw new exports.InvalidJsonTypeError(utils.makeDotPath("phones[" + i + "]", e.path), e.expectedType);
                    } else if (e.name === "JsonValueNotFoundError") {
                        throw new exports.JsonValueNotFoundError(utils.makeDotPath("phones[" + i + "]", e.path));
                    } else {
                        throw e;
                    }
                }
            }
        }
    } catch (e) {
        if (e.name === "InvalidJsonValueError") {
            throw new exports.InvalidJsonValueError(utils.makeDotPath("supplierInfo", e.path), e.value);
        } else if (e.name === "InvalidJsonTypeError") {
            throw new exports.InvalidJsonTypeError(utils.makeDotPath("supplierInfo", e.path), e.expectedType);
        } else if (e.name === "JsonValueNotFoundError") {
            throw new exports.JsonValueNotFoundError(utils.makeDotPath("supplierInfo", e.path));
        } else {
            throw e;
        }
    }
};

/**
 * Проверяет структуру позиции чека
 * @param item Позиция
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validatePositionItem = function(item) {
    exports.mustString(item.name, "name");
    exports.mustNumber(item.price, "price");
    exports.mustNumber(item.quantity, "quantity");
    exports.mustNumber(item.amount, "amount");
    exports.mustNumberOrMissing(item.infoDiscountAmount, "infoDiscountAmount");
    exports.mustNumberOrMissing(item.department, "department");
    exports.mustTypesOrMissing(item.measurementUnit, "measurementUnit", ["number", "string"]);
    exports.mustBooleanOrMissing(item.piece, "piece");
    try {
        exports.mustStringOrMissingValues(item.paymentMethod, "paymentMethod", Object.keys(utils.PAYMENT_METHODS));
    } catch (e) {
        if (e.name === "InvalidJsonValueError") {
            if (isNaN(parseInt(item.paymentMethod, 10)))
                throw e;
        } else {
            throw e;
        }
    }
    try {
        exports.mustStringOrMissingValues(item.paymentObject, "paymentObject", Object.keys(utils.PAYMENT_OBJECTS));
    } catch (e) {
        if (e.name === "InvalidJsonValueError") {
            var parsed = parseInt(item.paymentObject, 10);
            if (isNaN(parsed))
                throw e;
        } else {
            throw e;
        }
    }

    var code = exports.mustTypesOrMissing(item.nomenclatureCode, "nomenclatureCode", ["object", "string"]);
    if (typeof(code) === "object" && !exports.isMissing(code)) {
        exports.mustStringValues(code.type, "nomenclatureCode.type", ["furs", "medicines", "tobacco", "shoes"]);
        exports.mustStringOrMissing(code.gtin, "nomenclatureCode.gtin");
        exports.mustString(code.serial, "nomenclatureCode.serial");
    }

    if (!exports.isMissing(exports.mustObjectOrMissing(item.markingCode, "markingCode"))) {
        exports.mustString(item.markingCode.mark, "markingCode.mark");
        exports.mustStringOrMissingValues(item.markingCode.type, "markingCode.type", Object.keys(utils.MARKING_CODE_TYPES));
    }

    if (!exports.isMissing(exports.mustObjectOrMissing(item.imcParams, "imcParams"))) {
        exports.mustString(item.imcParams.imc, "imcParams.imc");
        exports.mustDictValueOrMissing(item.imcParams.imcType, "imcParams.imcType", utils.MARKING_CODE_TYPES_1_2);
        exports.mustStringOrMissing(item.imcParams.itemFractionalAmount, "imcParams.itemFractionalAmount");
        exports.mustDictValueOrMissing(item.imcParams.itemEstimatedStatus, "imcParams.itemEstimatedStatus", utils.MARKING_ESTIMATED_STATUS);
        exports.mustNumberOrMissing(item.imcParams.imcModeProcessing, "imcParams.imcModeProcessing");
        exports.mustStringOrMissing(item.imcParams.imcBarcode, "imcParams.imcBarcode");
        if (!exports.isMissing(item.imcParams.imcBarcode)) {
            try {
                Duktape.dec("base64", item.imcParams.imcBarcode)
            } catch (e) {
                throw new exports.InvalidJsonValueError("imcParams.imcBarcode", "not-base64-string")
            }
        }
        exports.mustObjectOrMissing(item.imcParams.itemInfoCheckResult, "imcParams.itemInfoCheckResult");
        if (!exports.isMissing(item.imcParams.itemInfoCheckResult)) {
            exports.mustBoolean(item.imcParams.itemInfoCheckResult.imcCheckFlag, "imcParams.itemInfoCheckResult.imcCheckFlag");
            exports.mustBoolean(item.imcParams.itemInfoCheckResult.imcCheckResult, "imcParams.itemInfoCheckResult.imcCheckResult");
            exports.mustBoolean(item.imcParams.itemInfoCheckResult.imcStatusInfo, "imcParams.itemInfoCheckResult.imcStatusInfo");
            exports.mustBoolean(item.imcParams.itemInfoCheckResult.imcEstimatedStatusCorrect, "imcParams.itemInfoCheckResult.imcEstimatedStatusCorrect");
            exports.mustBoolean(item.imcParams.itemInfoCheckResult.ecrStandAloneFlag, "imcParams.itemInfoCheckResult.ecrStandAloneFlag");
        }
    }

    exports.mustObjectOrMissing(item.tax, "tax");
    if (!exports.isMissing(item.tax)) {
        exports.mustStringValues(item.tax.type, "tax.type", Object.keys(utils.TAX_TYPES));
        exports.mustNumberOrMissing(item.tax.sum, "tax.sum");
    }

    if (!exports.isMissing(exports.mustObjectOrMissing(item.agentInfo, "agentInfo"))) {
        exports.validateAgentInfo(item.agentInfo);
    }

    if (!exports.isMissing(exports.mustObjectOrMissing(item.supplierInfo, "supplierInfo"))) {
        exports.validateSupplierInfo(item.supplierInfo);
    }

    exports.mustStringOrMissing(item.additionalAttribute, "additionalAttribute");
    exports.mustBooleanOrMissing(item.additionalAttributePrint, "additionalAttributePrint");
    var exciseSum = exports.mustNumberOrMissing(item.exciseSum, "exciseSum");
    if (!exports.isMissing(exciseSum) && Math.sign(exciseSum) < 0) {
        throw new exports.InvalidJsonValueError("exciseSum", exciseSum);
    }
    exports.mustStringOrMissing(item.countryCode, "countryCode");
    exports.mustStringOrMissing(item.customsDeclaration, "customsDeclaration");

    if (!exports.isMissing(exports.mustArrayOrMissing(item.industryInfo, "industryInfo"))) {
        for (var i = 0; i < item.industryInfo.length; i++) {
            exports.mustStringOrMissing(item.industryInfo[i].fois, "industryInfo.fois");
            exports.mustStringOrMissing(item.industryInfo[i].number, "industryInfo.number");
            exports.mustStringOrMissing(item.industryInfo[i].industryAttribute, "industryInfo.industryAttribute");
            var dateString = exports.mustStringOrMissing(item.industryInfo[i].date, "industryInfo.date");
            if (!exports.isMissing(dateString)) {
                if (!reggieDate.test(dateString)) {
                    throw new exports.InvalidJsonValueError("industryInfo.date", dateString);
                } else {
                    item.industryInfo[i].date = item.industryInfo[i].date.split('.').reverse().join('.');
                }
            }
        }
    }

    if (!exports.isMissing(exports.mustObjectOrMissing(item.productCodes, "productCodes"))) {
        var isTag1163 = false;
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.undefined, "productCodes.undefined"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.ean8, "productCodes.ean8"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.ean13, "productCodes.ean13"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.itf14, "productCodes.itf14"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.gs10, "productCodes.gs10"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.gs1m, "productCodes.gs1m"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.short, "productCodes.short"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.furs, "productCodes.furs"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.egais20, "productCodes.egais20"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.egais30, "productCodes.egais30"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.f1, "productCodes.f1"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.f2, "productCodes.f2"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.f3, "productCodes.f3"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.f4, "productCodes.f4"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.f5, "productCodes.f5"));
        isTag1163 |= !exports.isMissing(exports.mustStringOrMissing(item.productCodes.f6, "productCodes.f6"));
        var codesArray = exports.mustArrayOrMissing(item.productCodes.codes, "productCodes.codes");
        var isUnknownCode = !exports.isMissing(codesArray);
        if (isUnknownCode) {
            for (var i = 0; i < codesArray.length; ++i) {
                try {
                    exports.mustString(codesArray[i], "");
                } catch (e) {
                    if (e.name === "InvalidJsonValueError") {
                        throw new exports.InvalidJsonValueError(utils.makeDotPath("productCodes.codes[" + i + "]", e.path), e.value);
                    } else if (e.name === "InvalidJsonTypeError") {
                        throw new exports.InvalidJsonTypeError(utils.makeDotPath("productCodes.codes[" + i + "]", e.path), e.expectedType);
                    } else if (e.name === "JsonValueNotFoundError") {
                        throw new exports.JsonValueNotFoundError(utils.makeDotPath("productCodes.codes[" + i + "]", e.path));
                    } else {
                        throw e;
                    }
                }
            }
        }
        if (isUnknownCode == isTag1163) // если оба вида заполнения отсутствуют или оба есть
        {
            throw new exports.InvalidJsonValueError("productCodes.codes[]", "collision of array and tags");
        }
    }

    exports.mustNumberOrMissing(item.ucUserParam3, "ucUserParam3");
    exports.mustNumberOrMissing(item.ucUserParam4, "ucUserParam4");
    exports.mustNumberOrMissing(item.ucUserParam5, "ucUserParam5");
    exports.mustNumberOrMissing(item.ucUserParam6, "ucUserParam6");

    if (!exports.isMissing(exports.mustArrayOrMissing(item.customParameters, "customParameters"))) {
        for (var i = 0; i < item.customParameters.length; i++) {
            exports.mustNumber(item.customParameters[i].id, "customParameters.id");
            exports.mustString(item.customParameters[i].value, "customParameters.value");
        }
    }

};

/**
 * Проверяет структуру дополнительного реквизита пользователя
 * @param item Дополнительный реквизит пользователя
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validateUserAttributeItem = function(item) {
    exports.mustStringOrMissing(item.name, "name");
    exports.mustStringOrMissing(item.value, "value");
    exports.mustBooleanOrMissing(item.print, "print");
};

/**
 * Проверяет структуру дополнительного реквизита чека (БСО)
 * @param item Дополнительный реквизит чека (БСО)
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validateAdditionalAttributeItem = function(item) {
    exports.mustString(item.value, "value");
    exports.mustBooleanOrMissing(item.print, "print");
};

/**
 * Проверяет пре- и пост-элементы документа (нефискальные данные, которые могут печататься
 * до и после документа)
 * @param prePostItems Элементы
 * @param name Название для исключения
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validatePrePostItems = function(prePostItems, name) {
    var itemsArray = exports.mustArray(prePostItems, name);
    for (var i = 0; i < itemsArray.length; ++i) {
        try {
            var type = exports.mustString(itemsArray[i].type, "type");
            if (type === "text") {
                exports.validateTextItem(itemsArray[i]);
            } else if (type === "barcode") {
                // Для комбинированной печати (1006) требуется дополнительная обработка
                if (exports.isOverlayFor1006(itemsArray[i].overlay)) {
                    exports.validateBarcode1006Item(itemsArray[i]);
                }
                exports.validateBarcodeItem(itemsArray[i]);
            } else if (type === "pictureFromMemory") {
                exports.validatePictureFromMemoryItem(itemsArray[i]);
            } else if (type === "pixels") {
                exports.validatePixelsItem(itemsArray[i]);
            }
        } catch (e) {
            if (e.name === "InvalidJsonValueError") {
                throw new exports.InvalidJsonValueError(utils.makeDotPath(name + "[" + i + "]", e.path), e.value);
            } else if (e.name === "InvalidJsonTypeError") {
                throw new exports.InvalidJsonTypeError(utils.makeDotPath(name + "[" + i + "]", e.path), e.expectedType);
            } else if (e.name === "JsonValueNotFoundError") {
                throw new exports.JsonValueNotFoundError(utils.makeDotPath(name + "[" + i + "]", e.path));
            } else {
                throw e;
            }
        }
    }
};

/**
 * Проверяет пре-элементы документа (нефискальные данные, которые могут печататься
 * до документа)
 * @param preItems Элементы
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validatePreItems = function(preItems) {
    exports.validatePrePostItems(preItems, "preItems");
};

/**
 * Проверяет пост-элементы документа (нефискальные данные, которые могут печататься
 * после документа)
 * @param postItems Элементы
 * @throws JsonValueNotFoundError, если одно из обязательных полей не найдено
 * @throws InvalidJsonTypeError, если у одного из полей некорректный тип
 * @throws InvalidJsonValueError, если у одного из полей некорректное значение
 */
exports.validatePostItems = function(postItems) {
    exports.validatePrePostItems(postItems, "postItems");
};
