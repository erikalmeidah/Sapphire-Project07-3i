import React, { useEffect, useRef, useState, useReducer } from 'react';
import { Link } from 'react-router-dom';
import '../../ActivityLevels.less';
import { compileArduinoCode, handlePublicSave, handleSave } from '../../Utils/helpers';
import { message, Spin, Row, Col, Alert, Menu, Dropdown } from 'antd';
import CodeModal from '../modals/CodeModal';
import ConsoleModal from '../modals/ConsoleModal';
import PlotterModal from '../modals/PlotterModal';
import {
  connectToPort,
  handleCloseConnection,
  handleOpenConnection,
} from '../../Utils/consoleHelpers';
import ArduinoLogo from '../Icons/ArduinoLogo';
import PlotterLogo from '../Icons/PlotterLogo';

import LoginPromptModal from '../modals/LoginPromptModal';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'antd';
import { getSaves } from '../../../../Utils/requests';
import '../../../../Utils/requests.js'
import '../../Utils/helpers'

let plotId = 1;

export default function PublicCanvas({ activity, isSandbox }) {
  const [hoverSave, setHoverSave] = useState(false);
  const [popupShow, setPopupShow] = useState(false);
  const [userTypeShow, setUserTypeShow] = useState(false);
  const navigate = useNavigate();
  const replayRef = useRef([]);
  const clicks = useRef(0);

  const [hoverUndo, setHoverUndo] = useState(false);
  const [hoverRedo, setHoverRedo] = useState(false);
  const [hoverCompile, setHoverCompile] = useState(false);
  const [hoverConsole, setHoverConsole] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showPlotter, setShowPlotter] = useState(false);
  const [plotData, setPlotData] = useState([]);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [selectedCompile, setSelectedCompile] = useState(false);
  const [compileError, setCompileError] = useState('');

  const [forceUpdate] = useReducer((x) => x + 1, 0);
  const workspaceRef = useRef(null);
  const activityRef = useRef(null);

  const setWorkspace = () => {
    workspaceRef.current = window.Blockly.inject('blockly-canvas', {
      toolbox: document.getElementById('toolbox'),
    });
  };

  useEffect(() => {
    // automatically save workspace every min
    let autosaveInterval = setInterval(async () => {
      console.log("Inside auto save!");
      
      //save workspace
      var xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);
      var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
      window.localStorage.setItem("workspace", xmlText);
      console.log(xmlText);
  
      //save activity 
      let JSONActivity = JSON.stringify(activityRef.current);
      window.localStorage.setItem("activity", JSONActivity);
      console.log(JSONActivity);
  
      //save replay
      let JSONReplay = JSON.stringify(replayRef.current);
      window.localStorage.setItem("replay", JSONReplay);
      console.log(JSONReplay);
    }, 60000);

    // clean up - saves workspace and removes blockly div from DOM
    return async () => {
      clearInterval(autosaveInterval);
    };
  }, []);
  

  async function handleManualSave(goTo) {
    //Manual save using local storage
    console.log("Inside handle save!");

    //save workspace
    var xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);
    var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
    window.localStorage.setItem("workspace", xmlText);
    console.log(xmlText);
    console.log(workspaceRef.current);
    
    //save activity 
    let JSONActivity = JSON.stringify(activityRef.current);
    window.localStorage.setItem("activity", JSONActivity);
    console.log(JSONActivity);

    //save replay
    let JSONReplay = JSON.stringify(replayRef.current);
    window.localStorage.setItem("replay", JSONReplay);
    console.log(JSONReplay);

    //Set previous page flag
    window.localStorage.setItem("fromSandbox", "true");

    //Navigate
    navigate(goTo);
  };
  
  useEffect(() => {
    // once the activity state is set, set the workspace and save
    const setUp = async () => {
      activityRef.current = activity;
      if (!workspaceRef.current && activity && Object.keys(activity).length !== 0) {
        setWorkspace();
      }
    };
    setUp();
  }, [activity]);

  const handleUndo = () => {
    if (workspaceRef.current.undoStack_.length > 0)
      workspaceRef.current.undo(false);
  };

  const handleRedo = () => {
    if (workspaceRef.current.redoStack_.length > 0)
      workspaceRef.current.undo(true);
  };

  const handleConsole = async () => {
    if (showPlotter) {
      message.warning('Close serial plotter before openning serial monitor');
      return;
    }
    // if serial monitor is not shown
    if (!showConsole) {
      // connect to port
      await handleOpenConnection(9600, 'newLine');
      // if fail to connect to port, return
      if (typeof window['port'] === 'undefined') {
        message.error('Fail to select serial device');
        return;
      }
      setConnectionOpen(true);
      setShowConsole(true);
    }
    // if serial monitor is shown, close the connection
    else {
      if (connectionOpen) {
        await handleCloseConnection();
        setConnectionOpen(false);
      }
      setShowConsole(false);
    }
  };

  const handlePlotter = async () => {
    if (showConsole) {
      message.warning('Close serial monitor before openning serial plotter');
      return;
    }

    if (!showPlotter) {
      await handleOpenConnection(
        9600,
        'plot',
        plotData,
        setPlotData,
        plotId,
        forceUpdate
      );
      if (typeof window['port'] === 'undefined') {
        message.error('Fail to select serial device');
        return;
      }
      setConnectionOpen(true);
      setShowPlotter(true);
    } else {
      plotId = 1;
      if (connectionOpen) {
        await handleCloseConnection();
        setConnectionOpen(false);
      }
      setShowPlotter(false);
    }
  };

  const handleCompile = async () => {
    if (showConsole || showPlotter) {
      message.warning(
        'Close Serial Monitor and Serial Plotter before uploading your code'
      );
    } else {
      if (typeof window['port'] === 'undefined') {
        await connectToPort();
      }
      if (typeof window['port'] === 'undefined') {
        message.error('Fail to select serial device');
        return;
      }
      setCompileError('');
      await compileArduinoCode(
        workspaceRef.current,
        setSelectedCompile,
        setCompileError,
        activity,
        false
      );
    }
  };

  const menu = (
    <Menu>
      <Menu.Item onClick={handlePlotter}>
        <PlotterLogo />
        &nbsp; Show Serial Plotter
      </Menu.Item>
      <CodeModal title={'XML'} workspaceRef={workspaceRef.current} />
      <Menu.Item>
        <CodeModal title={'Arduino Code'} workspaceRef={workspaceRef.current} />
      </Menu.Item>
    </Menu>
  );

  function handleSaveClick() {
    console.log("clicked!")
  }

  function handleExistingAccount() {
    setPopupShow(false);
    setUserTypeShow(true);
  }

  return (
    <div id='horizontal-container' className='flex flex-column'>
      <div className='flex flex-row'>
        <div
          id='bottom-container'
          className='flex flex-column vertical-container overflow-visible'
        >
          <Spin
            tip='Compiling Code Please Wait... It may take up to 20 seconds to compile your code.'
            className='compilePop'
            size='large'
            spinning={selectedCompile}
          >
            <Row id='icon-control-panel'>
              <Col flex='none' id='section-header'>
                Program your Arduino...
              </Col>
              <Col flex='auto'>
                <Row align='middle' justify='end' id='description-container'>
                  <Col flex={'30px'}>
                    <Row>
                      <Col>
                        <Link id='link' to={'/'} className='flex flex-column'>
                          <i className='fa fa-home fa-lg' />
                        </Link>
                      </Col>
                    </Row>
                  </Col>
                  <Col flex={'200px'}>
                    <Row>
                      <Col className='flex flex-row' id='icon-align'>
                          {}
                          <button
                            onClick={() => setPopupShow(true)}
                            id='link'
                            className='flex flex-column'
                          >
                            <i
                              id='icon-btn'
                              className='fa fa-save'
                              onMouseEnter={() => setHoverSave(true)}
                              onMouseLeave={() => setHoverSave(false)}
                            />
                            {hoverSave && (
                              <div className='popup ModalCompile4'>Save</div>
                            )}
                          </button>
                        </Col>
                      <Col className='flex flex-row'>
                        <button
                          onClick={handleUndo}
                          id='link'
                          className='flex flex-column'
                        >
                          <i
                            id='icon-btn'
                            className='fa fa-undo-alt'
                            style={
                              workspaceRef.current
                                ? workspaceRef.current.undoStack_.length < 1
                                  ? { color: 'grey', cursor: 'default' }
                                  : null
                                : null
                            }
                            onMouseEnter={() => setHoverUndo(true)}
                            onMouseLeave={() => setHoverUndo(false)}
                          />
                          {hoverUndo && (
                            <div className='popup ModalCompile4'>Undo</div>
                          )}
                        </button>
                        <button
                          onClick={handleRedo}
                          id='link'
                          className='flex flex-column'
                        >
                          <i
                            id='icon-btn'
                            className='fa fa-redo-alt'
                            style={
                              workspaceRef.current
                                ? workspaceRef.current.redoStack_.length < 1
                                  ? { color: 'grey', cursor: 'default' }
                                  : null
                                : null
                            }
                            onMouseEnter={() => setHoverRedo(true)}
                            onMouseLeave={() => setHoverRedo(false)}
                          />
                          {hoverRedo && (
                            <div className='popup ModalCompile4'>Redo</div>
                          )}
                        </button>
                      </Col>
                    </Row>
                  </Col>
                  <Col flex={'230px'}>
                    <div
                      id='action-btn-container'
                      className='flex space-around'
                    >
                      <ArduinoLogo
                        setHoverCompile={setHoverCompile}
                        handleCompile={handleCompile}
                      />
                      {hoverCompile && (
                        <div className='popup ModalCompile'>
                          Upload to Arduino
                        </div>
                      )}

                      <i
                        onClick={() => handleConsole()}
                        className='fas fa-terminal hvr-info'
                        style={{ marginLeft: '6px' }}
                        onMouseEnter={() => setHoverConsole(true)}
                        onMouseLeave={() => setHoverConsole(false)}
                      />
                      {hoverConsole && (
                        <div className='popup ModalCompile'>
                          Show Serial Monitor
                        </div>
                      )}
                      <Dropdown overlay={menu}>
                        <i className='fas fa-ellipsis-v'></i>
                      </Dropdown>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
            <div id='blockly-canvas' />
            <LoginPromptModal loginTrigger={popupShow} setLoginTrigger={setPopupShow}>
              <h2>Login To Save Your Work</h2>
              <div>
                <button className='login-prompt-button' onClick={() => handleExistingAccount()}>I already have an account!</button>
                <button className='login-prompt-button'>I want to create an account!</button>
              </div>
              <div>
                <button className="login-prompt-button" onClick={() => setPopupShow(false)}>I want to keep working</button>
              </div>
            </LoginPromptModal>
            <LoginPromptModal loginTrigger={userTypeShow} setLoginTrigger={setUserTypeShow}>
              <h2>I am a...</h2>
              <div>
                <button className='login-prompt-button'>
                  <a className='student-login-prompt' onClick={() => handleManualSave("/")}>Student!</a>
                </button>
                <button className='login-prompt-button' onClick={() => handleManualSave("/teacherlogin")}>Teacher!</button>
                <button className='login-prompt-button' onClick={() => handleManualSave("/teacherlogin")}>Content Creator!</button>
              </div>
            </LoginPromptModal>
          </Spin>
        </div>
        <ConsoleModal
          show={showConsole}
          connectionOpen={connectionOpen}
          setConnectionOpen={setConnectionOpen}
        ></ConsoleModal>
        <PlotterModal
          show={showPlotter}
          connectionOpen={connectionOpen}
          setConnectionOpen={setConnectionOpen}
          plotData={plotData}
          setPlotData={setPlotData}
          plotId={plotId}
        />
      </div>

      {/* This xml is for the blocks' menu we will provide. Here are examples on how to include categories and subcategories */}
      <xml id='toolbox' is='Blockly workspace'>
        {
          // Maps out block categories
          activity &&
            activity.toolbox &&
            activity.toolbox.map(([category, blocks]) => (
              <category name={category} is='Blockly category' key={category}>
                {
                  // maps out blocks in category
                  // eslint-disable-next-line
                  blocks.map((block) => {
                    return (
                      <block
                        type={block.name}
                        is='Blockly block'
                        key={block.name}
                      />
                    );
                  })
                }
              </category>
            ))
        }
      </xml>

      {compileError && (
        <Alert
          message={compileError}
          type='error'
          closable
          onClose={(e) => setCompileError('')}
        ></Alert>
      )}
    </div>
  );
}
