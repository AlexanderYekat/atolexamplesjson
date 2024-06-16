const utils = require('myscripts_utils');

function execute(task) {
    var state = {};
    var errorsInformation = {};

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_ISM_EXCHANGE_STATUS);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }
    state.notSentCount = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENTS_COUNT);
    state.notSentFirstNoticeDateTime = utils.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));
    state.notSentFirstNoticeNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_ISM_ERRORS);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }
    errorsInformation.fnCommandCode = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_COMMAND_CODE);
    errorsInformation.documentNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);

    errorsInformation.fn = {
        code: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FN_ERROR),
        description: Fptr.getParamString(Fptr.LIBFPTR_PARAM_FN_ERROR_TEXT)
    };
    errorsInformation.network = {
        code: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_NETWORK_ERROR),
        description: Fptr.getParamString(Fptr.LIBFPTR_PARAM_NETWORK_ERROR_TEXT)
    };
    errorsInformation.ism = {
        code: Fptr.getParamInt(Fptr.LIBFPTR_PARAM_ISM_ERROR),
        description: Fptr.getParamString(Fptr.LIBFPTR_PARAM_ISM_ERROR_TEXT)
    };

    flags = {};
    if (Fptr.isParamAvailable(Fptr.LIBFPTR_PARAM_DATA_FOR_SEND_IS_EMPTY))
        flags.dataForSendIsEmpty = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_DATA_FOR_SEND_IS_EMPTY);

    errorsInformation.lastSuccessConnectionDateTime = utils.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));

    return Fptr.ok({
        errors: errorsInformation,
        status: state,
        warnings: flags
    });
}
