import React, { useState } from 'react';
import { Menu, Modal } from 'antd'; // something here?
import '../../../../assets/style.less';

export default function LoginPromptModal(props) {
    return (props.loginTrigger) ? (
        <div className='login-popup'>
            <div className="login-popup-inner">
                <button className="login-close-btn" onClick={() => props.setLoginTrigger(false)}>
                    <i 
                        id='icon-btn'
                        className='fa fa-close'
                    />
                    X
                </button>
                {props.children}
            </div>
        </div>
    ) : "";
}