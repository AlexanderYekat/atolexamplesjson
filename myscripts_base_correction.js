const utils = require('myscripts_utils');
const items = require('myscripts_items');
const validators = require('myscripts_validators');
const marks = require('myscripts_marks');
const reggieDate = /^(\d{4}).(\d{2}).(\d{2})$/;
const reggieDateTime = /^(\d{4}).(\d{2}).(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

function exitWithCancelation(e) {
    if (e.error === Fptr.LIBFPTR_ERROR_CHEKING_MARK_IN_PROGRESS)
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE_CLEAR, false);
    Fptr.cancelReceipt();
    Fptr.enableAutoCliche();
    return e;
}

function validateNewCorrection(task) {
    if (!validators.isMissing(validators.mustObjectOrMissing(task.operator, "operator"))) {
        validators.mustObject(task.operator, "operator");
        validators.mustString(task.operator.name, "operator.name");
        validators.mustStringOrMissing(task.operator.vatin, "operator.vatin");
    }

    validators.mustStringOrMissingValues(task.correctionType, "correctionType", ["self", "instruction"]);
    validators.mustStringOrMissing(task.correctionBaseName, "correctionBaseName");
    validators.mustStringOrMissing(task.correctionBaseNumber, "correctionBaseNumber");
    var dateString = validators.mustStringOrMissing(task.correctionBaseDate, "correctionBaseDate");
    if (!validators.isMissing(dateString)) {
        if (!reggieDate.test(dateString)) {
            throw new validators.InvalidJsonValueError("correctionBaseDate", dateString);
        }
    }

    validators.mustBooleanOrMissing(task.ignoreNonFiscalPrintErrors, "ignoreNonFiscalPrintErrors");
    validators.mustBooleanOrMissing(task.electronically, "electronically");
    validators.mustBooleanOrMissing(task.useVAT18, "useVAT18");
    validators.mustStringOrMissingValues(task.taxationType, "taxationType", Object.keys(utils.TAXATION_TYPES));
    validators.mustStringOrMissing(task.paymentsPlace, "paymentsPlace");
    validators.mustStringOrMissing(task.paymentsAddress, "paymentsAddress");
    validators.mustStringOrMissing(task.machineNumber, "machineNumber");
    validators.mustNumberOrMissing(task.total, "total");
    validators.mustBooleanOrMissing(task.validateMarkingCodes,"validateMarkingCodes");

    if (!validators.isMissing(validators.mustObjectOrMissing(task.clientInfo, "clientInfo"))) {
        validators.mustStringOrMissing(task.clientInfo.emailOrPhone, "clientInfo.emailOrPhone");
        validators.mustStringOrMissing(task.clientInfo.vatin, "clientInfo.vatin");
        validators.mustStringOrMissing(task.clientInfo.name, "clientInfo.name");

        validators.mustStringOrMissing(task.clientInfo.birthDate, "clientInfo.birthDate");
        validators.mustStringOrMissing(task.clientInfo.citizenship, "clientInfo.citizenship");
        validators.mustStringOrMissing(task.clientInfo.identityDocumentCode, "clientInfo.identityDocumentCode");
        validators.mustStringOrMissing(task.clientInfo.identityDocumentData, "clientInfo.identityDocumentData");
        validators.mustStringOrMissing(task.clientInfo.address, "clientInfo.address");
    }

    if (!validators.isMissing(validators.mustObjectOrMissing(task.operationInfo, "operationInfo"))) {
        validators.mustNumberOrMissing(task.operationInfo.id, "operationInfo.id");
        validators.mustStringOrMissing(task.operationInfo.data, "operationInfo.data");
        var dateTimeString = validators.mustStringOrMissing(task.operationInfo.dateTime, "operationInfo.dateTime");
        if (!validators.isMissing(dateTimeString)) {
            if (!reggieDateTime.test(dateTimeString)) {
                throw new validators.InvalidJsonValueError("operationInfo.dateTime", dateTimeString);
            }
        }
    }

    if (!validators.isMissing(validators.mustArrayOrMissing(task.industryInfo, "industryInfo"))) {
        for (var i = 0; i < task.industryInfo.length; i++) {
            validators.mustStringOrMissing(task.industryInfo[i].fois, "industryInfo.fois");
            validators.mustStringOrMissing(task.industryInfo[i].number, "industryInfo.number");
            validators.mustStringOrMissing(task.industryInfo[i].industryAttribute, "industryInfo.industryAttribute");
            var dateString = validators.mustStringOrMissing(task.industryInfo[i].date, "industryInfo.date");
            if (!validators.isMissing(dateString)) {
                if (!reggieDate.test(dateString)) {
                    throw new validators.InvalidJsonValueError("industryInfo.date", dateString);
                } else {
                    task.industryInfo[i].date = task.industryInfo[i].date.split('.').reverse().join('.');
                }
            }
        }
    }

    if (!validators.isMissing(validators.mustObjectOrMissing(task.companyInfo, "companyInfo"))) {
        validators.mustStringOrMissing(task.companyInfo.email, "companyInfo.email");
    }

    if (!validators.isMissing(validators.mustObjectOrMissing(task.agentInfo, "agentInfo"))) {
        validators.validateAgentInfo(task.agentInfo);
    }

    if (!validators.isMissing(validators.mustObjectOrMissing(task.supplierInfo, "supplierInfo"))) {
        validators.validateSupplierInfo(task.supplierInfo);
    }

    var itemsArray = validators.mustArray(task.items, "items");
    for (var i = 0; i < itemsArray.length; ++i) {
        try {
            var type = validators.mustString(itemsArray[i].type, "type");
            if (type === "text") {
                validators.validateTextItem(itemsArray[i]);
            } else if (type === "barcode") {
                if (validators.isOverlayFor1006(itemsArray[i].overlay)) {
                    validators.validateBarcode1006Item(itemsArray[i]);
                }
                validators.validateBarcodeItem(itemsArray[i]);
            } else if (type === "pictureFromMemory") {
                validators.validatePictureFromMemoryItem(itemsArray[i]);
            } else if (type === "position") {
                validators.validatePositionItem(itemsArray[i]);
            } else if (type === "userAttribute") {
                validators.validateUserAttributeItem(itemsArray[i]);
            } else if (type === "additionalAttribute") {
                validators.validateAdditionalAttributeItem(itemsArray[i]);
            } else if (type === "pixels") {
                validators.validatePixelsItem(itemsArray[i]);
            }
        } catch (e) {
            if (e.name === "InvalidJsonValueError") {
                throw new validators.InvalidJsonValueError(utils.makeDotPath("items[" + i + "]", e.path), e.value);
            } else if (e.name === "InvalidJsonTypeError") {
                throw new validators.InvalidJsonTypeError(utils.makeDotPath("items[" + i + "]", e.path), e.expectedType);
            } else if (e.name === "JsonValueNotFoundError") {
                throw new validators.JsonValueNotFoundError(utils.makeDotPath("items[" + i + "]", e.path));
            } else {
                throw e;
            }
        }
    }

    var paymentsArray = validators.mustArray(task.payments, "payments");
    for (var i = 0; i < paymentsArray.length; ++i) {
        try {
            try {
                validators.mustStringValues(paymentsArray[i].type, "type", Object.keys(utils.PAYMENT_TYPES));
            } catch (e) {
                if (e.name === "InvalidJsonValueError") {
                    if (isNaN(parseInt(paymentsArray[i].type, 10)))
                        throw e;
                } else {
                    throw e;
                }
            }
            validators.mustNumber(paymentsArray[i].sum, "sum");

            var printItems = validators.mustArrayOrMissing(paymentsArray[i].printItems, "printItems");
            if (!validators.isMissing(printItems)) {
                for (var j = 0; j < printItems.length; ++j) {
                    try {
                        var type = validators.mustString(printItems[j].type, "type");
                        if (type === "text") {
                            validators.validateTextItem(printItems[j]);
                        } else if (type === "barcode") {
                            if (validators.isOverlayFor1006(printItems[i].overlay)) {
                                validators.validateBarcode1006Item(printItems[i]);
                            }
                            validators.validateBarcodeItem(printItems[j]);
                        } else if (type === "pictureFromMemory") {
                            validators.validatePictureFromMemoryItem(printItems[j]);
                        } else if (type === "pixels") {
                            validators.validatePixelsItem(printItems[i]);
                        }
                    } catch (e) {
                        if (e.name === "InvalidJsonValueError") {
                            throw new validators.InvalidJsonValueError(utils.makeDotPath("printItems[" + j + "]", e.path), e.value);
                        } else if (e.name === "InvalidJsonTypeError") {
                            throw new validators.InvalidJsonTypeError(utils.makeDotPath("printItems[" + j + "]", e.path), e.expectedType);
                        } else if (e.name === "JsonValueNotFoundError") {
                            throw new validators.JsonValueNotFoundError(utils.makeDotPath("printItems[" + j + "]", e.path));
                        } else {
                            throw e;
                        }
                    }
                }
            }

        } catch (e) {
            if (e.name === "InvalidJsonValueError") {
                throw new validators.InvalidJsonValueError(utils.makeDotPath("payments[" + i + "]", e.path), e.value);
            } else if (e.name === "InvalidJsonTypeError") {
                throw new validators.InvalidJsonTypeError(utils.makeDotPath("payments[" + i + "]", e.path), e.expectedType);
            } else if (e.name === "JsonValueNotFoundError") {
                throw new validators.JsonValueNotFoundError(utils.makeDotPath("payments[" + i + "]", e.path));
            } else {
                throw e;
            }
        }
    }

    var taxesArray = validators.mustArrayOrMissing(task.taxes, "taxes");
    if (!validators.isMissing(taxesArray)) {
        for (var i = 0; i < taxesArray.length; ++i) {
            try {
                validators.mustStringValues(taxesArray[i].type, "type", Object.keys(utils.TAX_TYPES));
                validators.mustNumber(taxesArray[i].sum, "sum");
            } catch (e) {
                if (e.name === "InvalidJsonValueError") {
                    throw new validators.InvalidJsonValueError(utils.makeDotPath("taxes[" + i + "]", e.path), e.value);
                } else if (e.name === "InvalidJsonTypeError") {
                    throw new validators.InvalidJsonTypeError(utils.makeDotPath("taxes[" + i + "]", e.path), e.expectedType);
                } else if (e.name === "JsonValueNotFoundError") {
                    throw new validators.JsonValueNotFoundError(utils.makeDotPath("taxes[" + i + "]", e.path));
                } else {
                    throw e;
                }
            }
        }
    }

    if (!validators.isMissing(validators.mustArrayOrMissing(task.preItems, "preItems"))) {
        validators.validatePreItems(task.preItems);
    }
    if (!validators.isMissing(validators.mustArrayOrMissing(task.postItems, "postItems"))) {
        validators.validatePostItems(task.postItems);
    }

    if (!validators.isMissing(validators.mustArrayOrMissing(task.customParameters, "customParameters"))) {
        for (var i = 0; i < task.customParameters.length; i++) {
            validators.mustNumber(task.customParameters[i].id, "customParameters.id");
            validators.mustString(task.customParameters[i].value, "customParameters.value");
        }
    }

    const taskSize = getCorrectedTaskSize(getTaskSize(task));
    Fptr.logWrite("FiscalPrinter", Fptr.LIBFPTR_LOG_INFO, "Размер js задания + Δ ~" + taskSize);
    if (taskSize > getMaxSize()) {
        throw new validators.JsonSizeToBig(taskSize);
    }
}

