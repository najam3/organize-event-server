const mongoose = require('mongoose')

const schema = mongoose.Schema({
     name: {
        type: String,
        required: true
     },
     password: {
      type: String,
      required: true
     },
     email: {
      type:String,
      required: true
     },
     events: {
      type:Array
     },
     attending: {
      type:Array
     }
});

const prodModel = mongoose.model('myModel', schema);

module.exports = prodModel;
