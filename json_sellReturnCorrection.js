const correction = require('myscripts_base_correction');

function execute(task) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }

    var currentFfdVersion = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FFD_VERSION);
    if (currentFfdVersion < Fptr.LIBFPTR_FFD_1_1) {
        return Fptr.result(Fptr.LIBFPTR_ERROR_INVALID_RECEIPT_TYPE)
    }

    return correction.executeNewCorrection(task);
}

function validateTask(task) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }

    var currentFfdVersion = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FFD_VERSION);
    if (currentFfdVersion < Fptr.LIBFPTR_FFD_1_1) {
        return Fptr.result(Fptr.LIBFPTR_ERROR_INVALID_RECEIPT_TYPE)
    }

    return correction.validateNewCorrection(task);
}
