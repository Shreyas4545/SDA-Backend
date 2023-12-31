const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const db = require("./config/init.js");
const storage = require("./config/init.js");
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

const storage2 = multer.memoryStorage(); // Store files in memory instead of writing to disk

const upload = multer({ storage: storage2 });

app.post("/api/new", upload.single("image"), async (req, res) => {
  const storage = admin.storage();
  // const bucket = admin.storage().bucket();

  const bucket = storage.bucket("gs://event-bf7c6.appspot.com");

  // let { productName, categoryName, description } = req.body;

  // console.log(req.file);

  // try {
  //   await bucket.upload("./" + req.file.path);
  // } catch (err) {
  //   console.log(err);
  // }

  // const file = await bucket.file(req.file.originalname);
  // await file
  //   .getSignedUrl({
  //     action: "read",
  //     expires: "03-09-2491",
  //   })
  //   .then((url) => {
  //     console.log(url);
  //     fileurl = url;
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });

  // await fs.unlink(req.file.path, function (err) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     console.log("Deleted the file");
  //   }
  // });

  //new code
  const fileName = req.file.originalname;

  // Upload the file to Firebase Storage
  const fileUpload = bucket.file(fileName);
  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
    resumable: false,
  });

  stream.on("error", (error) => {
    console.error(error);
    return res.status(500).send("Error uploading file to Firebase Storage.");
  });

  stream.on("finish", () => {
    // Generate a signed URL for the uploaded file
    fileUpload.getSignedUrl(
      {
        action: "read",
        expires: "03-09-2491", // Adjust the expiration date as needed
      },
      (error, signedUrl) => {
        if (error) {
          console.error(error);
          res.status(500).send("Error generating signed URL.");
        } else {
          res.status(200).json({ fileUrl: signedUrl });
        }
      }
    );
  });

  // const pr = await ProductData.create({
  //   productName,
  //   categoryName,
  //   description,
  //   image: fileurl[0],
  // });

  // if (!pr) {
  //   return res.status(500).json({
  //     message: "error creating user",
  //   });
  // }
  return res.status(201).json({
    success: true,
    message: "Product Created Successfully !",
    // data: pr,
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

app.post("/api/products", upload.single("image"), async (req, res) => {
  // create a reference
  let { productName, categoryName, description } = req.body;

  try {
    // Grab the file
    const file = req.file;
    const timestamp = Date.now();
    const name = file.originalname.split(".")[0];
    const type = file.originalname.split(".")[1];
    const fileName = `${name}_${timestamp}.${type}`;
    const str = admin.storage();
    const bucket = str.bucket("gs://event-bf7c6.appspot.com");

    // Create a file reference within the bucket
    const fileRef = bucket.file(fileName);

    // Upload the file
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Get the public URL
    const downloadURL = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-09-2491", // Adjust the expiration date as needed
    });

    const pr = await ProductData.create({
      productName,
      categoryName,
      description,
      image: downloadURL[0],
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
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
});

app.delete("/api/deleteProduct/:id", async (req, res) => {
  let id = req.params.id;
  console.log(id);
  await ProductData.deleteOne({ _id: id })
    .then((data) => {
      return res.status(201).json({
        success: true,
        message: "Product Deleted Successfully !",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send(err);
    });
});
