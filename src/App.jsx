import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { API, graphqlOperation, Storage } from 'aws-amplify';
import awsconfig from './aws-exports';
import { listSongs } from './graphql/queries';
import { AmplifySignOut, withAuthenticator } from '@aws-amplify/ui-react-v1';
import { updateSong, createSong } from './graphql/mutations';
import ReactPlayer from 'react-player/lazy';
import { BsPlayFill, BsPauseFill } from 'react-icons/bs';
import { MdFavorite, MdPublish } from 'react-icons/md';
import { IoIosAddCircle } from 'react-icons/io';
import { v4 as uuid } from 'uuid';
import './App.css';

Amplify.configure(awsconfig);

function App() {
  const [songs, setSongs] = useState([]);
  const [songPlaying, setSongPlaying] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const [showAddSong, setShowAddNewSong] = useState(false);

  const fetchSongs = async () => {
    try {
      const songData = await API.graphql(graphqlOperation(listSongs));
      const songList = songData.data.listSongs.items;
      console.log('song list', songList);
      setSongs(songList);
    } catch (error) {
      console.log('error on fetching songs', error);
    }
  };

  const addLike = async (idx) => {
    try {
      const song = songs[idx];
      song.likes = song.likes + 1;
      delete song.createdAt;
      delete song.updatedAt;

      const songData = await API.graphql(
        graphqlOperation(updateSong, { input: song })
      );
      const songList = [...songs];
      songList[idx] = songData.data.updateSong;
      setSongs(songList);
    } catch (error) {
      console.log('error on adding Like to song', error);
    }
  };

  const toggleSong = async (idx) => {
    if (songPlaying === idx) {
      setSongPlaying('');
      return;
    }
    // setSongPlaying(idx);
    const songFilePath = songs[idx].filePath;

    try {
      const fileAccessURL = await Storage.get(songFilePath, { expires: 60 });
      console.log('access url', fileAccessURL);
      setSongPlaying(idx);
      setAudioURL(fileAccessURL);
      return;
    } catch (error) {
      console.error('error accessing the file from s3', error);
      setAudioURL('');
      setSongPlaying('');
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);
  // console.log(audioURL);

  return (
    <div className='App'>
      <header className='App-header'>
        <AmplifySignOut />
        {/* <h2></h2> */}
      </header>
      <div className='songList'>
        {songs.map((song, idx) => {
          return (
            <div key={`song${idx}`}>
              <div className='songCard'>
                <div
                  className='play'
                  aria-label='play'
                  onClick={() => toggleSong(idx)}
                >
                  {songPlaying === idx ? <BsPauseFill /> : <BsPlayFill />}
                </div>
                <div>
                  <div className='songTitle'>{song.title}</div>
                  {/* <div className='songOwner'>{song.owner}</div> */}
                </div>
                <div>
                  <div
                    aria-label='like'
                    className='like'
                    onClick={() => {
                      addLike(idx);
                    }}
                  >
                    <MdFavorite />
                  </div>
                  {song.likes}
                </div>
                <div className='songDescription'>{song.description}</div>
                {songPlaying === idx ? (
                  <div className='ourAudioPlayer'>
                    <ReactPlayer
                      url={audioURL}
                      controls
                      playing
                      height='50px'
                      // onPause={() => toggleSong(idx)}
                    />
                  </div>
                ) : null}
              </div>

              {/* {songPlaying === idx ? (
                <div className='ourAudioPlayer'>
                  <ReactPlayer
                    url={audioURL}
                    controls
                    playing
                    height='50px'
                    // onPause={() => toggleSong(idx)}
                  />
                </div>
              ) : null} */}
            </div>
          );
        })}
        {showAddSong ? (
          <Addsong
            onUpload={() => {
              setShowAddNewSong(false);
              fetchSongs();
            }}
          />
        ) : (
          <IoIosAddCircle onClick={() => setShowAddNewSong(true)} />
        )}
      </div>
      <div>Add Song</div>
    </div>
  );
}

export default withAuthenticator(App);

const Addsong = ({ onUpload }) => {
  const [songData, setSongData] = useState({});
  const [mp3Data, setMp3Data] = useState();

  const uploadSong = async () => {
    //Upload the song
    console.log('songData', songData);
    console.log('mp3Data', mp3Data);
    const { title, description, owner } = songData;

    const { key } = await Storage.put(`${uuid()}.mp3`, mp3Data, {
      contentType: 'audio/mp3',
      progressCallback(progress) {
        console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
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
      <div>close</div>
      <div onClick={uploadSong}>
        <MdPublish />
      </div>
    </div>
  );
};
