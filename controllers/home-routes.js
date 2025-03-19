const router = require("express").Router();
const { Items, Savings, User, RecentPurchases, RecentCategories, ItemsCategories } = require("../models");
const bcrypt = require("bcrypt");
const e = require("express");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');


require('dotenv').config();
const encryption_key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const algorithm = 'aes-256-cbc';

function hashEmail(email) {
    return crypto.createHash('sha256').update(email).digest('hex');
}

const key = "secretkey";

// Function to encrypt data
function encryptData(data) {
    const iv = crypto.randomBytes(16); // Generate a 16-byte IV
    const cipher = crypto.createCipheriv(algorithm, encryption_key, iv);
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // Format: iv:encryptedData
}

// Function to decrypt data
function decryptData(encryptedData) {
    // Check if the data contains a colon, indicating the iv:encrypted format
    if (!encryptedData.includes(':')) {
        console.error('Invalid format for encrypted data:', encryptedData);
        throw new Error('Invalid format for encrypted data');
    }

    // Split the data into IV and the encrypted part
    const [ivHex, encrypted] = encryptedData.split(':');

    // Ensure the IV part is valid
    if (!ivHex || ivHex.length !== 32) { // 32 hex characters = 16 bytes
        console.error('Invalid IV part:', ivHex);
        throw new Error('Invalid initialization vector');
    }

    // Convert the IV from hex to a Buffer
    const iv = Buffer.from(ivHex, 'hex');

    // Validate the IV length
    if (iv.length !== 16) {
        console.error('IV length is invalid:', iv.length);
        throw new Error('Invalid initialization vector: Must be 16 bytes.');
    }

    // Create the decipher and decrypt
    const decipher = crypto.createDecipheriv(algorithm, encryption_key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

// router.post("/login", async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Retrieve all users from the database
//         const users = await User.findAll();

//         // Add debug log to ensure users are being fetched
//         console.log('Fetched users:', users.map(user => user.id));

//         // Find the user by decrypting their stored email and comparing it to the input email
//         const user = users.find((user) => {
//             try {
//                 const decryptedEmail = decryptData(user.email);
//                 console.log(`Decrypted email for user ID ${user.id}:`, decryptedEmail); // Debug log

//                 // Trim and compare to avoid whitespace issues
//                 return decryptedEmail.trim() === email.trim();
//             } catch (decryptionError) {
//                 console.error(`Error decrypting email for user ID ${user.id}:`, decryptionError.message);
//                 return false; // Skip this user if decryption fails
//             }
//         });

//         if (!user) {
//             console.error("User not found for provided email:", email);
//             return res.status(401).json({ code: 'USER_NOT_FOUND', message: "Invalid email or password." });
//         }

//         // Log the stored hashed password for debugging
//         console.log("Stored hashed password for user ID:", user.id, user.password);

//         // Compare the entered password with the stored hashed password
//         const passwordMatch = await bcrypt.compare(password, user.password);
//         if (!passwordMatch) {
//             console.error("Password comparison failed for input password:", password);
//             return res.status(401).json({ code: 'PASSWORD_MISMATCH', message: "Invalid email or password." });
//         }

//         // Generate and send the token if passwords match
//         return res.json({
//             code: 'LOGIN_SUCCESS',
//             message: "Login successful!",
//             userId: user.id,
//             token: generateAuthToken(user)
//         });
//     } catch (error) {
//         console.error("Error during login:", error);
//         return res.status(500).json({ message: "An error occurred while logging in.", error: error.message });
//     }
// });


router.get("/users", async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Retrieve all users from the database
        const users = await User.findAll();

        // Add debug log to ensure users are being fetched
        console.log('Fetched users:', users.map(user => user.id));

        // Find the user by decrypting their stored email and comparing it to the input email
        const user = users.find((user) => {
            try {
                const decryptedEmail = decryptData(user.email);
                console.log(`Decrypted email for user ID ${user.id}:`, decryptedEmail); // Debug log

                // Trim and compare to avoid whitespace issues
                return decryptedEmail.trim() === email.trim();
            } catch (decryptionError) {
                console.error(`Error decrypting email for user ID ${user.id}:`, decryptionError.message);
                return false; // Skip this user if decryption fails
            }
        });

        if (!user) {
            console.error("User not found for provided email:", email);
            return res.status(401).json({ code: 'USER_NOT_FOUND', message: "Invalid email or password." });
        }

        // Log the stored hashed password for debugging
        console.log("Stored hashed password for user ID:", user.id, user.password);

        // Compare the entered password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.error("Password comparison failed for input password:", password);
            return res.status(401).json({ code: 'PASSWORD_MISMATCH', message: "Invalid email or password." });
        }

        // Generate and send the token if passwords match
        return res.json({
            code: 'LOGIN_SUCCESS',
            message: "Login successful!",
            userId: user.id,
            // token: generateAuthToken(user)
        });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "An error occurred while logging in.", error: error.message });
    }
});

