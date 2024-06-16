const utils = require('myscripts_utils');
const validators = require('myscripts_validators');

function readNextRecord(recordsID) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_ID, recordsID);
    return Fptr.readNextRecord();
}

function endReadRecords(recordsID) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_ID, recordsID);
    return Fptr.endReadRecords();
}

function parse(tagNumber, tagType) {
    switch (tagType) {
    case Fptr.LIBFPTR_TAG_TYPE_BITS:
    case Fptr.LIBFPTR_TAG_TYPE_BYTE:
    case Fptr.LIBFPTR_TAG_TYPE_UINT_16:
    case Fptr.LIBFPTR_TAG_TYPE_UINT_32:
        return Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_VALUE);

    case Fptr.LIBFPTR_TAG_TYPE_VLN:
    case Fptr.LIBFPTR_TAG_TYPE_FVLN:
        return Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_TAG_VALUE);

    case Fptr.LIBFPTR_TAG_TYPE_BOOL:
        return Fptr.getParamBool(Fptr.LIBFPTR_PARAM_TAG_VALUE);

    case Fptr.LIBFPTR_TAG_TYPE_ARRAY:
        return Duktape.enc("hex", new Buffer(Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE))).toUpperCase();

    case Fptr.LIBFPTR_TAG_TYPE_STRING:
        return Fptr.getParamString(Fptr.LIBFPTR_PARAM_TAG_VALUE).trim();

    case Fptr.LIBFPTR_TAG_TYPE_UNIX_TIME:
        return utils.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_TAG_VALUE));

    case Fptr.LIBFPTR_TAG_TYPE_STLV:
        Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_TYPE, Fptr.LIBFPTR_RT_PARSE_COMPLEX_ATTR);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_TAG_VALUE, Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE));
        Fptr.beginReadRecords();
        var recordsID = Fptr.getParamString(Fptr.LIBFPTR_PARAM_RECORDS_ID);

        var node = {};
        while (readNextRecord(recordsID) === 0) {
            var nodeTagNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_NUMBER);
            var nodeTagType = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_TYPE);

            if (Fptr.getParamBool(Fptr.LIBFPTR_PARAM_TAG_IS_REPEATABLE)) {
                if (!node.hasOwnProperty(nodeTagNumber.toString())) {
                    node[nodeTagNumber.toString()] = [];
                }
                node[nodeTagNumber.toString()].push(parse(nodeTagNumber, nodeTagType));
            } else {
                node[nodeTagNumber.toString()] = parse(nodeTagNumber, nodeTagType);
            }
        }

        endReadRecords(recordsID);
        return node;
    }
}