function getCorrectedTaskSize(taskSize) {
    //20% accuracy
    return Math.round(taskSize / 0.8);
}

function getMaxSize() {
    return (32768);
}

function getFloatNumSize(item, name) {
    var size = 0;
    try {
        var fld = validators.mustNumber(item, name) / 1000000;
        if (fld < Math.pow(2, 8)) {
            size += 1;
        } else if (fld < Math.pow(4, 8)) {
            size += 2;
        } else if (fld < Math.pow(6, 8)) {
            size += 3;
        } else if (fld < Math.pow(8, 8)) {
            size += 4;
        } else if (fld < Math.pow(10, 8)) {
            size += 5;
        } else if (fld < Math.pow(12, 8)) {
            size += 6;
        }
        size += 3 + 4;
    } catch (e) {
    }
    return size;
}

function getByteSize(item, name) {
    var size = 0;
    try {
        var fld = validators.mustString(item, name);
        size += 5;
    } catch (e) {
    }
    return size;
}

function getNumSize(item, name) {
    var size = 0;
    try {
        var fld = validators.mustNumber(item, name);
        if (fld < Math.pow(2, 8) / 100) {
            size += 1;
        } else if (fld < Math.pow(4, 8) / 100) {
            size += 2;
        } else if (fld < Math.pow(6, 8) / 100) {
            size += 3;
        } else if (fld < Math.pow(8, 8) / 100) {
            size += 4;
        } else if (fld < Math.pow(10, 8) / 100) {
            size += 5;
        } else if (fld < Math.pow(12, 8) / 100) {
            size += 6;
        }
        size += 4;
    } catch (e) {
    }
    return size;
}

