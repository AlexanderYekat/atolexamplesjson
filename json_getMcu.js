function execute(task) {
    var mcu = {};
    Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_MCU_INFO)
    if (Fptr.queryData() < 0) {
        return Fptr.error();
    }
    mcu.sn = Fptr.getParamString(Fptr.LIBFPTR_PARAM_MCU_SN);
    mcu.partId = Fptr.getParamString(Fptr.LIBFPTR_PARAM_MCU_PART_ID);
    mcu.partName = Fptr.getParamString(Fptr.LIBFPTR_PARAM_MCU_PART_NAME);

    return Fptr.ok(
        { mcu }
    );
}

function validateTask(task) {
    return Fptr.ok();
}
