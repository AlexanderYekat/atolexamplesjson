const utils = require('myscripts_utils');
const validators = require('myscripts_validators');

function validate(task) {
    validators.mustNumber(task.fiscalDocumentNumber, "fiscalDocumentNumber");
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

    Fptr.setParam(Fptr.LIBFPTR_PARAM_REPORT_TYPE, Fptr.LIBFPTR_RT_FN_DOC_BY_NUMBER);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER, task.fiscalDocumentNumber);
    if (Fptr.report() < 0) {
        return Fptr.error();
    }

    return Fptr.ok();
}
