// // import React, { useEffect, useState } from 'react';
// // import "./ProfileUpdate.css";
// // import assets from '../../assets/assets';
// // import { onAuthStateChanged } from 'firebase/auth';
// // import { auth, db } from '../../Config/firebase';
// // import { doc, getDoc } from 'firebase/firestore';
// // import { useNavigate } from 'react-router-dom';
// // import { toast } from 'react-toastify';
// // import upload from '../../lib/upload';
// // import { updateDoc } from 'firebase/firestore/lite';

// // const ProfileUpdate = () => {
// //   const navigate = useNavigate();
// //   const [image, setImage] = useState(null);
// //   const [name, setName] = useState("");
// //   const [bio, setBio] = useState("");
// //   const [uid, setUid] = useState("");
// //   const [prevImage, setPrevImage] = useState("");

// //   const ProfileUpdate = async (event) =>{
// //       event.preventDefault();
// //       try{
// //         if(!prevImage && !image){
// //             toast.error("upload profile picture")
// //         }
// //         const  docRef = doc(db,'users',uid);
// //         if(image){
// //           const imgUrl = await upload(image);
// //           setPrevImage(imgUrl);
// //           await updateDoc(docRef,({
// //             avatar:imgUrl,
// //             bio:bio,
// //             name:name
// //           }))

// //         }else{

// //           await updateDoc(docRef,({
         
// //             bio:bio,
// //             name:name
// //           }))
          
// //         }
// //       }catch{
        

// //       }
// //   }

// //   useEffect(() => {
// //     const unsubscribe = onAuthStateChanged(auth, async (user) => {
// //       if (user) {
// //         setUid(user.uid);
// //         const docRef = doc(db, "users", user.uid);
// //         const docSnap = await getDoc(docRef);

// //         if (docSnap.exists()) {
// //           const data = docSnap.data();
// //           if (data.name) setName(data.name);
// //           if (data.bio) setBio(data.bio);
// //           if (data.avatar) setPrevImage(data.avatar);
// //         }
// //       } else {
// //         navigate('/');
// //       }
// //     });

// //     // Cleanup subscription
// //     return () => unsubscribe();
// //   }, [navigate]);

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     // TODO: Add Firestore update logic here (update name, bio, and avatar)
// //     console.log({ uid, name, bio, image });
// //   };

// //   return (
// //     <div className='profile'> 
// //       <div className="profile-container">
// //         <form onSubmit={ProfileUpdate}>
// //           <h3>Profile Details</h3>

// //           <label htmlFor='avatar'>
// //             <input 
// //               type="file" 
// //               id='avatar' 
// //               accept='.png, .jpg, .jpeg' 
// //               hidden
// //               onChange={(e) => setImage(e.target.files[0])} 
// //             />
// //             <img 
// //               src={image ? URL.createObjectURL(image) : prevImage || assets.avatar_icon} 
// //               alt="Avatar" 
// //             /> 
// //             Upload file image
// //           </label>

// //           <input 
// //             type="text" 
// //             placeholder='Your name' 
// //             value={name} 
// //             required
// //             onChange={(e) => setName(e.target.value)} 
// //           />

// //           <textarea 
// //             placeholder='Write profile bio' 
// //             value={bio} 
// //             required
// //             onChange={(e) => setBio(e.target.value)} 
// //           />

// //           <button type='submit'>Save</button>
// //         </form>

// //         <img  
// //           className="profile-pic" 
// //           src={image ? URL.createObjectURL(image) : prevImage || assets.logo_icon} 
// //           alt="Profile Preview" 
// //         />
// //       </div>
// //     </div>
// //   );
// // }

// // export default ProfileUpdate;

// import React, { useEffect, useState } from 'react';
// import "./ProfileUpdate.css";
// import assets from '../../assets/assets';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth, db } from '../../Config/firebase';
// import { doc, getDoc, updateDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import upload from '../../lib/upload';

// const ProfileUpdate = () => {
//   const navigate = useNavigate();
//   const [image, setImage] = useState(null);
//   const [name, setName] = useState("");
//   const [bio, setBio] = useState("");
//   const [uid, setUid] = useState("");
//   const [prevImage, setPrevImage] = useState("");

//   // 🔧 handle form submit
//   const handleProfileUpdate = async (event) => {
//     event.preventDefault();

