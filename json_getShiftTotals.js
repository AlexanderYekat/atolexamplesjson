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
            case Fptr.LIBFPTR_ERROR_INVALID_PAYMENT_TYPE:
                return;
            default:
                throw e;
        }
    }
}

function getShiftTotals(receiptType) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_SHIFT_TOTALS);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
    if (Fptr.queryData() < 0) {
        throw new DriverError(Fptr.error());
    }
    return Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_SUM);
}

function getPaymentsSum(receiptType, paymentType) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_PAYMENT_SUM);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_PAYMENT_TYPE, paymentType);
    if (Fptr.queryData() < 0) {
        throw new DriverError(Fptr.error());
    }
    return Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_SUM);
}

function getCashMovementSum(isIncome) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, isIncome ? Fptr.LIBFPTR_DT_CASHIN_SUM : Fptr.LIBFPTR_DT_CASHOUT_SUM);
    if (Fptr.queryData() < 0) {
        throw new DriverError(Fptr.error());
    }
    return Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_SUM);
}

function getCashMovementCount(isIncome) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, isIncome ? Fptr.LIBFPTR_DT_CASHIN_COUNT : Fptr.LIBFPTR_DT_CASHOUT_COUNT);
    if (Fptr.queryData() < 0) {
        throw new DriverError(Fptr.error());
    }
    return Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENTS_COUNT);
}

function getReceiptCount(receiptType) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_RECEIPT_COUNT);
    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
    if (Fptr.queryData() < 0) {
        throw new DriverError(Fptr.error());
    }
    return Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENTS_COUNT);
}

function getShiftNumber(receiptType) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_SHIFT_STATE);
    if (Fptr.queryData() < 0) {
        throw new DriverError(Fptr.error());
    }
    return Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_NUMBER);
}

function getCashDrawerSum() {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_CASH_SUM);
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
            setCounterValue(rec, "count", function () {
                return getReceiptCount(utils.RECEIPT_TYPES[rt]);
            });
            setCounterValue(rec, "sum", function () {
                return getShiftTotals(utils.RECEIPT_TYPES[rt]);
            });
            for (var pt in utils.PAYMENT_TYPES) {
                setCounterValue(recPayments, pt, function () {
                    return getPaymentsSum(utils.RECEIPT_TYPES[rt], utils.PAYMENT_TYPES[pt]);
                });
            }
            for (var i = Fptr.LIBFPTR_PT_OTHER + 1; i < paymentsCount; i++) {
                setCounterValue(recPayments, "userPaymentType-" + i, function () {
                    return getPaymentsSum(utils.RECEIPT_TYPES[rt], i);
                });
            }
            rec.payments = recPayments;
            receipts[rt] = rec;
        }
        totals.receipts = receipts;

        var income = {};
        setCounterValue(income, "sum", function () {
            return getCashMovementSum(true);
        });
        setCounterValue(income, "count", function () {
            return getCashMovementCount(true);
        });
        totals.income = income;

        var outcome = {};
        setCounterValue(outcome, "sum", function () {
            return getCashMovementSum(false);
        });
        setCounterValue(outcome, "count", function () {
            return getCashMovementCount(false);
        });
        totals.outcome = outcome;

        var cashDrawer = {};
        setCounterValue(cashDrawer, "sum", function () {
            return getCashDrawerSum();
        });
        totals.cashDrawer = cashDrawer;

        setCounterValue(totals, "shiftNumber", function () {
            return getShiftNumber();
        });

        Fptr.resetError();

        return Fptr.ok({shiftTotals: totals});
    } catch (e) {
        if (e.name === 'DriverError') {
            return e.e;
        } else {
            throw e;
        }
    }
}
