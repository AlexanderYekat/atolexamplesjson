const utils = require('myscripts_utils');
const validators = require('myscripts_validators');

// Теги (команды) для комбинированной печати через пользовательский шаблон 1006
var TAG_RAW_DATA  = (0); // Тег для первичной (внешней) TLV
var TAG_COMBINE   = (1); // Включение комбинированной печати (параметр: 1 - текст слева, 0 - текст справа)
var TAG_QR_PARAM  = (2); // Параметры QR-кода (Ver, Mode, Ecc_level, Scale)
var TAG_QR_DATA   = (3); // Данные QR-кода (строка, макс. TLV_BUF_LEN символов)
var TAG_TEXT      = (4); // Добавить/напечатать строку (для комбинированной/обычной печати, макс. TLV_BUF_LEN символов)
var TAG_FONT      = (5); // Установить шрифт (параметр: 1 - номер и атрибуты шрифта)
var TAG_ALIGNMENT = (6); // Установить выравнивание (параметр: 1 - FORM_OPTION_ALIGN_LEFT и т.д. )

// Text Atributes (from HAL/h_Printer.h)
const PA_DOUBLE_WIDTH  = 0x80;
const PA_DOUBLE_HEIGHT = 0x40;

function setAlignment(alignment, defaultAlignment) {
    if (validators.isMissing(alignment)) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_ALIGNMENT, defaultAlignment);
        return;
    }

    switch (alignment) {
        case "left":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_ALIGNMENT, Fptr.LIBFPTR_ALIGNMENT_LEFT);
            break;
        case "center":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_ALIGNMENT, Fptr.LIBFPTR_ALIGNMENT_CENTER);
            break;
        case "right":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_ALIGNMENT, Fptr.LIBFPTR_ALIGNMENT_RIGHT);
            break;
    }
}

exports.executeText = function (text, defer) {
    if (!validators.isMissing(defer)) {
        if (defer !== Fptr.LIBFPTR_DEFER_NONE) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_DEFER, defer)
        }
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_TEXT, text.text, Fptr.IGNORE_IF_EMPTY);
    setAlignment(text.alignment, Fptr.LIBFPTR_ALIGNMENT_LEFT);

    switch (text.wrap) {
        case "none":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_TEXT_WRAP, Fptr.LIBFPTR_TW_NONE);
            break;
        case "chars":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_TEXT_WRAP, Fptr.LIBFPTR_TW_CHARS);
            break;
        case "words":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_TEXT_WRAP, Fptr.LIBFPTR_TW_WORDS);
            break;
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FONT, text.font, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FONT_DOUBLE_WIDTH, text.doubleWidth, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FONT_DOUBLE_HEIGHT, text.doubleHeight, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_STORE_IN_JOURNAL, text.storeInJournal, Fptr.IGNORE_IF_EMPTY);
    Fptr.printText();
    return Fptr.error();
};

exports.executeBarcode = function (barcode, defer) {
    var overlay = barcode.overlay;

    if (!validators.isMissing(overlay)) {
        for (var i = 0; i < overlay.length; i++) {
            var e = this.executeText(overlay[i], Fptr.LIBFPTR_DEFER_OVERLAY);
            if (e.isError) {
                return e;
            }
        }
    }

    if (!validators.isMissing(defer) && defer !== Fptr.LIBFPTR_DEFER_NONE) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_DEFER, defer)
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE, barcode.barcode);
    switch (barcode.barcodeType) {
        case "EAN8":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_EAN_8);
            break;
        case "EAN13":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_EAN_13);
            break;
        case "UPCA":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_UPC_A);
            break;
        case "UPCE":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_UPC_E);
            break;
        case "CODE39":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_CODE_39);
            break;
        case "CODE93":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_CODE_93);
            break;
        case "CODE128":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_CODE_128);
            break;
        case "CODABAR":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_CODABAR);
            break;
        case "ITF":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_ITF);
            break;
        case "ITF14":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_ITF_14);
            break;
        case "GS1_128":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_GS1_128);
            break;
        case "PDF417":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_PDF417);
            break;
        case "QR":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_QR);
            break;
        case "CODE39_EXTENDED":
            Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_TYPE, Fptr.LIBFPTR_BT_CODE_39_EXTENDED);
            break;
    }

    setAlignment(barcode.alignment, Fptr.LIBFPTR_ALIGNMENT_CENTER);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_SCALE, barcode.scale, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_HEIGHT, barcode.height, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_BARCODE_PRINT_TEXT, barcode.printText, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_STORE_IN_JOURNAL, barcode.storeInJournal, Fptr.IGNORE_IF_EMPTY);
    Fptr.printBarcode();
    return Fptr.error();
};

