const utils = require('myscripts_utils');
const validators = require('myscripts_validators');

function validate(task) {
    validators.mustStringValues(task.filter, "filter", ["fiscalDocumentNumber", "shiftNumber"]);
    validators.mustNumber(task.from, "from");
    validators.mustNumber(task.to, "to");
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

    if (task.filter === "fiscalDocumentNumber") {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_REPORT_TYPE, Fptr.LIBFPTR_RT_JOURNAL_DOCUMENT_BY_NUMBERS);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER, task.from);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER_END, task.to);
    }
    else if (task.filter === "shiftNumber") {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_REPORT_TYPE, Fptr.LIBFPTR_RT_JOURNAL_DOCUMENT_BY_SHIFTS);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SHIFT_NUMBER, task.from);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SHIFT_NUMBER_END, task.to);
    }
    if (Fptr.report() < 0) {
        return Fptr.error();
    }

    return Fptr.ok();
}
