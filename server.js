const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors")

dotenv.config(); // load env variables 

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send('API is running..!');
})


app.listen(PORT,()=>{
    console.log(`Server is running successflly on localhost:${PORT}`)
});