exports.executeCombine1006 = function (barcode, defer) {
    if (!validators.isMissing(barcode.alignment) && barcode.alignment === "left") {
        Fptr.setParam(TAG_COMBINE, 0) // QR-код слева, текст справа
    }
    else {
        Fptr.setParam(TAG_COMBINE, 1) // текст слева, QR-код справа
    }
    return Fptr.error();
};

exports.executeParam1006 = function (barcode, defer) {
    QrCodeParameters = 0x00000000; // 4 байта
    QrCodeParameters |= (0x06 << 0); // Поле "Ver" не передаётся, оставляем значение по умолчанию
    QrCodeParameters |= (0x02 << 8); // Поле "Mode" не передаётся, оставляем значение по умолчанию
    QrCodeParameters |= (0x00 << 16); // Поле "Ecc_level" не передаётся, оставляем значение по умолчанию
    if (!validators.isMissing(barcode.scale)) {
        QrCodeParameters |= (barcode.scale << 24); // Поле "Scale" заполняем из JSON
    }
    else {
        QrCodeParameters |= (0x04 << 24); // Поле "Scale" оставляем по умолчанию
    }
    Fptr.setParam(TAG_QR_PARAM, QrCodeParameters);
    return Fptr.error();
};

exports.executeParam1006Font = function (overlay, defer) {
    FontParameters = 0x00000000; // 4 байта
    if (!validators.isMissing(overlay.font)) {
        FontParameters = overlay.font; // Поле "Font" заполняем из JSON
    }
    if (!validators.isMissing(overlay.doubleWidth) && overlay.doubleWidth) {
        FontParameters |= PA_DOUBLE_WIDTH;
    }
    if (!validators.isMissing(overlay.doubleHeight) && overlay.doubleHeight) {
        FontParameters |= PA_DOUBLE_HEIGHT;
    }
    Fptr.setParam(TAG_FONT, FontParameters);
    return Fptr.error();
};

exports.executeParam1006Alignment = function (overlay, defer) {
    if (!validators.isMissing(overlay.alignment)) {
        AlignmentParameters = 0x00000000; // 4 байта
        if (overlay.alignment === "center") {
            AlignmentParameters = 0x00000000; // FORM_OPTION_ALIGN_RIGHT
        }
        else if (overlay.alignment === "right") {
            AlignmentParameters = 0x00000008; // FORM_OPTION_ALIGN_RIGHT
        }
        else if (overlay.alignment === "left") {
            AlignmentParameters = 0x00000010; // FORM_OPTION_ALIGN_LEFT
        }
        Fptr.setParam(TAG_ALIGNMENT, AlignmentParameters)
    }
    return Fptr.error();
};

exports.executeQr1006 = function (barcode, defer) {
    Fptr.setParam(TAG_QR_DATA, barcode.barcode);
    return Fptr.error();
};

exports.executeText1006 = function (text, defer) {
    Fptr.setParam(TAG_TEXT, text.text);
    return Fptr.error();
};

exports.execute1006 = function (text, defer) {
    // Собираем итоговую составную TLV
    Fptr.utilFormTlv();
    RawV = Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE);// V (value)
    var RawTL = new Uint8Array([
        (TAG_RAW_DATA & 0xFF), ((TAG_RAW_DATA >> 8) & 0xFF),    // T (tag)
        (RawV.length & 0xFF),  ((RawV.length >> 8) & 0xFF)]);   // L (length)
    var RawTLV = new Int8Array(RawTL.length + RawV.length);
    RawTLV.set(RawTL);
    RawTLV.set(RawV, RawTL.length);
    if (RawV.length > 631) {
        throw new validators.InvalidJsonValueError("превышение", "631 байт"); // [TODO] здесь можно бросать исключения?
    }

    // Запускаем пользовательский шаблон 1006
    if (!validators.isMissing(defer) && defer !== Fptr.LIBFPTR_DEFER_NONE) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_DEFER, defer)
    }
    Fptr.setParam(Fptr.LIBFPTR_PARAM_USER_SCRIPT_ID, "1006");
    Fptr.setParam(Fptr.LIBFPTR_PARAM_USER_SCRIPT_PARAMETER, RawTLV);
    Fptr.callScript();

    return Fptr.error();
};

