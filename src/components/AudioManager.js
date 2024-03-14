import React, { Component } from 'react'
import AudioPlayer from './AudioPlayer'
import PropTypes from 'prop-types'

const silentAudio = 'data:audio/mp3;base64,//MkxAAHiAICWABElBeKPL/RANb2w+yiT1g/gTok//lP/W/l3h8QO/OCdCqCW2Cw//MkxAQHkAIWUAhEmAQXWUOFW2dxPu//9mr60ElY5sseQ+xxesmHKtZr7bsqqX2L//MkxAgFwAYiQAhEAC2hq22d3///9FTV6tA36JdgBJoOGgc+7qvqej5Zu7/7uI9l//MkxBQHAAYi8AhEAO193vt9KGOq+6qcT7hhfN5FTInmwk8RkqKImTM55pRQHQSq//MkxBsGkgoIAABHhTACIJLf99nVI///yuW1uBqWfEu7CgNPWGpUadBmZ////4sL//MkxCMHMAH9iABEmAsKioqKigsLCwtVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVV//MkxCkECAUYCAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'

export default class AudioManager extends Component {
  constructor(props) {
    super(props)

    this.state = {
      currentKey: '',
    }
  }

  componentWillReceiveProps(nextProps) {
    // this happens only if playState changes
    // if timeline isPlaying, then find audio file to trigger
    // don't trigger audio to play once file is playing
    if (nextProps.isPlaying) {
      // console.log('next props is playing')
      if (this.childAudio.audioEl.paused) {
        // console.log('theres audio to play and current audio is paused')
        if (nextProps.currentKey !== this.state.currentKey) {
          // play back new file from the beginning
          this.setState({ currentKey: nextProps.currentKey }, () => {
            this.childAudio.audioEl.load()
            this.fetchAudioAndPlay(nextProps.currentKey)
          })
        } 
      }
    } else {
      // console.log('nextProps.isPlaying is false')
      // isPlaying is false, pause audio
      !this.childAudio.audioEl.paused && this.childAudio.audioEl.pause()
    }
  }

  fetchAudioAndPlay = (currentKey) => {
    const url = `https://s3.amazonaws.com/flint-pd-may/audio/${currentKey}.mp3`
    fetch(url,
      {
        method: "GET",
        mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", 
        headers: {
            "Content-Type": "audio/mpeg",
        },
        redirect: "follow",
        credentials: "omit",
      }
    )
    .then(response => {
      return response.blob()
    })
    .then(blob => {
      // Check to see if user is not using Chrome
      if (navigator.userAgent.indexOf('Chrome') === -1) {
        this.childAudio.audioEl.src = url
      } else {
        // need to fall back to src instead of srcObject
        try {
          this.childAudio.audioEl.srcObject = blob
        } catch (error) {
          this.childAudio.audioEl.src = URL.createObjectURL(blob)
        }
      }
      return this.childAudio.audioEl.play()
    })
    .then(_ => {
      if (!this.props.isPlaying) {
        this.childAudio.audioEl.pause()
      } else {
        // Audio playback started ;)
      }
      
    })
    .catch(e => {
      // Audio playback failed ;(
    })
  }

  render() {

    const { updateAudioIndex } = this.props
    return (
      <div>
        <AudioPlayer
          className={'audioPlayer'}
          src={silentAudio}
          autoPlay={false}
          loop={false}
          controls={false}
          preload='auto'
          ref={el => this.childAudio = el}
          onEnded={updateAudioIndex}
        />
      </div>
    )
  }
}

AudioManager.propTypes = {
  currentTime: PropTypes.number,
  isPlaying: PropTypes.bool,
  timelineAudio: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      length: PropTypes.number,
      timestamp: PropTypes.number,
    })
  ),
  currentKey: PropTypes.string,
  updateAudioIndex: PropTypes.func,
}