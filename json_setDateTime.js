const validators = require('myscripts_validators');

const reggie = /^(\d{4}).(\d{2}).(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

function validate(task) {
    var dateString = validators.mustString(task.dateTime, "dateTime");
    if (!reggie.test(dateString)) {
        throw new validators.InvalidJsonValueError("dateTime", dateString);
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

    var dateString = task.dateTime;
    var dateArray = reggie.exec(dateString);
    var dateObject = new Date();
    dateObject.setUTCFullYear(+dateArray[1]);
    dateObject.setUTCMonth(+dateArray[2] - 1, +dateArray[3]);
    dateObject.setUTCHours(+dateArray[4], +dateArray[5], +dateArray[6], 0);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATE_TIME, dateObject);
    if (Fptr.writeDateTime() < 0) {
        return Fptr.error();
    }
    return Fptr.ok();
}
