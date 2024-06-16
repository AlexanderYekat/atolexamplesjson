const utils = require('myscripts_utils');

function execute(task) {
    var department = [];
    for (var i = 0; i < 5; i++) {
        department[i] = {};
        for (var rt in utils.RECEIPT_TYPES) {
            Fptr.setParam(Fptr.LIBFPTR_PARAM_DATA_TYPE, Fptr.LIBFPTR_DT_DEPARTMENT_SUM);
            Fptr.setParam(Fptr.LIBFPTR_PARAM_RECEIPT_TYPE, utils.RECEIPT_TYPES[rt]);
            Fptr.setParam(Fptr.LIBFPTR_PARAM_DEPARTMENT, i + 1);
            if (Fptr.queryData() < 0) {
                return Fptr.error();
            }
            department[i][rt] = Fptr.getParamDouble(Fptr.LIBFPTR_PARAM_SUM);
        }
    }

    return Fptr.ok({
        departmentSum: {
            department1: department[0],
            department2: department[1],
            department3: department[2],
            department4: department[3],
            department5: department[4]
        }
    });
}