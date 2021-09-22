const mongoose = require('mongoose');

const voteDetailSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },
    partyname: {
        type: String,
        required: true,
    },
})

module.exports = mongoose.model('voteDetail', voteDetailSchema);