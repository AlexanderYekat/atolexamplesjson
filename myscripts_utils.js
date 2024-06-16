/**
 * Преобразует дату и время в формат ISO8601
 * @param date {Date} объект даты
 * @returns {string} Строковое представление даты
 */
exports.dateToIsoString = function (date) {
    var tzo = -date.getTimezoneOffset();
    var dif = tzo >= 0 ? '+' : '-';
    var pad = function (num) {
        var norm = Math.floor(Math.abs(num));
        return (norm < 10 ? '0' : '') + norm;
    };
    return date.getUTCFullYear() +
        '-' + pad(date.getUTCMonth() + 1) +
        '-' + pad(date.getUTCDate()) +
        'T' + pad(date.getUTCHours()) +
        ':' + pad(date.getUTCMinutes()) +
        ':' + pad(date.getUTCSeconds()) +
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60);
};

/**
 * Проверяет, что при возникновении заданной ошибки, отмену чеку не нужно
 * считать провалившейся
 * @param e Код ошибки
 * @returns {boolean} true, если продолжить работу после ошибки
 */
exports.isNormalCancelError = function (e) {
    switch (e) {
        case Fptr.LIBFPTR_ERROR_DENIED_IN_CLOSED_RECEIPT:
            return true;
        case Fptr.LIBFPTR_ERROR_INVALID_MODE:
            return true;
        case Fptr.LIBFPTR_ERROR_MODE_BLOCKED:
        case Fptr.LIBFPTR_ERROR_SHIFT_EXPIRED:
            return true;
        case Fptr.LIBFPTR_ERROR_OPEN_SHIFT_REPORT_INTERRUPTED:
        case Fptr.LIBFPTR_ERROR_CLOSE_FN_REPORT_INTERRUPTED:
        case Fptr.LIBFPTR_ERROR_BLOCKED_BY_REPORT_INTERRUPTION:
        case Fptr.LIBFPTR_ERROR_OFD_EXCHANGE_REPORT_INTERRUPTED:
        case Fptr.LIBFPTR_ERROR_CLOSE_RECEIPT_INTERRUPTED:
        case Fptr.LIBFPTR_ERROR_REGISTRATION_REPORT_INTERRUPTED:
        case Fptr.LIBFPTR_ERROR_REPORT_INTERRUPTED:
            return true;
        case Fptr.LIBFPTR_ERROR_DENIED_BY_LICENSE:
            return true;
        default:
            return false;
    }
};

/**
 * Вспомогательная функция для формирования данных результата
 * фискальных документов
 * @param forReceipt Формировать структуру для чека или нет
 * @returns Объект с фискальными параметрами документа
 */
exports.getFiscalParams = function (forReceipt) {
    var parameters = {};

    if (forReceipt) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_LAST_RECEIPT);
        if (Fptr.fnQueryData() === 0) {
            parameters.total = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_RECEIPT_SUM);
            parameters.fiscalDocumentNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);
            parameters.fiscalDocumentDateTime = exports.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));
            parameters.fiscalDocumentSign = Fptr.getParamString(Fptr.LIBFPTR_PARAM_FISCAL_SIGN);
        }

    } else {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_LAST_DOCUMENT);
        if (Fptr.fnQueryData() === 0) {
            parameters.fiscalDocumentNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);
            parameters.fiscalDocumentDateTime = exports.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));
            parameters.fiscalDocumentSign = Fptr.getParamString(Fptr.LIBFPTR_PARAM_FISCAL_SIGN);
        }
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FN_INFO);
    if (Fptr.fnQueryData() === 0) {
        parameters.fnNumber = Fptr.getParamString(Fptr.LIBFPTR_PARAM_SERIAL_NUMBER);
    }
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_TAG_VALUE);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_TAG_NUMBER, 1037);
    if (Fptr.fnQueryData() === 0) {
        parameters.registrationNumber = Fptr.getParamString(Fptr.LIBFPTR_PARAM_TAG_VALUE).trim();
    }
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_SHIFT);
    if (Fptr.fnQueryData() === 0) {
        parameters.shiftNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_NUMBER);
        if (forReceipt) {
            parameters.fiscalReceiptNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPT_NUMBER);
        }
    }
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_TAG_VALUE);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_TAG_NUMBER, 1060);
    if (Fptr.fnQueryData() === 0) {
        parameters.fnsUrl = Fptr.getParamString(Fptr.LIBFPTR_PARAM_TAG_VALUE);
    }
    return parameters;
};

/**
 * Вспомогательная функция для формирования предупреждений при формировании документов
 * @returns Объект с предупреждениями
 */
