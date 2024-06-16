const utils = require('myscripts_utils');

function execute(task) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_CHECK_MARK_TIME);
    Fptr.fnQueryData();

    return Fptr.ok({
        fmCheckTime: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FN_CHECK_MARK_TIME),
        sendingTime: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SENDING_MARK_TIME),
        serverExchangeTime: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_SERVER_EXCHANGE_TIME),
        fullTime: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FULL_SENDING_MARK_TIME)
    });
}
