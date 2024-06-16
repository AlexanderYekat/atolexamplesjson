function execute(task) {
    var fnState = {};
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_LAST_DOCUMENT);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }
    fnState.fiscalDocumentNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DOCUMENT_NUMBER);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_SHIFT);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }
    fnState.fiscalReceiptNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPT_NUMBER);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FN_INFO);
	if (Fptr.fnQueryData() < 0) {
		return Fptr.error();
	}
    var fnWarnings = {};
    fnWarnings.criticalError = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_CRITICAL_ERROR);
    fnWarnings.memoryOverflow = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_MEMORY_OVERFLOW);
    fnWarnings.needReplacement = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_NEED_REPLACEMENT);
    fnWarnings.ofdTimeout = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_OFD_TIMEOUT);
    fnWarnings.resourceExhausted = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_RESOURCE_EXHAUSTED);
    fnState.warnings = fnWarnings;
    
    return Fptr.ok({
        fnStatus: fnState
    });
}