exports.getWarnings = function () {
    var warnings = {};
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_STATUS);
    if (Fptr.queryData() === 0 && !Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FISCAL))
        warnings.nonFiscal = true;
    Fptr.checkDocumentClosed();
    if (!Fptr.getParamBool(Fptr.LIBFPTR_PARAM_DOCUMENT_PRINTED))
        warnings.notPrinted = true;
    return warnings;
};

/**
 * Список возможных значений версий ФФД для JSON
 */
exports.FFD_VERSIONS = {
    "1.05": Fptr.LIBFPTR_FFD_1_0_5,
    "1.1": Fptr.LIBFPTR_FFD_1_1,
    "1.2": Fptr.LIBFPTR_FFD_1_2,
};

/**
 * Список возможных значений систем налогообложения для JSON
 */
exports.TAXATION_TYPES = {
    "osn": Fptr.LIBFPTR_TT_OSN,
    "usnIncome": Fptr.LIBFPTR_TT_USN_INCOME,
    "usnIncomeOutcome": Fptr.LIBFPTR_TT_USN_INCOME_OUTCOME,
    "envd": Fptr.LIBFPTR_TT_ENVD,
    "esn": Fptr.LIBFPTR_TT_ESN,
    "patent": Fptr.LIBFPTR_TT_PATENT
};

/**
 * Список возможных значений признаков агентов для JSON
 */
exports.AGENT_TYPES = {
    "bankPayingAgent": Fptr.LIBFPTR_AT_BANK_PAYING_AGENT,
    "bankPayingSubagent": Fptr.LIBFPTR_AT_BANK_PAYING_SUBAGENT,
    "payingAgent": Fptr.LIBFPTR_AT_PAYING_AGENT,
    "payingSubagent": Fptr.LIBFPTR_AT_PAYING_SUBAGENT,
    "attorney": Fptr.LIBFPTR_AT_ATTORNEY,
    "commissionAgent": Fptr.LIBFPTR_AT_COMMISSION_AGENT,
    "another": Fptr.LIBFPTR_AT_ANOTHER,
};

/**
 * Разбирает налоговую ставку
 * @param value Налоговая ставка для JSON
 * @returns {*} Налоговая ставка для драйвера
 */
exports.parseTaxType = function (value) {
    var r = exports.TAX_TYPES[value];
    if (r === undefined) {
        r = parseInt(value, 10);
        if (isNaN(r))
            return undefined;
    }
    return r;
};

/**
 * Список возможных значений налоговых ставок для JSON
 */
exports.TAX_TYPES = {
    "none": Fptr.LIBFPTR_TAX_NO,
    "vat0": Fptr.LIBFPTR_TAX_VAT0,
    "0": Fptr.LIBFPTR_TAX_VAT0,
    "vat10": Fptr.LIBFPTR_TAX_VAT10,
    "10": Fptr.LIBFPTR_TAX_VAT10,
    "vat110": Fptr.LIBFPTR_TAX_VAT110,
    "110": Fptr.LIBFPTR_TAX_VAT110,
    "vat18": Fptr.LIBFPTR_TAX_VAT18,
    "18": Fptr.LIBFPTR_TAX_VAT18,
    "vat118": Fptr.LIBFPTR_TAX_VAT118,
    "118": Fptr.LIBFPTR_TAX_VAT118,
    "vat20": Fptr.LIBFPTR_TAX_VAT20,
    "20": Fptr.LIBFPTR_TAX_VAT20,
    "vat120": Fptr.LIBFPTR_TAX_VAT120,
    "120": Fptr.LIBFPTR_TAX_VAT120,
};

/**
 * Список возможных значений типов коррекций для JSON
 */
exports.CORRECTION_TYPES = {
    "sellCorrection": Fptr.LIBFPTR_RT_SELL_CORRECTION,
    "sellReturnCorrection": Fptr.LIBFPTR_RT_SELL_RETURN_CORRECTION,
    "buyCorrection": Fptr.LIBFPTR_RT_BUY_CORRECTION,
    "buyReturnCorrection": Fptr.LIBFPTR_RT_BUY_RETURN_CORRECTION
};

/**
 * Список возможных значений типов чеков для JSON
 */
exports.RECEIPT_TYPES = {
    "sell": Fptr.LIBFPTR_RT_SELL,
    "sellReturn": Fptr.LIBFPTR_RT_SELL_RETURN,
    "buy": Fptr.LIBFPTR_RT_BUY,
    "buyReturn": Fptr.LIBFPTR_RT_BUY_RETURN
};

/**
 * Разбирает тип оплаты
 * @param value Тип оплаты для JSON
 * @returns {*} Тип оплаты для драйвера
 */
exports.parsePaymentType = function (value) {
    var r = exports.PAYMENT_TYPES[value];
    if (r === undefined) {
        r = parseInt(value, 10);
        if (isNaN(r))
            return undefined;
    }
    return r;
};

/**
 * Список возможных значений типов оплат для JSON
 */
