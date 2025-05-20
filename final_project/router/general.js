const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Check if both username and password are provided
  if (username && password) {
    // Check if the user does not already exist
    if (isValid(username)) {
      // Add the new user to the users array
      users.push({ "username": username, "password": password });
      return res.status(200).json({ message: "User successfully registered. Now you can login" });
    } else {
      return res.status(409).json({ message: "User already exists!" });
    }
  }
  // Return error if username or password is missing
  return res.status(404).json({ message: "Error: Username or password not provided." });
});

// function that returns a promise to retrieve all books, 
function getBooks() {
  return new Promise((resolve, reject) => {
    //Simulating the access time to a real database with a timer
    setTimeout(() => {
      if (books) {
        resolve(books);
      } else {
        reject(new Error('Books not found'));
      }
    }, 300);
  });
}

// Get the book list available in the shop with a promise callback
public_users.get('/', function (req, res) {
  getBooks()
    .then(booksProm => { res.send(JSON.stringify(booksProm, null, 4)); })
    .catch(error => {
      console.error('Error fetching books:', error.message);
      if (error.message === 'Books not found') {
        res.status(404).send(error.message);
      } else {
        res.status(500).json({ error: 'Failed to fetch books' });
      }
    });
});

async function getBookByISBN(isbn) {
  const book = books[isbn];
  return book;
}
// Get book details based on ISBN with async - await
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const isbn = req.params.isbn;
    const book = await getBookByISBN(isbn);
    if (book) {
      return res.json(book);
    } else {
      return res.status(404).send(`Book not found by the provided ${isbn}`);
    }
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

// Get book details based on author with async - await and an anonymous function in the await
public_users.get('/author/:author', async function (req, res) {
  try {
    const author = req.params.author;
    const booksOfAuthor = await (async (authorStr) => 
      { return Object.entries(books).filter(([key, book]) => { return book.author.includes(authorStr) }) 
      })(author);
    if (booksOfAuthor.length > 0) {
      res.send(Object.fromEntries(booksOfAuthor));
    } else {
      res.status(404).send(`The provided author ${author} is not found between author names`);
    }
  } catch (error) {
    res.status(500).send('Failed to get books by author');
  }
});

// Get all books based on title with async - await and an anonymous function in the await
public_users.get('/title/:title', async function (req, res) {
  try {
    const title = req.params.title;
    const booksOfTitle = await (async (titleStr) => { 
      return Object.entries(books).filter(([key, book]) => { 
        return book.title.includes(titleStr) 
      }) 
    })(title);
    if (booksOfTitle.length > 0) {
      res.send(Object.fromEntries(booksOfTitle));
    } else {
      res.status(404).send(`The provided title ${title} is not found between book titles.`);
    }
  } catch (error) {
    res.status(500).send('Failed to get books by title');
  }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  //Write your code here
  return res.send(books[req.params.isbn]['reviews']);
});

module.exports.general = public_users;