function getStrSize(item, name) {
    var size = 0;
    try {
        size += validators.mustString(item, name).length + 4;
    } catch (e) {
    }
    return size;
}

function getArrOfStrSize(item, name) {
    var size = 0;
    var arr = validators.mustArrayOrMissing(item, "name");
    if (!validators.isMissing(arr)) {
        for (var i = 0; i < arr.length; ++i) {
            try {
                size += validators.mustString(arr[i], "").length + 4;
            } catch (e) {
            }
        }
        if (size > 0) {
            size += 4;
        }
    }
    return size;
}

function getTaskSize(task) {
    var size = 2;
    //required
    //номер ффд
    size += 5;
    //номер фн
    size += 20;
    //кег номер ккт
    size += 24;
    //ИНН пользователя
    size += 16;
    //номер фд
    size += 8;
    //1012 - дата, время
    size += 8;
    //ФПД
    size += 8;
    //номер смены
    size += 8;
    //номер чека за смену
    size += 8;
    //признак расчета
    size += 5;
    //сумма расчета
    size += 6;

    if (!validators.mustBooleanOrMissing(task.electronically, "electronically")) {
        size += 5;
    }

    size += getByteSize(task.taxationType, "taxationType");

    //clientInfo
    var clientInfo = validators.mustObjectOrMissing(task.clientInfo, "clientInfo");
    if (!validators.isMissing(clientInfo)) {
        size += getStrSize(clientInfo.emailOrPhone, "emailOrPhone");
        size += getStrSize(clientInfo.vatin, "vatin");
        size += getStrSize(clientInfo.name, "name");
        size += getStrSize(clientInfo.birthDate, "birthDate");
        size += getStrSize(clientInfo.citizenship, "citizenship");
        size += getStrSize(clientInfo.identityDocumentCode, "identityDocumentCode");
        size += getStrSize(clientInfo.identityDocumentData, "identityDocumentData");
        size += getStrSize(clientInfo.address, "address");
    }

    //items
    var itemsArray = validators.mustArray(task.items, "items");
    if (itemsArray.length > 0) {
        size += 4;
    }

    for (var i = 0; i < itemsArray.length; ++i) {
        var type = validators.mustString(itemsArray[i].type, "type");
        if (type === "userAttribute") {
            size += 4;
            size += getStrSize(itemsArray[i].name, "name");
            size += getStrSize(itemsArray[i].value, "value");
        }
        if (type === "position") {
            size += 4;
            size += getStrSize(itemsArray[i].name, "name");
            size += getNumSize(itemsArray[i].price, "price")
            size += getNumSize(itemsArray[i].amount, "amount")
            size += getNumSize(itemsArray[i].infoDiscountAmount, "infoDiscountAmount")
            size += getNumSize(itemsArray[i].department, "department")
            size += getFloatNumSize(itemsArray[i].quantity, "quantity")
            //size += getStrSize(itemsArray[i].measurementUnit, "measurementUnit");
            size += getByteSize(itemsArray[i].paymentMethod, "paymentMethod");
            size += getByteSize(itemsArray[i].paymentObject, "paymentObject");
            var vat = validators.mustObjectOrMissing(itemsArray[i].vat, "vat");
            if (!validators.isMissing(vat)) {
                size += 6;
                var type = validators.mustString(vat.type, "type");
                if (!validators.isMissing(type)) {
                    size += 5;
                }
            }
            // if (!validators.isMissing(itemsArray[i].tax)) {
            //     size += getByteSize(itemsArray[i].tax.type, "tax.type");
            //     size += getNumSize(itemsArray[i].tax.sum, "tax.sum");
            // }
            var agentInfo = validators.mustObjectOrMissing(itemsArray[i].agentInfo, "agentInfo");
            if (!validators.isMissing(agentInfo)) {
                size += 4;
                if (!validators.isMissing(validators.mustObjectOrMissing(agentInfo.agents, "agents"))) {
                    size += 5;
                }
                if (!validators.isMissing(validators.mustObjectOrMissing(agentInfo.receivePaymentsOperator, "receivePaymentsOperator"))) {
                    size += getArrOfStrSize(agentInfo.receivePaymentsOperator.phones, "agentInfo.receivePaymentsOperator.phones");
                }

                if (!validators.isMissing(validators.mustObjectOrMissing(agentInfo.payingAgent, "payingAgent"))) {
                    size += getArrOfStrSize(agentInfo.payingAgent.phones, "payingAgent.phones");
                    size += getStrSize(agentInfo.payingAgent.operation, "payingAgent.operation");
                }

                if (!validators.isMissing(validators.mustObjectOrMissing(agentInfo.moneyTransferOperator, "moneyTransferOperator"))) {
                    size += getArrOfStrSize(agentInfo.moneyTransferOperator.phones, "moneyTransferOperator.phones");
                    size += getStrSize(agentInfo.moneyTransferOperator.name, "moneyTransferOperator.name");
                    size += getStrSize(agentInfo.moneyTransferOperator.address, "moneyTransferOperator.address");
                    size += getStrSize(agentInfo.moneyTransferOperator.vatin, "moneyTransferOperator.vatin");
                }
            }

            var supplierInfo = validators.mustObjectOrMissing(itemsArray[i].supplierInfo, "supplierInfo");
            if (!validators.isMissing(supplierInfo)) {
                size += getStrSize(supplierInfo.name, "name");
                size += getStrSize(supplierInfo.vatin, "vatin");
                size += getArrOfStrSize(supplierInfo.phones, "phones");
            }

            var imcParams = validators.mustObjectOrMissing(itemsArray[i].imcParams, "imcParams");
            if (!validators.isMissing(imcParams)) {
                size += 4;
                //1305 - по длине кода маркировки нужно более детально проводить оценку
                size += 28 + 4;
                //2107 - результат проверки маркированного товара
                size += 5;
                //2102
                size += getFloatNumSize(imcParams.imcModeProcessing, "imcModeProcessing")
                //2106
                size += 5
            }
        }
    }
    //operator
    if (!validators.isMissing(validators.mustObjectOrMissing(task.operator, "operator"))) {
        size += getStrSize(task.operator.name, "operator.name");
        size += getStrSize(task.operator.vatin, "operator.vatin");
    }

    //company info
    if (!validators.isMissing(validators.mustObjectOrMissing(task.companyInfo, "companyInfo"))) {
        size +=getStrSize(task.companyInfo.email, "companyInfo.email");
    }

    //payments
    var paymentsArray = validators.mustArray(task.payments, "payments");
    //empty payments size
    size += 20;
    for (var i = 0; i < paymentsArray.length; ++i) {
        size += getNumSize(paymentsArray[i].sum, "sum");
        size -= 4; //empty minus
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_TAG_VALUE);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_TAG_NUMBER, 1009);
    if (Fptr.fnQueryData() < 0) {
        size += 4;
    } else {
        var val = Fptr.getParamString(Fptr.LIBFPTR_PARAM_TAG_NAME);
        size += val.length + 4;
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_TAG_VALUE);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_TAG_NUMBER, 1187);
    if (Fptr.fnQueryData() < 0) {
        size += 4;
    } else {
        var val = Fptr.getParamString(Fptr.LIBFPTR_PARAM_TAG_NAME);
        size += val.length + 4;
    }
    return size;
}

