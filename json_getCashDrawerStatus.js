function execute(task) {
	var cashDrawerCounters = {};
	var cashDrawerState = {};

	Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_CASH_SUM);
	if (Fptr.queryData() < 0) {
		return Fptr.error();
	}
    cashDrawerCounters.cashSum = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_SUM);
	
	Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_SHORT_STATUS);
	if (Fptr.queryData() < 0) {
		return Fptr.error();
	}
    cashDrawerState.cashDrawerOpened = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_CASHDRAWER_OPENED);

	return Fptr.ok({
		counters: cashDrawerCounters,
		cashDrawerStatus: cashDrawerState
	});
}
