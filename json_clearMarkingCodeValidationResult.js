function execute(task) {
    if (Fptr.clearMarkingCodeValidationResult() < 0) {
        return Fptr.error();
    } else {
        return Fptr.ok();
    }
}
