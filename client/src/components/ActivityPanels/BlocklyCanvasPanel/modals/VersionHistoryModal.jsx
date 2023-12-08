import React, { useState } from 'react';
import { Modal, Button, Input } from 'antd';
import '../../ActivityLevels.less';

export default function VersionHistoryModal(props) {
  const [visible, setVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [customVersionName, setCustomVersionName] = useState('');
  const [selectedSaveId, setSelectedSaveId] = useState(null);

  const {
    saves,
    loadSave,
    lastAutoSave,
    getFormattedDate,
    pushEvent,
    updateSaveName,
  } = props;

  const showNameModal = (saveId) => {
    setSelectedSaveId(saveId);
    setNameModalVisible(true);
  };

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
    setNameModalVisible(false);
    setCustomVersionName('');
  };

  const handleOk = () => {

    if (!selectedSaveId) {
      console.error('No selected save ID');
      return;
    }

     if (props.updateSaveName) {
    // Call updateSaveName to update the save name in your data source (database, API, etc.)
    props.updateSaveName(selectedSaveId, customVersionName);
  }
    // Update the save name in the component state
    const updatedSaves = saves.past.map(save => {
      if (save.id === selectedSaveId) {
        return {
          ...save,
          customVersionName: customVersionName,
        };
      }
      return save;
    });
  
    // Call updateSaveName to update the save name in your data source (database, API, etc.)
    updateSaveName(selectedSaveId, customVersionName);
  
    // Update the state with the new saves
    props.updateSaves({ past: updatedSaves, current: props.saves.current });
  
    setVisible(false);
    setNameModalVisible(false);
    setCustomVersionName('');
    setSelectedSaveId(null);
  };

  const handleSelected = (selectedId) => {
    loadSave(selectedId);
    pushEvent('restore');
    setVisible(false);
  };

  const groupSavesByDate = (savesArray) => {
    return savesArray.reduce((groupedSaves, save) => {
      const dateKey = getFormattedDate(save.updated_at).split(' ')[0];
      if (!groupedSaves[dateKey]) {
        groupedSaves[dateKey] = [];
      }
      groupedSaves[dateKey].push(save);
      return groupedSaves;
    }, {});
  };

  const groupedPastSaves = groupSavesByDate(saves.past || []);

  return (
    <div id='history-modal'>
      <Button onClick={showModal}>
        <div className='flex space-between'>
          <i id='eye-icon' className='fa fa-eye fa-lg' />
          <div>Version History</div>
        </div>
      </Button>
      <Modal
        title={'Team Name Version History'}
        visible={visible}
        onCancel={handleCancel}
        width='60vw'
        footer={[
          <Button key='ok' type='primary' onClick={handleOk}>
            OK
          </Button>,
        ]}
        bodyStyle={{ height: '50vh', overflow: 'auto' }}
      >
        <ul>
          {/* Group Past Saves by Date */}
          {Object.entries(groupedPastSaves).map(([date, savesForDate]) => (
          <li key={date}>
            <details id='date-box'>
              <summary id='summary'>Date: {date}</summary>
              {savesForDate.map((save) => (
                <div key={save.id} id='history-item'>
                  <div id='item-content'>
                    {save.customVersionName || save.student.name}'s save from {getFormattedDate(save.updated_at)}
                  </div>
                  <div id='item-content'>
                    <Button onClick={() => handleSelected(save.id)}>Restore this save</Button>
                    <Button onClick={() => showNameModal(save.id)}>Rename</Button>
                  </div>
                </div>
              ))}
            </details>
          </li>
        ))}

          {/* Last Auto-Save */}
          {lastAutoSave && (
            <li value={lastAutoSave.id * -1} key={lastAutoSave.id * -1}>
              <div id='history-item'>
                <div id='item-content'>
                  Last auto-save from {getFormattedDate(lastAutoSave.updated_at)}
                </div>
                <div id='item-content'>
                  <Button onClick={() => handleSelected(-2)}>Restore this save</Button>
                </div>
              </div>
            </li>
          )}

          {/* Active Save */}
          {saves.current && (
            <li value={saves.current.id} key={saves.current.id}>
              <div id='history-item'>
                <div id='item-content'>
                  Active save from {getFormattedDate(saves.current.updated_at)}
                </div>
                <div id='item-content'>
                  <Button onClick={() => handleSelected(saves.current.id)}>Restore this save</Button>
                </div>
              </div>
            </li>
          )}

          {/* Default Template */}
          <li key={-1}>
            <div id='history-item'>
              <div id='item-content'>Default template</div>
              <div id='item-content'>
                <Button onClick={() => handleSelected(-1)}>Start over</Button>
              </div>
            </div>
          </li>
        </ul>
      </Modal>

      {/* Name Version Modal */}
      <Modal
        title='Name Version'
        visible={nameModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width='50vw'
        footer={[
          <Button key='ok' type='primary' onClick={handleOk}>
            OK
          </Button>,
        ]}
      >
        <Input
          placeholder='Enter version name'
          value={customVersionName}
          onChange={(e) => setCustomVersionName(e.target.value)}
        />
      </Modal>
    </div>
  );
}