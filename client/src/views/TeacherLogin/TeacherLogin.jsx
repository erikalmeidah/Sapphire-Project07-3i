import { message } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar/NavBar';
import { postUser, setUserSession } from '../../Utils/AuthRequests';
import './TeacherLogin.less';
import { saveWorkspace } from '../../Utils/requests';
import { handleSave } from '../../../src/components/ActivityPanels/Utils/helpers.js';

const useFormInput = (initialValue) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = (e) => {
    setValue(e.target.value);
  };
  return {
    value,
    onChange: handleChange,
  };
};

export default function TeacherLogin() {
  const email = useFormInput('');
  const password = useFormInput('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    setLoading(true);
    let body = { identifier: email.value, password: password.value };

    //IF LOGGING IN FROM PUBLIC CANVAS
    if(localStorage.getItem("prevPage") == "/sandbox"){
      console.log("Inside teacher login!");
      localStorage.setItem("prevPage", "/teacherlogin");
    }
    postUser(body)
      .then((response) => {
        
          setUserSession(response.data.jwt, JSON.stringify(response.data.user));
          setLoading(false);
          if (response.data.user.role.name === 'Content Creator') {
            navigate('/ccdashboard');
          } else if (response.data.user.role.name === 'Researcher') {
            navigate('/report');
          } else {
            //IF TEACHER LOGIN
            navigate('/dashboard');
          }
        })
        .catch((error) => {
          setLoading(false);
          message.error('Login failed. Please input a valid email and password.');
        });
      
  };

  return (
    <div className='container nav-padding'>
      <NavBar />
      <div id='content-wrapper'>
        <form
          id='box'
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleLogin();
          }}
        >
          <div id='box-title'>User Login</div>
          <input
            type='email'
            {...email}
            placeholder='Email'
            autoComplete='username'
          />
          <input
            type='password'
            {...password}
            placeholder='Password'
            autoComplete='current-password'
          />
          <p id='forgot-password' onClick={() => navigate('/forgot-password')}>
            Forgot Password?
          </p>
          <input
            type='button'
            value={loading ? 'Loading...' : 'Login'}
            onClick={handleLogin}
            disabled={loading}
          />
        </form>
      </div>
    </div>
  );
}
