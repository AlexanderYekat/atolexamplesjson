function execute(task) {
    var licensesInformation = [];
    Fptr.setParam(Fptr.LIBFPTR_PARAM_RECORDS_TYPE, Fptr.LIBFPTR_RT_LICENSES);
    if (Fptr.beginReadRecords() < 0) {
        return Fptr.error();
    } else {
        while (Fptr.readNextRecord() === Fptr.LIBFPTR_OK) {
            licensesInformation.push({
                id: Fptr.getParamString(Fptr.LIBFPTR_PARAM_LICENSE_NUMBER),
                name: Fptr.getParamString(Fptr.LIBFPTR_PARAM_LICENSE_NAME)
            })
        }
        Fptr.endReadRecords();
    }

    return Fptr.ok({
        licenses: licensesInformation
    });
}
