const validators = require('myscripts_validators');
const utils = require('myscripts_utils');

exports.getOfflineValidation = function(error, result) {
    var offlineValidation = {};
    offlineValidation["fmCheck"] = ((result & (1 << 0)) !== 0);
    offlineValidation["fmCheckResult"] = ((result & (1 << 1)) !== 0);
    offlineValidation["fmCheckErrorReason"] = utils.extractKeyValue(utils.MARKING_FN_CHECK_ERROR_REASON, error);
    return offlineValidation;
};

exports.getOnlineValidation = function() {
    var result = {};
    result.itemInfoCheckResult = exports.getItemInfoCheckResult(Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_ONLINE_VALIDATION_RESULT));
    var tlvArray = Fptr.getParamString(Fptr.LIBFPTR_PARAM_TLV_LIST).split(';');
    if (tlvArray.indexOf("2005") !== -1) {
        result.markOperatorResponse = exports.getMarkOperatorResponse(Fptr.getParamInt(2005));
    }
    if (tlvArray.indexOf("2109") !== -1) {
        result.markOperatorItemStatus = utils.extractKeyValue(utils.MARKING_OPERATOR_ITEM_STATUS, Fptr.getParamInt(2109));
    }
    if (tlvArray.indexOf("2105") !== -1) {
        result.markOperatorResponseResult = utils.extractKeyValue(utils.MARKING_OPERATOR_RESPONSE_RESULT, Fptr.getParamInt(2105));
    }
    if (tlvArray.indexOf("2100") !== -1) {
        result.imcType = utils.extractKeyValue(utils.MARKING_CODE_TYPES_1_2, Fptr.getParamInt(2100));
    }
    if (tlvArray.indexOf("2101") !== -1) {
        result.imcBarcode = Fptr.getParamString(2101);
    }
    if (tlvArray.indexOf("2102") !== -1) {
        result.imcModeProcessing = Fptr.getParamInt(2102);
    }
    return result;
};

exports.getMarkOperatorResponse = function(value) {
    var markOperatorResponse = {};
    markOperatorResponse["responseStatus"] = ((value & (1 << 1)) !== 0);
    markOperatorResponse["itemStatusCheck"] = ((value & (1 << 3)) !== 0);
    return markOperatorResponse;
};

exports.getItemInfoCheckResult = function(value) {
    var itemInfoCheckResult = {};
    itemInfoCheckResult["imcCheckFlag"] = ((value & (1 << 0)) !== 0);
    itemInfoCheckResult["imcCheckResult"] = ((value & (1 << 1)) !== 0);
    itemInfoCheckResult["imcStatusInfo"] = ((value & (1 << 2)) !== 0);
    itemInfoCheckResult["imcEstimatedStatusCorrect"] = ((value & (1 << 3)) !== 0);
    itemInfoCheckResult["ecrStandAloneFlag"] = ((value & (1 << 4)) !== 0);
    return itemInfoCheckResult;
};

exports.executeBeginMarkingCodeValidation = function(task) {
    if (!validators.isMissing(task.params.imcType)) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE_TYPE, utils.parseMarkingCodeTypeFfd_1_2(task.params.imcType));
    }

    try {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE, Duktape.dec("base64", task.params.imc));
    } catch (e) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE, task.params.imc);
    }
    
    Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE_STATUS, utils.parseMarkingEstimatedStatus(task.params.itemEstimatedStatus));
    Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_PROCESSING_MODE, task.params.imcModeProcessing);

    if (!validators.isMissing(task.params.itemQuantity)) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_QUANTITY, task.params.itemQuantity);
    }

    if (!validators.isMissing(task.params.itemUnits)) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MEASUREMENT_UNIT, utils.parseItemUnits(task.params.itemUnits));
    }

    if (!validators.isMissing(task.params.itemFractionalAmount)) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_FRACTIONAL_QUANTITY, task.params.itemFractionalAmount);
    }

    if (!validators.isMissing(task.params.waitForResult)) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_WAIT_FOR_VALIDATION_RESULT, task.params.waitForResult);
    }

    if (!validators.isMissing(task.params.notSendToServer)) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_NOT_SEND_TO_SERVER, task.params.notSendToServer);
    }

    if (Fptr.beginMarkingCodeValidation() < 0) {
        return Fptr.error();
    }

    answer = {};
    answer.offlineValidation = exports.getOfflineValidation(
        Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_OFFLINE_VALIDATION_ERROR),
        Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_VALIDATION_RESULT)
    );
    return Fptr.ok(answer);
};

exports.executeGetMarkingCodeValidationStatus = function() {
    var answer = {};
    if (Fptr.getMarkingCodeValidationStatus() < 0) {
        answer.driverError = utils.driverErrorObject();
    } else {
        var isReady = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_MARKING_CODE_VALIDATION_READY);
        answer.ready = isReady;
        if (isReady) {
            var error = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_ONLINE_VALIDATION_ERROR);
            var descriptipon = Fptr.getParamString(Fptr.LIBFPTR_PARAM_MARKING_CODE_ONLINE_VALIDATION_ERROR_DESCRIPTION);
            answer.driverError = utils.driverErrorObject(error, descriptipon);
            answer.sentImcRequest = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_IS_REQUEST_SENT);
            if (error === 0) {
                answer.onlineValidation = exports.getOnlineValidation();
            }
        }
    }
    return Fptr.ok(answer);
};

