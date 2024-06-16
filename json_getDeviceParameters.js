const validators = require('myscripts_validators');

function validate(task) {
    var arr = validators.mustArray(task.keys, "keys");
    for (var i = 0; i < arr.length; i++) {
        validators.mustNumber(task.keys[i], "keys[" + i + "]");
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

    var parametersKeys = task.keys;
    var parameters = [];
    for (var i = 0; i < parametersKeys.length; i++) {
        var param = {};
        param.key = parametersKeys[i];
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, parametersKeys[i]);
        if (Fptr.readDeviceSetting() === 0) {
            param.value = Fptr.getParamString(Fptr.LIBFPTR_PARAM_SETTING_VALUE);
        } else {
            param.errorDescription = Fptr.errorDescription();
            param.errorCode = Fptr.errorCode();
        }
        parameters.push(param);
    }
    return Fptr.ok({
        deviceParameters: parameters
    });
}
