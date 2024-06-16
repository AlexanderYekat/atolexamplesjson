function execute(task) {
    if (Fptr.openDrawer() < 0) {
        return Fptr.error();
    }

    return Fptr.ok();
}
