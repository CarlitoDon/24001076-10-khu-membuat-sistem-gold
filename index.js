const express = require('express');
const app = express();

const bcrypt = require('bcrypt')

const { User, Item, Order } = require('./models');
const { or } = require('sequelize');

app.use(express.json());

// Route Register
app.post("/register", async (req, res) => {
    const { username, password, email, birth_date } = req.body;
    hashedPassword = await bcrypt.hash(password, 10);

    // Cari apakah username atau email sudah ada di database
    const existingUser = await User.findOne({ where: { username } });
    const existingEmail = await User.findOne({ where: { email } });

    // Jika Username & Password tidak diisi
    if (!username || !password) {
        res.status(404).send({ 
            message: "Silakan isikan Username & Password"
        });
    }
    // Jika username telah digunakan
    else if (existingUser){
        res.send({ 
            message: "Username telah digunakan"
        });
    }
    // Jika username telah digunakan
    else if (existingEmail){
        res.send({ 
            message: "Email telah digunakan"
        });
    }
    // Register berhasil
    else {
        // Buat instance baru dari model User
        const newUser = new User({
            username,
            password: hashedPassword,
            email,
            birth_date
        });

        // Simpan pengguna baru ke dalam database
        await newUser.save();

        res.status(201).send({ 
            message: "Pengguna berhasil didaftarkan"
        });
    };
});


// Route Login
app.post("/login", async (req,res) => {
    const { username, password } = req.body;
    const userExists = await User.findOne({ where: { username } });
    
    if (!username || !password) {
        res.status(404).send({ 
            message: "Silakan isikan Username & Password"
        });
    } 

    else if (!userExists) {
        return res.status(404).send({
            message: "Username tidak ditemukan"
        });
    }

    else {
        try {
            if (await bcrypt.compare(password,userExists.password)) {
                res.status(200).send({
                    message: "Login berhasil"
                });
            } else {
                res.status(401).send({
                    message: "Password yang Anda masukkan salah!"
                });
            }
        } catch (error) {
            res.status(500).send({
                message: "Terjadi kesalahan"
            });
        };
    };
});



app.route("/items")
    .get(async(req, res) => {
        const allItems = await Item.findAll();
        return res.json({
            success: 1,
            data: allItems
        });
    })
    .post((req, res) => {
        const { name, price, stock } = req.body;
        const item = new Item({
            name,
            price,
            stock
        });

        item.save().then(() => {
            res.sendStatus(201);
        });
    })
    .put(async (req, res) => {
        const itemId = req.query.id;
        const { new_name, new_price, new_stock } = req.body;
    
        try {
            const item = await Item.findByPk(itemId);
            if (!item) {
                return res.status(404).send("Item not found");
            }
    
            item.name = new_name;
            item.price = new_price;
            item.stock = new_stock;
    
            await item.save();
            return res.send("Item Updated");
        } catch (error) {
            return res.status(500).send("Internal Server Error");
        }
    });
    



// Route Order
app.route("/order")
    .post(async (req, res) => {
        const { user_id, item_id, quantity } = req.body;
        const newOrder = new Order({
            user_id,
            item_id,
            quantity,
            status: "Pending"
        });
        newOrder.save();

        const orderedItemIndex = await Item.findByPk(item_id);
        const itemName = orderedItemIndex.name
        const itemPrice = orderedItemIndex.price;
        const total_price = quantity * itemPrice;

        const userIndex = await User.findByPk(user_id);
        const username = userIndex.username

        const userOrderRes = {
            user_id,
            username,
            item_id,
            itemName,
            quantity,
            total_price,
            status: "Pending"
        };
        res.json({
            success: 1,
            data: userOrderRes
        });
    })
    //Mengubah status Order pakai PATCH
    .patch(async (req, res) => {
        const order_id = req.query.order_id
        const orderIndex = await Order.findByPk(order_id)

        orderIndex.status = "Delivered" 
        orderIndex.save()

        res.json({
            success: 1,
            message: "Status updated"
        })
    });

// Route SuperUser //
// Route GET Users
app.get("/users", async (req, res) => {
    const users = await User.findAll();
    res.status(200).json({
        success: 1,
        data: users
    });
});

// Route GET Orders
app.get("/orders", async (req, res) => {
    const orders = await Order.findAll();
    res.status(200).json({
        success: 1,
        data: orders
    });
});


app.listen(3000,() => console.log("Server berjalan di port 3000"));