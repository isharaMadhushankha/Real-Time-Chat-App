import React from 'react'
import "./LeftSidebar.css"
import assets from '../../assets/assets'


const LeftSidebar = () => {
  return (
    <div className='ls'>
        <div className='ls-top'>
            <div className='ls-nav'>
                <img src={assets.logo} className="logo" alt="" />
                <div className='menu'>
                    <img src={assets.menu_icon} alt="" />
                    <div className='sub-menu'>
                        <p>Edit profile</p>
                        <hr />
                        <p>Logout</p>
                    </div>
                </div>
            </div>
            <div className="ls-search">
                <img src={assets.search_icon} alt="" />
                <input type="text" placeholder='Search hear..' />
            </div>
        </div>
        <div className='ls-list'>
            { Array(10).fill("").map((item,index)=>(
                <div key={index} className="friend">
                <img src={assets.profile_img} alt="" />
                <div>
                    <p>Ishara Madushanka</p>
                    <span>hello,How are you?</span>

                </div>
            </div>
            ))}
            

        </div>

    </div>
  )
}

export default LeftSidebar