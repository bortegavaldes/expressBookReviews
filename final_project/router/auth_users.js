const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

//check if the user is valid, it is valid if not exists
const isValid = (username)=>{ //returns boolean
  return !users.some(user => user.username === username);
}

const authenticatedUser = (username,password)=>{ //returns boolean
  return users.some( user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (username && password){
    if (authenticatedUser(username,password)){
      let accessToken = jwt.sign({
        data: password
      }, 'access', { expiresIn: 60*15 });
      req.session.authorization = { accessToken, username}
      return res.status(200).send(`User ${username} successfully logged in`);
    }else{
      return res.status(401).json({ message: "Invalid credentials. Check username and password" });
    }
  }else{
    return res.status(400).json({message: "Error logging in: empty user or password"});
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const curUser = req.session?.authorization['username'];
  if (curUser){
    const curBook = books[req.params.isbn];
    if (curBook){
      const comment = req.body.comment;
      const grade = req.body.grade;
      if (comment && grade){
        const isUpt = curBook.reviews.hasOwnProperty(curUser);
        curBook.reviews[curUser] = { "comment":comment, "grade": grade};
        return res.send(`Review ${isUpt?"updated":"added"} for the book of isbn ${req.params.isbn}.`);
      }else{
        return res.status(400).json({message: "Error, comment or grade for the review are missed"});
      }
    }else{
      return res.status(404).json({message: `Error book with the isbn ${req.params.isbn} not found`});
    }
  }else{
    return res.status(400).json({message: "Not user logged in"});
  }
});

//delete a review of the current user in the specified isbn
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const curUser = req.session?.authorization['username'];
  if (curUser){
    const curBook = books[req.params.isbn];
    if (curBook){
      if (curBook.reviews.hasOwnProperty(curUser)){
        delete curBook.reviews[curUser];
        return res.send("The review has been deleted for the current user in the specified isbn.")
      }else{
        return res.status(400).json({message: `Error, the current user doesn't have review for the book isbn ${req.params.isbn}.`});
      }
    }else{
      return res.status(404).json({message: `Error book with the isbn ${req.params.isbn} not found`});
    }
  }else{
    return res.status(400).json({message: "Not user logged in"});
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
