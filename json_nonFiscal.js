const utils = require('myscripts_utils');
const items = require('myscripts_items');
const validators = require('myscripts_validators');

function exitWithCancelation(e) {
    Fptr.cancelReceipt();
    return e;
}

function validate(task) {
    var itemsArray = validators.mustArray(task.items, "items");
    for (var i = 0; i < itemsArray.length; ++i) {
        try {
            var type = validators.mustString(itemsArray[i].type, "type");
            if (type === "text") {
                validators.validateTextItem(itemsArray[i]);
            } else if (type === "barcode") {
                // Для комбинированной печати (1006) требуется дополнительная обработка
                if (validators.isOverlayFor1006(itemsArray[i].overlay)) {
                    validators.validateBarcode1006Item(itemsArray[i]);
                }
                validators.validateBarcodeItem(itemsArray[i]);
            } else if (type === "pictureFromMemory") {
                validators.validatePictureFromMemoryItem(itemsArray[i]);
            } else if (type === "pixels") {
                validators.validatePixelsItem(itemsArray[i]);
            }
        } catch (e) {
            if (e.name === "InvalidJsonValueError") {
                throw new validators.InvalidJsonValueError(utils.makeDotPath("items[" + i + "]", e.path), e.value);
            } else if (e.name === "InvalidJsonTypeError") {
                throw new validators.InvalidJsonTypeError(utils.makeDotPath("items[" + i + "]", e.path), e.expectedType);
            } else if (e.name === "JsonValueNotFoundError") {
                throw new validators.JsonValueNotFoundError(utils.makeDotPath("items[" + i + "]", e.path));
            } else {
                throw e;
            }
        }
    }

    validators.mustBooleanOrMissing(task.printFooter, "printFooter");
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

    Fptr.enableAutoCliche();

    if (Fptr.beginNonfiscalDocument() < 0) {
        return Fptr.error();
    }

    for (var i = 0; i < task.items.length; i++) {
        if (task.items[i].type === "text") {
            e = items.executeText(task.items[i]);
            if (e.isError) {
                return exitWithCancelation(e);
            }
        } else if (task.items[i].type === "barcode") {
            // items: для комбинированной печати (1006) требуется другой метод
            if (validators.isOverlayFor1006(task.items[i].overlay)) {
                e = items.executeBarcode1006(task.items[i]);
            }
            else {
                e = items.executeBarcode(task.items[i]);
            }
            if (e.isError) {
                return exitWithCancelation(e);
            }
        } else if (task.items[i].type === "pictureFromMemory") {
            e = items.executePictureFromMemory(task.items[i]);
            if (e.isError) {
                return exitWithCancelation(e);
            }
        } else if (task.items[i].type === "pixels") {
            e = items.executePixelsBuffer(task.items[i]);
            if (e.isError) {
                return exitWithCancelation(e);
            }
        }
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_PRINT_FOOTER, task.printFooter, Fptr.IGNORE_IF_EMPTY);
    if (Fptr.endNonfiscalDocument() < 0) {
        return exitWithCancelation(Fptr.error());
    }

    return Fptr.ok();
}