exports.executeBarcode1006 = function (barcode, defer) {
    // 0. Начинаем печать с пустой строки (возможно, так инициализируется принтер)
    // Fptr.setParam(TAG_TEXT, " ");

    // 1. Включаем комбинированную печать
    var e = this.executeCombine1006(barcode, defer);
    if (e.isError) {
        return e;
    }

    // 2. Применяем параметры QR-кода
    e = this.executeParam1006(barcode, defer);
    if (e.isError) {
        return e;
    }

    // 3. Печатаем сам QR-код
    e = this.executeQr1006(barcode, defer);
    if (e.isError) {
        return e;
    }

    // 4. Впечатываем строки рядом с QR-кодом
    var overlay = barcode.overlay;
    var lastFont = -1;
    var lastAlignment = "unknown";
    if (!validators.isMissing(overlay)) {
        for (var i = 0; i < overlay.length; i++) {
            // 4.1. Применяем параметры текста: шрифт
            var newFont = lastFont;
            if (!validators.isMissing(overlay[i].font)) {
                newFont = overlay[i].font;
            }
            if (!validators.isMissing(overlay[i].doubleWidth) && overlay[i].doubleWidth) {
                newFont |= PA_DOUBLE_WIDTH;
            }
            else {
                newFont &= ~PA_DOUBLE_WIDTH;
            }
            if (!validators.isMissing(overlay[i].doubleHeight) && overlay[i].doubleHeight) {
                newFont |= PA_DOUBLE_HEIGHT;
            }
            else {
                newFont &= ~PA_DOUBLE_HEIGHT;
            }
            if (newFont !== lastFont) { // изменился шрифт?
                e = this.executeParam1006Font(overlay[i], defer);
                if (e.isError) {
                    return e;
                }
                lastFont = newFont;
            }

            // 4.2. Применяем параметры текста: выравнивание
            if (!validators.isMissing(overlay[i].alignment) && overlay[i].alignment !== lastAlignment) { // изменилось выравнивание?
                e = this.executeParam1006Alignment(overlay[i], defer);
                if (e.isError) {
                    return e;
                }
                lastAlignment = overlay[i].alignment;
            }
            // 4.3. Печатаем текст
            var e = this.executeText1006(overlay[i], defer);
            if (e.isError) {
                return e;
            }
        }
    }
    else {
        // Ни одной строки не передали. Должна быть хотя бы одна, чтобы начать печать
        Fptr.setParam(TAG_TEXT, " ")
    }

    // 5. Получаем финальную TLV и запускаем шаблон 1006
    e = this.execute1006(barcode, defer);
    if (e.isError) {
        return e;
    }

    return Fptr.error();
};


exports.executePictureFromMemory = function (picture, defer) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_PICTURE_NUMBER, picture.pictureNumber);
    setAlignment(picture.alignment, Fptr.LIBFPTR_ALIGNMENT_CENTER);

    if (!validators.isMissing(defer) && defer !== Fptr.LIBFPTR_DEFER_NONE) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_DEFER, defer)
    }

    Fptr.printPictureByNumber();
    return Fptr.error();
};

exports.executePixelsBuffer = function (pixelBuffer, defer) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_PIXEL_BUFFER, Duktape.dec("base64", pixelBuffer.pixels));
    Fptr.setParam(Fptr.LIBFPTR_PARAM_WIDTH, pixelBuffer.width);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_SCALE_PERCENT, pixelBuffer.scale, Fptr.IGNORE_IF_EMPTY);
    setAlignment(pixelBuffer.alignment, Fptr.LIBFPTR_ALIGNMENT_CENTER);

    if (!validators.isMissing(defer) && defer !== Fptr.LIBFPTR_DEFER_NONE) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_DEFER, defer)
    }

    Fptr.printPixelBuffer();
    return Fptr.error();
};

