const utils = require('myscripts_utils');
const items = require('myscripts_items');
const validators = require('myscripts_validators');

function validate(task) {
    if (!validators.isMissing(validators.mustObjectOrMissing(task.operator, "operator"))) {
        validators.mustObject(task.operator, "operator");
        validators.mustString(task.operator.name, "operator.name");
        validators.mustStringOrMissing(task.operator.vatin, "operator.vatin");
    }

    validators.mustBooleanOrMissing(task.electronically, "electronically");

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

    Fptr.readModelFlags();
    var canElectronicallyReport = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_CAP_DISABLE_PRINT_REPORTS);

    if (!task.electronically || !canElectronicallyReport) {
        if (!validators.isMissing(task.preItems)) {
            items.executePreItems(task.preItems);
        }
        if (!validators.isMissing(task.postItems)) {
            items.executePostItems(task.postItems);
        }
    }

    // Кешируем номер последнего чека в ФН - после закрытия может сброситься
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_SHIFT);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }
    var lastReceiptNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPT_NUMBER);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_REPORT_ELECTRONICALLY, task.electronically, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_REPORT_TYPE, Fptr.LIBFPTR_RT_CLOSE_SHIFT);
    if (Fptr.report() < 0) {
        var e = Fptr.error();
        if (e.error === Fptr.LIBFPTR_ERROR_DENIED_IN_CLOSED_SHIFT) {
            Fptr.enableAutoCliche();
            return e;
        }

        Fptr.checkDocumentClosed();
        if (!Fptr.getParamBool(Fptr.LIBFPTR_PARAM_DOCUMENT_CLOSED)) {
            Fptr.enableAutoCliche();
            return e;
        }
    }

    var result = utils.getFiscalDocumentResult();
    if (!result.isError) {
        result.result.fiscalParams.receiptsCount = lastReceiptNumber;
    }
    return result;
}
