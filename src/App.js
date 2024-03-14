import React, { Component } from 'react'
import Map from './Map'
import Timeline from './components/Timeline'
import ControlPanel from './components/ControlPanel'
import InfoView from './components/InfoView'
import StartInfo from './components/StartInfo'
import IncidentsLegend from './components/IncidentsLegend'
import CallBoard from './components/CallBoard'
import CommentDrawer from './components/CommentDrawer'
import GraphAreaD3 from './GraphAreaD3'
import AudioManager from './components/AudioManager'
import { map_range } from './utils'
import moment from 'moment'
import data from './data/may10-11-incidents-timestamps-formatted-audio6-yPos-ids.json'
import weekDataPosts from './data/featuresWithPosts-May5-12-sm2.json'
import audio from './data/audio-smallerArray.json'

import './App.css'

// Human time (GMT): Wednesday, May 10, 2017 10:00:00 AM
// const startTime = 1494410400000
// startTime so there's an audio incident immediately
// Human time (GMT): Wednesday, May 10, 2017 11:46:01.115 AM
const startTime = 1494416761115
// Human time (GMT): Thursday, May 11, 2017 10:00:00 AM
const endTime = 1494496800000

const timeout = ms => new Promise(res => setTimeout(res, ms))

class App extends Component {

  constructor() {
    super()

    this.state = {
      startState: true,
      viewMode: 'incidents',
      infoMode: 'none',
      modeChanged: false,
      startTS: startTime,
      endTS: endTime,
      dateRange: [startTime, endTime],
      currentTime: startTime,
      isPlaying: false, 
      isAudioPlaying: false,
      currentAudioArray: data[0].properties.audio,
      currentAudioIndex: 0,
      isMapLoaded: false,
      selectedMapIncident: {
        type: 'Feature',
        geometry: { },
        properties: {
          eventNumber: ''
        }
      },
      hoveredFeature: {
        type: 'Feature',
        geometry: { },
        properties: {
          eventNumber: ''
        }
      },
      openPost: {},
      isCommentDrawerOpen: false,
      isCreditsOpen: false,
      windowWidth: 0,
      windowHeight: 0
    }

    window.timer = null
    window.interval = null
    this.hoverTimeout = null
    this.audioCtx = null
    this.audioSource = null
    this.timelineAudio = audio

    this.mapped = data.map( d => {
      if (d.properties.unix_onscene) {
        d.properties['onSceneDuration'] = (+d.properties.unix_end - +d.properties.unix_onscene) / 1000
      } else {
        d.properties['onSceneDuration'] = 0
      }
      d.properties.yPos = d.properties.yPos + 1
      return d
    })
  }

  static defaultProps = {
    incidents: data,
    defaultFeature: {
      type: 'Feature',
      geometry: { },
      properties: {
        eventNumber: ''
      }
    }
  }

