                const express = require('express');
                const app = express();
                const bcrypt = require('bcrypt');
                const cors = require('cors');
                const mongoose = require('mongoose');
                const prodModel = require('./models/productSchema');
                const jwt = require('jsonwebtoken');
                const allEventsModel = require('./models/allEvents');
                require('dotenv').config();
                const PORT =  3000;
                
                // Connect database

                const connectDB = async () => {
                    try {
                      const conn = await mongoose.connect(process.env.MONGOOSE_URI);
                      console.log(`MongoDB Connected: ${conn.connection.host}`);
                    } catch (error) {
                      console.log(error);
                      process.exit(1);
                    }
                  }


                // mongoose.connect(process.env.MONGOOSE_URI)
                // .then(() => console.log('MongoDb Connected'))
                // .catch((err) => console.log('error', err))

                app.use(cors());
                app.use(express.json());

                    app.post('/register', async (req, res) => {
                        const data = req.body;
                        const { name, email, password } = data;

                        if(name && email && password) {
                            const hashedPassword = await bcrypt.hash(password, 10);
                            prodModel.findOne({ email })
                            .then((user) => {
                                if(user) {
                                    res.json({
                                        message: 'Email Address already in use'
                                    })
                                } else {
                                    const objToSend = {
                                        ...data,
                                        name: name,
                                        email: email,
                                        password: hashedPassword
                                    }
                                    prodModel.create(objToSend)
                                    .then(() => {
                                        res.json({
                                            message: 'User Signed up successfully'
                                        })
                                    })
                                    .catch((error) => {
                                        res.json({
                                            message: `${error} `
                                        })
                                    })
                                }
                            })
                            .catch((error) => {
                                console.log(`error:- ${error}`)
                            })
                        } else {
                            res.json({
                                message:'Required Credentials are missing'
                            })
                        }

                        console.log(data);
                    })

                    app.post('/login', async (req, res) => {

                        const data = req.body;
                        const {email, password} = data;
                        prodModel.findOne({email})
                        .then( async (user) => {
                            if(user){
                                const passwordMatched = await bcrypt.compare(password, user.password);
                                console.log('paswordMatched', passwordMatched)
                                if(!passwordMatched) {
                                    res.status(404).json({message: 'Credentials Error'})
                                    // res.json({message: 'Credentials Error'}) 
                                    return
                                } 
                                else {
                                    const tokenObj = {
                                        ...user
                                    }
                                    
                                    const token = jwt.sign(tokenObj, 'userToken');
                                    console.log(email, password)
                                    res.json({
                                            message:'Logged in Succuessfully',
                                            status: 'Success',
                                            loggedIn: true,
                                            data:user,
                                            token:token
                                        })                
                                }
                            } else {
                                return res.status(404).json({message: 'User not found'})
                            }
                        })
                        .catch((error) => {
                            console.log(`error:- ${error}`)
                        })
                    })



                app.post('/decode', async (req, res) => {
                        const tokenRecieved = req.body;
                        const { token } = tokenRecieved;
                        if(token === undefined) return;
                        
                        const decodedToken = jwt.decode(token);
                        const payload = decodedToken._doc
                        res.json({
                            payload:payload,
                            status:'Success',
                            message:'User verified'
                        })
                        
                })

                app.post('/create', (req, res) => {
                    const data = req.body;
                    const { email, event } = data;
                    
                    prodModel.updateOne({email}, { $push: { events: event } })
                    .then((result) => {
                       res.send({
                        message: 'Event updated in database'
                       })
                    
                    })
                    .catch((error) => {
                        console.log(`error ${error}`)
                    })
                    if(data) {
                        res.send({
                            message: 'success'
                        })
                    }

                })

                app.post('/getevents', (req, res) => {
                        const data = req.body;
                        
                        const { email } = data;
                        
                        if(email) {
                            prodModel.findOne({email})
                            .then((user) => {
                                 res.send({
                                    user:user,
                                    message: 'This is the updated user data'
                                })

                            })
                            .catch((error) => {
                                console.log(`error:- ${error}`)
                            })    
                        }
                })



                app.post('/allevents', (req, res) => {
                    const data = req.body;
                    
                    if(data.obj) {
                    const { name, dateOfEvent, description  } = data.obj;
                        const objToSend = {
                            ...data.obj,
                            name: name,
                            date: dateOfEvent,
                            description:description
                        }
                        allEventsModel.create(objToSend)
                        .then(() => {
                            res.json({
                                message: 'Event Added to feed'
                            })           
                        })
                        .catch(error => {
                            res.json({
                                message:  error
                            })
                        })
                    }
                })

                app.get('/newsfeed', (req, res) => {
                    
                    allEventsModel.find({})
                    .then((doc) => {
                        res.send({
                            data: doc
                        })
                        
                    })
                    .catch((error) => {
                        console.log(error);
                        res.status(500).json({ message: 'Internal server error.' });
                    })
                })

                app.post('/delete', async (req, res) => {
                    const data = req.body;
                    const { user, event } = data;
                    console.log(event.name, 'name')
                    try {
                      if (user) {
                       
                        // Find the user by their email
                        const foundUser = await prodModel.findOne({ email: user });
                        // Delete the same event from the newsfeed simultaneously...
                        await allEventsModel.deleteMany({ name:event.name })

                        
                        // Check if the user exists
                        if (!foundUser) {
                          return res.status(404).json({ message: 'User not found.' });
                        }
                  
                        // Use $pull to remove the specified event from the 'events' array of the user
                        foundUser.events.pull(event);
                      
                        // Save the updated user document
                        await foundUser.save();
                  
                        return res.status(200).json({ message: 'Event deleted successfully.' });
                      } else {
                        return res.status(400).json({ message: 'User email not provided.' });
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      return res.status(500).json({ message: 'An error occurred while deleting the event.' });
                    }
                  });
                  
                app.post('/ticket', (req, res) => {
                    const data = req.body;
                  
                    const { email, clickedEvent  } = data;
                    console.log(email)
                    prodModel.findOne({email, "attending._id": clickedEvent._id})
                                .then((existingEvent) => {
                                    if(existingEvent) {
                                        res.send({
                                            message: `Error: You are already attending ${clickedEvent.name}`
                                        })
                                    
                                    } else if(email !== undefined){
                                        prodModel.updateOne({email}, { $push: { attending: clickedEvent } })
                                        .then((user) => {
                                            res.send({
                                                message: `Congratulations you are going ${clickedEvent.name}`,
                                                user:user
                                            }) 
                                        })
                                        .catch((error) => {
                                            res.send({
                                                messsage: `Error: ${error}`
                                            })
                                        })                               
                                    } else {
                                        res.send({
                                            message:'Please Login to Start attending Events'
                                        })
                                    }
                                })
                           
                            })


                app.get('/users', (req, res) => {
                prodModel.find({}).maxTimeMS(5000).exec()
                .then((doc) => {                   
                  res.send(doc)
                })

                })

                app.post('/deleteaccount', (req, res) => {
                    const { email } = req.body;
                
                    // Delete user from prodModel
                    prodModel.deleteOne({ email: email })
                        .then(() => {
                            // After user deletion, delete their events
                            return allEventsModel.deleteMany({ created_by: email });
                        })
                        .then(() => {
                            // After both deletions, send a single success response
                            res.send({
                                message: `${email} Your account and posts were successfully deleted.`
                            });
                        })
                        .catch((error) => {
                            res.status(500).send({
                                message: `Error: ${error}`
                            });
                        });
                });
                



            connectDB().then(() => {
                app.listen(PORT, () => {
                    console.log("listening for requests");
                })
            })














