const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const db = require("./config/init.js");
var admin = require("firebase-admin");
const multer = require("multer");
const fs = require("fs");

const mongourl =
  "mongodb+srv://sdauser:sdauser@sdadatabase.z44y6.mongodb.net/productdata?retryWrites=true&w=majority";
mongoose
  .connect(mongourl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connection Is Open");
  })
  .catch((err) => {
    console.log(err);
  });

app.use(cors());
app.use(bodyParser.json({ limit: "16mb" }));
require("./Datamodel");
const ProductData = mongoose.model("ProductData");
app.use(express.json());

app.listen(9001, () => {
  console.log("Server is running on port 9001");
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
let fileurl;

app.post("/api/products", upload.single("image"), async (req, res) => {
  const storage = admin.storage();

  const bucket = storage.bucket("gs://event-bf7c6.appspot.com");

  let { productName, categoryName, description } = req.body;

  try {
    await bucket.upload("./" + req.file.path);
  } catch (err) {
    console.log(err);
  }

  const file = await bucket.file(req.file.originalname);
  await file
    .getSignedUrl({
      action: "read",
      expires: "03-09-2491",
    })
    .then((url) => {
      console.log(url);
      fileurl = url;
    })
    .catch((err) => {
      console.log(err);
    });

  await fs.unlink(req.file.path, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Deleted the file");
    }
  });

  const pr = await ProductData.create({
    productName,
    categoryName,
    description,
    image: fileurl[0],
  });

  if (!pr) {
    return res.status(500).json({
      message: "error creating user",
    });
  }
  return res.status(201).json({
    success: true,
    message: "Product Created Successfully !",
    data: pr,
  });
});

app.get("/api/getProducts", async (req, res) => {
  await ProductData.find({})
    .then((data) => {
      return res.status(200).json({
        success: true,
        data: data,
        message: "Successfully Sent Details",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(501).json({
        message: "Internal Server Error",
        success: false,
      });
    });
});

app.get("/api/category", async (req, res) => {
  const pr = await ProductData.find({ categoryName: req.query.categoryName });

  res.json(pr);
});

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "successfully Running",
  });
});