exports.executeNewCorrection = function(task) {
    try {
        validateNewCorrection(task);
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

    Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE_CLEAR, false);
    if (Fptr.cancelReceipt() < 0 && !utils.isNormalCancelError(Fptr.errorCode())) {
        return Fptr.error();
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error()
    }
    var ffd = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FFD_VERSION);

    var isValidateMarkingCodes = false;
    if (!validators.isMissing(task.validateMarkingCodes)) {
        isValidateMarkingCodes = task.validateMarkingCodes;
    }

    // Валидация КМ
    validateMarks = {};
    if (isValidateMarkingCodes === true) {
        var imcParams = [];
        for (var i = 0; i < task.items.length; i++) {
            var item = task.items[i];
            if ((item.type === "position") && (!validators.isMissing(item.imcParams))) {
                if (!validators.isMissing(item.imcParams.itemEstimatedStatus) &&
                    ((item.imcParams.itemEstimatedStatus === "itemDryForSale") || (item.imcParams.itemEstimatedStatus ==="itemDryReturn"))) {
                    if (!validators.isMissing(item.quantity)) {
                        item.imcParams.itemQuantity = item.quantity;
                    }
                    if (!validators.isMissing(item.measurementUnit)) {
                        item.imcParams.itemUnits = item.measurementUnit;
                    }
                }
                imcParams.push(item.imcParams);
            }
        }
        taskForValidate = {};
        taskForValidate.waitForResult = true;
        taskForValidate.timeout = 60000;
        taskForValidate.params = imcParams;
        validateMarks = marks.executeValidateMarks(taskForValidate);
        var c = 0;
        for (var i = 0; i < task.items.length; i++) {
            var item = task.items[i];
            if ((item.type === "position") && (!validators.isMissing(item.imcParams))) {
                if (validators.isMissing(validateMarks[c].onlineValidation) ||
                    validators.isMissing(validateMarks[c].onlineValidation.itemInfoCheckResult)) {
                    Fptr.cancelMarkingCodeValidation();
                    Fptr.clearMarkingCodeValidationResult();
                    return exitWithCancelation(Fptr.error({validateMarks: validateMarks}));
                }
                item.imcParams.itemInfoCheckResult = validateMarks[c].onlineValidation.itemInfoCheckResult;
                if (!item.imcParams.itemInfoCheckResult.imcCheckFlag ||
                    !item.imcParams.itemInfoCheckResult.imcCheckResult ||
                    !item.imcParams.itemInfoCheckResult.imcStatusInfo  ||
                    !item.imcParams.itemInfoCheckResult.imcEstimatedStatusCorrect) {
                    Fptr.cancelMarkingCodeValidation();
                    Fptr.clearMarkingCodeValidationResult();
                    return exitWithCancelation(Fptr.error({validateMarks: validateMarks}));
                }
                if (!validators.isMissing(validateMarks[c].onlineValidation.imcType)) {
                    item.imcParams.imcType = validateMarks[c].onlineValidation.imcType;
                }
                c++;
            }
        }
    }

    if (!validators.isMissing(task.operator)) {
        Fptr.setParam(1021, task.operator.name);
        Fptr.setParam(1203, task.operator.vatin, Fptr.IGNORE_IF_EMPTY);
        if (Fptr.operatorLogin() < 0) {
            return Fptr.error();
        }
    }

    if (!task.electronically) {
        if (!validators.isMissing(task.preItems)) {
            items.executePreItems(task.preItems);
        }
        if (!validators.isMissing(task.postItems)) {
            items.executePostItems(task.postItems);
        }
    }

    var correctionType = undefined;
    switch (task.correctionType) {
        case "self":
            correctionType = 0;
            break;
        case "instruction":
            correctionType = 1;
            break;
    }

    var dateString = task.correctionBaseDate;
    if (!validators.isMissing(dateString)) {
        var dateArray = reggieDate.exec(dateString);
        var dateObject = new Date();
        dateObject.setUTCFullYear(+dateArray[1]);
        dateObject.setUTCMonth(+dateArray[2] - 1, +dateArray[3]);
        dateObject.setUTCHours(0, 0, 0, 0);
    }

    Fptr.setParam(1177, task.correctionBaseName, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1178, dateObject, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1179, task.correctionBaseNumber, Fptr.IGNORE_IF_EMPTY);
    Fptr.utilFormTlv();
    var tag1174 = Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE);

    // Готовим данные клиента для передачи чек для ФФД 1.2
    var clientInfoSTLV = new Uint8Array([]);
    if (!validators.isMissing(task.clientInfo) && ffd >= Fptr.LIBFPTR_FFD_1_2) {
        Fptr.setParam(1227, task.clientInfo.name, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(1228, task.clientInfo.vatin, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(1243, task.clientInfo.birthDate, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(1244, task.clientInfo.citizenship, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(1245, task.clientInfo.identityDocumentCode, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(1246, task.clientInfo.identityDocumentData, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(1254, task.clientInfo.address, Fptr.IGNORE_IF_EMPTY);
        Fptr.utilFormTlv();
        clientInfoSTLV = Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE);
    }

    var operationInfoSTLV = new Uint8Array([]);
    if (!validators.isMissing(task.operationInfo) && ffd >= Fptr.LIBFPTR_FFD_1_2) {
        var dateTimeString = task.operationInfo.dateTime;
        var dateTimeArray = reggieDateTime.exec(dateTimeString);
        var dateTimeObject = new Date();
        dateTimeObject.setUTCFullYear(+dateTimeArray[1]);
        dateTimeObject.setUTCMonth(+dateTimeArray[2] - 1, +dateTimeArray[3]);
        dateTimeObject.setUTCHours(+dateTimeArray[4], +dateTimeArray[5], +dateTimeArray[6], 0);
        Fptr.setParam(1273, dateTimeObject, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(1271, task.operationInfo.id, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(1272, task.operationInfo.data, Fptr.IGNORE_IF_EMPTY);
        if (Fptr.utilFormTlv() < 0) {
            return Fptr.error();
        }
        operationInfoSTLV = Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE);
    }

    var arr1261 = new Array();
    var industryInfoSTLV = new Uint8Array([]);
    if (!validators.isMissing(task.industryInfo) && ffd >= Fptr.LIBFPTR_FFD_1_2) {
        for (var i = 0; i < task.industryInfo.length; i++) {
            Fptr.setParam(1262, task.industryInfo[i].fois, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1263, task.industryInfo[i].date, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1264, task.industryInfo[i].number, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1265, task.industryInfo[i].industryAttribute, Fptr.IGNORE_IF_EMPTY);
            if (Fptr.utilFormTlv() < 0) {
                return Fptr.error();
            }
            arr1261.push(Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE));
        }
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, utils.CORRECTION_TYPES[task.type]);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_ELECTRONICALLY, task.electronically, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1173, correctionType, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1174, tag1174, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1055, utils.TAXATION_TYPES[task.taxationType], Fptr.IGNORE_IF_EMPTY);

    if (!validators.isMissing(task.clientInfo)) {
        Fptr.setParam(1008, task.clientInfo.emailOrPhone, Fptr.IGNORE_IF_EMPTY);

        if (ffd < Fptr.LIBFPTR_FFD_1_2) {
            Fptr.setParam(1227, task.clientInfo.name, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1228, task.clientInfo.vatin, Fptr.IGNORE_IF_EMPTY);
        } else {
            Fptr.setParam(1256, clientInfoSTLV, Fptr.IGNORE_IF_EMPTY);
        }
    }

    Fptr.setParam(1270, operationInfoSTLV, Fptr.IGNORE_IF_EMPTY);

    for (var i = 0; i < arr1261.length; i++) {
        Fptr.setParam(1261, arr1261[i], Fptr.IGNORE_IF_EMPTY);
    }

    Fptr.setParam(1009, task.paymentsAddress, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1187, task.paymentsPlace, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1036, task.machineNumber, Fptr.IGNORE_IF_EMPTY);

    if (!validators.isMissing(task.agentInfo)) {
        if (!validators.isMissing(task.agentInfo.agents) && ffd < Fptr.LIBFPTR_FFD_1_2) {
            var agentType = Fptr.LIBFPTR_AT_NONE;
            for (var i = 0; i < task.agentInfo.agents.length; i++) {
                agentType |= utils.AGENT_TYPES[task.agentInfo.agents[i]];
            }
            if (agentType > 0) {
                Fptr.setParam(1057, agentType);
            }
        }

        if (!validators.isMissing(task.agentInfo.moneyTransferOperator)) {
            Fptr.setParam(1005, task.agentInfo.moneyTransferOperator.address, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1016, task.agentInfo.moneyTransferOperator.vatin, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1026, task.agentInfo.moneyTransferOperator.name, Fptr.IGNORE_IF_EMPTY);
            phones = task.agentInfo.moneyTransferOperator.phones;
            for (var i = 0; phones && i < phones.length; i++) {
                Fptr.setParam(1075, task.agentInfo.moneyTransferOperator.phones[i], Fptr.IGNORE_IF_EMPTY);
            }
        }
        if (!validators.isMissing(task.agentInfo.payingAgent)) {
            Fptr.setParam(1044, task.agentInfo.payingAgent.operation, Fptr.IGNORE_IF_EMPTY);
            phones = task.agentInfo.payingAgent.phones;
            for (var i = 0; phones && i < phones.length; i++) {
                Fptr.setParam(1073, task.agentInfo.payingAgent.phones[i], Fptr.IGNORE_IF_EMPTY);
            }
        }
        if (!validators.isMissing(task.agentInfo.receivePaymentsOperator)) {
            phones = task.agentInfo.receivePaymentsOperator.phones;
            for (var i = 0; phones && i < phones.length; i++) {
                Fptr.setParam(1074, task.agentInfo.receivePaymentsOperator.phones[i], Fptr.IGNORE_IF_EMPTY);
            }
        }
    }
    if (!validators.isMissing(task.supplierInfo)) {
        phones = task.supplierInfo.phones;
        for (var i = 0; phones && i < phones.length; i++) {
            Fptr.setParam(1171, task.supplierInfo.phones[i], Fptr.IGNORE_IF_EMPTY);
        }
    }

    var res = Fptr.openReceipt();
    var shiftAutoOpened = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_SHIFT_AUTO_OPENED);
    if (res < 0) {
        return exitWithCancelation(Fptr.error());
    }

    var total = 0;
    for (var i = 0; i < task.items.length; i++) {
        if (task.items[i].type === "position") {
            e = items.executePosition(task.items[i]);
            if (e.isError) {
                return exitWithCancelation(e);
            }
            total += Number(task.items[i].amount.toFixed(2));
        } else if (task.items[i].type === "text") {
            e = items.executeText(task.items[i]);
            if (e.isError && !task.ignoreNonFiscalPrintErrors) {
                return exitWithCancelation(Fptr.error());
            }
        } else if (task.items[i].type === "barcode") {
            if (validators.isOverlayFor1006(task.items[i].overlay)) {
                e = items.executeBarcode1006(task.items[i]);
            }
            else {
                e = items.executeBarcode(task.items[i]);
            }
            if (e.isError && !task.ignoreNonFiscalPrintErrors) {
                return exitWithCancelation(Fptr.error());
            }
        } else if (task.items[i].type === "pictureFromMemory") {
            e = items.executePictureFromMemory(task.items[i]);
            if (e.isError && !task.ignoreNonFiscalPrintErrors) {
                return exitWithCancelation(Fptr.error());
            }
        } else if (task.items[i].type === "userAttribute") {
            e = items.executeUserAttribute(task.items[i]);
            if (e.isError) {
                return exitWithCancelation(e);
            }
        } else if (task.items[i].type === "additionalAttribute") {
            e = items.executeAdditionalAttribute(task.items[i]);
            if (e.isError) {
                return exitWithCancelation(e);
            }
        } else if (task.items[i].type === "pixels") {
            var e = items.executePixelsBuffer(task.items[i]);
            if (e.isError) {
                return exitWithCancelation(e);
            }
        }
    }

    if (!validators.isMissing(task.total))
        total = task.total;

    Fptr.setParam(Fptr.LIBFPTR_PARAM_SUM, total);
    if (Fptr.receiptTotal() < 0)
        return exitWithCancelation(Fptr.error());

    if (!validators.isMissing(task.taxes)) {
        for (var i = 0; i < task.taxes.length; i++) {
            if (task.taxes[i].sum) {
                Fptr.setParam(Fptr.LIBFPTR_PARAM_TAX_TYPE, utils.parseTaxType(task.taxes[i].type));
                Fptr.setParam(Fptr.LIBFPTR_PARAM_TAX_SUM, task.taxes[i].sum);
                if (Fptr.receiptTax() < 0) {
                    return exitWithCancelation(Fptr.error());
                }
            }
        }
    }

    var paymentsSum = 0;
    for (var i = 0; i < task.payments.length; i++) {
        paymentsSum += Number(task.payments[i].sum.toFixed(2));
    }

    if (Number(paymentsSum.toFixed(2)) < Number(total.toFixed(2))) {
        return exitWithCancelation(Fptr.result(Fptr.LIBFPTR_ERROR_NOT_FULLY_PAID));
    }

    // Сначала записываем все неналичные оплаты, а потом отдельно наличные
    for (var i = 0; i < task.payments.length; i++) {
        var pt = utils.parsePaymentType(task.payments[i].type);
        var ps = task.payments[i].sum;
        if (pt !== Fptr.LIBFPTR_PT_CASH && ps !== 0) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_PAYMENT_TYPE, pt);
            Fptr.setParam(Fptr.LIBFPTR_PARAM_PAYMENT_SUM, ps);
            if (Fptr.payment() < 0) {
                return exitWithCancelation(Fptr.error());
            }

            if (!validators.isMissing(task.payments[i].printItems)) {
                for (var j = 0; j < task.payments[i].printItems.length; ++j) {
                    if (task.payments[i].printItems[j].type === "text") {
                        e = items.executeText(task.payments[i].printItems[j]);
                        if (e.isError && !task.ignoreNonFiscalPrintErrors) {
                            return exitWithCancelation(Fptr.error());
                        }
                    }
                }
            }
        }
    }

    for (var i = 0; i < task.payments.length; i++) {
        var pt = utils.parsePaymentType(task.payments[i].type);
        var ps = task.payments[i].sum;
        if (pt === Fptr.LIBFPTR_PT_CASH && ps !== 0) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_PAYMENT_TYPE, pt);
            Fptr.setParam(Fptr.LIBFPTR_PARAM_PAYMENT_SUM, ps);
            if (Fptr.payment() < 0) {
                return exitWithCancelation(Fptr.error());
            }

            if (!validators.isMissing(task.payments[i].printItems)) {
                for (var j = 0; j < task.payments[i].printItems.length; ++j) {
                    if (task.payments[i].printItems[j].type === "text") {
                        e = items.executeText(task.payments[i].printItems[j]);
                        if (e.isError && !task.ignoreNonFiscalPrintErrors) {
                            return exitWithCancelation(Fptr.error());
                        }
                    }
                }
            }
        }
    }

    if (!validators.isMissing(task.customParameters)) {
        for (var i = 0; task.customParameters && i < task.customParameters.length; i++) {
            Fptr.setUserParam(task.customParameters[i].id, task.customParameters[i].value)
        }
    }

    if (Fptr.closeReceipt() < 0) {
        var e = Fptr.error();
        if (e.error === Fptr.LIBFPTR_ERROR_DENIED_IN_CLOSED_SHIFT) {
            return exitWithCancelation(e);
        }

        Fptr.checkDocumentClosed();
        if (!Fptr.getParamBool(Fptr.LIBFPTR_PARAM_DOCUMENT_CLOSED)) {
            return exitWithCancelation(e);
        }
    }

    if (validators.isMissing(validateMarks)) {
        return Fptr.ok(
            utils.getFiscalDocumentResult().result,
            {
                shiftAutoOpened: shiftAutoOpened
            });
    } else {
        return Fptr.ok(
            utils.getFiscalDocumentResult().result,
            {
                shiftAutoOpened: shiftAutoOpened
            },
            validateMarks);
    }
};

