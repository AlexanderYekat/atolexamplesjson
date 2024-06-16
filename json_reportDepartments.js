const utils = require('myscripts_utils');

function execute(task) {
    if (Fptr.cancelReceipt() < 0 && !utils.isNormalCancelError(Fptr.errorCode())) {
        return Fptr.error();
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_REPORT_TYPE, Fptr.LIBFPTR_RT_DEPARTMENTS);
    if (Fptr.report() < 0) {
        Fptr.enableAutoCliche();
        return Fptr.error();
    }
    return Fptr.ok();
}
