import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { API, graphqlOperation, Storage } from 'aws-amplify';
import awsconfig from './aws-exports';
import { listSongs } from './graphql/queries';
import { AmplifySignOut, withAuthenticator } from '@aws-amplify/ui-react-v1';
import { updateSong } from './graphql/mutations';
import ReactPlayer from 'react-player/lazy';
import { BsPlayFill, BsPauseFill } from 'react-icons/bs';
import { MdFavorite } from 'react-icons/md';
import { IoIosAddCircle } from 'react-icons/io';
import Addsong from './components/Addsong';
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

  const deleteSong = async (idx) => {
    try {
      const song = songs[idx];
      const { id, filePath } = song;
      console.log(song);
      // Delete the song from the app's GraphQL API
      await API.graphql(graphqlOperation(deleteSong, { input: { id } }));
      // await API.graphql(graphqlOperation(deleteSong, { input: id }));

      // Delete the song file from AWS S3
      await Storage.remove(filePath);

      // Remove the song from the songs state
      const songList = [...songs];
      songList.splice(idx, 1);
      setSongs(songList);
    } catch (error) {
      console.log('error on deleting song', error);
    }

    // deleteSong();
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
                <div className='delete'>
                  <button onClick={() => deleteSong(idx)}>Delete Song</button>
                </div>
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
      {/* <Addsong /> */}
    </div>
  );
}

export default withAuthenticator(App);