exports.executeValidateMarks = function(task) {
    var timeout = 60000; //ms
    if (!validators.isMissing(task.timeout))
        timeout = task.timeout;

    var waitForResult = true;
    if (!validators.isMissing(task.waitForResult))
        waitForResult = task.waitForResult;

    answer = [];
    for (var i = 0; i < task.params.length; ++i) {
        answerItem = {};
        if (!validators.isMissing(task.params[i].imcType)) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE_TYPE, utils.parseMarkingCodeTypeFfd_1_2(task.params[i].imcType), Fptr.IGNORE_IF_EMPTY);
        }
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE_STATUS, utils.parseMarkingEstimatedStatus(task.params[i].itemEstimatedStatus));
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_PROCESSING_MODE, task.params[i].imcModeProcessing, Fptr.IGNORE_IF_EMPTY);
        try {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE, Duktape.dec("base64", task.params[i].imc));
        } catch (e) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE, task.params[i].imc);
        }
        Fptr.setParam(Fptr.LIBFPTR_PARAM_QUANTITY, task.params[i].itemQuantity, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MEASUREMENT_UNIT, utils.parseItemUnits(task.params[i].itemUnits), Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_FRACTIONAL_QUANTITY, task.params[i].itemFractionalAmount, Fptr.IGNORE_IF_EMPTY);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_WAIT_FOR_VALIDATION_RESULT, waitForResult, Fptr.IGNORE_IF_EMPTY);

        // начать проверку КМ
        if (Fptr.beginMarkingCodeValidation() < 0) {
            answerItem.driverError = utils.driverErrorObject();
            Fptr.cancelMarkingCodeValidation();
            answer.push(answerItem);
            continue;
        } else {
            answerItem.offlineValidation = exports.getOfflineValidation(
                Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_OFFLINE_VALIDATION_ERROR),
                Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_VALIDATION_RESULT)
            );
        }

        // ожидать ответ от сервера ИСМ (или дождаться завершения проверки)
        var isError = false;
        const startTime = Date.now();
        while (true) {
            if (Fptr.getMarkingCodeValidationStatus() < 0) {
                answerItem.driverError = utils.driverErrorObject();
                isError = true;
                break;
            }

            if (!Fptr.getParamBool(Fptr.LIBFPTR_PARAM_MARKING_CODE_VALIDATION_READY)) {
                endTime = Date.now();
                if (endTime - startTime >= timeout) { //ms
                    answerItem.driverError = utils.driverErrorObject(
                        Fptr.LIBFPTR_ERROR_MARK_CHECK_TIMEOUT_EXPIRED,
                        "Превышен таймаут ожидания ответа от сервера"
                    );
                    isError = true;
                    break;
                }
                sleep(300);
                continue;
            }
            if (waitForResult) {
                answerItem.onlineValidation = exports.getOnlineValidation();
                answerItem.driverError = utils.driverErrorObject(Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_ONLINE_VALIDATION_ERROR));
            }
            answerItem.sentImcRequest = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_IS_REQUEST_SENT);
            break;
        }


        if (isError)
        {
            answer.push(answerItem);
            Fptr.cancelMarkingCodeValidation();
            continue;
        }

        if (!waitForResult) {
            if (Fptr.getMarkingCodeValidationStatus() < 0) {
                answerItem.driverError = utils.driverErrorObject();
                Fptr.cancelMarkingCodeValidation();
            }

            if (Fptr.acceptMarkingCode() < 0) {
                answerItem.driverError = utils.driverErrorObject();
                Fptr.cancelMarkingCodeValidation();
            } else {
                answerItem.itemInfoCheckResult = exports.getItemInfoCheckResult(Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_ONLINE_VALIDATION_RESULT));
            }
        } else if (answerItem.onlineValidation.itemInfoCheckResult.imcCheckFlag &&
                   answerItem.onlineValidation.itemInfoCheckResult.imcCheckResult &&
                   answerItem.onlineValidation.itemInfoCheckResult.imcStatusInfo  &&
                   answerItem.onlineValidation.itemInfoCheckResult.imcEstimatedStatusCorrect) {
            if (Fptr.acceptMarkingCode() < 0) {
                answerItem.driverError = utils.driverErrorObject();
                Fptr.cancelMarkingCodeValidation();
            } else {
                answerItem.itemInfoCheckResult = exports.getItemInfoCheckResult(Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_ONLINE_VALIDATION_RESULT));
            }
        } else if (Fptr.declineMarkingCode() < 0) {
            answerItem.driverError = utils.driverErrorObject();
            Fptr.cancelMarkingCodeValidation();
        }

        answer.push(answerItem);
    }
    return answer;
};