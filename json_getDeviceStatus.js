const utils = require('myscripts_utils');

function execute(task) {
	Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_STATUS);
	if (Fptr.queryData() < 0) {
		return Fptr.error();
	}

    var deviceStatus = {};
    deviceStatus.blocked = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_BLOCKED);
    deviceStatus.coverOpened = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_COVER_OPENED);
    deviceStatus.currentDateTime = utils.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));
    deviceStatus.fiscal = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FISCAL);
    deviceStatus.fnFiscal = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_FISCAL);
    deviceStatus.fnPresent = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_PRESENT);
    deviceStatus.paperPresent = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_RECEIPT_PAPER_PRESENT);
    deviceStatus.cashDrawerOpened = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_CASHDRAWER_OPENED);
    switch (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SHIFT_STATE)) {
        case Fptr.LIBFPTR_SS_CLOSED:
            deviceStatus.shift = "closed";
            break;
        case Fptr.LIBFPTR_SS_OPENED:
            deviceStatus.shift = "opened";
            break;
        case Fptr.LIBFPTR_SS_EXPIRED:
            deviceStatus.shift = "expired";
            break;
    }
    return Fptr.ok({deviceStatus: deviceStatus});
}
