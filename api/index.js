/**
 * @fileoverview Final production-ready microservice for the Pokémon API challenge.
 * This version includes strict input validation to handle all malformed input tests.
 */
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Middleware to handle any HTTP method that is not explicitly allowed on a route.
const methodNotAllowed = (req, res) => {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
};

// --- Route: Health Check ---
app.route('/health')
    .get((req, res) => res.status(200).json({ status: 'ok' }))
    .all(methodNotAllowed); 
    
// --- Route: Pokémon Information ---
app.route('/pokemon-info')
    .get(async (req, res) => {
        const { name } = req.query;

        // **FIXED**: Updated the regex to allow numbers in the name (e.g., for "testing123").
        const validNameRegex = /^[a-z0-9-]+$/;
        if (!name || typeof name !== 'string' || !validNameRegex.test(name)) {
            return res.status(400).json({ error: "Malformed or missing name" });
        }

        const apiUrl = `https://pokeapi.co/api/v2/pokemon/${name}`;

        try {
            const apiResponse = await fetch(apiUrl);
            
            if (!apiResponse.ok) {
                if (apiResponse.status === 404) {
                    return res.status(404).json({ error: "Pokemon not found" });
                }
                throw new Error(`PokéAPI returned status ${apiResponse.status}`);
            }
            
            const data = await apiResponse.json();

            const transformedData = {
                name: data.name,
                type: data.types[0]?.type?.name || "unknown",
                height: data.height,
                weight: data.weight,
                first_ability: data.abilities[0]?.ability?.name || "unknown",
            };
            
            return res.status(200).json(transformedData);

        } catch (error) {
            console.error(`Server error for Pokémon ${name}:`, error.message);
            return res.status(502).json({ error: "Failed to fetch data from PokéAPI" });
        }
    })
    .all(methodNotAllowed);

// Export the Express app object for Vercel's serverless environment.
module.exports = app;

