const utils = require('myscripts_utils');

function DriverError(e) {
    this.e = e;
    this.name = 'DriverError';
}

function setCounterValue(object, key, op) {
    try {
        object[key] = op();
    } catch (e) {
        switch (e.e.error) {
            case Fptr.LIBFPTR_ERROR_NOT_SUPPORTED:
            case Fptr.LIBFPTR_ERROR_INVALID_RECEIPT_TYPE:
            case Fptr.LIBFPTR_ERROR_INVALID_SCRIPT_NUMBER:
                return;
            default:
                throw e;
        }
    }
}

function getOverallTotalByPayment(receiptType, paymentType) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_NON_NULLABLE_SUM_BY_PAYMENTS);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_PAYMENT_TYPE, paymentType);
    if (Fptr.queryData() < 0) {
        throw new DriverError(Fptr.error());
    }
    return Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_SUM);
}

function getOverallTotal(receiptType) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_NON_NULLABLE_SUM);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
    if (Fptr.queryData() < 0) {
        throw new DriverError(Fptr.error());
    }
    return Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_SUM);
}

function execute(task) {
    try {
        var totals = {};

        Fptr.readModelFlags();
        var paymentsCount = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_CAP_PAYMENTS_COUNT);

        var receipts = {};
        for (var rt in utils.RECEIPT_TYPES) {
            var rec = {}, recPayments = {};
            setCounterValue(rec, "sum", function () {
                return getOverallTotal(utils.RECEIPT_TYPES[rt]);
            });
            for (var pt in utils.PAYMENT_TYPES) {
                setCounterValue(recPayments, pt, function () {
                    return getOverallTotalByPayment(utils.RECEIPT_TYPES[rt], utils.PAYMENT_TYPES[pt]);
                });
            }
            for (var i = Fptr.LIBFPTR_PT_OTHER + 1; i < paymentsCount; i++) {
                setCounterValue(recPayments, "userPaymentType-" + i, function () {
                    return getOverallTotalByPayment(utils.RECEIPT_TYPES[rt], i);
                });
            }
            if (Object.keys(recPayments).length > 0)
                rec.payments = recPayments;
            receipts[rt] = rec;
        }
        totals.receipts = receipts;

        Fptr.resetError();

        return Fptr.ok({overallTotals: totals});
    } catch (e) {
        if (e.name === 'DriverError') {
            return e.e;
        } else {
            throw e;
        }
    }
}