exports.executeUserAttribute = function (userAttribute) {
    Fptr.setParam(1085, userAttribute.name, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1086, userAttribute.value, Fptr.IGNORE_IF_EMPTY);
    Fptr.utilFormTlv();
    var tag1084 = Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE);

    if (validators.isMissing(userAttribute.print) || userAttribute.print) {
        Fptr.setParam(1084, tag1084);
    } else {
        Fptr.setNonPrintableParam(1084, tag1084);
    }

    Fptr.fnWriteAttributes();
    return Fptr.error();
};

exports.executeAdditionalAttribute = function (additionalAttribute) {
    if (validators.isMissing(additionalAttribute.print) || additionalAttribute.print) {
        Fptr.setParam(1192, additionalAttribute.value);
    } else {
        Fptr.setNonPrintableParam(1192, additionalAttribute.value);
    }

    Fptr.fnWriteAttributes();
    return Fptr.error();
};

exports.executePosition = function (position) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error()
    }
    var ffd = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FFD_VERSION);

    if (!validators.isMissing(position.agentInfo)) {
        if (!validators.isMissing(position.agentInfo.moneyTransferOperator)) {
            Fptr.setParam(1005, position.agentInfo.moneyTransferOperator.address, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1016, position.agentInfo.moneyTransferOperator.vatin, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1026, position.agentInfo.moneyTransferOperator.name, Fptr.IGNORE_IF_EMPTY);
            phones = position.agentInfo.moneyTransferOperator.phones;
            for (var i = 0; phones && i < phones.length; i++) {
                Fptr.setParam(1075, phones[i], Fptr.IGNORE_IF_EMPTY);
            }
        }
        if (!validators.isMissing(position.agentInfo.payingAgent)) {
            Fptr.setParam(1044, position.agentInfo.payingAgent.operation, Fptr.IGNORE_IF_EMPTY);
            phones = position.agentInfo.payingAgent.phones;
            for (var i = 0; phones && i < phones.length; i++) {
                Fptr.setParam(1073, phones[i], Fptr.IGNORE_IF_EMPTY);
            }
        }

        if (!validators.isMissing(position.agentInfo.receivePaymentsOperator)) {
            phones = position.agentInfo.receivePaymentsOperator.phones;
            for (var i = 0; phones && i < phones.length; i++) {
                Fptr.setParam(1074, phones[i], Fptr.IGNORE_IF_EMPTY);
            }
        }

        Fptr.utilFormTlv();
        var tag1223 = Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE);
    }

    if (!validators.isMissing(position.supplierInfo)) {
        Fptr.setParam(1225, position.supplierInfo.name, Fptr.IGNORE_IF_EMPTY);
        phones = position.supplierInfo.phones;
        for (var i = 0; phones && i < phones.length; i++) {
            Fptr.setParam(1171, phones[i], Fptr.IGNORE_IF_EMPTY);
        }

        if (ffd >= Fptr.LIBFPTR_FFD_1_2) {

        }

        Fptr.utilFormTlv();
        var tag1224 = Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE);
    }

    var arr1260 = new Array();
    if (!validators.isMissing(position.industryInfo) && ffd >= Fptr.LIBFPTR_FFD_1_2) {
        for (var i = 0; i < position.industryInfo.length; i++) {
            Fptr.setParam(1262, position.industryInfo[i].fois, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1263, position.industryInfo[i].date, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1264, position.industryInfo[i].number, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1265, position.industryInfo[i].industryAttribute, Fptr.IGNORE_IF_EMPTY);
            if (Fptr.utilFormTlv() < 0) {
                return Fptr.error();
            }
            arr1260.push(Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE));
        }
    }


    // Ниже подаются только параметры регистрации, вызовы других методов (utilFormTlv) запрещены

    if (!validators.isMissing(position.productCodes) && ffd >= Fptr.LIBFPTR_FFD_1_2) {
        var codesArray = validators.mustArrayOrMissing(position.productCodes.codes, "productCodes.codes");
        if (!validators.isMissing(codesArray)) {
            for (var i = 0; codesArray && (i < codesArray.length); i++) {
                Fptr.setParam(Fptr.LIBFPTR_PARAM_PRODUCT_CODE, codesArray[i], Fptr.IGNORE_IF_EMPTY);
            }
        } else {
            Fptr.setParam(1300, position.productCodes.undefined, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1301, position.productCodes.ean8, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1302, position.productCodes.ean13, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1303, position.productCodes.itf14, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1304, position.productCodes.gs10, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1305, position.productCodes.gs1m, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1306, position.productCodes.short, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1307, position.productCodes.furs, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1308, position.productCodes.egais20, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1309, position.productCodes.egais30, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1320, position.productCodes.f1, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1321, position.productCodes.f2, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1322, position.productCodes.f3, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1323, position.productCodes.f4, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1324, position.productCodes.f5, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(1325, position.productCodes.f6, Fptr.IGNORE_IF_EMPTY);
        }
    }


    if (!validators.isMissing(position.markingCode)) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE, Duktape.dec("base64", position.markingCode.mark));
        Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE_TYPE, utils.MARKING_CODE_TYPES[position.markingCode.type], Fptr.IGNORE_IF_EMPTY);
    } else if (!validators.isMissing(position.imcParams)) {
        try {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE, Duktape.dec("base64", position.imcParams.imc));
        } catch (e) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE, position.imcParams.imc);
        }

        if (!validators.isMissing(position.imcParams.imcType)) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE_TYPE, utils.MARKING_CODE_TYPES_1_2[position.imcParams.imcType], Fptr.IGNORE_IF_EMPTY);
        }
        if (!validators.isMissing(position.imcParams.itemFractionalAmount)) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_FRACTIONAL_QUANTITY, position.imcParams.itemFractionalAmount);
        }
        if (!validators.isMissing(position.imcParams.itemEstimatedStatus)) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE_STATUS, utils.parseMarkingEstimatedStatus(position.imcParams.itemEstimatedStatus));
        }
        if (!validators.isMissing(position.imcParams.imcModeProcessing)) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_PROCESSING_MODE, position.imcParams.imcModeProcessing);
        }
        if (!validators.isMissing(position.imcParams.imcBarcode)) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_PRODUCT_ID,  Duktape.dec("base64", position.imcParams.imcBarcode));
        }
        if (!validators.isMissing(position.imcParams.itemInfoCheckResult)) {
            var value = 0;
            if (position.imcParams.itemInfoCheckResult.imcCheckFlag)
                value += (1 << 0);
            if (position.imcParams.itemInfoCheckResult.imcCheckResult)
                value += (1 << 1);
            if (position.imcParams.itemInfoCheckResult.imcStatusInfo)
                value += (1 << 2);
            if (position.imcParams.itemInfoCheckResult.imcEstimatedStatusCorrect)
                value += (1 << 3);
            if (position.imcParams.itemInfoCheckResult.ecrStandAloneFlag)
                value += (1 << 4);
            Fptr.setParam(Fptr.LIBFPTR_PARAM_MARKING_CODE_ONLINE_VALIDATION_RESULT, value);
        }
    } else if (!validators.isMissing(position.nomenclatureCode)) {
        if (typeof position.nomenclatureCode === "string") {
            Fptr.setParam(1162, Duktape.dec("base64", position.nomenclatureCode));
        } else if (typeof position.nomenclatureCode === "object" && !validators.isMissing(position.nomenclatureCode)) {
            switch (position.nomenclatureCode.type) {
                case "furs":
                    Fptr.setParam(Fptr.LIBFPTR_PARAM_NOMENCLATURE_TYPE, Fptr.LIBFPTR_NT_FURS);
                    break;
                case "medicines":
                    Fptr.setParam(Fptr.LIBFPTR_PARAM_NOMENCLATURE_TYPE, Fptr.LIBFPTR_NT_MEDICINES);
                    break;
                case "tobacco":
                    Fptr.setParam(Fptr.LIBFPTR_PARAM_NOMENCLATURE_TYPE, Fptr.LIBFPTR_NT_TOBACCO);
                    break;
                case "shoes":
                    Fptr.setParam(Fptr.LIBFPTR_PARAM_NOMENCLATURE_TYPE, Fptr.LIBFPTR_NT_SHOES);
                    break;
            }
            Fptr.setParam(Fptr.LIBFPTR_PARAM_GTIN, position.nomenclatureCode.gtin, Fptr.IGNORE_IF_EMPTY);
            Fptr.setParam(Fptr.LIBFPTR_PARAM_SERIAL_NUMBER, position.nomenclatureCode.serial);
            if (Fptr.utilFormNomenclature() < 0) {
                return Fptr.error();
            }

            Fptr.setParam(1162, Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE));
        }
    }

    if (!validators.isMissing(position.agentInfo)) {
        if (!validators.isMissing(position.agentInfo.agents)) {
            var agentType = Fptr.LIBFPTR_AT_NONE;
            for (var i = 0; i < position.agentInfo.agents.length; i++) {
                agentType |= utils.AGENT_TYPES[position.agentInfo.agents[i]];
            }
            if (agentType > 0) {
                if (validators.isMissing(position.agentInfo.agentsPrint) || position.agentInfo.agentsPrint) {
                    Fptr.setParam(1222, agentType);
                }
                else {
                    Fptr.setNonPrintableParam(1222, agentType);
                }
            }
        }
    }
    if (!validators.isMissing(position.supplierInfo)) {
        if (validators.isMissing(position.supplierInfo.supplierVatinPrint) || position.supplierInfo.supplierVatinPrint) {
            Fptr.setParam(1226, position.supplierInfo.vatin, Fptr.IGNORE_IF_EMPTY);
        }
        else {
            Fptr.setNonPrintableParam(1226, position.supplierInfo.vatin, Fptr.IGNORE_IF_EMPTY);
        }
    }

    if (!validators.isMissing(position.agentInfo)) {
        if (validators.isMissing(position.agentInfo.agentDataPrint) || position.agentInfo.agentDataPrint) {
            Fptr.setParam(1223, tag1223, Fptr.IGNORE_IF_EMPTY);
        } else {
            Fptr.setNonPrintableParam(1223, tag1223, Fptr.IGNORE_IF_EMPTY);
        }
    }
    if (!validators.isMissing(position.supplierInfo)) {
        if (validators.isMissing(position.supplierInfo.supplierPrint) || position.supplierInfo.supplierPrint) {
            Fptr.setParam(1224, tag1224, Fptr.IGNORE_IF_EMPTY);
        } else {
            Fptr.setNonPrintableParam(1224, tag1224, Fptr.IGNORE_IF_EMPTY);
        }
    }

    if (ffd >= Fptr.LIBFPTR_FFD_1_2) {
        if (!validators.isMissing(position.measurementUnit))
            Fptr.setParam(2108, utils.parseItemUnits(position.measurementUnit), Fptr.IGNORE_IF_EMPTY);
    } else {
        if (!validators.isMissing(position.measurementUnit))
            Fptr.setParam(1197, position.measurementUnit.toString(), Fptr.IGNORE_IF_EMPTY)
    }

    for (var i = 0; i < arr1260.length; i++) {
        Fptr.setParam(1260, arr1260[i], Fptr.IGNORE_IF_EMPTY);
    }

    Fptr.setParam(1229, position.exciseSum, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1230, position.countryCode, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1231, position.customsDeclaration, Fptr.IGNORE_IF_EMPTY);
    Fptr.setUserParam(3, position.ucUserParam3, Fptr.IGNORE_IF_EMPTY);
    Fptr.setUserParam(4, position.ucUserParam4, Fptr.IGNORE_IF_EMPTY);
    Fptr.setUserParam(5, position.ucUserParam5, Fptr.IGNORE_IF_EMPTY);
    Fptr.setUserParam(6, position.ucUserParam6, Fptr.IGNORE_IF_EMPTY);

    if (!validators.isMissing(position.additionalAttribute)) {
        if (validators.isMissing(position.additionalAttributePrint) || position.additionalAttributePrint) {
            Fptr.setParam(1191, position.additionalAttribute);
        }
        else {
            Fptr.setNonPrintableParam(1191, position.additionalAttribute);
        }
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_COMMODITY_NAME, position.name);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_PRICE, position.price);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_QUANTITY, position.quantity);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_POSITION_SUM, position.amount);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_INFO_DISCOUNT_SUM, position.infoDiscountAmount, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DEPARTMENT, position.department, Fptr.IGNORE_IF_EMPTY);
    if (!validators.isMissing(position.tax)) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_TAX_TYPE, utils.parseTaxType(position.tax.type));
        Fptr.setParam(Fptr.LIBFPTR_PARAM_USE_ONLY_TAX_TYPE, validators.isMissing(position.tax.sum));
        if (!validators.isMissing(position.tax.sum)) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_TAX_SUM, position.tax.sum);
        }
    }
    Fptr.setParam(Fptr.LIBFPTR_PARAM_COMMODITY_PIECE, position.piece, Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1214, utils.parsePaymentMethod(position.paymentMethod), Fptr.IGNORE_IF_EMPTY);
    Fptr.setParam(1212, utils.parsePaymentObject(position.paymentObject), Fptr.IGNORE_IF_EMPTY);

    if (!validators.isMissing(position.customParameters)) {
        for (var i = 0; position.customParameters && i < position.customParameters.length; i++) {
            Fptr.setUserParam(position.customParameters[i].id, position.customParameters[i].value)
        }
    }

    Fptr.registration();
    return Fptr.error();
};