exports.PAYMENT_TYPES = {
    "cash": Fptr.LIBFPTR_PT_CASH,
    "electronically": Fptr.LIBFPTR_PT_ELECTRONICALLY,
    "prepaid": Fptr.LIBFPTR_PT_PREPAID,
    "credit": Fptr.LIBFPTR_PT_CREDIT,
    "other": Fptr.LIBFPTR_PT_OTHER
};

/**
 * Разбирает признак способа расчета
 * @param value Признак способа расчета для JSON
 * @returns {*} Признак способа расчета для драйвера
 */
exports.parsePaymentMethod = function (value) {
    var r = exports.PAYMENT_METHODS[value];
    if (r === undefined) {
        r = parseInt(value, 10);
        if (isNaN(r))
            return undefined;
    }
    return r;
};

/**
 * Список возможных признака способа расчета для JSON
 */
exports.PAYMENT_METHODS = {
    "fullPrepayment": 1,
    "prepayment": 2,
    "advance": 3,
    "fullPayment": 4,
    "partialPayment": 5,
    "credit": 6,
    "creditPayment": 7
};

/**
 * Разбирает признак предмета расчета
 * @param value Признак предмета расчета для JSON
 * @returns {*} Признак предмета расчета для драйвера
 */
exports.parsePaymentObject = function (value) {
    var r = exports.PAYMENT_OBJECTS[value];
    if (r === undefined) {
        r = parseInt(value, 10);
        if (isNaN(r))
            return undefined;
    }
    return r;
};

/**
 * Список возможных признака предмета расчета для JSON
 */
exports.PAYMENT_OBJECTS = {
    "commodity": 1,
    "excise": 2,
    "job": 3,
    "service": 4,
    "gamblingBet": 5,
    "gamblingPrize": 6,
    "lottery": 7,
    "lotteryPrize": 8,
    "intellectualActivity": 9,
    "payment": 10,
    "agentCommission": 11,
    "composite": 12, // alias для pay
    "pay": 12,
    "another": 13,
    "proprietaryLaw": 14,
    "nonOperatingIncome": 15,
    "insuranceContributions": 16, // alias для otherContributions
    "otherContributions": 16,
    "merchantTax": 17,
    "resortFee": 18,
    "deposit": 19,
    "consumption": 20,
    "soleProprietorCPIContributions": 21,
    "cpiContributions": 22,
    "soleProprietorCMIContributions": 23,
    "cmiContributions": 24,
    "csiContributions": 25,
    "casinoPayment": 26,
    "fundsIssuance": 27,
    "exciseWithoutMarking": 30,
    "exciseWithMarking": 31,
    "commodityWithoutMarking": 32,
    "commodityWithMarking": 33,
};

/**
 * Вспомогательная функция для формирования пути к полю JSON-задания
 * @param path Путь
 * @param newSection Новая секция пути
 * @returns {string} Новый путь
 */
exports.makeDotPath = function (path, newSection) {
    if (newSection) {
        return path + "." + newSection;
    }
    return path;
};


/**
 * Возвращает текущее состояние ошибок обмена с ОФД
 * @returns {object} Ошибки обмена с ОФД
 */
exports.getOfdExchangeErrors = function () {
    var ofdExchangeErrorsInformation = {};

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_ERRORS);
    if (Fptr.fnQueryData() === 0) {
        ofdExchangeErrorsInformation.fnCommandCode = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_COMMAND_CODE);
        ofdExchangeErrorsInformation.documentNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);

        ofdExchangeErrorsInformation.fn = {
            code: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FN_ERROR),
            description: Fptr.getParamString(Fptr.LIBFPTR_PARAM_FN_ERROR_TEXT)
        };
        ofdExchangeErrorsInformation.network = {
            code: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_NETWORK_ERROR),
            description: Fptr.getParamString(Fptr.LIBFPTR_PARAM_NETWORK_ERROR_TEXT)
        };
        ofdExchangeErrorsInformation.ofd = {
            code: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_OFD_ERROR),
            description: Fptr.getParamString(Fptr.LIBFPTR_PARAM_OFD_ERROR_TEXT)
        };

        ofdExchangeErrorsInformation.lastSuccessConnectionDateTime = exports.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));
    }

    return ofdExchangeErrorsInformation;
};

/**
 * Возвращает результат фискализации документа в ФН
 *
 * @param number Номер документа
 * @param recovery Флаг восстановления
 * @returns {Result} Результат
 */