function validateOldCorrection(task) {
    if (!validators.isMissing(validators.mustObjectOrMissing(task.operator, "operator"))) {
        validators.mustObject(task.operator, "operator");
        validators.mustString(task.operator.name, "operator.name");
        validators.mustStringOrMissing(task.operator.vatin, "operator.vatin");
    }

    validators.mustStringOrMissingValues(task.correctionType, "correctionType", ["self", "instruction"]);
    validators.mustStringOrMissing(task.correctionBaseName, "correctionBaseName");
    validators.mustStringOrMissing(task.correctionBaseNumber, "correctionBaseNumber");
    var dateString = validators.mustStringOrMissing(task.correctionBaseDate, "correctionBaseDate");
    if (!validators.isMissing(dateString)) {
        if (!reggieDate.test(dateString)) {
            throw new validators.InvalidJsonValueError("correctionBaseDate", dateString);
        }
    }

    validators.mustStringOrMissing(task.machineNumber, "machineNumber");
    validators.mustBooleanOrMissing(task.electronically, "electronically");
    validators.mustStringOrMissingValues(task.taxationType, "taxationType", Object.keys(utils.TAXATION_TYPES));

    var paymentsArray = validators.mustArray(task.payments, "payments");
    for (var i = 0; i < paymentsArray.length; ++i) {
        try {
            try {
                validators.mustStringValues(paymentsArray[i].type, "type", Object.keys(utils.PAYMENT_TYPES));
            } catch (e) {
                if (e.name === "InvalidJsonValueError") {
                    if (isNaN(parseInt(paymentsArray[i].type, 10)))
                        throw e;
                } else {
                    throw e;
                }
            }
            validators.mustNumber(paymentsArray[i].sum, "sum");

            var printItems = validators.mustArrayOrMissing(paymentsArray[i].printItems, "printItems");
            if (!validators.isMissing(printItems)) {
                for (var j = 0; j < printItems.length; ++j) {
                    try {
                        var type = validators.mustString(printItems[j].type, "type");
                        if (type === "text") {
                            validators.validateTextItem(printItems[j]);
                        } else if (type === "barcode") {
                            validators.validateBarcodeItem(printItems[j]);
                        } else if (type === "pictureFromMemory") {
                            validators.validatePictureFromMemoryItem(printItems[j]);
                        } else if (type === "pixels") {
                            validators.validatePixelsItem(printItems[j]);
                        }
                    } catch (e) {
                        if (e.name === "InvalidJsonValueError") {
                            throw new validators.InvalidJsonValueError(utils.makeDotPath("printItems[" + j + "]", e.path), e.value);
                        } else if (e.name === "InvalidJsonTypeError") {
                            throw new validators.InvalidJsonTypeError(utils.makeDotPath("printItems[" + j + "]", e.path), e.expectedType);
                        } else if (e.name === "JsonValueNotFoundError") {
                            throw new validators.JsonValueNotFoundError(utils.makeDotPath("printItems[" + j + "]", e.path));
                        } else {
                            throw e;
                        }
                    }
                }
            }

        } catch (e) {
            if (e.name === "InvalidJsonValueError") {
                throw new validators.InvalidJsonValueError(utils.makeDotPath("payments[" + i + "]", e.path), e.value);
            } else if (e.name === "InvalidJsonTypeError") {
                throw new validators.InvalidJsonTypeError(utils.makeDotPath("payments[" + i + "]", e.path), e.expectedType);
            } else if (e.name === "JsonValueNotFoundError") {
                throw new validators.JsonValueNotFoundError(utils.makeDotPath("payments[" + i + "]", e.path));
            } else {
                throw e;
            }
        }
    }

    var taxesArray = validators.mustArrayOrMissing(task.taxes, "taxes");
    if (!validators.isMissing(taxesArray)) {
        for (var i = 0; i < taxesArray.length; ++i) {
            try {
                validators.mustStringValues(taxesArray[i].type, "type", Object.keys(utils.TAX_TYPES));
                validators.mustNumber(taxesArray[i].sum, "sum");
            } catch (e) {
                if (e.name === "InvalidJsonValueError") {
                    throw new validators.InvalidJsonValueError(utils.makeDotPath("taxes[" + i + "]", e.path), e.value);
                } else if (e.name === "InvalidJsonTypeError") {
                    throw new validators.InvalidJsonTypeError(utils.makeDotPath("taxes[" + i + "]", e.path), e.expectedType);
                } else if (e.name === "JsonValueNotFoundError") {
                    throw new validators.JsonValueNotFoundError(utils.makeDotPath("taxes[" + i + "]", e.path));
                } else {
                    throw e;
                }
            }
        }
    }

    if (!validators.isMissing(validators.mustArrayOrMissing(task.preItems, "preItems"))) {
        validators.validatePreItems(task.preItems);
    }
    if (!validators.isMissing(validators.mustArrayOrMissing(task.postItems, "postItems"))) {
        validators.validatePostItems(task.postItems);
    }

    if (!validators.isMissing(validators.mustArrayOrMissing(task.customParameters, "customParameters"))) {
        for (var i = 0; i < task.customParameters.length; i++) {
            validators.mustNumber(task.customParameters[i].id, "customParameters.id");
            validators.mustString(task.customParameters[i].value, "customParameters.value");
        }
    }

    if (!validators.isMissing(validators.mustArrayOrMissing(task.items, "items"))) {
        var itemsArray = task.items;
        for (var i = 0; i < itemsArray.length; ++i) {
            try {
                var type = validators.mustString(itemsArray[i].type, "type");
                if (type === "userAttribute") {
                    validators.validateUserAttributeItem(itemsArray[i]);
                } else if (type === "additionalAttribute") {
                    validators.validateAdditionalAttributeItem(itemsArray[i]);
                }
            } catch (e) {
                if (e.name === "InvalidJsonValueError") {
                    throw new validators.InvalidJsonValueError(utils.makeDotPath("items[" + i + "]", e.path), e.value);
                } else if (e.name === "InvalidJsonTypeError") {
                    throw new validators.InvalidJsonTypeError(utils.makeDotPath("items[" + i + "]", e.path), e.expectedType);
                } else if (e.name === "JsonValueNotFoundError") {
                    throw new validators.JsonValueNotFoundError(utils.makeDotPath("items[" + i + "]", e.path));
                } else {
                    throw e;
                }
            }
        }
    }
}

