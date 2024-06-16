const utils = require('myscripts_utils');
const validators = require('myscripts_validators');
const marks = require('myscripts_marks');

function validate(task) {
    validators.mustNumberOrMissing(task.timeout, "timeout");
    validators.mustBooleanOrMissing(task.waitForResult, "waitForResult");
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

    return Fptr.ok(marks.executeValidateMarks(task));
}
