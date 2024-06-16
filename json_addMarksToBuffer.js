const utils = require('myscripts_utils');
const validators = require('myscripts_validators');
const marks = require('myscripts_marks');

function validate(task) {
    validators.mustObject(task.params, "params");
    for (var i = 0; i < task.params.length; ++i) {
        try {
            validators.mustString(task.params[i].imc, "params.imc");
            validators.mustDictValueOrMissing(task.params[i].imcType, "params.imcType", utils.MARKING_CODE_TYPES_1_2);
            validators.mustStringOrMissing(task.params[i].itemFractionalAmount, "params.itemFractionalAmount");
            validators.mustDictValueOrMissing(task.params[i].itemEstimatedStatus, "params.itemEstimatedStatus", utils.MARKING_ESTIMATED_STATUS);
            validators.mustNumberOrMissing(task.params[i].imcModeProcessing, "params.imcModeProcessing");
            validators.mustNumberOrMissing(task.params[i].itemQuantity, "params.itemQuantity");
            validators.mustDictValueOrMissing(task.params[i].itemUnits, "params.itemUnits", utils.ITEM_UNITS);
        } catch (e) {
            if (e.name === "InvalidJsonValueError") {
                throw new validators.InvalidJsonValueError(utils.makeDotPath("params" + "[" + i + "]", e.path), e.value);
            } else if (e.name === "InvalidJsonTypeError") {
                throw new validators.InvalidJsonTypeError(utils.makeDotPath("params" + "[" + i + "]", e.path), e.expectedType);
            } else if (e.name === "JsonValueNotFoundError") {
                throw new validators.JsonValueNotFoundError(utils.makeDotPath("params" + "[" + i + "]", e.path));
            } else {
                throw e;
            }
        }
    }
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

    // Предварительная проверка статуса проверки КМ
    // Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_MARKING_MODE_STATUS);
    // if (Fptr.fnQueryData() >= 0) {
    //     switch (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_MODE_CHECKING_STATUS)) {
    //         case Fptr.LIBFPTR_MCS_BLOCK:
    //             return Fptr.result(Fptr.LIBFPTR_ERROR_MARKING_WORK_TEMPORARY_BLOCKED);
    //         case Fptr.LIBFPTR_MCS_MARK_RECEIVE_B1:
    //         case Fptr.LIBFPTR_MCS_MARK_STATE_QUERY_B5:
    //         case Fptr.LIBFPTR_MCS_MARK_STATE_ANSWER_B6:
    //             return Fptr.result(Fptr.LIBFPTR_ERROR_MARKING_CODE_VALIDATION_IN_PROGRESS);
    //     }
    // }

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
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_WAIT_FOR_VALIDATION_RESULT, false);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_NOT_SEND_TO_SERVER, true);

        if (Fptr.beginMarkingCodeValidation() < 0) {
            answerItem.driverError = utils.driverErrorObject();
            Fptr.cancelMarkingCodeValidation();
            answer.push(answerItem);
            continue;
        } else {
            answerItem.driverError = utils.driverErrorObject();
            answerItem.offlineValidation = marks.getOfflineValidation(
                Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_OFFLINE_VALIDATION_ERROR),
                Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_VALIDATION_RESULT)
            );
        }

        // ожидать ответ от сервера ИСМ (или дождаться завершения проверки)
        var isError = false;
        timeout = 60000;
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
            answerItem.driverError = utils.driverErrorObject(Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_ONLINE_VALIDATION_ERROR));
            break;
        }

        if (isError)
        {
            answer.push(answerItem);
            Fptr.cancelMarkingCodeValidation();
            continue;
        }

        if (Fptr.acceptMarkingCode() < 0) {
            answerItem.driverError = utils.driverErrorObject();
            Fptr.cancelMarkingCodeValidation();
        } else {
            answerItem.itemInfoCheckResult = marks.getItemInfoCheckResult(Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_CODE_ONLINE_VALIDATION_RESULT))
        }
        answer.push(answerItem);
    }

    return Fptr.ok(answer);
}
