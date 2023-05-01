const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io')
const app = express();
const server = http.createServer(app);
const { Sequelize, DataTypes } = require('sequelize');
const port = 7000
const sequelizeServer = new Sequelize('postgres://postgres:satele99@localhost:5432/postgres', {
    define: {
        schema: 'capstone_backend'
    }
}); 
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000'
    }
})

io.on('connection', socket => {
    console.log(socket.id + ' ==== connected')

    socket.on('send-notif', (data)=> {
        console.log(socket.id + ' sent notif')
        socket.broadcast.emit('recieve-notif', data) 
    })
    socket.on('join', (data) => {
        socket.join(data.user)
        console.log(socket.id+' joined '+data.user+' room')
        io.sockets.in(data.user).emit('new_msg', ) 
    })
    socket.on('send-message', data => {
        socket.to(data.room).emit('recieve-message', data)
    })

    socket.on('disconnect', () => {
        console.log(socket.id + ' ==== disconnected');
        socket.removeAllListeners();
    })
})





app.use(express.json())
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
server.listen(port, '127.0.0.1', ()=>{
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
        type: DataTypes.TEXT,
        field: 'post_content'
    },
    likes: {
        type: DataTypes.INTEGER,
        field: 'post_likes'
    },
    username:{
        type: DataTypes.STRING,
        field: 'username'
    },
    date:{
        type: DataTypes.STRING,
        field: 'date_time'
    }, 
    uuid: {
        type: DataTypes.STRING,
        field: 'unique_identifier'
    }
});

const Comments = sequelizeServer.define('comments', {
    comment: {
        type: DataTypes.STRING,
        field: 'comment'
    }
    
});

const Message = sequelizeServer.define('message', {
    subject: {
        type: DataTypes.STRING,
        field: 'subject'
    },
    messageBody: {
        type: DataTypes.TEXT,
        field: 'message_body'
    }
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

app.post('/create-post', async (req,res)=> {
    const addPost = req.body;
    
    try {
        const findUser = await User.findOne({where: {username: addPost.username}});
        console.log(req.files, req.body)
        if(findUser){
            const create = await 
            Posts.create({
                content: addPost.content,
                likes: addPost.likes,
                date: addPost.date,
                username: addPost.username,
                uuid: addPost.uuid
            });
            const setKey = await findUser.addPost(create);
            if(setKey){
                res.status(200).send('Success.')
            }
        }
    } catch (err) {
        console.log(err) 
        res.status(409).send(err);
    }
    
})

// get method
app.get('/user/:username/:password', (req, res) => {
    const username = req.params['username'];
    const password = req.params['password'];
    console.log(username, password)
    async function getUser() {
        try{
            console.log('in function')
            const findUser = await User.findOne({where: {username: username, password: password}})
            if(findUser){
                console.log('found')
                res.status(200).send(findUser)
            }else {
                res.status(409).send(null)
            }
        } catch (err) {
            if(err){
                console.log('not found')
                res.status(409).send('Request failed with status code 409.')
            }
        }
    }
    getUser();
});
app.get('/get-user-post/:userId', async (req, res) => {
    try {
        const userId = req.params['userId']
        const findUser = await User.findOne({where:{id: userId}})
        if(findUser){
            const findPosts = await Posts.findAll({where: {userId: findUser.id}})
            if(findPosts){
                res.status(200).send(findPosts)
            }
        }
    } catch (err) {
        res.status(409).send('failed')
    }
})

app.get('/all-users', async (req, res) => {
    try {
        const getAllUsers = await User.findAll()
        if(getAllUsers){
            res.status(200).send(getAllUsers)
        }
    } catch (err) {
        console.log(err)
    }
})

app.get('/post/:uuid', (req, res) => {
    const uuid = req.params['uuid']
    async function getPost() {
        try{
            const findPost = await Posts.findOne({where: {uuid: uuid}})
            if(findPost){
                res.status(200).send(findPost)
            }
        } catch (err) {
            res.status(404).send('Request failed.')
        }
    } 
    getPost();
});
app.get('/all-posts', async (req, res) => {
    try {
        const grabAllPosts = await Posts.findAll()
        if(grabAllPosts){
            res.status(200).send(grabAllPosts)
        }
    } catch (err) {
        console.log(err)
    }
})
// delete method 

app.delete('/delete/:user', async (req, res) => {
    const user = req.params['user'];
    try {
        const findUser = await User.findOne({where: {username: user}})
        if(findUser){
            const destroyUser = await User.destroy({where: {username: findUser.username}})
            if(destroyUser != null){
                res.status(200).send('Success.')
            }
        }
    } catch (err) {
        console.log(err)
        res.status(409).send(err)
    }

}) 

app.delete('/delete-post/:uuid', async (req, res) => {
    const uuid = req.params['uuid']
    try {
        const findPost = await Posts.findOne({where: {uuid: uuid}})
        if(findPost){
            const destroyPost = await Posts.destroy({where: {uuid: findPost.uuid}})
            if(destroyPost != null){
                res.status(200).send('Success.')
            }
        }
    } catch (err) {
        console.log(err)
        res.status(409).send(err)
    }
})
// put method 
app.put('/update-password/:user/:newPassword', async (req, res) => {
    try {
        const user = req.params['user']
        const newPassword = req.params['newPassword']
        const findUser = await User.findOne({where: {username: user}})
        if(findUser){
            const updatePassword = await User.update({password: newPassword}, {where: {username: findUser.username}})
            res.status(200).send('password updated')
        }
    } catch (err) {
        res.status(409).send(err)
    }
})

app.put('/update-interest/:userID/:interest', async (req, res) => {
    try {
        const userId = req.params['userID']
        const updatedInterest = req.params['interest']
        const findUser = await User.findOne({where: {id : userId}})
        if(findUser){
            const updateInterest = await User.update({interests: updatedInterest}, {where: {id: findUser.id}})
            res.status(200).send('Success.')
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

app.put('/update-likes/:uuid', async (req, res) => {
    try {
        const uuid = req.params['uuid']
        const findPost = await Posts.findOne({where: { uuid: uuid}})
        if(findPost){
            const addLike = await Posts.increment('likes', {by: 1, where: {uuid: findPost.uuid}})
            res.status(200).send('Success.')
        }
    } catch (err) { 
        console.log(err)
    }
})

app.put('/decrement-likes/:uuid', async (req, res) => {
    try {
        const uuid = req.params['uuid']
        const findPost = await Posts.findOne({where:{ uuid: uuid}})
        if(findPost){
            const removeLike = await Posts.decrement('likes', {by: 1, where: {uuid: findPost.uuid}}) 
            res.status(200).send('Success.')
        }
    } catch (err) {
        console.log(err)
    }
})