exports.getFiscalDocumentResult = function (number, recovery) {
    var isLast = false;
    var result = {};
    var parameters = {};
    var warnings = {};

    warnings.recovered = recovery;

    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_STATUS);
    if (Fptr.queryData() === 0 && !Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FISCAL))
        warnings.nonFiscal = true;

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_LAST_DOCUMENT);
    if (Fptr.fnQueryData() !== 0) {
        if (warnings.nonFiscal) {
            return Fptr.ok({
                fiscalParams: params,
                warnings: warnings
            });
        } else {
            return Fptr.error()
        }
    }

    if (number === undefined || number < 0 || number === Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER)) {
        isLast = true;
        number = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER)
    } else if (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER) < number) {
        return Fptr.result(Fptr.LIBFPTR_ERROR_FN_NO_MORE_DATA)
    }
    parameters.fiscalDocumentNumber = number;

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FN_INFO);
    if (Fptr.fnQueryData() === 0) {
        parameters.fnNumber = Fptr.getParamString(Fptr.LIBFPTR_PARAM_SERIAL_NUMBER);
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_TAG_VALUE);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_TAG_NUMBER, 1037);
    if (Fptr.fnQueryData() === 0) {
        parameters.registrationNumber = Fptr.getParamString(Fptr.LIBFPTR_PARAM_TAG_VALUE).trim();
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_TAG_VALUE);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_TAG_NUMBER, 1060);
    if (Fptr.fnQueryData() === 0) {
        parameters.fnsUrl = Fptr.getParamString(Fptr.LIBFPTR_PARAM_TAG_VALUE);
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_DOCUMENT_BY_NUMBER);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER, parameters.fiscalDocumentNumber);
    var isReceipt = false, isCloseShift = false, isExchangeStatus = false;
    if (Fptr.fnQueryData() === 0) {
        parameters.fiscalDocumentNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);
        parameters.fiscalDocumentDateTime = exports.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));
        parameters.fiscalDocumentSign = Fptr.getParamString(Fptr.LIBFPTR_PARAM_FISCAL_SIGN);

        switch (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FN_DOCUMENT_TYPE)) {
            case Fptr.LIBFPTR_FN_DOC_RECEIPT:
            case Fptr.LIBFPTR_FN_DOC_BSO:
            case Fptr.LIBFPTR_FN_DOC_CORRECTION:
            case Fptr.LIBFPTR_FN_DOC_BSO_CORRECTION:
                isReceipt = true;
                parameters.total = Fptr.getParamDouble(1020);
                break;
            case Fptr.LIBFPTR_FN_DOC_CLOSE_SHIFT:
                isCloseShift = true;
                parameters.shiftNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_NUMBER);
                break;
            case Fptr.LIBFPTR_FN_DOC_OPEN_SHIFT:
                parameters.shiftNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_NUMBER);
                break;
            case Fptr.LIBFPTR_FN_DOC_EXCHANGE_STATUS:
                isExchangeStatus = true;
                break;
        }
    }

    if (isLast) {
        Fptr.checkDocumentClosed();
        if (!Fptr.getParamBool(Fptr.LIBFPTR_PARAM_DOCUMENT_PRINTED))
            warnings.notPrinted = true;

        Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_SHIFT);
        if (Fptr.fnQueryData() === 0) {
            parameters.shiftNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_NUMBER);
            if (isReceipt) {
                parameters.fiscalReceiptNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPT_NUMBER);
            }
        }
        if (isCloseShift) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_SHIFT);
            if (Fptr.fnQueryData() === 0) {
                parameters.receiptsCount = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPT_NUMBER);
            }
        }
        if (isExchangeStatus) {
            var state = {};

            Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_OFD_EXCHANGE_STATUS);
            if (Fptr.fnQueryData() === 0) {
                state.notSentCount = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENTS_COUNT);
                state.notSentFirstDocDateTime = exports.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));
                state.notSentFirstDocNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);
            }

            result.errors = exports.getOfdExchangeErrors();
            result.status = state;
        }
    } else {
        var ofdExchangeState = {};

        function readNextRecord(recordsID) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_ID, recordsID);
            return Fptr.readNextRecord();
        }

        if (isReceipt) {
            parameters.shiftNumber = 0;
            parameters.fiscalReceiptNumber = 0;
        } else if (isCloseShift) {
            parameters.receiptsCount = 0;
        } else if (isExchangeStatus) {
            parameters.shiftNumber = 0;
            ofdExchangeState.notSentCount = 0;
            ofdExchangeState.notSentFirstDocNumber = 0;
            ofdExchangeState.notSentFirstDocDateTime = exports.dateToIsoString(new Date(0));
        } else {
            parameters.shiftNumber = 0;
        }

        for (var i = 0; i < 3; ++i) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_TYPE, Fptr.LIBFPTR_RT_FN_DOCUMENT_TLVS);
            Fptr.setParam(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER, parameters.fiscalDocumentNumber);
            var r = Fptr.beginReadRecords();
            recordsID = Fptr.getParamString(Fptr.LIBFPTR_PARAM_RECORDS_ID);
            if (r === 0) {
                while (readNextRecord(recordsID) === Fptr.LIBFPTR_OK) {
                    var tagNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_NUMBER);
                    switch (tagNumber) {
                        case 1038:
                            parameters.shiftNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_VALUE);
                            break;
                        case 1042:
                            parameters.fiscalReceiptNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_VALUE);
                            break;
                        case 1097:
                            ofdExchangeState.notSentCount = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_VALUE) + 1;
                            break;
                        case 1116:
                            ofdExchangeState.notSentFirstDocNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_VALUE);
                            break;
                        case 1098:
                            ofdExchangeState.notSentFirstDocDateTime = exports.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_TAG_VALUE));
                            break;
                        case 1118:
                            parameters.receiptsCount = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_VALUE);
                            break;
                    }
                }

                Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_ID, recordsID);
                Fptr.endReadRecords();

                break;
            } else if (Fptr.error().error === Fptr.LIBFPTR_ERROR_FN_QUERY_INTERRUPTED) {
                sleep(300);
            }
        }

        if (isExchangeStatus) {
            result.errors = exports.getOfdExchangeErrors();
            result.status = ofdExchangeState;
        }
    }
    if (isExchangeStatus) {
        var totals = exports.getFnTotals();
        var quantityCounters = exports.getFnQuantityCounters();
        var unsentDocs = exports.getFnUnsentDocsCounters();

        if (totals!= null)
            parameters.fnTotals = totals;
        if (quantityCounters!= null)
            parameters.fnQuantityCounters = quantityCounters;
        if (unsentDocs!= null)
            parameters.fnUnsentDocsCounters = unsentDocs;
    }


    result.fiscalParams = parameters;
    result.warnings = warnings;
    return Fptr.ok(result);
};


