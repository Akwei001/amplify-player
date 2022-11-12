import React from 'react';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
// import { listSongs } from './graphql/queries';

import { AmplifySignOut, withAuthenticator } from '@aws-amplify/ui-react-v1';
import './App.css';

Amplify.configure(awsconfig);

function App() {
  // const [songs, setSongs] = useState([]);

  // const fetchSongs = async () => {
  //   try {
  //     const songData = await API.graphql(graphqlOperation(listSongs));
  //     const songList = songData.data.listSongs.items;
  //     console.log('song list', songList);
  //     setSongs(songList);
  //   } catch (error) {
  //     console.log('error on fetching songs', error);
  //   }
  // };

  // useEffect(() => {
  //   fetchSongs();
  // }, []);

  return (
    <div className='App'>
      <header className='App-header'>
        <AmplifySignOut />
        <h2>App Content</h2>
      </header>
    </div>
  );
}

export default withAuthenticator(App);
