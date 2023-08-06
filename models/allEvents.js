const mongoose = require('mongoose');

const schema = mongoose.Schema({
      email: {
        type:String
      },
     name: {
        type: String,
        required: true
     },
     date: {
        type: String,
        required: true
     },
     description:{
      type: String,
      required: true   
    },
    category:{
      type:String,
      required: true
    },
    location: {
      type: String
    },
    time: {
      type: String
    },
    created_on: {
      type:Date,
      default:Date.now
    },
    ticket: {
      type:Object
    },
    created_by: {
      type:String
    },
    created_by_user: {
      type: String
    },
    interested: {
      type:Number
    }
  });

const allEventsModel = mongoose.model('allEventsModel', schema);

module.exports = allEventsModel;