/**
 * Список возможных значений типов марки
 */
exports.MARKING_CODE_TYPES = {
    "other": Fptr.LIBFPTR_MCT_OTHER,
    "egais20": Fptr.LIBFPTR_MCT_EGAIS_20,
    "egais30": Fptr.LIBFPTR_MCT_EGAIS_30
};

/**
 * Разбирает тип КМ
 * @param value Тип КМ для JSON
 * @returns {*} Тип КМ для драйвера
 */
exports.parseMarkingCodeType = function (value) {
    var r = exports.MARKING_CODE_TYPES[value];
    if (r === undefined) {
        r = parseInt(value, 10);
        if (isNaN(r))
            return undefined;
    }
    return r;
};


/**
 * Список возможных значений типов КМ под ФФД 1.2 для JSON
 */
exports.MARKING_CODE_TYPES_1_2 = {
    "auto": Fptr.LIBFPTR_MCT12_AUTO,
    "imcUnrecognized": Fptr.LIBFPTR_MCT12_UNKNOWN,
    "imcShort": Fptr.LIBFPTR_MCT12_SHORT,
    "imcFmVerifyCode88": Fptr.LIBFPTR_MCT12_88_CHECK,
    "imcVerifyCode44": Fptr.LIBFPTR_MCT12_44_NO_CHECK,
    "imcFmVerifyCode44": Fptr.LIBFPTR_MCT12_44_CHECK,
    "imcVerifyCode4": Fptr.LIBFPTR_MCT12_4_NO_CHECK
};

/**
 * Список возможных значений планируемого статуса КМ для JSON
 */
exports.MARKING_ESTIMATED_STATUS = {
    "itemPieceSold": Fptr.LIBFPTR_MES_PIECE_SOLD,
    "itemDryForSale": Fptr.LIBFPTR_MES_DRY_FOR_SALE,
    "itemPieceReturn": Fptr.LIBFPTR_MES_PIECE_RETURN,
    "itemDryReturn": Fptr.LIBFPTR_MES_DRY_RETURN,
    "itemStatusUnchanged": Fptr.LIBFPTR_MES_UNCHANGED
};

/**
 * Список возможных значений меры количества товара для JSON
 */
