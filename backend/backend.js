const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Sequelize, DataTypes } = require('sequelize');
const { create } = require('domain');
const port = 7000
const sequelizeServer = new Sequelize('postgres://amirhali:satele@localhost:6000/amirhali', {
    define: {
        schema: 'capstone_backend'
    }
});

app.use(express.json())
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.listen(port, '127.0.0.1', ()=>{
    console.log(`server running on ${port}`)
})

sequelizeServer.authenticate().then(()=> {
    console.log('Database connected succesfully');

});
sequelizeServer.sync({alter: true}).then(()=> {
    console.log('tables created successfully')
});


const User = sequelizeServer.define('users', {
    username:{
        type: DataTypes.STRING,
        field: 'username'
    },
    password: {
        type: DataTypes.STRING,
        field: 'password'
    },
    firstName: {
        type: DataTypes.STRING,
        field: 'first_name'
    },
    lastName: {
        type: DataTypes.STRING,
        field: 'last_name'
    },
    interests: {
        type: DataTypes.STRING,
        field: 'interests'
    },
    email: {
        type: DataTypes.STRING,
        field: 'user_email'
    }
}, {
    timestamps: false
});

const Posts = sequelizeServer.define('posts', {
    content: {
        type: DataTypes.STRING,
        field: 'post_content'
    },
    likes: {
        type: DataTypes.INTEGER,
        field: 'post_likes'
    },
    username:{
        type: DataTypes.STRING,
        field: 'username'
    }
});

const Comments = sequelizeServer.define('comments', {
    comment: {
        type: DataTypes.STRING,
        field: 'comment'
    },
    
})

User.hasMany(Posts);
User.hasMany(Comments);
Posts.hasMany(Comments);
Posts.belongsTo(User);
Comments.belongsTo(User);
Comments.belongsTo(Posts);

//ENDPOINTS VVV

// post method
app.post('/create-user', (req, res)=> {
    const newUser = req.body;
    async function createUser(){
        try {
            const foundUser = await User.findOne({where: {username: newUser.username}})
            if(!foundUser){
                User.create({
                    username: newUser.username,
                    password: newUser.password,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName, 
                    email: newUser.email, 
                    interests: 'none'
                });
                res.status(200).send('Request successful.')
            }else{
                res.status(409).send('Request unsuccessful.')
            }
        } catch (error) {
            if(error){
                res.status(409).send('Request failed with status code 409')
            }
        }
    }
    createUser();
});

app.post('/create-post', (req,res)=> {
    const addPost = req.body;
    async function createPost() {
        try {
            const findUser = await User.findOne({where: {username: addPost.username}});
            if(findUser){
                const create = await 
                Posts.create({
                    content: addPost.content,
                    likes: '0',
                    username: addPost.username
                });
                const setKey = await findUser.addPost(create);
                if(setKey){
                    res.status(200).send('Success.')
                }
            }
        } catch (err) {
            res.status(409).send(err);
        }
    }
})

app.get('/user/:username', (req, res) => {
    const username = req.params['username'];
    async function getUser() {
        try{
            const findUser = await User.findOne({where: {username: username}})
            if(findUser){
                res.status(200).send(findUser)
            }
        } catch (err) {
            if(err){
                res.status(409).send('Request failed with status code 409.')
            }
        }
    }
    getUser();
});