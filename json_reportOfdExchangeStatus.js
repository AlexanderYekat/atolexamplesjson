const utils = require('myscripts_utils');
const items = require('myscripts_items');
const validators = require('myscripts_validators');

function validate(task) {
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

    var state = {};
    var errorsInformation = {};

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_OFD_EXCHANGE_STATUS);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }
    state.notSentCount = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENTS_COUNT);
    state.notSentFirstDocDateTime = utils.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));
    state.notSentFirstDocNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_ERRORS);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }
    errorsInformation.fnCommandCode = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_COMMAND_CODE);
    errorsInformation.documentNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);

    errorsInformation.fn = {
        code: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FN_ERROR),
        description: Fptr.getParamString(Fptr.LIBFPTR_PARAM_FN_ERROR_TEXT)
    };
    errorsInformation.network = {
        code: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_NETWORK_ERROR),
        description: Fptr.getParamString(Fptr.LIBFPTR_PARAM_NETWORK_ERROR_TEXT)
    };
    errorsInformation.ofd = {
        code: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_OFD_ERROR),
        description: Fptr.getParamString(Fptr.LIBFPTR_PARAM_OFD_ERROR_TEXT)
    };

    errorsInformation.lastSuccessConnectionDateTime = utils.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));

    if (!validators.isMissing(task.preItems)) {
        items.executePreItems(task.preItems);
    }
    if (!validators.isMissing(task.postItems)) {
        items.executePostItems(task.postItems);
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_REPORT_TYPE, Fptr.LIBFPTR_RT_OFD_EXCHANGE_STATUS);
    if (Fptr.report() < 0) {
        return Fptr.error();
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_CASH_SUM);
    if (Fptr.queryData() < 0) {
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

    return utils.getFiscalDocumentResult();
}
