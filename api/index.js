/**
 * @fileoverview Final, production-ready microservice for the candidate challenge.
 * This version includes the corrected logic for handling non-existent books.
 */
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const methodNotAllowed = (req, res) => {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
};

// --- Route: Health Check ---
app.route('/health')
    .get((req, res) => res.status(200).json({ status: 'ok' }))
    .all(methodNotAllowed); 
    
// --- Route: Book Information ---
app.route('/book-info')
    .get(async (req, res) => {
        const { isbn } = req.query;

        if (!isbn || !/^[0-9X]{10,13}$/i.test(isbn)) {
            return res.status(400).json({ error: "Malformed or missing ISBN" });
        }

        const apiUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;

        try {
            const apiResponse = await fetch(apiUrl);
            if (!apiResponse.ok) {
                throw new Error(`Open Library API returned status ${apiResponse.status}`);
            }
            
            const data = await apiResponse.json();
            const bookKey = `ISBN:${isbn}`;
            const bookData = data[bookKey];

            // **FIXED**: This is the corrected, robust check.
            if (!data || Object.keys(data).length === 0 || !bookData || !bookData.title) {
                return res.status(404).json({ error: "Book not found" });
            }

            const transformedData = {
                title: bookData.title,
                author: bookData.authors ? bookData.authors[0].name : "Unknown",
                pages: bookData.number_of_pages || 0,
                publish_date: bookData.publish_date || "Unknown"
            };
            return res.status(200).json(transformedData);

        } catch (error) {
            console.error(`Server error for ISBN ${isbn}:`, error.message);
            return res.status(502).json({ error: "Failed to fetch data from Open Library API" });
        }
    })
    .all(methodNotAllowed);

module.exports = app;