exports.ITEM_UNITS = {
    "piece": Fptr.LIBFPTR_IU_PIECE,
    "gram": Fptr.LIBFPTR_IU_GRAM,
    "kilogram": Fptr.LIBFPTR_IU_KILOGRAM,
    "ton": Fptr.LIBFPTR_IU_TON,
    "centimeter": Fptr.LIBFPTR_IU_CENTIMETER,
    "decimeter": Fptr.LIBFPTR_IU_DECIMETER,
    "meter": Fptr.LIBFPTR_IU_METER,
    "squareCentimeter": Fptr.LIBFPTR_IU_SQUARE_CENTIMETER,
    "squareDecimeter": Fptr.LIBFPTR_IU_SQUARE_DECIMETER,
    "squareMeter": Fptr.LIBFPTR_IU_SQUARE_METER,
    "milliliter": Fptr.LIBFPTR_IU_MILLILITER,
    "liter": Fptr.LIBFPTR_IU_LITER,
    "cubicMeter": Fptr.LIBFPTR_IU_CUBIC_METER,
    "kilowattHour": Fptr.LIBFPTR_IU_KILOWATT_HOUR,
    "gkal": Fptr.LIBFPTR_IU_GKAL,
    "day": Fptr.LIBFPTR_IU_DAY,
    "hour": Fptr.LIBFPTR_IU_HOUR,
    "minute": Fptr.LIBFPTR_IU_MINUTE,
    "second": Fptr.LIBFPTR_IU_SECOND,
    "kilobyte": Fptr.LIBFPTR_IU_KILOBYTE,
    "megabyte": Fptr.LIBFPTR_IU_MEGABYTE,
    "gigabyte": Fptr.LIBFPTR_IU_GIGABYTE,
    "terabyte": Fptr.LIBFPTR_IU_TERABYTE,
    "otherUnits": Fptr.LIBFPTR_IU_OTHER
};

/**
 * Список возможных сведений о статусе товара для JSON
 */
exports.MARKING_OPERATOR_ITEM_STATUS = {
    "itemEstimatedStatusCorrect": Fptr.LIBFPTR_OIS_ESTIMATED_STATUS_CORRECT,
    "itemEstimatedStatusIncorrect": Fptr.LIBFPTR_OIS_ESTIMATED_STATUS_INCORRECT,
    "itemSaleStopped": Fptr.LIBFPTR_OIS_SALE_STOPPED
};

/**
 * Список возможных сведений о статусе товара для JSON
 */
exports.MARKING_FN_CHECK_ERROR_REASON = {
    "checked": Fptr.LIBFPTR_CER_CHECKED,
    "typeIncorrect": Fptr.LIBFPTR_CER_TYPE_INCORRECT,
    "noKeys": Fptr.LIBFPTR_CER_NO_KEYS,
    "noGS1": Fptr.LIBFPTR_CER_NO_GS1,
    "other": Fptr.LIBFPTR_CER_OTHER
};

/**
 * Список возможных кодов обработки запроса ФФД 1.2 для JSON
 */
exports.MARKING_OPERATOR_RESPONSE_RESULT = {
    "correct": Fptr.LIBFPTR_ORR_CORRECT,
    "incorrect": Fptr.LIBFPTR_ORR_INCORRECT,
    "unrecognized": Fptr.LIBFPTR_ORR_UNRECOGNIZED
};

/**
 * Список возможных состояний проверки КМ ФФД 1.2 для JSON
 */
exports.MARKING_MODE_CHECKING_STATUS = {
    "blocked": Fptr.LIBFPTR_MCS_BLOCK,
    "noImcForCheck": Fptr.LIBFPTR_MCS_NO_MARK_FOR_CHECK,
    "receivedImc": Fptr.LIBFPTR_MCS_MARK_RECEIVE_B1,
    "requestedImcStatus": Fptr.LIBFPTR_MCS_MARK_STATE_QUERY_B5,
    "receivedImcStatus": Fptr.LIBFPTR_MCS_MARK_STATE_ANSWER_B6
};

/**
 * Список возможных значений ресурса области уведомлений ФФД 1.2 для JSON
 */
exports.NOTICE_FREE_MEMORY = {
    "less50": Fptr.LIBFPTR_NFM_LESS_50_PERCENT,
    "50to80": Fptr.LIBFPTR_NFM_FROM_50_TO_80_PERCENT,
    "80to90": Fptr.LIBFPTR_NFM_FROM_80_TO_90_PERCENT,
    "more90": Fptr.LIBFPTR_NFM_MORE_90_PERCENT,
    "outOfMemory": Fptr.LIBFPTR_NFM_OUT_OF_MEMORY
};

/**
 * Список возможных значений статуса проверки КМ в ККТ ФФД 1.2 для JSON
 */
exports.MARK_CHECKING_STATUS_IN_CASH = {
    "notExecuted": Fptr.LIBFPTR_MCS_NOT_EXECUTED,
    "executed": Fptr.LIBFPTR_MCS_EXECUTED,
    "completed": Fptr.LIBFPTR_MCS_IS_OVER,
    "recievedResult": Fptr.LIBFPTR_MCS_RESULT_IS_RECIEVED
};

/**
 * Список возможных значений типа проверки КМ в ККТ ФФД 1.2 для JSON
 */
exports.MARK_CHECKING_TYPE_IN_CASH = {
    "modeStandAlone": Fptr.LIBFPTR_MCT_AUTONOMOUS,
    "waitForResult": Fptr.LIBFPTR_MCT_WAIT_FOR_RESULT,
    "notWaitForResult": Fptr.LIBFPTR_MCT_RESULT_NOT_WAIT,
    "notSendToServer": Fptr.LIBFPTR_MCT_QUERY_NOT_SEND
};

