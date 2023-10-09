const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer'); // Import the multer library
const path = require('path')

// Data structures
const users = [];
const blogPosts = [];
app.use(express.static(path.join(__dirname, 'public')));


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
  })
);

// Serve uploaded images as static files
app.use('/images', express.static(__dirname + '/public/images'));
app.use(express.static(path.join(__dirname, 'public')));

// Create a storage engine for uploaded images
const storage = multer.diskStorage({
  destination: './public/images', 
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); 
  }
});

const upload = multer({ storage: storage });

// Views setup (you should have EJS or another template engine installed)
app.set('view engine', 'ejs');
app.set('views', 'views');

// User registration route
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { username, password: hashedPassword };
  users.push(user);
  res.redirect('/login');
});

// User login route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);

  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.user = user;
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// Dashboard route (protected)
app.get('/dashboard', (req, res) => {
  if (req.session.user) {
    res.render('dashboard', { user: req.session.user, blogPosts });
  } else {
    res.redirect('/login');
  }
});

// Blog post routes (CRUD)
app.post('/add-post', upload.single('image'), (req, res) => {
  const { title, content } = req.body;
  const image = req.file ? '/images/' + req.file.filename : ''; // Save the image file path
  console.log(image)
  const newPost = { title, content, image };
  console.log(newPost)
  blogPosts.push(newPost);
  res.redirect('/dashboard');
});

app.get('/edit-post/:id', (req, res) => {
  const postId = req.params.id;
  const post = blogPosts.find((p) => p.id === postId);
  res.render('edit-post', { post });
});

app.post('/edit-post/:id', (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;
  const post = blogPosts.find((p) => p.id === postId);
  post.title = title;
  post.content = content;
  res.redirect('/dashboard');
});

app.delete('/delete-post/:id', (req, res) => {
  const postId = req.params.id;
  const index = blogPosts.findIndex((p) => p.id === postId);
  if (index !== -1) {
    blogPosts.splice(index, 1);
  }
  res.redirect('/dashboard');
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/register');
});


// Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