exports.executePreItems = function (preItems) {
    for (var i = 0; i < preItems.length; i++) {
        if (preItems[i].type === "text") {
            var e = this.executeText(preItems[i], Fptr.LIBFPTR_DEFER_PRE);
            if (e.isError) {
                return e;
            }
        } else if (preItems[i].type === "barcode") {
            // PreItems: для комбинированной печати (1006) требуется другой метод
            if (validators.isOverlayFor1006(preItems[i].overlay)) {
                var e = this.executeBarcode1006(preItems[i], Fptr.LIBFPTR_DEFER_PRE);
            }
            else {
                var e = this.executeBarcode(preItems[i], Fptr.LIBFPTR_DEFER_PRE);
            }

            if (e.isError) {
                return e;
            }
        } else if (preItems[i].type === "pictureFromMemory") {
            var e = this.executePictureFromMemory(preItems[i], Fptr.LIBFPTR_DEFER_PRE);
            if (e.isError) {
                return e;
            }
        } else if (preItems[i].type === "pixels") {
            e = this.executePixelsBuffer(preItems[i], Fptr.LIBFPTR_DEFER_PRE);
            if (e.isError) {
                return e;
            }
        }
    }

    return Fptr.ok();
};

exports.executePostItems = function (postItems) {
    Fptr.readModelFlags();
    if (Fptr.getParamBool(Fptr.LIBFPTR_PARAM_CAP_MANUAL_CLICHE_CONTROL)) {
        if (postItems.length > 0) {
            for (var i = 0; i < postItems.length; i++) {
                if (postItems[i].type === "text") {
                    var e = this.executeText(postItems[i], Fptr.LIBFPTR_DEFER_POST);
                    if (e.isError) {
                        return e;
                    }
                } else if (postItems[i].type === "barcode") {
                    // PostItems: для комбинированной печати (1006) требуется другой метод
                    if (validators.isOverlayFor1006(postItems[i].overlay)) {
                        e = this.executeBarcode1006(postItems[i], Fptr.LIBFPTR_DEFER_POST);
                    }
                    else {
                        e = this.executeBarcode(postItems[i], Fptr.LIBFPTR_DEFER_POST);
                    }

                    if (e.isError) {
                        return e;
                    }
                } else if (postItems[i].type === "pictureFromMemory") {
                    var e = this.executePictureFromMemory(postItems[i], Fptr.LIBFPTR_DEFER_POST);
                    if (e.isError) {
                        return e;
                    }
                } else if (postItems[i].type === "pixels") {
                    e = this.executePixelsBuffer(postItems[i], Fptr.LIBFPTR_DEFER_POST);
                    if (e.isError) {
                        return e;
                    }
                }
            }

            Fptr.disableAutoCliche();
        } else {
            Fptr.enableAutoCliche();
        }
    }

    return Fptr.ok();
};