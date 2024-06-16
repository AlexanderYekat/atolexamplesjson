const utils = require('myscripts_utils');

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
            break;
        default:
            break;
    }
}

function execute(task) {
    var fnInformation = {};
    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FFD_VERSIONS);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }
    fnInformation.ffdVersion = getFfdVersion(Fptr.getParamInt(Fptr.LIBFPTR_PARAM_DEVICE_FFD_VERSION));
    fnInformation.fnFfdVersion = getFfdVersion(Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FN_FFD_VERSION));

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_VALIDITY);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }
    fnInformation.numberOfRegistrations = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_REGISTRATIONS_COUNT);
    fnInformation.registrationsRemaining = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_REGISTRATIONS_REMAIN);
    fnInformation.validityDate = utils.dateToIsoString(Fptr.getParamDateTime(Fptr.LIBFPTR_PARAM_DATE_TIME));

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_FN_INFO);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }

    var fnWarnings = {};
    fnInformation.serial = Fptr.getParamString(Fptr.LIBFPTR_PARAM_SERIAL_NUMBER);
    fnInformation.version = Fptr.getParamString(Fptr.LIBFPTR_PARAM_FN_VERSION);
    fnInformation.execution = Fptr.getParamString(Fptr.LIBFPTR_PARAM_FN_EXECUTION);
    fnInformation.fnContainsKeysUpdaterServerUri = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_CONTAINS_KEYS_UPDATER_SERVER_URI);
    switch (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_FN_STATE)) {
        case Fptr.LIBFPTR_FNS_INITIAL:
            fnInformation.livePhase = "init";
            break;
        case Fptr.LIBFPTR_FNS_CONFIGURED:
            fnInformation.livePhase = "configured";
            break;
        case Fptr.LIBFPTR_FNS_FISCAL_MODE:
            fnInformation.livePhase = "fiscalMode";
            break;
        case Fptr.LIBFPTR_FNS_POSTFISCAL_MODE:
            fnInformation.livePhase = "postFiscalMode";
            break;
        case Fptr.LIBFPTR_FNS_ACCESS_ARCHIVE:
            fnInformation.livePhase = "accessArchive";
            break;
        default:
            fnInformation.livePhase = "unknown";
            break;
    }
    fnWarnings.criticalError = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_CRITICAL_ERROR);
    fnWarnings.memoryOverflow = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_MEMORY_OVERFLOW);
    fnWarnings.needReplacement = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_NEED_REPLACEMENT);
    fnWarnings.ofdTimeout = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_OFD_TIMEOUT);
    fnWarnings.resourceExhausted = Fptr.getParamBool(Fptr.LIBFPTR_PARAM_FN_RESOURCE_EXHAUSTED);
    fnInformation.warnings = fnWarnings;

    return Fptr.ok({
        fnInfo: fnInformation
    });
}