router.post("/signup", async (req, res) => {
    try {
        const { email, password, first_name, last_name, dob, employment } = req.body;
        const saltRounds = 10; // Number of salt rounds for bcrypt

        // Validate the email format before encrypting
        if (!/.+@.+\..+/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format.' });
        }

        // Encrypt sensitive data
        const encryptedEmail = encryptData(email);
        const encryptedFirstName = encryptData(first_name);
        const encryptedLastName = encryptData(last_name);
        const encryptedDob = encryptData(dob);
        const encryptedEmployment = encryptData(employment);

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user with encrypted data
        const userData = await User.create({
            first_name: encryptedFirstName,
            last_name: encryptedLastName,
            email: encryptedEmail, // Store the encrypted email
            password: hashedPassword,
            dob: encryptedDob,
            employment: encryptedEmployment
        });

        // Generate an authentication token
        const token = generateAuthToken(userData);

        res.status(201).json({
            token,
            user: {
                id: userData.id,
                email: userData.email,
                first_name: userData.first_name,
                last_name: userData.last_name,
                dob: userData.dob,
                employment: userData.employment
            }
        });

    } catch (err) {
        console.error('Error in signup route:', err);
        res.status(400).json({ message: err.message, details: err });
    }
});

router.post('/add-item', (req, res) => {
    console.log('Incoming request body:', req.body); // Log the entire request body

    const newItem = {
        user_id: req.body.user_id,
        category: req.body.category,
        category_name: req.body.category_name,
        price: req.body.price, // Pass the raw price without encryption
    };

    console.log('Description:', req.body.description);
    console.log('Amount:', req.body.amount);

    Items.create(newItem)
        .then(() => res.status(200).json({ message: 'Item received and stored securely' }))
        .catch(err => {
            console.error('Error storing item:', err);
            res.status(500).json({ message: 'Error storing item', error: err });
        });
});

router.get('/items', async (req, res) => {
    try {
        // Fetch all items from the database
        const items = await Items.findAll();
        res.json(items);
    } catch (err) {
        // If an error occurs, send a 500 server error response
        res.status(500).json({ message: "Error fetching items", error: err });
    }
});

// ! Getting all of the users items by user id
router.get("/items/user/:id", async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);

        const items = await Items.findAll({
            where: {
                user_id: userId
            }
        });

        // Decrypt data for each item before sending it to the client
        const decryptedItems = items.map(item => ({
            ...item.dataValues,
            description: item.description ? decryptData(item.description) : item.description,
            amount: item.amount ? parseFloat(decryptData(item.amount)) : item.amount
        }));

        res.json(decryptedItems);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

router.post('/set-income/:user_id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.user_id);
        console.log('User:', user);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Income from request body:", req.body.float_income);
        user.income = parseFloat(req.body.float_income);
        console.log('Income after assignment:', user.income);

        await user.save();
        console.log('Saved income:', user.income);
        res.json({ message: "Income updated", income: user.income });
    } catch (err) {
        console.error('Error during request:', err);
        res.status(500).json({ message: "Internal server error", error: err });
    }
});

router.get('/user-income/:user_id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.user_id);
        res.json({ income: user.income });
    } catch (err) {
        res.status(500).json(err);
    }
});

router.delete('/delete-item/:itemId', async (req, res) => {
    try {
        const itemId = req.params.itemId;
        // Add additional checks here if needed (e.g., ensure the user is authorized to delete this item)

        await Items.destroy({ where: { id: itemId } });
        res.status(200).json({ message: 'Item successfully deleted' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/purchases/:id', async (req, res) => {
    try {
        const { purchase, category, price } = req.body;
        const user_id = req.params.id;
        const newPurchase = {
            purchase,
            category,
            price,
            user_id
        }
        console.log('Adding purchase:', newPurchase);
        RecentPurchases.create(newPurchase);
        res.status(201).json(newPurchase);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/purchases', async (req, res) => {
    try {
        const purchases = await RecentPurchases.findAll();
        res.json(purchases);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/purchases/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Assuming you have a Purchase model which can fetch purchases by user ID
        const userPurchases = await RecentPurchases.findAll({
            where: { user_id: userId }
        });
        console.log('User purchases:', userPurchases);
        res.json(userPurchases);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to clear out all recent purchases for a specific user
router.delete('/purchases/clear/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Delete all recent purchases associated with the user
        await RecentPurchases.destroy({
            where: { user_id: userId }
        });

        res.status(200).json({ message: 'Recent purchases cleared' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/categories/:id', async (req, res) => {
    try {
        const { category, cat_budget } = req.body;
        const user_id = req.params.id;
        const userID = parseInt(user_id);
        const addedCategory = {
            category,
            cat_budget,
            user_id: userID
        }

        console.log('Adding category:', addedCategory);
        RecentCategories.create(addedCategory);
        res.status(201).json(addedCategory);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const categories = await RecentCategories.findAll();
        res.json(categories);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/categories/:id', async (req, res) => {
    try {
        const user_id = req.params.id;
        const categories = await RecentCategories.findAll({
            where: {
                user_id: user_id
            }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { category, cat_budget } = req.body;

        // Find the category by ID and update it
        const updatedCategory = await RecentCategories.update(
            { category, cat_budget },
            { where: { id: categoryId } }
        );

        if (updatedCategory) {
            res.json({ message: 'Category updated successfully' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/new-item-category', async (req, res) => {
    try {
        const { category_name, user_id } = req.body;
        console.log('New category:', category_name);
        const newCategory = await ItemsCategories.create({ category_name, user_id });
        res.json(newCategory);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/new-item-categories', async (req, res) => {
    try {
        const categories = await ItemsCategories.findAll();
        res.json(categories);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/new-item-categories/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const categories = await ItemsCategories.findAll({
            where: { user_id: userId }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ! Update item
router.put("/update-item/:itemId", async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const { category, category_name, price } = req.body; // Assuming these are the fields you want to update

        const item = await Items.findByPk(itemId);
        console.log('category name:', category_name);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // Update the item
        item.category = category;
        item.category_name = category_name;
        item.price = price;
        await item.save();

        res.json({ message: "Item updated successfully", item });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;