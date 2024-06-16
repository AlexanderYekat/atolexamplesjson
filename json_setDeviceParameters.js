const validators = require('myscripts_validators');
const utils = require('myscripts_utils');

function validate(task) {
    var params = validators.mustArray(task.deviceParameters, "deviceParameters");

    for (var i = 0; i < params.length; ++i) {
        try {
            validators.mustNumber(params[i].key, "key");
            validators.mustTypes(params[i].value, "value", ["number", "string", "boolean"]);
        } catch (e) {
            if (e.name === "InvalidJsonValueError") {
                throw new validators.InvalidJsonValueError(utils.makeDotPath("deviceParameters[" + i + "]", e.path), e.value);
            } else if (e.name === "InvalidJsonTypeError") {
                throw new validators.InvalidJsonTypeError(utils.makeDotPath("deviceParameters[" + i + "]", e.path), e.expectedType);
            } else if (e.name === "JsonValueNotFoundError") {
                throw new validators.JsonValueNotFoundError(utils.makeDotPath("deviceParameters[" + i + "]", e.path));
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

    var answer = [];

    for (var i = 0; i < task.deviceParameters.length; i++) {
        var answerField = {
            key: task.deviceParameters[i].key,
            value: task.deviceParameters[i].value,
        };

        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, task.deviceParameters[i].key);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_VALUE, task.deviceParameters[i].value);
        if (Fptr.writeDeviceSetting() < 0) {
            answerField.errorCode = Fptr.errorCode();
            answerField.errorDescription = Fptr.errorDescription();
        }

        answer.push(answerField)
    }

    if (Fptr.commitSettings() < 0) {
        return Fptr.error();
    }

    return Fptr.ok({
        deviceParameters: answer
    });
}
