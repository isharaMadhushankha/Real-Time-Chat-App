import React from 'react'
import "./ProfileUpdate.css"
import assets from '../../assets/assets'

const ProfileUpdate = () => {
  return (
    <div className='profile'> 
      <div className="profile-container">
        <form action="">
          <h3>Profile details</h3>
          <label htmlFor='file' id='avatar'  accept ='.png, .jpg, jpeg' hidden>
          <img src={assets.avatar_icon} alt="" /> 
          upload file image
          </label>
        </form>
      </div>
    </div>
  )
}

export default ProfileUpdate