//     try {
//       if (!uid) {
//         toast.error("User not found");
//         return;
//       }

//       if (!prevImage && !image) {
//         toast.error("Please upload a profile picture");
//         return;
//       }

//       const docRef = doc(db, 'users', uid);
//       let imgUrl = prevImage;

//       // ✅ Upload only if a new image is selected
//       if (image) {
//         imgUrl = await upload(image);
//         setPrevImage(imgUrl);
//       }

//       // ✅ Update Firestore user doc
//       await updateDoc(docRef, {
//         name,
//         bio,
//         avatar: imgUrl,
//       });

//       toast.success("Profile updated successfully!");
//     } catch (error) {
//       console.error("Profile update failed:", error);
//       toast.error("Something went wrong while updating your profile.");
//     }
//   };

//   // 🔥 Load user data on auth state change
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         setUid(user.uid);
//         const docRef = doc(db, "users", user.uid);
//         const docSnap = await getDoc(docRef);

//         if (docSnap.exists()) {
//           const data = docSnap.data();
//           setName(data.name || "");
//           setBio(data.bio || "");
//           setPrevImage(data.avatar || "");
//         }
//       } else {
//         navigate('/');
//       }
//     });

//     return () => unsubscribe();
//   }, [navigate]);

//   return (
//     <div className='profile'>
//       <div className="profile-container">
//         <form onSubmit={handleProfileUpdate}>
//           <h3>Profile Details</h3>

//           <label htmlFor='avatar'>
//             <input
//               type="file"
//               id='avatar'
//               accept='.png, .jpg, .jpeg'
//               hidden
//               onChange={(e) => setImage(e.target.files[0])}
//             />
//             <img
//               src={image ? URL.createObjectURL(image) : prevImage || assets.avatar_icon}
//               alt="Avatar"
//             />
//             Upload profile image
//           </label>

//           <input
//             type="text"
//             placeholder='Your name'
//             value={name}
//             required
//             onChange={(e) => setName(e.target.value)}
//           />

//           <textarea
//             placeholder='Write profile bio'
//             value={bio}
//             required
//             onChange={(e) => setBio(e.target.value)}
//           />

//           <button type='submit'>Save</button>
//         </form>

//         <img
//           className="profile-pic"
//           src={image ? URL.createObjectURL(image) : prevImage || assets.logo_icon}
//           alt="Profile Preview"
//         />
//       </div>
//     </div>
//   );
// }

// export default ProfileUpdate;


import React, { useEffect, useState } from 'react';
import "./ProfileUpdate.css";
import assets from '../../assets/assets';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../Config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const [prevImage, setPrevImage] = useState("");

  // Convert image to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();

    try {
      if (!uid) {
        toast.error("User not found");
        return;
      }

      let imgBase64 = prevImage;

      if (image) {
        imgBase64 = await convertToBase64(image);
        setPrevImage(imgBase64);
      }

      const docRef = doc(db, 'users', uid);

      await updateDoc(docRef, {
        name,
        bio,
        avatar: imgBase64,
      });
      
     
      toast.success("Profile updated successfully!");
      setTimeout(() => navigate('/chat'), 1500);
    
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Something went wrong while updating your profile.");
    }
  };

  // Load user data on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setBio(data.bio || "");
          setPrevImage(data.avatar || "");
        }
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className='profile'>
      <div className="profile-container">
        <form onSubmit={handleProfileUpdate}>
          <h3>Profile Details</h3>

          <label htmlFor='avatar'>
            <input
              type="file"
              id='avatar'
              accept='.png, .jpg, .jpeg'
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />
            <img
              src={image ? URL.createObjectURL(image) : prevImage || assets.avatar_icon}
              alt="Avatar"
            />
            Upload profile image
          </label>

          <input
            type="text"
            placeholder='Your name'
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />

          <textarea
            placeholder='Write profile bio'
            value={bio}
            required
            onChange={(e) => setBio(e.target.value)}
          />

          <button type='submit'>Save</button>
        </form>

        <img
          className="profile-pic"
          src={image ? URL.createObjectURL(image) : prevImage || assets.logo_icon}
          alt="Profile Preview"
        />
      </div>
    </div>
  );
}

export default ProfileUpdate;
