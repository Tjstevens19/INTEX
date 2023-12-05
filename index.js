const express = require("express");
let app = express();
let path = require("path");
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));

const knex = require("knex")({
    client: "pg",
    connection: {
        host : process.env.RDS_HOSTNAME || "localhost",
        user : process.env.RDS_USERNAME || "postgres",
        password : process.env.RDS_PASSWORD || "S0cc3rr0cks",
        database : process.env.RDS_DB_NAME || "music",
        port : process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
});  

// app.get("/", (req, res) => {
//     knex.select("band_id", 
//                 "band_name", 
//                 "lead_singer",
//                 "music_genre",
//                 "still_rocking",
//                 "rating").from('bands').then(bands => {
//         res.render("displayBand", {mybands: bands});
//     }).catch(err => {
//         console.log(err);
//         res.status(500).json({err});
//     });
// });

app.get("/", (req, res) => {
    res.render("landingPage");
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    knex
        .select("user_name", "password")
        .from("users")
        .where("user_name", username)
        .then(users => {
            if (users.length > 0) {
                // Assuming passwords are hashed, you should use a proper authentication method here.
                const storedPassword = users[0].password;

                // Dummy example: Check if the provided password matches the stored password
                if (username === "admin" && password === "admin") {
                    res.send('Login successful!');
                    res.redirect("/displayAllData");
                }
                else if (password === storedPassword) {
                    res.send('Login successful!');
                    res.redirect("/displayData");
                } else {
                    res.send('Login failed. Check your username and password.');
                }
            } else {
                res.send('Login failed. No user found with that username, please try again or create an account.');
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ err });
        });
});


app.get('/createAccount', (req, res) => {
    res.render('createUser');
});

app.post('/createAccount', (req, res) => {
    knex("users").insert({user_name: req.body.newUsername, password: req.body.newPassword}).then(users => {
        res.send('Account created successfully!');
        res.redirect("/login");
    })
});

app.get('/modifyAccount', (req, res) => {
    res.render('modifyUser');
});

app.post('/modifyAccount', (req, res) => {
    knex("users").where("user_id", parseInt(req.body.user_id)).update({
        user_name : req.body.newUsername,
        password: req.body.newPassword,
    }).then(users => {
        res.redirect("/login");
    });    
});

// app.get("/findRecord", (req, res) => {
//     res.render("findRecord", {});
// });

// app.get("/chooseBand/:bandName", (req, res) => {
//     knex.select("band_name", "lead_singer").from('bands').where("band_name", req.params.bandName).then(bands => {
//         res.render("displayBand", {mybands: bands});
//     }).catch(err => {
//         console.log(err);
//         res.status(500).json({err});
//     });
// });

// app.get("/editBand", (req, res) => {
//     knex.select("band_id", 
//                 "band_name", 
//                 "lead_singer",
//                 "music_genre",
//                 "still_rocking",
//                 "rating").from("bands").where("band_name", req.query.band_name.toUpperCase()).then(bands => {
//                     res.render("editBand", {mybands: bands});
//     }).catch(err => {
//         console.log(err);
//         res.status(500).json({err});
//     });    
// });


// app.post("/editBand", (req, res) => {
//     knex("bands").where("band_id", parseInt(req.body.band_id)).update({
//         band_name: req.body.bandName,
//         lead_singer: req.body.singer,
//         music_genre: req.body.music_genre,
//         still_rocking: req.body.still_rocking ? "Y" : "N",
//         rating: req.body.rating
//     }).then(mybands => {
//         res.redirect("/");
//     });    
// });

// app.get("/addBand", (req, res) => {
//     res.render("addBand");
// });    

app.get("/addResponse", (req, res) => {
    res.render("dataGather");
});    
    
// This is one way to do it. This way doesn't specify the column names where you want to insert and just inserts all.
// app.post("/addBand", (req, res) => {
//     knex("bands").insert(req.body).then(mybands => {
//         res.redirect("/");
//     })
// }); 

// This is another way, just specifying the column names you want to insert.
// app.post("/addBand", (req, res) => {
//     knex("bands").insert({band_name: req.body.band_name.toUpperCase(), lead_singer: req.body.lead_singer.toUpperCase()}).then(mybands => {
//         res.redirect("/");
//     })
// });

app.post("/addResponse", (req, res) => {
    knex("SurveyResults").insert({band_name: req.body.band_name.toUpperCase(), lead_singer: req.body.lead_singer.toUpperCase()}).then(mybands => {
        res.redirect("/");
    })
});

// app.post("/deleteBand/:id", (req, res) => {
//     knex("bands").where("band_id", req.params.id).del().then(mybands => {
//         res.redirect("/");
//     }).catch(err => {
//         console.log(err);
//         res.status(500).json({err});
//     })
// });

// app.post("/deleteAllBands", (req, res) => {
//     knex("bands").del().then(mybands => {
//         res.redirect("/");
//     }).catch(err => {
//         console.log(err);
//         res.status(500).json({err});
//     })
// }); 

app.listen(port, () => console.log("Express App has started and server is listening!"));