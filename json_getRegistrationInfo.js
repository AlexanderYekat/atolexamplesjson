function execute(task) {
    var organization = {};
    var device = {};
    var ofd = {};
    var ism = {};

    Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_REG_INFO);
    if (Fptr.fnQueryData() < 0) {
        return Fptr.error();
    }

    organization.name = Fptr.getParamString(1048);
    organization.vatin = Fptr.getParamString(1018);
    organization.email = Fptr.getParamString(1117);
    var taxationTypes = Fptr.getParamInt(1062);
    organization.taxationTypes = [];
    if (taxationTypes & Fptr.LIBFPTR_TT_OSN) {
        organization.taxationTypes.push("osn");
    }
    if (taxationTypes & Fptr.LIBFPTR_TT_USN_INCOME) {
        organization.taxationTypes.push("usnIncome");
    }
    if (taxationTypes & Fptr.LIBFPTR_TT_USN_INCOME_OUTCOME) {
        organization.taxationTypes.push("usnIncomeOutcome");
    }
    if (taxationTypes & Fptr.LIBFPTR_TT_ENVD) {
        organization.taxationTypes.push("envd");
    }
    if (taxationTypes & Fptr.LIBFPTR_TT_ESN) {
        organization.taxationTypes.push("esn");
    }
    if (taxationTypes & Fptr.LIBFPTR_TT_PATENT) {
        organization.taxationTypes.push("patent");
    }
    var agents = Fptr.getParamInt(1057);
    organization.agents = [];
    if (agents & Fptr.LIBFPTR_AT_BANK_PAYING_AGENT) {
        organization.agents.push("bankPayingAgent");
    }
    if (agents & Fptr.LIBFPTR_AT_BANK_PAYING_SUBAGENT) {
        organization.agents.push("bankPayingSubagent");
    }
    if (agents & Fptr.LIBFPTR_AT_PAYING_AGENT) {
        organization.agents.push("payingAgent");
    }
    if (agents & Fptr.LIBFPTR_AT_PAYING_SUBAGENT) {
        organization.agents.push("payingSubagent");
    }
    if (agents & Fptr.LIBFPTR_AT_ATTORNEY) {
        organization.agents.push("attorney");
    }
    if (agents & Fptr.LIBFPTR_AT_COMMISSION_AGENT) {
        organization.agents.push("commissionAgent");
    }
    if (agents & Fptr.LIBFPTR_AT_ANOTHER) {
        organization.agents.push("another");
    }
    organization.address = Fptr.getParamString(1009);
    device.paymentsAddress = Fptr.getParamString(1187);
    device.fnsUrl = Fptr.getParamString(1060);
    device.registrationNumber = Fptr.getParamString(1037);
    device.offlineMode = Fptr.getParamBool(1002);
    device.encryption = Fptr.getParamBool(1056);
    device.autoMode = Fptr.getParamBool(1001);
    device.machineNumber = Fptr.getParamString(1036);

    var ffd = Fptr.getParamInt(1209);

    switch (ffd) {
        case Fptr.LIBFPTR_FFD_1_0:
            device.ffdVersion = "1.0";
            break;
        case Fptr.LIBFPTR_FFD_1_0_5:
            device.ffdVersion = "1.05";
            break;
        case Fptr.LIBFPTR_FFD_1_1:
            device.ffdVersion = "1.1";
            break;
        case Fptr.LIBFPTR_FFD_1_2:
            device.ffdVersion = "1.2";
            break;
    }

    ofd.name = Fptr.getParamString(1046);
    ofd.vatin = Fptr.getParamString(1017);

    if (ffd >= Fptr.LIBFPTR_FFD_1_2) {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_LAST_REGISTRATION);
        if (Fptr.fnQueryData() < 0) {
            return Fptr.error();
        }
        var lastRegistrationNumber = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_REGISTRATIONS_COUNT);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_FN_DATA_TYPE, Fptr.LIBFPTR_FNDT_REGISTRATION_TLV);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_REGISTRATION_NUMBER, lastRegistrationNumber);
        Fptr.setParam(Fptr.LIBFPTR_PARAM_TAG_NUMBER, 1290);
        if (Fptr.fnQueryData() < 0) {
            return Fptr.error();
        }
        var tag1290 = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_TAG_VALUE);
        device.machineInstallation = ((tag1290 & (1 << 1)) !== 0);  //1221
        device.bso = ((tag1290 & (1 << 2)) !== 0);  //1110
        device.internet = ((tag1290 & (1 << 5)) !== 0);  //1108
        device.excise = ((tag1290 & (1 << 6)) !== 0);  //1207
        device.marking = ((tag1290 & (1 << 8)) !== 0);  //2103 - LIBFPTR_PARAM_TRADE_MARKED_PRODUCTS
        device.service = ((tag1290 & (1 << 9)) !== 0);  //1109
        device.gambling = ((tag1290 & (1 << 10)) !== 0);  //1193
        device.lottery = ((tag1290 & (1 << 11)) !== 0);  //1126
        device.pawnShop = ((tag1290 & (1 << 12)) !== 0);  //1257 - LIBFPTR_PARAM_PAWN_SHOP_ACTIVITY
        device.insurance = ((tag1290 & (1 << 13)) !== 0);  //1258 - LIBFPTR_PARAM_INSURANCE_ACTIVITY
    }
    else
    {
        device.machineInstallation = Fptr.getParamBool(1221);
        device.bso = Fptr.getParamBool(1110);
        device.internet = Fptr.getParamBool(1108);
        device.excise = Fptr.getParamBool(1207);
        device.service = Fptr.getParamBool(1109);
        device.gambling = Fptr.getParamBool(1193);
        device.lottery = Fptr.getParamBool(1126);
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 273);
    Fptr.readDeviceSetting();
    ofd.host = Fptr.getParamString(Fptr.LIBFPTR_PARAM_SETTING_VALUE);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 274);
    Fptr.readDeviceSetting();
    ofd.port = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SETTING_VALUE);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 275);
    Fptr.readDeviceSetting();
    ofd.dns = Fptr.getParamString(Fptr.LIBFPTR_PARAM_SETTING_VALUE);

    Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 50);
    Fptr.readDeviceSetting();
    switch (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SETTING_VALUE))
    {
        case Fptr.LIBFPTR_TT_OSN:
            device.defaultTaxationType = "osn";
            break;
        case Fptr.LIBFPTR_TT_USN_INCOME:
            device.defaultTaxationType = "usnIncome";
            break;
        case Fptr.LIBFPTR_TT_USN_INCOME_OUTCOME:
            device.defaultTaxationType = "usnIncomeOutcome";
            break;
        case Fptr.LIBFPTR_TT_ENVD:
            device.defaultTaxationType = "envd";
            break;
        case Fptr.LIBFPTR_TT_ESN:
            device.defaultTaxationType = "esn";
            break;
        case Fptr.LIBFPTR_TT_PATENT:
            device.defaultTaxationType = "patent";
            break;
    }

    Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 276);
    Fptr.readDeviceSetting();
    switch (Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SETTING_VALUE)) {
        case 1:
            device.ofdChannel = "usb";
            break;
        case 2:
            device.ofdChannel = "ethernet";
            break;
        case 3:
            device.ofdChannel = "wifi";
            break;
        case 4:
            device.ofdChannel = "gsm";
            break;
        case 5:
            device.ofdChannel = "proto";
            break;
        case 6:
            device.ofdChannel = "tcpipOsStack";
            break;
        default:
            break;
    }

    if (ffd >= Fptr.LIBFPTR_FFD_1_2)
    {
        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 1000);
        Fptr.readDeviceSetting();
        ism.host = Fptr.getParamString(Fptr.LIBFPTR_PARAM_SETTING_VALUE);

        Fptr.setParam(Fptr.LIBFPTR_PARAM_SETTING_ID, 1001);
        Fptr.readDeviceSetting();
        ism.port = Fptr.getParamInt(Fptr.LIBFPTR_PARAM_SETTING_VALUE);
        return Fptr.ok({
            organization: organization,
            device: device,
            ofd: ofd,
            ism: ism
        });
    }
    else
        return Fptr.ok({
            organization: organization,
            device: device,
            ofd: ofd
        });
}
