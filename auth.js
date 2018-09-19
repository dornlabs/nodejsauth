const mongoUriBuilder = require( 'mongo-uri-builder' );
const Mongo = require('mongodb')




class Auth {

    async createUser(req, res, next ){
        let query = {
            username : req.body.username,
            password : req.body.password,
        }

        let create = async function(){
            let conn =  await Mongo.connect(Auth.returnConnectionStringReplica(), { useNewUrlParser: true } );
            let db   =  await conn.db("pearson");
            let doc  =  await db.collection("users").insertOne(query)
        }

        if (await Auth.userValidator(query.username, query.password )==false){
            create()
            console.log("user created")

            req.usercreated = true
            next()
        }else
        {   
            console.log("user not created")
            req.usercreated = false
            next()
        }


    }


    static returnConnectionStringReplica(){
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
        let conn =  await Mongo.connect(Auth.returnConnectionStringReplica(), { useNewUrlParser: true } );
        let db   =  await conn.db("pearson");
        let doc  =  await db.collection("users").find(query).toArray()

        if ( doc.length  == 1 ){
            return true
        } else {
            return false
        }
    }

}

module.exports = Auth;