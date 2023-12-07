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
        password : process.env.RDS_PASSWORD || "admin",
        database : process.env.RDS_DB_NAME || "INTEX",
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
                    // res.send('Login successful!');
                    res.redirect("/displayAllData");
                }
                else if (password === storedPassword) {
                    // res.send('Login successful!');
                    res.redirect("/displayData");
                } else {
                    res.send(`
                    <script>
                        alert('Login failed. Check your username and password.');
                        window.location.href = '/login';
                    </script>
                `);
                }
            } else {
                res.send(`
                <script>
                    alert('Login failed. No user found with that username, please try again or create an account.');
                    window.location.href = '/login';
                </script>
            `);
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ err });
        });
});
app.get('/displayData', (req, res) => {
        knex.select("User_Id", 
                "Timestamp", 
                "Age",
                "Gender",
                "Location",
                "Relationship_Status",
                "Social_Media_User", 
                "Occupation",
                "Avg_Social_Media_Hours_Daily",
                "Purposeless_Usage_Frequency",
                "Distracted_Use_Frequency",
                "Restless_Without_Social Media_Level", 
                "General_Distraction_Level",
                "General_Worry_Level",
                "General_Difficulty_Concentrating_Level",
                "Comparison_To_Others_Frequency",
                "Feeling_About_Comparison_Level",
                "Seeking_Validation_Frequency", 
                "Depression_Frequency",
                "Interest_Fluctuation_Frequency",
                "Sleep_Issue_Frequency",
                "Comments",
                ).from('Survey_Responses').then(responses => {
        res.render("displayData", {SurveyResponses: responses});
    }).catch(err => {
        console.log(err);
        res.status(500).json({err});
    });

});

//  app.get("/displayData", (req, res) => {
//     res.render("displayData");

    // knex.select("band_id", 
    //             "band_name", 
    //             "lead_singer",
    //             "music_genre",
    //             "still_rocking",
    //             "rating").from('bands').then(bands => {
        // res.render("displayBand", {mybands: bands});
    // }).catch(err => {
    //     console.log(err);
    //     res.status(500).json({err});
    // });
// });

app.get('/createAccount', (req, res) => {
    res.render('createUser');
});

app.post('/createAccount', (req, res) => {
    const { newUsername, newPassword } = req.body;

    // Check if the username already exists
    knex
        .select("user_name")
        .from("users")
        .where("user_name", newUsername)
        .then(users => {
            if (users.length > 0) {
                // An account already exists with that username
                res.send(`
                    <script>
                        alert('An account already exists with that Username');
                        window.location.href = '/createAccount';
                    </script>
                `);
            } else {
                // Insert the new user into the database
                knex("users")
                    .insert({ user_name: newUsername, password: newPassword })
                    .returning("*")  // This line returns the inserted user data
                    .then(insertedUsers => {
                        // Check if the insertion was successful
                        if (insertedUsers.length > 0) {
                            res.send(`
                                <script>
                                    alert('Account created successfully!');
                                    window.location.href = '/displayData';
                                </script>
                            `);
                        } else {
                            // Handle the case where insertion failed
                            res.send(`
                                <script>
                                    alert('Account creation failed. Please try again.');
                                    window.location.href = '/createAccount';
                                </script>
                            `);
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({ err });
                    });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ err });
        });
});


app.get('/modifyAccount', (req, res) => {
    res.render('modifyUser');
});

app.post('/modifyAccount', (req, res) => {
    const { oldUsername, newUsername, newPassword } = req.body;

    knex
        .select("user_name")
        .from("users")
        .where("user_name", oldUsername)
        .then(users => {
            if (users.length === 0) {
                // oldUsername doesn't exist in the database
                res.send(`
                    <script>
                        alert('User not found. Please check the old username');
                        window.location.href = '/modifyAccount';
                    </script>
                `);
            } else {
                // Update the user's information
                return knex('users')
                  .where('user_name', oldUsername)
                  .update({
                    user_name: newUsername,
                    password: newPassword,
                  });
              }
            })
            .then(() => {
                res.send(`
                    <script>
                        alert('Account modified successfully');
                        window.location.href = '/displayData';
                    </script>
                `);
                
              })
              .catch((error) => {
                console.error(error);
                res.status(500).send('Internal Server Error');
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
    knex("Survey_Responses")
        .insert({
            platforms: req.body.platforms,
            lead_singer: req.body.lead_singer.toUpperCase()
        })
        .then(() => {
            // Redirect to the displayData page after successful insertion
            res.redirect("/displayData");
        })
        .catch(err => {
            // Handle the case where insertion failed
            console.log(err);
            res.status(500).json({ err });
        });
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