  componentDidMount() {
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions)
    document.onkeypress = function(e) {
      e = e || window.event;
      var charCode = e.keyCode || e.which
      if (charCode === 32) {
          e.preventDefault()
          return false
      }
    }
    document.addEventListener('keydown', this.handleKeyPress, false)
    window.addEventListener('focus', (e) => {
      // console.log('window focus event', e)
      if (this.state.viewMode === 'incidents') {
        this.handlePlayState(true)
      }
    })
    window.addEventListener('blur', (e) => {
      // console.log('window blur event', e)
      if (this.state.viewMode === 'incidents') {
        this.handlePlayState(false)
        if (this.state.isAudioPlaying) {
          this.pauseAudio()
        }
      }
    })
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions)
    document.removeEventListener('keydown', this.handleKeyPress, false)
    window.clearInterval(this.interval)
  }

  updateWindowDimensions = () => {
    // console.log(window.innerWidth, window.innerHeight)
    this.setState({ windowWidth: window.innerWidth, windowHeight: window.innerHeight });
  }

  handleKeyPress = (event) => {
    // console.log('keydown', event.key)
    event.key === ' ' && this.handlePlayStateChange() //: console.log(event.key + ' pressed')
  }

  initWebAudioApi = () => {
    // console.log('Initialize Web Audio')
    // create a new audio context
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    // bind the context to our <audio /> element
    this.audioSource = this.audioCtx.createMediaElementSource(this.audioChild.childAudio.audioEl)
  }

  handleMapLoaded = () => {
    this.setState({ isMapLoaded: true })
  }

  handleStateTearDown = (event) => {
    // console.log('Start State Tear Down')
    this.setState({ startState: false, }, () => {
      // instantiate web audio api here
      this.audioChild.childAudio.audioEl.play()
      this.initWebAudioApi()
      setTimeout(() => {
        if (this.audioSource && this.audioCtx) {
          // console.log('has all the audio api stuff')
          this.updateCurrentTime(0) // move time to first audio file
          this.handlePlayStateChange()
          this.audioSource.connect(this.audioCtx.destination)
        }
      }, 300)
      
    })
  }

  handlePlayStateChange = () => {
    // console.log('handlePlayStateChange', this.state.isPlaying)
    if (this.state.isAudioPlaying) {
      this.pauseAudio()
    }
    this.setState({isPlaying: !this.state.isPlaying}, () => this.handlePlayState(this.state.isPlaying) )
  }

  handleViewModeToggle = (value) => {
    window.timer = null
    window.interval = null
    if (this.state.isMapLoaded) {
      this.setState({ viewMode: value,
                      modeChanged: !this.state.modeChanged, 
                      isCommentDrawerOpen: false, 
                      selectedMapIncident: this.props.defaultFeature, 
                      hoveredFeature: this.props.defaultFeature 
                    }, () => {
        if (value === 'incidents') {
          this.handlePlayState(true)
        } else {
          this.handlePlayState(false)
        }
        this.pauseAudio()
      })
      document.getElementById('footerID').style.bottom = '40px'
      
    } else {
      // console.log("cant switch modes yet")
    }
  }

  handleInfoModeHover = (value) => {
    this.setState({ infoMode: value, isCommentDrawerOpen: false }, () => {
      // console.log('infoMode', this.state.infoMode)
      // console.log('selectedMapIncident', this.state.selectedMapIncident)
      if (this.state.selectedMapIncident.properties.eventNumber !== '') {
        if (document.getElementById(`fb-badge-wrapper-${this.state.selectedMapIncident.properties.eventNumber}`)) document.getElementById(`fb-badge-wrapper-${this.state.selectedMapIncident.properties.eventNumber}`).style.zIndex = 1
        if (document.getElementById(`fb-badge-${this.state.selectedMapIncident.properties.eventNumber}`)) document.getElementById(`fb-badge-${this.state.selectedMapIncident.properties.eventNumber}`).style.zIndex = 1
      }
      if (this.state.infoMode !== this.state.viewMode) {
        this.hoverTimeout = setTimeout( () => {
          this.handleViewModeToggle(value)
        }, 2000)
      }
    })
  }

  handleInfoModeMouseLeave = () => {
    this.setState({ infoMode: 'none' }, () => {
      window.clearTimeout(this.hoverTimeout)
    })
  }

  handleRolloverChange = (marker) => {
    if (marker) this.setState({ hoveredFeature: marker })
    this.handleAudio(marker)
    this.audioCtx.resume().then(() => {
      // console.log('Playback resumed successfully')
    })

  }

  handleIncidentMarker = (marker) => {
    this.setState({ selectedMapIncident: marker, hoveredFeature: marker })
    // play audio on click
    this.handleAudio(marker)
    this.audioCtx.resume().then(() => {
      // console.log('Playback resumed successfully')
    })
  }

  handleMapClick = (marker) => {
    if (this.state.isCommentDrawerOpen === true) {
      console.log("post is open - close it", this.state.openPost)
      this.setState({ isCommentDrawerOpen: false })
    } 
    if (this.state.selectedMapIncident.properties.eventNumber !== '') {
      this.setState({ selectedMapIncident: marker, hoveredFeature: marker })
    }
  }

  handleAudio = (feature) => {
    if (feature.properties.audio) {
      this.pauseAudio()
      const audioArr = typeof(feature.properties.audio) === 'string' ? JSON.parse(feature.properties.audio) : feature.properties.audio
      if (!this.arraysAreEqual(audioArr, this.state.currentAudioArray)) {
        // reset audio index to 0 and update to new audio array
        this.setState({ currentAudioArray: audioArr, currentAudioIndex: 0, currentKey: audioArr[0] })
      }
      // if arrays are equal, don't update audio array or index, just play again
      this.setState({ isAudioPlaying: true })
    }
  }

  handleTimelineAudio = () => {
    const t = this.state.currentTime
    const element = this.timelineAudio.find( (a) => {
      const tStart = a.timestamp
      const tEnd = tStart + a.length
      return (t >= tStart && t <= tEnd)
    })
    // set audio key based on timeline audio, not hover audio
    if (element && this.state.currentKey !== element.id) {
      this.setState({ currentKey: element.id, isAudioPlaying: true })
      this.findFeatureFromAudioId(element.id)
      if (this.audioSource && this.audioCtx) {
        // console.log('has all the audio api stuff')
        this.audioSource.connect(this.audioCtx.destination)
      }
    }
  }

  findFeatureFromAudioId = (id) => {
    // Find the first incident whose audio array includes the specified id
    const feature = this.props.incidents.find(incident => 
      incident.properties.audio && incident.properties.audio.includes(id)
    );
  
    // If a feature is found, update the state
    if (feature) {
      this.setState({ hoveredFeature: feature });
    }
  };

  arraysAreEqual = (array, otherArray) => {
    // if the other array is a falsy value, return
    if (!otherArray) return false

    // compare lengths to save time
    if (array.length !== otherArray.length) return false

    // if lengths are same, compare inner items
    for (let i = 0; i < array.length; i++) {
      // check for nested arrays
      if (array[i] instanceof Array && otherArray[i] instanceof Array) {
        // recurse into nested arrays
        if (!array[i].equals(otherArray[i])) return false
      }
      else if (array[i] !== otherArray[i]) return false
      // warning, two different object instances will never be equal
    }
    return true
  }

  updateAudioIndex = (e) => {
    // check for hover state
    if (this.state.hoveredFeature.properties.eventNumber !== '') {
      // console.log(this.state.currentAudioIndex, this.state.currentAudioArray.length)
      if (this.state.currentAudioIndex < this.state.currentAudioArray.length - 1) {
        this.setState({ currentAudioIndex: this.state.currentAudioIndex + 1, currentKey: this.state.currentAudioArray[this.state.currentAudioIndex + 1] })
      } else {
        this.setState({ isAudioPlaying: false, currentAudioIndex: 0 })
      }
    } else {
      // if nothing is hovered and just reached end of timeline audio
      this.setState({ isAudioPlaying: false })
    }
  }

  updateTimelineAudioIndex = (time) => {
    const t = Math.floor(time)
    let newIndex = this.timelineAudio.findIndex(element => {
      const tStart = Math.floor(element.timestamp)
      return t <= tStart
    })
    if (newIndex > 0) {
      const timeBefore =  this.timelineAudio[newIndex - 1]
      const timeAfter =  this.timelineAudio[newIndex]
      if (Math.abs(t - timeBefore.timestamp) < Math.abs(t - timeAfter.timestamp)) {
        // index is timeBefore
        newIndex = newIndex - 1
      } 
    }
    
    if (newIndex < 0) {
      newIndex = this.timelineAudio.length - 1
    }

    this.setState({ currentKey: this.timelineAudio[newIndex].id, isAudioPlaying: true })
    this.updateCurrentTime(newIndex)
    this.findFeatureFromAudioId(this.timelineAudio[newIndex].id)
    // make sure audio context is connected if not playing popup viz
    if (this.audioSource && this.audioCtx) {
      // console.log('has all the audio api stuff')
      this.audioSource.connect(this.audioCtx.destination)
    }
  }

  updateCurrentTime = (index) => {
    const newTime = this.timelineAudio[index].timestamp
    this.setState({ currentTime: newTime })
  }

  pauseAudio = () => {
    if (this.state.isAudioPlaying) {
      this.setState({ isAudioPlaying: false })
    }
  }

  playAudio = () => {
    if (!this.state.isAudioPlaying) {
      this.setState({ isAudioPlaying: true })
    }
  }

  handlePlayState = (playState) => {
    window.clearInterval(this.state.interval)

    if (playState && this.state.viewMode === 'incidents') {
      this.interval = window.setInterval(this.update, 1000)
      this.setState({ interval: this.interval })
    } else {
      window.clearInterval(this.interval)
      window.clearInterval(this.state.interval)
    }
  }

  update = () => {
    this.setState(Object.assign(
      {},
      this.state,
      { currentTime: (this.state.currentTime + 1000) % this.state.endTS }
    ), () => {
      this.handleTimelineAudio()
    })
  }

  handleSeekChange = (time) => {
    const ts = this.unconvertTime(time)
    this.pauseAudio()
    this.setState({ currentTime: ts, selectedMapIncident: this.props.defaultFeature, hoveredFeature: this.props.defaultFeature })
    this.updateTimelineAudioIndex(ts)
  }

  convertTime = (value) => {
    // convert time so that start is 0 (what progress bar likes)
    return map_range(value, this.state.startTS, this.state.endTS, 0, (this.state.endTS - this.state.startTS))
  }

  unconvertTime = (value) => {
    // unconvert time so that user seeking will send the correct timestamp
    // back to the main app from the Timeline
    return map_range(value, 0, (this.state.endTS - this.state.startTS), this.state.startTS, this.state.endTS)
  }

  filterIncidents = (cTime) => {
    const filteredPresent = this.props.incidents.filter( feature => {
      feature = this.updateIncidentStatus(cTime, feature)
      feature = this.updateElapsedTime(cTime, feature)
      const strt = feature.properties.unix_timestamp
      const end = feature.properties.unix_end
      return (cTime >= strt && cTime <= end)
    })
    return filteredPresent
  }

  updateElapsedTime = (time, feature) => {
    if (feature.properties.unix_timestamp && feature.properties.unix_end) {
      if (+time >= +feature.properties.unix_timestamp) {
        feature.properties.elapsedTime = Math.floor((+time - +feature.properties.unix_timestamp) / 1000)
      }
    } else {
      feature.properties.elapsedTime = 0
    }
    return feature
  }

  updateIncidentStatus = (time, feature) => {
    const strt = feature.properties.unix_timestamp
    const end = feature.properties.unix_end
    
    if (feature.properties.unix_onscene && feature.properties.unix_dispatch) {
      const dispatchT = feature.properties.unix_dispatch
      const onSceneT = feature.properties.unix_onscene

      if (+time >= strt && +time <= dispatchT) {
        feature.properties.status = "notAssigned"
      } else if (+time >= dispatchT && +time <= onSceneT) {
        feature.properties.status = "waitingforUnit"
      } else if (+time >= onSceneT && +time <= end) {
        feature.properties.status = "onScene"
      } else if (+time >= end) {
        feature.properties.status = "ended"
      }
    } else {
      if (+time >= strt && +time <= end) {
        feature.properties.status = "notAssigned"
      } else if (+time >= end) {
        feature.properties.status = "ended"
      }
    }

    return feature
  }

  handleFacebookMarker = (fbMarker) => {
    if (fbMarker.properties.postId) {
      const post = JSON.parse(fbMarker.properties.fbookInfo)
      // clicked on same post if it's open
      if (post.id === this.state.openPost.id) {
        this.setState({ isCommentDrawerOpen: false })
        timeout(800).then(() => {
          this.setState({ openPost: {} })
        })
      } 
      // first time clicked on a post
      else if (Object.keys(this.state.openPost).length === 0) {
        this.setPostInfo(post)
        this.setState({ isCommentDrawerOpen: true, selectedMapIncident: fbMarker })
      } 
      // clicked on a different post if it's already open
      else {
        this.setState({ isCommentDrawerOpen: false })
        timeout(800).then(() => {
          this.setPostInfo(post)
          this.setState({ isCommentDrawerOpen: true, selectedMapIncident: fbMarker })
        })
      }
    }
  }

  setPostInfo = (post) => {
    this.setState({ openPost: post || {}, isCommentDrawOpen: post ? true : false })
  }

  getGraphSize() {
    const width = this.graphAreaDiv.clientWidth - 160
    const height = this.graphAreaDiv.clientHeight
    return { width, height }
  }

  getFeatureCollection = (data) => {
    const obj = {}
    obj['type'] = 'FeatureCollection'
    obj['features'] = data
    return obj
  }

  render() {

    const {
      startState,
      viewMode, 
      infoMode, 
      modeChanged,
      endTS, 
      isAudioPlaying,
      currentKey,
      currentTime,
      isMapLoaded,
      selectedMapIncident,
      hoveredFeature,
      dateRange,
      windowWidth,
      windowHeight,
      isCommentDrawerOpen
    } = this.state

    const formattedTime = moment(currentTime).format('hh:mm:ss A')
    const formattedDate = moment(currentTime).format('MMM Do YYYY')
    const formattedDay = moment(currentTime).format('dddd')

    return (
      <div 
        className="App"
        ref={(graphAreaDiv) => this.graphAreaDiv = graphAreaDiv}
      >
      {isCommentDrawerOpen && <div className="fb-modal"></div>}
        <Map 
        staticData={this.getFeatureCollection(data)}
        activeData={this.filterIncidents(currentTime)}
        weekDataPosts={weekDataPosts}
        currentTime={currentTime}
        handleHighlight={this.handleRolloverChange}
        hoveredFeature={hoveredFeature}
        selectedMapIncident={selectedMapIncident}
        handleFBMarker={this.handleFacebookMarker}
        handleIncidentMarker={this.handleIncidentMarker}
        handleMapClick ={this.handleMapClick}
        pauseAudio={this.pauseAudio}
        viewMode={viewMode}
        modeChanged={modeChanged}
        handlePlayStateChange={this.handlePlayStateChange}
        audioSource={this.audioSource}
        audioContext={this.audioCtx}
        handleMapLoaded={this.handleMapLoaded}
        startState={startState}
        />
        {
          viewMode === 'infographic' ? 
          <div className="GraphAreaContainer">
            <GraphAreaD3
              size={[windowWidth, windowHeight - 240]}
              staticData={this.mapped}
              currentTime={currentTime}
              dateRange={[dateRange[0], dateRange[1]]}
            />
          </div> : null
        }
        {
          ((viewMode === 'incidents') && !startState) ?
          <IncidentsLegend /> : null
        }
        <StartInfo 
          handleTearDown={this.handleStateTearDown}
          startState={startState}
        />
        <ControlPanel
        handleToggle={this.handleViewModeToggle}
        handleHover={this.handleInfoModeHover}
        handleMouseLeave={this.handleInfoModeMouseLeave}
        infoMode={infoMode}
        viewMode={viewMode}
        isMapLoaded={isMapLoaded}
        startState={startState}
        />
        <InfoView
        infoMode={infoMode}
        />
        <Timeline
        handleSeek={this.handleSeekChange}
        handleSeekStart={this.handleSeekStart}
        handleSeekEnd={this.handleSeekEnd}
        currentTime={this.convertTime(currentTime)}
        totalTime={this.convertTime(endTS)}
        formattedTime={formattedTime}
        staticData={data}
        activeData={this.filterIncidents(currentTime)}
        dateRange={dateRange}
        axisWidth={windowWidth}
        startState={startState}
        />
        <CallBoard
          activeData={this.filterIncidents(currentTime)}
          currentTime={currentTime}
          handleHighlight={this.handleRolloverChange}
          handleRowClick={this.handleIncidentMarker}
          selectedMapIncident={selectedMapIncident}
          hoveredFeature={hoveredFeature}
          startState={startState}
        />
        <CommentDrawer 
          isCommentDrawerOpen={isCommentDrawerOpen}
          postData={this.state.openPost}
        />
        <div id="footerID" className="footer">
          <div className="credits">{viewMode === 'incidents' ? formattedDay : ''}</div>
          <div className="day">{viewMode === 'facebook' ? 'Week of May 5 - 12, 2017' : viewMode === 'infographic' ? '6AM May 10 - 6AM May 11, 2017' : formattedDate}</div>
        </div>
        <AudioManager
          ref={audio => { this.audioChild = audio }}
          currentTime={currentTime}
          isPlaying={isAudioPlaying}
          timelineAudio={this.timelineAudio}
          currentKey={currentKey}
          updateAudioIndex={this.updateAudioIndex}
        />
      </div>
    );
  }
}

export default App;
