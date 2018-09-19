const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoUriBuilder = require( 'mongo-uri-builder' );
const Mongo = require('mongodb')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

class Auth {

    async createUser(req, res, next ){
        let query = {
            username : req.body.username,
            password : req.body.password,
        }

        let create = async function(){
            let conn =  await Mongo.connect(Auth.returnConnectionStringReplica(), { useNewUrlParser: true } );
            let db   =  await conn.db("pearson");
            await db.collection("users").insertOne(query)
        }

        if (await Auth.userValidator(query.username, query.password )==false){
            create()
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


    static returnConnectionString(){
        return mongoUriBuilder(
            {  
                host: "localhost",
                port: 27017,
                database: 'pearson',
         });    
    }

    async verifyUser(req, res, next){
   
        let query = {
            username : req.body.username,
            password : req.body.password,
        }
        console.log(query)
        if ( await Auth.userValidator(query.username, query.password )==true ){
            req.uservalid = true;
            next()
        }else{
            res.sendStatus(403);
        }
    };

    static async userValidator( _username, _password ){
        let query = {
            username : _username,
            password : _password
        }
        let conn =  await Mongo.connect(Auth.returnConnectionString(), { useNewUrlParser: true } );
        let db   =  await conn.db("pearson");
        let doc  =  await db.collection("users").find(query).toArray()

        if ( doc.length  == 1 ){
            return true
        } else {
            return false
        }
    }
}

let Auth_ = new Auth();


app.get('/', (req, res) => {
  res.json({
    message: '/login to login with post request. /create to create a new user'
  });
});

app.post('/login', Auth_.verifyUser , (req, res) => {
    if ( req.uservalid == true){
        res.json("valid")
    }else{
        res.json("try again");
    }
});

app.post('/create', Auth_.createUser, (req, res) => {
    
    console.log(req.usercreated);

    if ( req.usercreated == true){
        res.json("User created with: " + req.username + " " + req.password )
    }else{
        res.json("try again user already in db");
    }
});

app.listen(5000, () => console.log('Server started on port 5000'));
