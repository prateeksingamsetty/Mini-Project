const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const passportUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
})
passportUserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', passportUserSchema);