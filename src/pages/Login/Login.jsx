import React, { useState } from 'react'
import './Login.css';
import assests from "../../assets/assets"
import { signup, login} from '../../Config/firebase';
import { use } from 'react';


const Login = () => {
  const [currentState,setCurrentState]= useState("Sign Up");
  const [username,setUsername] = useState("");
  const [email,setemail] = useState("");
  const [password,setPassowrd] = useState("");

  const onSubmitHnadler = (event) =>{
      event.preventDefault();
      if(currentState==="Sign Up"){
        signup(username,email,password);
      }else{
        login(email,password)
      }
  }

  return (
    <div className='login'>
        <img src={assests.logo_big} alt="" className='logo' />
        <form className='login-form' onSubmit={onSubmitHnadler}>
          <h2>{currentState}</h2>
          {currentState==="Sign Up"?<input type="text" onChange={(e)=>{setUsername(e.target.value)}} value={username}  placeholder='Enter username..' className='form-input' required/>:null}
          <input type="email" placeholder='Enter email..' onChange={(e)=>{setemail(e.target.value)}} value={email} className='form-input' required/>
          <input type="password" placeholder='Enter username..' onChange={(e)=>{setPassowrd(e.target.value)}} value={password} className='form-input'  required/>
          <button type='submit'>{currentState==="Sign Up"?"Create an account":"Login now"}</button>
          <div className="login-term">
            <input type="checkbox" />
            <p>Agree to the term of use & privaercy policy</p>
          </div>
          <div className="login-fogot">
            {currentState==="Sign Up" ?  <p className="login-toggle">already have an account <span onClick={()=>setCurrentState("Login")}>click here</span></p>:
            <p className="login-toggle">Create an account <span onClick={()=>setCurrentState("Sign Up")}>click here</span></p>
              }
              
              
            </div>

        </form>
    </div>
  )
}

export default Login