/**
 * Список возможных значений этапа проверки КМ в ККТ ФФД 1.2 для JSON
 */
exports.MARK_CHECKING_STAGE_IN_CASH = {
    "waitForTask": Fptr.LIBFPTR_MCST_WAITING_FOR_TASK,
    "openConnection": Fptr.LIBFPTR_MCST_OPENING_CONNECTION,
    "send": Fptr.LIBFPTR_MCST_SENDING,
    "waitForResult": Fptr.LIBFPTR_MCST_WAITING_FOR_RESULT,
    "getResult": Fptr.LIBFPTR_MCST_GETTING_RESULT,
    "decodeResult": Fptr.LIBFPTR_MCST_DECODE_RESULT,
    "completed": Fptr.LIBFPTR_MCST_TASK_IS_OVER,
    "waitForRepeat": Fptr.LIBFPTR_MCST_WAITING_FOR_REPEAT
};

/**
 * Разбирает тип КМ ФФД 1.2
 * @param value Тип КМ ФФД 1.2 для JSON
 * @returns {*} Тип КМ ФФД 1.2 для драйвера
 */
exports.parseMarkingCodeTypeFfd_1_2 = function (value) {
    var r = exports.MARKING_CODE_TYPES_1_2[value];
    if (r === undefined) {
        r = parseInt(value, 10);
        if (isNaN(r))
            return undefined;
    }
    return r;
};

/**
 * Разбирает планируемый статус КМ ФФД 1.2
 * @param value Планируемый статус КМ ФФД 1.2 для JSON
 * @returns {*} Планируемый статус КМ ФФД 1.2 для драйвера
 */
exports.parseMarkingEstimatedStatus = function (value) {
    var r = exports.MARKING_ESTIMATED_STATUS[value];
    if (r === undefined) {
        r = parseInt(value, 10);
        if (isNaN(r))
            return undefined;
    }
    return r;
};

/**
 * Разбирает меру количества товара ФФД 1.2
 * @param value Мера количества товара ФФД 1.2 для JSON
 * @returns {*} Мера количества товара ФФД 1.2 для драйвера
 */
exports.parseItemUnits = function (value) {
    var r = exports.ITEM_UNITS[value];
    if (r === undefined) {
        r = parseInt(value, 10);
        if (isNaN(r))
            return undefined;
    }
    return r;
};

/**
 * Возвращает счетчики итогов ФН - 1157
 *
 * @returns {result} Результат
 */
exports.getFnTotals = function () {

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
    if (Fptr.fnQueryData() < 0 || Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DEVICE_FFD_VERSION) < Fptr.LIBFPTR_FFD_1_1) {
        return null;
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_SHIFT_STATE);
    if (Fptr.queryData() < 0) {
        return Fptr.error();
    }
    var shiftState = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_STATE);


    var result = {};
    for (var i = 0; i <= 3; ++i) {

       var type = {};
       if (i === 0)
           Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, Fptr.LIBFPTR_RT_SELL);
       else if (i === 1)
           Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, Fptr.LIBFPTR_RT_SELL_RETURN);
       else if (i === 2)
           Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, Fptr.LIBFPTR_RT_BUY);
       else if (i === 3)
           Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, Fptr.LIBFPTR_RT_BUY_RETURN);

        Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_TOTALS);

        if (shiftState == Fptr.LIBFPTR_SS_OPENED){
            Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_COUNTERS_TYPE, Fptr.LIBFPTR_FNCT_SHIFT);
        }
        else{
            Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_COUNTERS_TYPE, Fptr.LIBFPTR_FNCT_NON_NULLABLE);
        }

        Fptr.fnQueryData();

        type.receipts = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPTS_COUNT);
        type.corrections = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_CORRECTIONS_COUNT);
        type.receiptsSum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_RECEIPTS_SUM);
        type.correctionsSum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_CORRECTIONS_SUM);
        type.cashSum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_PAYMENTS_SUM_CASH);
        type.noncashSum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_PAYMENTS_SUM_ELECTRONICALLY);
        type.prepaidSum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_PAYMENTS_SUM_PREPAID);
        type.creditSum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_PAYMENTS_SUM_CREDIT);
        type.barterSum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_PAYMENTS_SUM_OTHER);
        type.vat20Sum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_TAXES_SUM_VAT20);
        type.vat10Sum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_TAXES_SUM_VAT10);
        type.vat120Sum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_TAXES_SUM_VAT120);
        type.vat110Sum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_TAXES_SUM_VAT110);
        type.vat0Sum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_TAXES_SUM_VAT0);
        type.vatNoSum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_TAXES_SUM_NO);

        if (i === 0)
            result.sell= type;
        else if (i === 1)
            result.sellReturn= type;
        else if (i === 2)
            result.buy= type;
        else if (i === 3)
            result.buyReturn= type;
    }

    return result;
};

