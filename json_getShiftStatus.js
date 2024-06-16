const utils = require('myscripts_utils');

function execute(task) {
	Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_SHIFT_STATE);
	if (Fptr.queryData() < 0) {
		return Fptr.error();
	}

    var shiftState;
    switch (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_STATE)) {
        case Fptr.LIBFPTR_SS_CLOSED:
            shiftState = "closed";
            break;
        case Fptr.LIBFPTR_SS_OPENED:
            shiftState = "opened";
            break;
        case Fptr.LIBFPTR_SS_EXPIRED:
            shiftState = "expired";
            break;
        default:
            break;
    }
    var number =  Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_NUMBER);
    var time = utils.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));


    var count_fd;
    if (shiftState === "closed") {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_DOCUMENTS_COUNT_IN_SHIFT);
        if (Fptr.fnQueryData() >= 0)
            count_fd = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENTS_COUNT);
    }

    return Fptr.ok({
        shiftStatus: {
            number: number,
            expiredTime: time,
            state: shiftState,
            documentsCount: count_fd
        }
    });
}
