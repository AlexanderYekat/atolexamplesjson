const utils = require('myscripts_utils');

function execute(task) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_MARKING_MODE_STATUS);
    Fptr.fnQueryData();
    return Fptr.ok({
        fm: {
            status: utils.extractKeyValue(utils.MARKING_MODE_CHECKING_STATUS, Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARKING_MODE_CHECKING_STATUS)),
            checkingCount: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARK_CHECKING_COUNT),
            soldImcCount: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARK_SOLD_COUNT),
            noticeIsBegin: Fptr.getParamBool(Fptr.LIBFPTR_PARAM_NOTICE_IS_BEGIN),
            noticeFreeMemory: utils.extractKeyValue(utils.NOTICE_FREE_MEMORY, Fptr.getParamInt(Fptr.LIBFPTR_PARAM_NOTICE_FREE_MEMORY)),
            noticeUnsentCount:  Fptr.getParamInt(Fptr.LIBFPTR_PARAM_NOTICE_COUNT)
        },
        ecr: {
            status: utils.extractKeyValue(utils.MARK_CHECKING_STATUS_IN_CASH, Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARK_CHECKING_STATUS_IN_CASH)),
            type: utils.extractKeyValue(utils.MARK_CHECKING_TYPE_IN_CASH, Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARK_CHECKING_TYPE_IN_CASH)),
            stage: utils.extractKeyValue(utils.MARK_CHECKING_STAGE_IN_CASH, Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MARK_CHECKING_STAGE_IN_CASH))
        }
    });
}
