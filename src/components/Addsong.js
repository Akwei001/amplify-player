import React, { useState } from 'react';
import { API, graphqlOperation, Storage } from 'aws-amplify';
import { createSong } from '../graphql/mutations';
import { MdPublish } from 'react-icons/md';
import { v4 as uuid } from 'uuid';

const Addsong = ({ onUpload }) => {
  const [songData, setSongData] = useState({});
  const [mp3Data, setMp3Data] = useState();
  const [uploadPercent, setUploadPercent] = useState(0);

  const uploadSong = async () => {
    //Upload the song
    console.log('songData', songData);
    console.log('mp3Data', mp3Data);
    const { title, description, owner } = songData;

    const { key } = await Storage.put(`${uuid()}.mp3`, mp3Data, {
      contentType: 'audio/mp3',
      progressCallback(progress) {
        setUploadPercent(Math.round((progress.loaded / progress.total) * 100));
      },
    });

    const createSongInput = {
      id: uuid(),
      title,
      description,
      owner,
      filePath: key,
      likes: 0,
    };

    await API.graphql(graphqlOperation(createSong, { input: createSongInput }));

    onUpload();
  };
  return (
    <div className='newSong'>
      <textarea
        label='title'
        placeholder='Title'
        value={songData.title}
        onChange={(e) => setSongData({ ...songData, title: e.target.value })}
      />
      <textarea
        label='artist'
        placeholder='Artist'
        value={songData.artist}
        onChange={(e) => setSongData({ ...songData, owner: e.target.value })}
      />
      <textarea
        label='description'
        placeholder='Description'
        value={songData.description}
        onChange={(e) =>
          setSongData({ ...songData, description: e.target.value })
        }
      />

      <input
        className='input-button'
        type='file'
        accept='audio/mp3'
        onChange={(e) => setMp3Data(e.target.files[0])}
      />
      <div className='close-button'>Close</div>
      <div className='upload' onClick={uploadSong}>
        {uploadPercent > 0 && (
          <div className='progress-container'>
            <div
              className='progress-bar'
              style={{ width: `${uploadPercent}%` }}
            />
            <p className='progress-text'>{uploadPercent}%</p>
          </div>
        )}
        <MdPublish />
        Upload
      </div>
    </div>
  );
};

export default Addsong;
