const receipt = require('myscripts_base_receipt');

function execute(task) {
    return receipt.executeReceipt(task);
}

function validateTask(task) {
    return receipt.validate(task);
}

