function getFfdVersion(version) {
	switch (version) {
		case Fptr.LIBFPTR_FFD_1_0:
			return "1.0";
		case Fptr.LIBFPTR_FFD_1_0_5:
			return "1.05";
		case Fptr.LIBFPTR_FFD_1_1:
			return "1.1";
        case Fptr.LIBFPTR_FFD_1_2:
            return "1.2";
		default:
			break;
	}
}

function execute(task) {
	var deviceInformation = {};
	Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_STATUS)
	if (Fptr.queryData() < 0) {
		return Fptr.error();
	}
    deviceInformation.firmwareVersion = Fptr.getParamString(Fptr.LIBFPTR_PARAM_UNIT_VERSION);
    deviceInformation.model = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_MODEL);
    deviceInformation.modelName = Fptr.getParamString(Fptr.LIBFPTR_PARAM_MODEL_NAME);
    deviceInformation.receiptLineLength = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPT_LINE_LENGTH);
    deviceInformation.receiptLineLengthPix = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_RECEIPT_LINE_LENGTH_PIX);
    deviceInformation.serial = Fptr.getParamString(Fptr.LIBFPTR_PARAM_SERIAL_NUMBER);
	
	Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_UNIT_VERSION);
	Fptr.setParam(Fptr.LIBFPTR_PARAM_UNIT_TYPE, Fptr.LIBFPTR_UT_CONFIGURATION);
	if (Fptr.queryData() < 0) {
        return Fptr.error();
    }
	deviceInformation.configurationVersion = Fptr.getParamString(Fptr.LIBFPTR_PARAM_UNIT_VERSION);
	
	Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
	if (Fptr.fnQueryData() < 0) {
		return Fptr.error();
	}
    deviceInformation.ffdVersion = getFfdVersion(Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DEVICE_FFD_VERSION));
    deviceInformation.fnFfdVersion = getFfdVersion(Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FN_FFD_VERSION));
	
	return Fptr.ok(
		{deviceInfo: deviceInformation}
	);
}
