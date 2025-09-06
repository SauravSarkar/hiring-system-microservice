/**
 * @fileoverview A robust, Vercel-ready microservice for the Pokémon API challenge.
 * This version correctly fetches, transforms, and serves Pokémon data according
 * to the new challenge specifications.
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

        // Handles malformed or missing name parameter, as per the test suite.
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: "Malformed or missing name" });
        }

        const apiUrl = `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`;

        try {
            const apiResponse = await fetch(apiUrl);
            
            // The PokéAPI correctly returns a 404 status for non-existent Pokémon.
            if (!apiResponse.ok) {
                if (apiResponse.status === 404) {
                    return res.status(404).json({ error: "Pokemon not found" });
                }
                // For other upstream errors (e.g., 5xx from PokéAPI).
                throw new Error(`PokéAPI returned status ${apiResponse.status}`);
            }
            
            const data = await apiResponse.json();

            // Transforms the complex API data into the simple format required by the challenge.
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
            // Returns a generic server error if the fetch operation fails.
            return res.status(502).json({ error: "Failed to fetch data from PokéAPI" });
        }
    })
    .all(methodNotAllowed);

// Export the Express app object for Vercel's serverless environment.
module.exports = app;