function validate(task) {
    validators.mustNumber(task.fiscalDocumentNumber, "fiscalDocumentNumber");
    validators.mustBooleanOrMissing(task.withRawData, "withRawData");
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

    var doc = task.fiscalDocumentNumber;
    var withRawData = task.withRawData ? task.withRawData : false;
    var shortData = false;
    var documentType = 0;
    var tlvs = {};

    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_TYPE, Fptr.LIBFPTR_RT_FN_DOCUMENT_TLVS);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER, doc);
    Fptr.beginReadRecords();
    var err = Fptr.errorCode();
    var rawData = [];
    if (Fptr.errorCode() === Fptr.LIBFPTR_ERROR_NO_MORE_DATA || Fptr.errorCode() === Fptr.LIBFPTR_ERROR_FN_NO_MORE_DATA) {
        if (withRawData)
            return Fptr.result(Fptr.LIBFPTR_ERROR_FN_NO_MORE_DATA);
        shortData = true;

        Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
        if (Fptr.fnQueryData() < 0) {
            return Fptr.error();
        }
        var ffdVersion = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DEVICE_FFD_VERSION);

        Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_DOCUMENT_BY_NUMBER);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER, doc);
        if (Fptr.fnQueryData() < 0) {
            return Fptr.error();
        }

        documentType = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FN_DOCUMENT_TYPE);
        tlvs["1012"] = utils.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));
        tlvs["1040"] = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);

        var sign = new Buffer(Duktape.dec("hex", Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FISCAL_SIGN).toString(16)));
        tlvs["1077"] = Duktape.enc("hex", sign).toUpperCase();

        switch (documentType) {
            case Fptr.LIBFPTR_FN_DOC_REGISTRATION:
                tlvs["1018"] = Fptr.getParamString(1018).trim();
                tlvs["1037"] = Fptr.getParamString(1037).trim();
                tlvs["1062"] = Fptr.getParamInt(1062);
                tlvs["1056"] = Fptr.getParamBool(1056);
                tlvs["1002"] = Fptr.getParamBool(1002);
                tlvs["1001"] = Fptr.getParamBool(1001);
                tlvs["1109"] = Fptr.getParamBool(1109);
                tlvs["1110"] = Fptr.getParamBool(1110);
                tlvs["1108"] = Fptr.getParamBool(1108);
                if (ffdVersion >= Fptr.LIBFPTR_FFD_1_1) {
                    tlvs["1017"] = Fptr.getParamString(1017).trim();
                    tlvs["1207"] = Fptr.getParamBool(1207);
                    tlvs["1193"] = Fptr.getParamBool(1193);
                    tlvs["1126"] = Fptr.getParamBool(1126);
                    tlvs["1221"] = Fptr.getParamBool(1221);
                }
                break;
            case Fptr.LIBFPTR_FN_DOC_REREGISTRATION:
                tlvs["1018"] = Fptr.getParamString(1018).trim();
                tlvs["1037"] = Fptr.getParamString(1037).trim();
                tlvs["1062"] = Fptr.getParamInt(1062);
                tlvs["1056"] = Fptr.getParamBool(1056);
                tlvs["1002"] = Fptr.getParamBool(1002);
                tlvs["1001"] = Fptr.getParamBool(1001);
                tlvs["1109"] = Fptr.getParamBool(1109);
                tlvs["1110"] = Fptr.getParamBool(1110);
                tlvs["1108"] = Fptr.getParamBool(1108);
                if (ffdVersion >= Fptr.LIBFPTR_FFD_1_1) {
                    tlvs["1017"] = Fptr.getParamString(1017).trim();
                    tlvs["1207"] = Fptr.getParamBool(1207);
                    tlvs["1193"] = Fptr.getParamBool(1193);
                    tlvs["1126"] = Fptr.getParamBool(1126);
                    tlvs["1221"] = Fptr.getParamBool(1221);
                    tlvs["1205"] = Fptr.getParamInt(1205);
                } else {
                    tlvs["1101"] = Fptr.getParamInt(1101);
                }
                break;
            case Fptr.LIBFPTR_FN_DOC_CLOSE_FN:
                tlvs["1018"] = Fptr.getParamString(1018).trim();
                tlvs["1037"] = Fptr.getParamString(1037).trim();
                break;
            case Fptr.LIBFPTR_FN_DOC_EXCHANGE_STATUS:
                tlvs["1097"] = Fptr.getParamInt(1097);
                tlvs["1098"] = utils.dateToIsoString(Fptr.getParamDateTime(1098));
                break;
            case Fptr.LIBFPTR_FN_DOC_OPEN_SHIFT:
            case Fptr.LIBFPTR_FN_DOC_CLOSE_SHIFT:
                tlvs["1038"] = Fptr.getParamInt(1038);
                break;
            case Fptr.LIBFPTR_FN_DOC_RECEIPT:
            case Fptr.LIBFPTR_FN_DOC_CORRECTION:
            case Fptr.LIBFPTR_FN_DOC_BSO:
            case Fptr.LIBFPTR_FN_DOC_BSO_CORRECTION:
                tlvs["1054"] = Fptr.getParamInt(1054);
                tlvs["1020"] = Fptr.getParamInt(1020);
                break;
        }
    }
    else if (err === 0) {
        documentType = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FN_DOCUMENT_TYPE);
        var recordsID = Fptr.getParamString(Fptr.LIBFPTR_PARAM_RECORDS_ID);

        while (readNextRecord(recordsID) === 0) {
            var nodeTagNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_NUMBER);
            var nodeTagType = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_TYPE);

            var v = Fptr.getParamByteArray(Fptr.LIBFPTR_PARAM_TAG_VALUE);
            rawData.push(new Uint8Array([nodeTagNumber & 0xFF, nodeTagNumber >> 8]));
            rawData.push(new Uint8Array([v.length & 0xFF, v.length >> 8]));
            rawData.push(v);

            if (Fptr.getParamBool(Fptr.LIBFPTR_PARAM_TAG_IS_REPEATABLE)) {
                if (!tlvs.hasOwnProperty(nodeTagNumber.toString())) {
                    tlvs[nodeTagNumber.toString()] = [];
                }
                tlvs[nodeTagNumber.toString()].push(parse(nodeTagNumber, nodeTagType));
            } else {
                tlvs[nodeTagNumber.toString()] = parse(nodeTagNumber, nodeTagType);
            }
        }

        endReadRecords(recordsID);
    } else {
        return Fptr.error();
    }

    tlvs.short = shortData;
    var needQr = false;
    switch (documentType)
    {
        case Fptr.LIBFPTR_FN_DOC_REGISTRATION:
            tlvs.fiscalDocumentType = "registration";
            break;
        case Fptr.LIBFPTR_FN_DOC_REREGISTRATION:
            tlvs.fiscalDocumentType = "changeRegistrationParameters";
            break;
        case Fptr.LIBFPTR_FN_DOC_CLOSE_FN:
            tlvs.fiscalDocumentType = "closeArchive";
            break;
        case Fptr.LIBFPTR_FN_DOC_EXCHANGE_STATUS:
            tlvs.fiscalDocumentType = "ofdExchangeStatus";
            break;
        case Fptr.LIBFPTR_FN_DOC_OPEN_SHIFT:
            tlvs.fiscalDocumentType = "openShift";
            break;
        case Fptr.LIBFPTR_FN_DOC_CLOSE_SHIFT:
            tlvs.fiscalDocumentType = "closeShift";
            break;
        case Fptr.LIBFPTR_FN_DOC_RECEIPT:
            tlvs.fiscalDocumentType = "receipt";
            needQr = true;
            break;
        case Fptr.LIBFPTR_FN_DOC_CORRECTION:
            tlvs.fiscalDocumentType = "receiptCorrection";
            needQr = true;
            break;
        case Fptr.LIBFPTR_FN_DOC_BSO:
            tlvs.fiscalDocumentType = "bso";
            needQr = true;
            break;
        case Fptr.LIBFPTR_FN_DOC_BSO_CORRECTION:
            tlvs.fiscalDocumentType = "bsoCorrection";
            needQr = true;
            break;
        default:
            break;
    }

    // Формирование QR-кода
    if (needQr) {
        var fn;
        if (!("1041" in tlvs)) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FN_INFO);
            Fptr.fnQueryData();
            fn = Fptr.getParamString(Fptr.LIBFPTR_PARAM_SERIAL_NUMBER);
        } else {
            fn = tlvs["1041"];
        }
        tlvs.qr =   "t=" + tlvs["1012"].split(":").join("").split("-").join("").substr(0, 13) +
                    "&s=" + (tlvs["1020"]).toFixed(2) +
                    "&fn=" + fn +
                    "&i=" + tlvs["1040"] +
                    "&fp=" + parseInt(tlvs["1077"].substr(4), 16) +
                    "&n=" + tlvs["1054"];
    }

    var r = {
        documentTLV: tlvs
    };
    if (withRawData) {
        r.rawData = Duktape.enc("base64", Buffer.concat(rawData));
    }
    return Fptr.ok(r);
}
