//importing required modules
import express from 'express';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import fs from 'fs';
import cors from 'cors';
import { collection } from './connectAtlas.js';
import multer from 'multer';
import bcrypt from 'bcrypt';
import connectDB from './connectAtlas.js';

//setting up the port and express app.
const port=process.env.PORT||3000;
const app=express();

//setting up multer for uploading files.
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
    }),
}).single('picture');

//Middleware 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');


//CORS Options
const corsOps={
    origin:'*',
    methods:['GET', 'POST', 'OPTIONS'],
    allowHeaders:['Content-Type', 'Authorization'],
    credential:true,
};

app.use(cors(corsOps));

//session management. Needs to be fixed, for future reference.
app.use(
    expressSession({
        secret: 'cst2120 secret',
        cookie: { maxAge: 600000 },
        resave: false,
        saveUninitialized: true,
    })
);

//Middleware to check if the user is logged in, ie, a member.
const isMember = (req, res, next) => {
    if (req.session && req.session.username) {
        next();
    } 
        res.status(401).json({ error: 'Please login' });
    
};


if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

const storage=multer.diskStorage({
    destination:(req, file, cb)=> cb(null, 'uploads'),

    filename:(req, file, cb)=> cb(null, Date.now() + '-' + file.originalname),
});

//handles file uploads.
app.post('/uploadPicture', upload, (req, res) => {
    if (req.file) {
        console.log('File uploaded:', req.file);
        res.send('Picture uploaded successfully!');
    } else {
        res.status(400).send('No file uploaded');
    }
});

//serves upload page.
 app.use(express.static('uploads'));
 app.get('/uploadPicture', (req, res) => {
    res.sendFile(__dirname + 'C:\Users\rajav\OneDrive\Desktop\CW2_WADB\index.html');
});


//route for registering
app.post('/M00979606/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        console.log("Registration attempt:", {username});
        const existingUser = await collection.findOne({username});
        
        if (existingUser) {
            console.log("User already exists: ", username);
            return res.json({ registration: false, message: 'Username already exists' });
        }
        
        //encrypts passwords for security purpose
        const hashPassword= await bcrypt.hash(password,10);
        const result = await collection.insertOne({username, password:hashPassword, following:[]});
        console.log("User registered successfully:", result);
        res.json({registration:true, username});
    }
    catch (error){
        console.log('Registration error:', error);
        res.status(500).json({registration:false, message:'Registration failed', errorDetails:error.message});
    }
});


//route for logging in
app.post('/M00979606/login', async(req, res)=>{
    const{username, password}=req.body;
    try{
        const user=await collection.findOne({username});
        if(!user){
            return res.json({login:false, message:'Incorrect username or password.'});
        }

        const isPasswordSame= await bcrypt.compare(password, user.password);
        if(!isPasswordSame){
            return res.json({login:false, message:'Incorrect username or password!'})
        }

        req.session.username=user.username;
        res.json({login:true, username:user.name});
    }
    catch (error){
        console.error('Login error: ', error);
        res.status(500).json({login:false, message:'Unexpected error'});
    }
});

//was supposed to fetch user content, needs to be fixed- for future reference.
app.get('/M00979606/contents', async (req, res) => {
    try {
        const username = req.session.username;
        const user = await collection.findOne({ username });
        if (!user || !Array.isArray(user.following)) {
            return res.json([]);
        }

        const posts = await collection.find({ username: { $in: user.following } }).toArray();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching contents:', error);
        res.status(500).json({ error: 'Failed to fetch contents' });
    }
});


//checks the user's login status.
fetch('http://localhost:8080/checklogin', {
    method: 'GET',
    credentials: 'include',
})
    .then((response) => response.json())
    .then((data) => {
        if (data.login) {
            console.log(`User logged in as: ${data.username}`);
        } else {
            console.log('User not logged in');
        }
    })
    .catch((error) => console.error('Error:', error));
    
//get login status route
app.get('/checklogin', async (req, res) => {
    if (req.session.username) {
        res.json({ login: true, username: req.session.username });
    } else {
        res.json({ login: false });
    }
});

//was supposed to search for users- needs to be fixed 
app.get('/M00979606/users/search', async (req, res) => {
    const query = req.query.q;
    try {
        const users = await collection.find({ name: { $regex: query, $options: 'i' } }).toArray();
        res.json(users);
    } catch (error) {
        console.log('Search error- ', error);
        res.status(500).json({ error: 'We could not go through with the search :(' });
    }
});


//logout route
app.get('/M00979606/logout', async (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.json({ error: err });
        res.json({ login: false });
    });
});

//serving files from M00979606 path
app.use('/M00979606', express.static(__dirname));

//handles file upload
app.post('/uploadPicture', isMember, async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ upload: false, error: 'No file uploaded' });
    }
    const myFile = req.files.myFile;
    const uploadPath = path.join(uploadDir, myFile.name);
    myFile.mv(uploadPath, (err) => {
        if (err) {
            console.error('Error moving file:', err);
            return res.status(500).json({ upload: false, error: err.message });
        }
        
        res.json(`{ upload: true, filename: myFile.name, fileUrl: /uploads/${myFile.name} }`);
    });
});

//profile route for logged in users- not functioning, needs to be fixed.
app.get('/profile', isMember, async (req, res) => {
    res.json(`{ message: Welcome to your profile, ${req.session.username}! }`);
});

//404 error handling
app.use((req, res) => {
    res.status(404).send('Page not found');
});

//client-side fetching for login
fetch('http://localhost:8080/M00979606/login',{
    method:'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'username', password: 'password' }),
    credentials: 'include'
})
.then((response) => response.json())
    .then((data) => {
        console.log(data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });

//route for creating posts
app.post('/posts', async(req,res)=>{
    const {collection}=await connectDB();
    const newPost={postId: req.body.postId, content: req.body.content, likes:0, comments:[]};
    const result=await collection.insertOne(newPost);
    res.status(201).send({success:true, id:result.insertedID});
});


//route for liking posts
app.post('/posts/:id/like', async(req, res)=>{
    const {collection} = connectDB();
    const postId=req.params.id;
    const result=await collection.updateOne({postId}, {$inc: {likes: 1}});
    res.send({success:result.modifiedCount>0});
});

//route for commenting on post
app.post('/posts/:id/comment', async (req, res) => {
    const { collection } = await connectDB();
    const { username, text } = req.body;
    const result = await collection.updateOne(
        { postId: req.params.id },
        { $push: { comments: { username, text } } }
    );
    res.send({ success: result.modifiedCount > 0 });
});

//loads posts
async function loadPosts() {
    try {
        const response = await fetch('http://localhost:8080/posts'); // Ensure full URL is used
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        const posts = await response.json();
        console.log(posts); // Or handle posts as needed
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}


loadPosts();

//adds comments through client
async function addComment(postId) {
    const commentInput = document.getElementById(`comment-${postId}`);
    const text = commentInput.value;

    if (text.trim()) {
        await fetch(`/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'currentUser', text })
        });
        commentInput.value = '';
        loadPosts(); 
    }
}

//route to search users
app.post('/search-users', async (req, res) => {
    const { searchQuery } = req.body;

    try {
        const users = await usersCollection.find({ name: { $regex: searchQuery, $options: 'i' } }).toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

//starts the server
app.listen(8080, () => console.log('Server listening on port 8080'));