/**
 * Возвращает счетчики количеств операций
 *
 * @returns {result} Результат
 */
exports.getFnQuantityCounters = function () {

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
    if (Fptr.fnQueryData() < 0 || Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DEVICE_FFD_VERSION) < Fptr.LIBFPTR_FFD_1_1) {
        return null;
    }

    var result = {};

    function readNextRecord(recordsID) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_ID, recordsID);
        return Fptr.readNextRecord();
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_TYPE, Fptr.LIBFPTR_RT_FN_QUANTITY_COUNTERS);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_COUNTERS_TYPE, Fptr.LIBFPTR_FNCT_NON_NULLABLE);
    Fptr.beginReadRecords();

    recordsID = Fptr.getParamString(Fptr.LIBFPTR_PARAM_RECORDS_ID);
    result.shiftNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_NUMBER);
    result.countAll = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPTS_COUNT);

    while (readNextRecord(recordsID) == Fptr.LIBFPTR_OK) {

        var type = {};

        switch (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE)) {
            case Fptr.LIBFPTR_RT_SELL:
                result.sell= type;
                break;
            case Fptr.LIBFPTR_RT_SELL_RETURN:
                result.sellReturn= type;
                break;
            case Fptr.LIBFPTR_RT_BUY:
                result.buy= type;
                break;
            case Fptr.LIBFPTR_RT_BUY_RETURN:
                result.buyReturn= type;
                break;
        }

        type.count = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPTS_COUNT);
        type.corrections = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_CORRECTIONS_COUNT);
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_ID, recordsID);
    Fptr.endReadRecords();

    return result;
};

/**
 * Возвращает счетчики итогов непереданных ФД  - 1158
 *
 * @returns {result} Результат
 */
exports.getFnUnsentDocsCounters = function () {

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
    if (Fptr.fnQueryData() < 0 || Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DEVICE_FFD_VERSION) < Fptr.LIBFPTR_FFD_1_1) {
        return null;
    }

    var result = {};

    function readNextRecord(recordsID) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_ID, recordsID);
        return Fptr.readNextRecord();
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_TYPE, Fptr.LIBFPTR_RT_FN_UNSENT_DOCS_COUNTERS);
    Fptr.beginReadRecords();
    recordsID = Fptr.getParamString(Fptr.LIBFPTR_PARAM_RECORDS_ID);
    result.countAll = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPTS_COUNT);

    while (readNextRecord(recordsID) == Fptr.LIBFPTR_OK) {

        var type = {};

        switch (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE)) {
            case Fptr.LIBFPTR_RT_SELL:
                result.sell = type;
                break;
            case Fptr.LIBFPTR_RT_SELL_RETURN:
                result.sellReturn = type;
                break;
            case Fptr.LIBFPTR_RT_BUY:
                result.buy = type;
                break;
            case Fptr.LIBFPTR_RT_BUY_RETURN:
                result.buyReturn = type;
                break;
            }

        type.count = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPTS_COUNT);
        type.sum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_RECEIPTS_SUM);

    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_ID, recordsID);
    Fptr.endReadRecords();

    return result;
};

exports.extractKeyValue = function (dict, value) {
    for (var key in dict) {
        if (dict[key] === value) {
            return key;
        }
    }
    return "";
};


exports.driverErrorObject = function (code, description) {
    var result = {};
    if (code !== undefined)
    {
        result["code"] = code;
        result["description"] = description;
    } else {
        result["code"] = Fptr.errorCode();
        result["description"] = Fptr.errorDescription();
    }
    switch (result["code"]) {
        case Fptr.LIBFPTR_ERROR_MARKING_CODE_VALIDATION_IN_PROGRESS:
            result["error"] = "imcCheckIsRun";
            break;
        case Fptr.LIBFPTR_ERROR_OFD_EXCHANGE:
            result["error"] = "serverNoConnect";
            break;
        case Fptr.LIBFPTR_ERROR_MARKING_CODE_VALIDATION_CANCELED:
            result["error"] = "imcCheckBreak";
            break;
        case Fptr.LIBFPTR_ERROR_INVALID_STATE:
            result["error"] = "imcCheckWrongState";
            break;
        case Fptr.LIBFPTR_ERROR_MARK_CHECK_TIMEOUT_EXPIRED:
            result["error"] = "responseTimeout";
            break;
        case Fptr.LIBFPTR_ERROR_NO_MARKING_CODE_IN_TABLE:
            result["error"] = "noImcInTable";
            break;
    }
    return result;
};