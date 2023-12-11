var admin = require("firebase-admin");
const { readFile } = require("fs/promises");
const path = require("path");

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, "./Firebase.json");

async function initializeFirebaseApp() {
  try {
    const serviceAccountData = await readFile(serviceAccountPath);
    const serviceAccount = JSON.parse(serviceAccountData);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase app initialized successfully!");
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    throw error; // rethrow the error to indicate initialization failure
  }
}

// Initialize Firebase
initializeFirebaseApp()
  .then(() => {
    // Now you can use Firebase services after initialization
    const db = admin.firestore();
    // Do something with the Firestore instance

    const storage = admin.storage();
    const bucket = storage.bucket("gs://it-repeats-ea39a.appspot.com/");

    // Do something with the Storage instance

    // Alternatively, you can export the Firestore and Storage instances for use in other modules
    module.exports = {
      db,
      storage,
      bucket,
    };
  })
  .catch((error) => {
    // Handle any errors during initialization
    console.error("Error starting the application:", error);
  });
