// Section 4 Group 10
// Magda Imerlishvili, Ethan Nance, Taylor Stevens, Nicholas Thomas

// Import required modules
const express = require("express");
const moment = require('moment-timezone');

// Initialize Express app
let app = express();

// Set the path module for handling file paths
let path = require("path");

// Set the default port to 3000 or use the environment variable
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set the view engine to EJS
app.set("view engine", "ejs");

// Enable parsing of URL-encoded data
app.use(express.urlencoded({extended: true}));

// Configure the database connection using Knex
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

// Handle requests to the root path
app.get("/", (req, res) => {
    res.render("landingPage");
});

// Handle requests to the '/login' path
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle login form submissions
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    knex
        .select("user_name", "password")
        .from("users")
        .where("user_name", username)
        .then(users => {
            if (users.length > 0) {
                // Store the password from the database so you can compare
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
                    // Display an alert and redirect if login fails
                    res.send(`
                        <script>
                            alert('Login failed. Check your username and password.');
                            window.location.href = '/login';
                        </script>
                    `);
                }
            } else {
                // Display an alert and redirect if user is not found
                res.send(`
                    <script>
                        alert('Login failed. No user found with that username, please try again or create an account.');
                        window.location.href = '/login';
                    </script>
                `);
            }
        })
        .catch(err => {
            // Log and handle any errors that occur during login
            console.log(err);
            res.status(500).json({ err });
        });
});

app.get('/displayData', (req, res) => {

        knex.select("Survey_Responses.User_Id", 
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
                "Restless_Without_Social_Media_Level", 
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
                "Organization_Info.Organization_Num",
                "Organization_Info.Organization_Type" ,
                 "User_Engagement_Info.Platform_Num",
                 "Platform_Info.Platform_Name",
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
                .orderBy('Survey_Responses.User_Id')
                .distinctOn('Survey_Responses.User_Id')
                .then(responses => {
                    // Render the 'displayData' view with the retrieved survey responses
                    res.render("displayData", { SurveyResponses: responses });
                })
                .catch(err => {
                    // Log and handle any errors that occur during data retrieval
                    console.log(err);
                    res.status(500).json({ err });
                });
        });
        


// Handle requests to the '/createAccount' path
app.get('/createAccount', (req, res) => {
    res.render('createUser');
});

// Handle new account creation form submissions
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
                            // Display a success alert and redirect
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
                        // Log and handle any errors that occur during account creation
                        console.log(err);
                        res.status(500).json({ err });
                    });
            }
        })
        .catch(err => {
            // Log and handle any errors that occur during account creation
            console.log(err);
            res.status(500).json({ err });
        });
});


// Handle requests to the '/modifyAccount' path
app.get('/modifyAccount', (req, res) => {
    res.render('modifyUser');
});

// Handle account modification form submissions
app.post('/modifyAccount', (req, res) => {
    const { oldUsername, newUsername, newPassword } = req.body;
    
    // Check if the user is trying to modify the admin username or password
    if (oldUsername === 'admin' || newUsername === 'admin' || newPassword === 'admin') {
        return res.send(`
            <script>
                alert('Unauthorized: Modifying admin credentials is not allowed.');
                window.location.href = '/modifyAccount';
            </script>
        `);
    }
    
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
                // Update the user's information in the database
                return knex('users')
                  .where('user_name', oldUsername)
                  .update({
                    user_name: newUsername,
                    password: newPassword,
                  });
            }
        })
        .then(() => {
            // Display a success alert and redirect
            res.send(`
                <script>
                    alert('Account modified successfully');
                    window.location.href = '/login';
                </script>
            `);
        })
        .catch((error) => {
            // Log and handle any errors that occur during account modification
            console.error(error);
            res.status(500).send('Internal Server Error');
        });
});

// Handle requests to the '/addResponse' path
app.get("/addResponse", (req, res) => {
    res.render("dataGather");
});    
    
// Handle new survey response form submissions
app.post("/addResponse", async (req, res) => {
    try {
        // Format the current date and time using moment-timezone
        const currentDate = moment().tz('MST');
        const formattedTimestamp = currentDate.format("YYYY-MM-DD HH:mm:ss");

        // Insert data into Survey_Responses table
        const [userResponse] = await knex("Survey_Responses").insert({
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
            Comments: req.body.comments
        }, ["User_Id"]); // Retrieve the User_Id

        const userResponseId = userResponse.User_Id;

        // Insert data into User_Engagement_Info table for platforms and organizations
        const engagementData = [];
        req.body.organizations.forEach(organizationNumber => {
            req.body.platforms.forEach(platformNumber => {
                engagementData.push({
                    User_Id: userResponseId,
                    Organization_Num: organizationNumber,
                    Platform_Num: platformNumber,
                });
            });
        });

        await knex("User_Engagement_Info").insert(engagementData);

        // Display a success alert and redirect
        res.send(`
        <script>
            alert('Submitted Successfully');
            window.location.href = '/';
        </script>
        `);
    } catch (error) {
        // Log and handle any errors that occur during survey response submission
        console.error(error);
        res.status(500).json({error});
    }
});

// Start the Express app and listen on the specified port
app.listen(port, () => console.log("Express App has started and server is listening!"));