exports.executeOldCorrection = function (task) {
    try {
        validateOldCorrection(task);
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

    if (Fptr.cancelReceipt() < 0 && !utils.isNormalCancelError(Fptr.errorCode())) {
        return Fptr.error();
    }

    if (!validators.isMissing(task.operator) && task.operator.name) {
        Fptr.setParam(1021, task.operator.name);
        Fptr.setParam(1203, task.operator.vatin, Fptr.IGNORE_IF_EMPTY);
        if (Fptr.operatorLogin() < 0) {
            return Fptr.error();
        }
    }

    if (!task.electronically) {
        if (!validators.isMissing(task.preItems)) {
            items.executePreItems(task.preItems);
        }
        if (!validators.isMissing(task.postItems)) {
            items.executePostItems(task.postItems);
        }
    }

    var correctionType = undefined;
    switch (task.correctionType) {
        case "self":
            correctionType = 0;
            break;
        case "instruction":
            correctionType = 1;
            break;
    }

    var dateString = task.correctionBaseDate;
    if (!validators.isMissing(dateString)) {
        var dateArray = reggieDate.exec(dateString);
        var dateObject = new Date();
        dateObject.setUTCFullYear(+dateArray[1]);
        dateObject.setUTCMonth(+dateArray[2] - 1, +dateArray[3]);
        dateObject.setUTCHours(0, 0, 0, 0);
    }

    Fptr.setParam(1177, task.correctionBaseName, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1178, dateObject, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1179, task.correctionBaseNumber, Fptr.IGNORE_IF_EMPTY);
    Fptr.utilFormTlv();
    var tag1174 = Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, utils.CORRECTION_TYPES[task.type], Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1036, task.machineNumber, Fptr.IGNORE_IF_EMPTY);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_USE_VAT18, task.useVAT18, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_ELECTRONICALLY, task.electronically, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1055, utils.TAXATION_TYPES[task.taxationType], Fptr.IGNORE_IF_EMPTY);

    Fptr.setParam(1173, correctionType, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1174, tag1174, Fptr.IGNORE_IF_EMPTY);

    if (!validators.isMissing(task.clientInfo)) {
        Fptr.setParam(1008, task.clientInfo.emailOrPhone, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(1227, task.clientInfo.name, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(1228, task.clientInfo.vatin, Fptr.IGNORE_IF_EMPTY);
    }

    var res = Fptr.openReceipt();
    var shiftAutoOpened = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_SHIFT_AUTO_OPENED);
    if (res < 0) {
        return exitWithCancelation(Fptr.error());
    }

    var paymentsSum = 0;
    for (var i = 0; i < task.payments.length; i++) {
        paymentsSum += task.payments[i].sum;
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_SUM, paymentsSum);
    if (Fptr.receiptTotal() < 0)
        return exitWithCancelation(Fptr.error());

    if (!validators.isMissing(task.taxes)) {
        for (var i = 0; i < task.taxes.length; i++) {
            if (task.taxes[i].sum) {
                Fptr.setParam(Fptr.LIBFPTR_PARAM_TAX_TYPE, utils.parseTaxType(task.taxes[i].type));
                Fptr.setParam(Fptr.LIBFPTR_PARAM_TAX_SUM, task.taxes[i].sum);
                if (Fptr.receiptTax() < 0) {
                    return exitWithCancelation(Fptr.error());
                }
            }
        }
    }

    if (!validators.isMissing(task.items)) {
        for (var i = 0; i < task.items.length; i++) {
            if (task.items[i].type === "userAttribute") {
                e = items.executeUserAttribute(task.items[i]);
                if (e.isError) {
                    return exitWithCancelation(e);
                }
            } else if (task.items[i].type === "additionalAttribute") {
                e = items.executeAdditionalAttribute(task.items[i]);
                if (e.isError) {
                    return exitWithCancelation(e);
                }
            }
        }
    }

    // Сначала записываем все неналичные оплаты, а потом отдельно наличные
    for (var i = 0; i < task.payments.length; i++) {
        var pt = utils.parsePaymentType(task.payments[i].type);
        var ps = task.payments[i].sum;
        if (pt !== Fptr.LIBFPTR_PT_CASH && ps !== 0) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_PAYMENT_TYPE, pt);
            Fptr.setParam(Fptr.LIBFPTR_PARAM_PAYMENT_SUM, ps);
            if (Fptr.payment() < 0) {
                return exitWithCancelation(Fptr.error());
            }

            if (!validators.isMissing(task.payments[i].printItems)) {
                for (var j = 0; j < task.payments[i].printItems.length; ++j) {
                    if (task.payments[i].printItems.type === "text") {
                        e = items.executeText(task.payments[i].printItems[i]);
                        if (e.isError && !task.ignoreNonFiscalPrintErrors) {
                            return exitWithCancelation(Fptr.error());
                        }
                    }
                }
            }
        }
    }

    for (var i = 0; i < task.payments.length; i++) {
        var pt = utils.parsePaymentType(task.payments[i].type);
        var ps = task.payments[i].sum;
        if (pt === Fptr.LIBFPTR_PT_CASH && ps !== 0) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_PAYMENT_TYPE, pt);
            Fptr.setParam(Fptr.LIBFPTR_PARAM_PAYMENT_SUM, ps);
            if (Fptr.payment() < 0) {
                return exitWithCancelation(Fptr.error());
            }

            if (!validators.isMissing(task.payments[i].printItems)) {
                for (var j = 0; j < task.payments[i].printItems.length; ++j) {
                    if (task.payments[i].printItems.type === "text") {
                        e = items.executeText(task.payments[i].printItems[i]);
                        if (e.isError && !task.ignoreNonFiscalPrintErrors) {
                            return exitWithCancelation(Fptr.error());
                        }
                    }
                }
            }
        }
    }

    if (!validators.isMissing(task.customParameters)) {
        for (var i = 0; task.customParameters && i < task.customParameters.length; i++) {
            Fptr.setUserParam(task.customParameters[i].id, task.customParameters[i].value)
        }
    }

    if (Fptr.closeReceipt() < 0) {
        var e = Fptr.error();
        if (e.error === Fptr.LIBFPTR_ERROR_DENIED_IN_CLOSED_SHIFT) {
            return exitWithCancelation(e);
        }

        Fptr.checkDocumentClosed();
        if (!Fptr.getParamBool(Fptr.LIBFPTR_PARAM_DOCUMENT_CLOSED)) {
            return exitWithCancelation(e);
        }
    }

    return Fptr.ok(
        utils.getFiscalDocumentResult().result,
        {
            shiftAutoOpened: shiftAutoOpened
        });
};

exports.validateNewCorrection = function(task) {
    try {
        validateNewCorrection(task);
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
};

exports.validateOldCorrection = function(task) {
    try {
        validateOldCorrection(task);
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
};

