const utils = require('myscripts_utils');
const validators = require('myscripts_validators');

function validate(task) {
    validators.mustNumberOrMissing(task.params, "timeout");
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

    var result = {};

    if (Fptr.pingMarkingServer() < 0) {
        result.driverError = utils.driverErrorObject();
        return Fptr.ok(result);
    }

    var timeout = 60000; //ms
    if (!validators.isMissing(task.timeout))
        timeout = task.timeout;

    const startTime = Date.now();
    while (true) {
        endTime = Date.now();
        if (endTime - startTime >= timeout) { //ms
            result.driverError = utils.driverErrorObject(
                Fptr.LIBFPTR_ERROR_MARK_CHECK_TIMEOUT_EXPIRED,
                "Превышен таймаут ожидания ответа от сервера"
            );
            break;
        }
        if (Fptr.getMarkingServerStatus() < 0) {
            result.driverError = utils.driverErrorObject();
            break;
        }
        result.ready = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_CHECK_MARKING_SERVER_READY);
        if (result.ready) {
            result.time = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_SERVER_RESPONSE_TIME);
            break;
        }
        sleep(300);
    }

    return Fptr.ok(result);
}
