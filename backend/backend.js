const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Sequelize, DataTypes } = require('sequelize');
const port = 7000
const sequelizeServer = new Sequelize('postgres://amirhali:satele@localhost:6000/amirhali', {
    define: {
        schema: 'capstone_backend'
    }
});

app.use(express.json())
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
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
sequelizeServer.createSchema('capstone_backend')


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
    }
});

//ENDPOINTS VVV