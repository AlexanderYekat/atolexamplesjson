const utils = require('myscripts_utils');
const items = require('myscripts_items');
const validators = require('myscripts_validators');

function validate(task) {
    validators.mustNumber(task.cashSum, "cashSum");
    validators.mustBooleanOrMissing(task.electronically, "electronically");

    if (!validators.isMissing(validators.mustObjectOrMissing(task.operator, "operator"))) {
        validators.mustObject(task.operator, "operator");
        validators.mustString(task.operator.name, "operator.name");
        validators.mustStringOrMissing(task.operator.vatin, "operator.vatin");
    }

    if (!validators.isMissing(validators.mustArrayOrMissing(task.preItems, "preItems"))) {
        validators.validatePreItems(task.preItems);
    }
    if (!validators.isMissing(validators.mustArrayOrMissing(task.postItems, "postItems"))) {
        validators.validatePostItems(task.postItems);
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

    if (!validators.isMissing(task.preItems)) {
        items.executePreItems(task.preItems);
    }
    if (!validators.isMissing(task.postItems)) {
        items.executePostItems(task.postItems);
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_SUM, task.cashSum);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DOCUMENT_ELECTRONICALLY, task.electronically, Fptr.IGNORE_IF_EMPTY);
    var res = Fptr.cashOutcome();
    var shiftAutoOpened = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_SHIFT_AUTO_OPENED);

    if (res < 0) {
        Fptr.enableAutoCliche();
        return Fptr.error();
    } else {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_CASH_SUM);
        if (Fptr.queryData() < 0) {
            return Fptr.error();
        } else {
            return Fptr.ok({
                    counters: {
                        cashSum: Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_SUM)
                    }
                },
                {
                    shiftAutoOpened: shiftAutoOpened
                });

        }
    }
}
