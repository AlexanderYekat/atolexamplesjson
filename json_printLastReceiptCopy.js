function execute(task) {
    Fptr.setParam(Fptr.LIBFPTR_PARAM_REPORT_TYPE, Fptr.LIBFPTR_RT_LAST_DOCUMENT);
    if (Fptr.report() < 0) {
        return Fptr.error();
    }

    return Fptr.ok();
}
