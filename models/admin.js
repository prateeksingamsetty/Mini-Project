const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    startDate: {
        type: Date,
        default: new Date()
    },
    endDate: {
        type: Date,
        default: new Date()
    }
});

module.exports = mongoose.model('Admin', adminSchema);