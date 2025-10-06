// import { getDownloadURL, getStorage, ref, uploadString } from "firebase/storage";
// import { data } from "react-router-dom";

// const upload = async (file) => {
//   const storage = getStorage();
//   const storageRef = ref(storage,`images/${Date.now()+file.name}`);

//   // Raw string is the default if no format is provided
//   const message = "This is my message.";
//   uploadString(storageRef, message).then((snapshot) => {
//     console.log("Uploaded a raw string!");
//   });

//   // Base64 formatted string
//   const message2 = "5b6p5Y+344GX44G+44GX44Gf77yB44GK44KB44Gn44Go44GG77yB";
//   uploadString(storageRef, message2, "base64").then((snapshot) => {
//     console.log("Uploaded a base64 string!");
//   });

//   // Base64url formatted string
//   const message3 = "5b6p5Y-344GX44G-44GX44Gf77yB44GK44KB44Gn44Go44GG77yB";
//   uploadString(storageRef, message3, "base64url").then((snapshot) => {
//     console.log("Uploaded a base64url string!");
//   });

//   // Data URL string
//   const message4 =
//     "data:text/plain;base64,5b6p5Y+344GX44G+44GX44Gf77yB44GK44KB44Gn44Go44GG77yB";
//   uploadString(storageRef, message4, "data_url").then((snapshot) => {
//     resolve(getDownloadURL)
//   });
// };


// export default upload;


import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const upload = async (file) => {
  try {
    if (!file) throw new Error("No file provided");

    const storage = getStorage();
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);

    // Upload the actual file (not string)
    const snapshot = await uploadBytes(storageRef, file);

    // Get the file's download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log("✅ File uploaded successfully:", downloadURL);
    return downloadURL; // Return URL so you can save it to Firestore
  } catch (error) {
    console.error("❌ Upload failed:", error);
    throw error;
  }
};

export default upload;
