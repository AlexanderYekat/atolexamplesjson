const utils = require('myscripts_utils');
const validators = require('myscripts_validators');

function validate(task) {
    if (!validators.isMissing(validators.mustObjectOrMissing(task.operator, "operator"))) {
        validators.mustObject(task.operator, "operator");
        validators.mustString(task.operator.name, "operator.name");
        validators.mustStringOrMissing(task.operator.vatin, "operator.vatin");
    }

    validators.mustBooleanOrMissing(task.electronically, "electronically");
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

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_OPERATION_TYPE, Fptr.LIBFPTR_FNOP_CLOSE_ARCHIVE);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_REPORT_ELECTRONICALLY, task.electronically, Fptr.IGNORE_IF_EMPTY);
    if (Fptr.fnOperation() < 0) {
        var e = Fptr.error();
        if (e.error === Fptr.LIBFPTR_ERROR_DENIED_IN_CLOSED_SHIFT) {
            return e;
        }

        Fptr.checkDocumentClosed();
        if (!Fptr.getParamBool(Fptr.LIBFPTR_PARAM_DOCUMENT_CLOSED)) {
            return e;
        }
    }

    return utils.getFiscalDocumentResult();
}
