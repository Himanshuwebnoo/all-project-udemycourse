const express = require('express');
const bcrypt = require('bcryptjs');
const csurf = require('csurf'); // Import csurf


const db = require('../data/database');

const router = express.Router();
const csrfProtection = csurf(); // Initialize csrfProtection

router.get('/', function (req, res) {
  res.render('welcome');
});

router.get('/signup', function (req, res) {
  res.render('signup', { csrfToken: req.csrfToken() });  // Added: CSRF token
});

router.get('/login', function (req, res) {
  res.render('login');
});

router.post('/signup', csrfProtection, async function (req, res) {
    // Validate CSRF token
  if (!req.session || !req.session.csrfSecret || !req.body._csrf || req.body._csrf !== req.session.csrfSecret) {
    console.log('Invalid CSRF token');
    return res.status(403).redirect('/signup');
  }

   const userData = req.body;
   const enteredEmail = userData.email;
   const enteredConfirmEmail = userData['confirm-email'];
   const enteredPassword = userData.password;

   if (
    !enteredEmail || 
    !enteredConfirmEmail || 
    !enteredPassword || 
    enteredPassword.trim() < 6 || 
    enteredEmail !== enteredConfirmEmail || 
    !enteredEmail.includes('@')
    ) {
      console.log('Incorrect Data');
      return res.redirect('/signup');
    }

    const existingUser = await db.getDb().collection('users').findOne({email: enteredEmail});

    if (existingUser) {
      console.log('User Exists Already');
      return res.redirect('/signup');
    }
   
   const hashedPassword = await bcrypt.hash(enteredPassword, 12);

   const user = {
    email: enteredEmail,
    password: hashedPassword
   }
   await db.getDb().collection('users').insertOne(user);
   res.redirect('/login');
});

router.post('/login', async function (req, res) {

  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredPassword = userData.password;

  const existingUser = await db.getDb().collection('users').findOne({ email: enteredEmail});
   if (!existingUser){
    console.log('Could not Login');
    return res.redirect('/login');
   }
 const passwordsAreEqual = await bcrypt.compare(enteredPassword, existingUser.password);
   if (!passwordsAreEqual){
    console.log('Could Not Login-Password not equal');
    return res.redirect('/login');
   }

   req.session.user = { id: existingUser._id, email: existingUser.email };
   req.session.isAuthenticated = true;
   req.session.save(function(){
    res.redirect('/admin');        
   }); 
});

router.get('/admin', function (req, res) {
  if (!req.session.isAuthenticated) {
    return res.status(401).render('401');
  }
  res.render('admin');
});

router.post('/logout', function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect('/');
});

module.exports = router;
