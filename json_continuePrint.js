function execute(task) {
    if (Fptr.continuePrint() < 0)
        return Fptr.error();

    return Fptr.ok();
}
