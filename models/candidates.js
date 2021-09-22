const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },
    partyname: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String,
        required: true
    },
    agenda: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Candidate', candidateSchema);