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
        password : process.env.RDS_PASSWORD || "S0cc3rr0cks" || "admin" || "S0cc3rr0cks",
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
                    res.redirect("/displayData");
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

        knex.select("Survey_Responses.User_Id", 
                "Survey_Responses.Timestamp", 
                "Survey_Responses.Age",
                "Survey_Responses.Gender",
                "Survey_Responses.Location",
                "Survey_Responses.Relationship_Status",
                "Survey_Responses.Social_Media_User", 
                "Survey_Responses.Occupation",
                "Survey_Responses.Avg_Social_Media_Hours_Daily",
                "Survey_Responses.Purposeless_Usage_Frequency",
                "Survey_Responses.Distracted_Use_Frequency",
                "Survey_Responses.Restless_Without_Social_Media_Level", 
                "Survey_Responses.General_Distraction_Level",
                "Survey_Responses.General_Worry_Level",
                "Survey_Responses.General_Difficulty_Concentrating_Level",
                "Survey_Responses.Comparison_To_Others_Frequency",
                "Survey_Responses.Feeling_About_Comparison_Level",
                "Survey_Responses.Seeking_Validation_Frequency", 
                "Survey_Responses.Depression_Frequency",
                "Survey_Responses.Interest_Fluctuation_Frequency",
                "Survey_Responses.Sleep_Issue_Frequency",
                "Survey_Responses.Comments",
                "Organization_Info.Organization_Num",
                "Organization_Info.Organization_Type" ,
                 "User_Engagement_Info.Platform_Num",
                 "Platform_Info.Platform_Name",
                 // Replace with the actual column name from UserInfo
               
                 knex.raw(`
                 (
                     SELECT STRING_AGG(DISTINCT "Platform_Info"."Platform_Name", ', ') 
                     FROM "User_Engagement_Info" 
                     JOIN "Platform_Info" ON "User_Engagement_Info"."Platform_Num" = "Platform_Info"."Platform_Num" 
                     WHERE "User_Engagement_Info"."User_Id" = "Survey_Responses"."User_Id"
                 ) AS "Platform_Names"
             `),
             // Organization Types subquery
             knex.raw(`
             (
                 SELECT STRING_AGG(DISTINCT "Platform_Info"."Platform_Name", ', ') 
                 FROM "User_Engagement_Info" 
                 JOIN "Platform_Info" ON "User_Engagement_Info"."Platform_Num" = "Platform_Info"."Platform_Num" 
                 WHERE "User_Engagement_Info"."User_Id" = "Survey_Responses"."User_Id"
                 GROUP BY "User_Engagement_Info"."User_Id"
             ) AS "Platform_Names"
         `),
         
         // Organization Types subquery
         knex.raw(`
             (
                 SELECT STRING_AGG(DISTINCT "Organization_Info"."Organization_Type", ', ') 
                 FROM "User_Engagement_Info" 
                 JOIN "Organization_Info" ON "User_Engagement_Info"."Organization_Num" = "Organization_Info"."Organization_Num" 
                 WHERE "User_Engagement_Info"."User_Id" = "Survey_Responses"."User_Id"
                 GROUP BY "User_Engagement_Info"."User_Id"
             ) AS "Organization_Types"
             `) 
        )
                .from('Survey_Responses')
                .join('User_Engagement_Info', 'Survey_Responses.User_Id', '=', 'User_Engagement_Info.User_Id')
                .join('Organization_Info', 'User_Engagement_Info.Organization_Num', '=', 'Organization_Info.Organization_Num')
                .join('Platform_Info', 'User_Engagement_Info.Platform_Num', '=', 'Platform_Info.Platform_Num')
                .orderBy('Survey_Responses.User_Id') // Order by Timestamp column
                .distinctOn('Survey_Responses.User_Id') // Use DISTINCT ON
                .then(responses => {
                    res.render("displayData", { SurveyResponses: responses });
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json({ err });
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
    const { user_id, newUsername, newPassword } = req.body;

    knex("users")
        .where("user_id", parseInt(user_id))
        .update({
            user_name: newUsername,
            password: newPassword,
        })
        .returning("*")  // Retrieve the updated user data
        .then(updatedUsers => {
            if (updatedUsers.length === 0) {
                // User not found, handle accordingly (e.g., display an error message)
                res.send(`
                    <script>
                        alert('User not found. Unable to modify account.');
                        window.location.href = '/displayData';
                    </script>
                `);
            } else {
                // Redirect after successful modification with a success message
                res.send(`
                    <script>
                        alert('User updated successfully.');
                        window.location.href = '/displayData';
                    </script>
                `);
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ err });
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

// app.post("/addResponse", (req, res) => {
//     knex("Survey_Responses").insert({platforms: req.body.platforms, lead_singer: req.body.lead_singer.toUpperCase()})
    

//     .then(mybands => {
//         res.redirect("/");
//     })
// });

// Define routes
app.post("/addResponse", async (req, res) => {
    try {
        const currentDate = new Date();
        const formattedTimestamp = currentDate.toISOString().slice(0, 19).replace("T", " ");
      // Insert data into Survey_Responses table
    await knex("Survey_Responses").insert({
        Timestamp: formattedTimestamp,
        Age: req.body.age,
        Gender: req.body.gender,
        Relationship_Status: req.body.relationship,
        Location: req.body.location,
        Occupation: req.body.Occupation,
        Social_Media_User: req.body.usage,
        Avg_Social_Media_Hours_Daily: req.body.AvgTime,
        Purposeless_Usage_Frequency: req.body.purposeless,
        Distracted_Use_Frequency: req.body.distracted,
        Restless_Without_Social_Media_Level: req.body.restless,
        General_Distraction_Level: req.body.eDistract,
        General_Worry_Level: req.body.worried,
        General_Difficulty_Concentrating_Level: req.body.dConcentrate,
        Comparison_To_Others_Frequency: req.body.comparison,
        Feeling_About_Comparison_Level: req.body.comparisonFeeling,
        Seeking_Validation_Frequency: req.body.validation,
        Depression_Frequency: req.body.depressed,
        Interest_Fluctuation_Frequency: req.body.fluctuate,
        Sleep_Issue_Frequency: req.body.sleepIssues,
        Comments: req.body.Comments
        // Add other fields as needed
      });
  
      // Insert data into User_Engagement_Info table
    //   await db("User_Engagement_Info").insert({
    //     response_id: responseId,
    //     social_media_usage: req.body.usage,
    //     average_time_spent: req.body.AvgTime,
    //     // Add other fields as needed
    //   });
  
    //   // Insert data into a separate table for platforms (assuming a One-to-Many relationship)
    //   const platforms = req.body.platforms.map(platformId => ({
    //     response_id: responseId,
    //     platform_id: platformId,
    //   }));
    //   await db("User_Engagement_Info").insert(platforms);
  
    //   // Insert data into a separate table for organizations (assuming a One-to-Many relationship)
    //   const organizations = req.body.organizations.map(orgName => ({
    //     response_id: responseId,
    //     organization_name: orgName,
    //   }));
    //   await db("User_Organizations").insert(organizations);
  
      res.redirect("/displayData");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
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