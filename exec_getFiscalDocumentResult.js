const utils = require('myscripts_utils');
const validators = require('myscripts_validators');

function validate(params) {
    validators.mustNumber(params.fiscalDocumentNumber, "fiscalDocumentNumber");
    validators.mustBoolean(params.recovery, "recovery");
}

function main(args) {
    try {
        validate(args);
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

    return utils.getFiscalDocumentResult(args.fiscalDocumentNumber, args.recovery);
}

return main(__scriptParams);
