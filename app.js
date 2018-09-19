const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoUriBuilder = require( 'mongo-uri-builder' );
const Mongo = require('mongodb')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//returns the mongo url
let url =  mongoUriBuilder({  
            host: "localhost",
            port: 27017,
            database: 'pearson'});

//returns true if user is found false if not
async function userValidator( _username, _password ){
    let query = {
        username : _username,
        password : _password
    }
    let conn =  await Mongo.connect( url , { useNewUrlParser: true } );
    let db   =  await conn.db("pearson");
    let doc  =  await db.collection("users").find(query).toArray()
    
    if ( doc.length  == 1 ){
        return true
    } else {
        return false
    }
}
//put user in database
async function putUser( _username, _password ){
    let input = {
        username: _username,
        password: _password
    }   
    let conn =  await Mongo.connect( url , { useNewUrlParser: true } );
    let db   =  await conn.db("pearson");
    await db.collection("users").insertOne( input )
}
//midleware function that creates a user if non exists sents flag to created, if user already in db sents flag to false
async function createUser(req, res, next ){
    let query = {
        username : req.body.username,
        password : req.body.password,
    }
    if (await userValidator(query.username, query.password )==false){
        putUser( query.username, query.password )
        console.log("user created")
        req.usercreated = true
        req.username = query.username
        req.password = query.password
        next()
    }else{   
        console.log("user not created")
        req.usercreated = false
        next()
    }
}
//middleware that validates the username
async function verifyUser(req, res, next){   
    let query = {
        username : req.body.username,
        password : req.body.password,
    }
    console.log(query)
    if ( await userValidator(query.username, query.password )==true ){
        req.uservalid = true;
        next()
    }else{
        res.sendStatus(403);
    }
};

app.get('/', (req, res) => {
  res.json({
    message: '/login to login with post request. /create to create a new user'
  });
});

app.post('/login', verifyUser , (req, res) => {
    if ( req.uservalid == true){
        res.json("valid")
    }else{
        res.json("try again");
    }
});

app.post('/create', createUser, (req, res) => { 
    if ( req.usercreated == true){
        res.json("User created with: " + req.username + " " + req.password )
    }else{
        res.json("try again user already in db");
    }
});

let port = 5000;

app.listen( port , () => console.log('Server started on port: ' + port ));