import React, { Component } from 'react'
import PropTypes from 'prop-types'
import mapboxgl from 'mapbox-gl'
import Oscilloscope from 'oscilloscope'
import { toTitleCase, map_range } from './utils'
import bounds from './data/subunits-flint.json'
import descriptionLookup from './data/descriptionMap.json'

const defaultMapView = {
  center: [-83.6969862, 43.0215524],
  zoom: 12,
  pitch: 30
}
const popupMode = true

export default class Map extends Component {

  constructor(props) {
    super(props)
    this.state = {
      map: null,
      popup: null,
      currentAudioArray: null,
      currentAudioIndex: 0,
      layersOff: true
    }

    this.audio = null
    this.pulseAnimationFrame = null

    if (popupMode) {
      this.popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      })

      this.otherPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      })
    }
  }

  static defaultProps = {
    defaultFeature: {
      type: 'Feature',
      geometry: { },
      properties: {
        eventNumber: ''
      }
    }
  }

  componentDidMount() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmVldiIsImEiOiIzdzVEVDdrIn0.z3N2X1Fk7rx4wXesVf0-rQ' //MAPBOX_TOKEN

    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [-85.46778000907034, 43.57288613860254],
        zoom: 6,
        pitch: 0
    })

    this.map.on('load', (...args) => {
      // console.log('MAP LOADED')
      this.initMap()
      this.addListeners()
      this.props.handleMapLoaded()
    })
  }

  componentWillUnmount() {
    this.map.remove()
  }

  UNSAFE_componentWillUpdate(nextProps) {
    if (nextProps.startState) {
      // console.log('map compomentWillUpdate still in start state')
      this.map.flyTo({
        center: [-85.46778000907034, 43.57288613860254],
        zoom: 6,
        pitch: 0
      })
    } else {
      if (this.state.layersOff && this.map.isStyleLoaded()) {
        // console.log('map compomentWillUpdate start state off, layers off is true, zoom in')
        this.map.flyTo({
          center: [-83.6969862, 43.0215524],
          zoom: 12,
          pitch: 30
        })
        // try and turn all map layers to visible, need to check if layers exist
        this.map.setLayoutProperty('incidentsLayer', 'visibility', 'visible')
        this.map.setLayoutProperty('incidentsOnSceneLayer', 'visibility','visible')
        this.map.setLayoutProperty('incidentsOnSceneHighlightLayer', 'visibility','visible')
        nextProps.activeData.forEach( d => {
          this.map.setLayoutProperty(`incidentsRadarLayer-${d.properties.eventNumber}`, 'visibility', 'visible')
        })
        this.setState({ layersOff: false })
      }
      // Need to update data
      if (nextProps.activeData && this.map.getSource('incidents')) {
        this.map.getSource('incidents').setData(this.makeGeoJsonFromFeatures(nextProps.activeData))
      }

      //update radar layer data
      if (nextProps.activeData && this.props.activeData && this.map.isStyleLoaded()) {
        
        const allLayers = this.map.getStyle().layers
        const radarLayers = allLayers.filter( layer => {
          return (layer.id.indexOf('incidentsRadarLayer') !== -1) 
        })

        // get rid of elements no long in new data
        radarLayers.forEach(layer => {
          const eventId = layer.id.substr(20)
          if (!nextProps.activeData.some(d => d.properties.eventNumber === eventId)) {
            if (this.map.getLayer(`incidentsRadarLayer-${eventId}`)) this.map.removeLayer(`incidentsRadarLayer-${eventId}`)
            if (this.map.getSource(`incidentsRadarLayer-${eventId}`)) this.map.removeSource(`incidentsRadarLayer-${eventId}`)
          }
        })
        nextProps.activeData.forEach( (d, i) => {
          if (this.map.getLayer(`incidentsRadarLayer-${d.properties.eventNumber}`)) {
            // do nothing
          } else {
            // create a new layer
            this.createNewIncidentsRadarLayer(d)
          }
        })
      }

      if (this.map.getSource('incidents')) {

        if (this.map.isStyleLoaded()) {
          // filter active incidents
          this.map.setFilter('incidentsLayer', ['in', 'eventNumber'].concat(
            nextProps.activeData.map( feature => {
              // filter out incidents where cops are onScene and return event number for layer filter
              return feature.properties.status !== 'onScene' && feature.properties.eventNumber
            })
          ))

          // filter active onScene incidents
          this.map.setFilter('incidentsOnSceneLayer', ['in', 'eventNumber'].concat(
            nextProps.activeData.map( feature => {
              // filter out incidents where cops are onScene and return event number for layer filter
              return feature.properties.status === 'onScene' && feature.properties.eventNumber
            })
          ))
        }
        
        if (nextProps.hoveredFeature.id) {
          this.turnIncidentHighlightOn(nextProps.hoveredFeature)
          if (popupMode) this.turnOnTooltip(nextProps.hoveredFeature, this.popup)
        } 
        if (this.props.hoveredFeature.id && nextProps.hoveredFeature.id && nextProps.hoveredFeature.id !== this.props.hoveredFeature.id) {
          // console.log('both this and next have hover, but unequal - turn off highlight only')
          this.turnIncidentHighlightOff(this.props.hoveredFeature)

        }
        if (this.props.hoveredFeature.id && !nextProps.hoveredFeature.id) {
          // console.log('feature was hovered and now its not - turn off')
          this.turnIncidentHighlightOff(this.props.hoveredFeature)
          if (popupMode) this.turnOffTooltip(this.popup)
        }

        if (this.props.hoveredFeature.id && !nextProps.hoveredFeature.id && !nextProps.selectedMapIncident.id) {
          this.props.pauseAudio()
        }

        if (nextProps.selectedMapIncident.id) {
          this.map.flyTo({
            center: nextProps.selectedMapIncident.geometry.coordinates, 
            zoom: 15, 
            pitch: 60
          })
          // console.log('nextProps selected case - turn on highlight')
          this.turnIncidentHighlightOn(nextProps.selectedMapIncident)
          if (popupMode) this.turnOnTooltip(nextProps.selectedMapIncident, this.popup)
        } 
        if (this.props.selectedMapIncident.id && nextProps.selectedMapIncident.id && nextProps.selectedMapIncident.id !== this.props.selectedMapIncident.id) {
          this.map.flyTo({
            center: nextProps.selectedMapIncident.geometry.coordinates, 
            zoom: 15, 
            pitch: 60
          })
          // console.log('both this and next have selection, but unequal - turn off this props selected')
          this.turnIncidentHighlightOff(this.props.selectedMapIncident)
          if (popupMode) this.turnOffTooltip(this.popup)
        } 
        if (this.props.selectedMapIncident.id && !nextProps.selectedMapIncident.id) {
          this.map.flyTo(defaultMapView)
          this.props.pauseAudio()
          // console.log('nextProps NOT selected case, but has this props selection - turn off highlight')
          this.turnIncidentHighlightOff(this.props.selectedMapIncident)
          if (popupMode) this.turnOffTooltip(this.popup)
        }

        // Account for other popups if one incident is selected and rolling over other incidents
        if (nextProps.selectedMapIncident.id && nextProps.hoveredFeature.id && nextProps.selectedMapIncident.id !== nextProps.hoveredFeature.id) {
          // add another tooltip
          if (popupMode) this.turnOnTooltip(nextProps.hoveredFeature, this.otherPopup)
        }

        if (nextProps.selectedMapIncident.id && !nextProps.hoveredFeature.id) {
          if (popupMode) this.turnOffTooltip(this.otherPopup)
        }
      }

      if (nextProps.viewMode !== this.props.viewMode) {
        // console.log('viewMode Changed', this.props.viewMode, nextProps.viewMode)
        // console.log('modeChanged',  this.props.modeChanged, nextProps.modeChanged)
        // console.log('style loaded', this.map.isStyleLoaded())
        if (nextProps.viewMode === 'incidents' || nextProps.viewMode === 'facebook') {
          this.map.flyTo(defaultMapView)
        }
      }

      if (nextProps.viewMode === 'incidents' && this.props.modeChanged !== nextProps.modeChanged) {
        this.turnMapOn(true)
        this.turnFacebookOn(false)
        this.turnIncidentsOn(true, nextProps)
      }
      if (nextProps.viewMode === 'facebook' && (this.props.modeChanged !== nextProps.modeChanged)) {
        this.turnMapOn(true)
        this.turnFacebookOn(true)
        this.turnIncidentsOn(false, nextProps)
      }
      if (nextProps.viewMode === 'infographic' && (this.props.modeChanged !== nextProps.modeChanged)) {
        this.turnMapOn(false)
        this.turnFacebookOn(false)
        this.turnIncidentsOn(false, nextProps)
      }
    }
  } 

  turnMapOn = (turnOn) => {
    // if (turnOn) {
    //   console.log('TURN MAP ON')
    // } else {
    //   console.log('TURN MAP OFF')
    // }
    const domMap = document.getElementsByClassName('Map mapboxgl-map')
    domMap[0].style.visibility = turnOn ? 'visible' : 'hidden'
  }

  turnFacebookOn = (turnOn) => {
    // if (turnOn) {
    //   console.log('TURN FACEBOOK ON')
    // } else {
    //   console.log('TURN FACEBOOK OFF')
    // }
    const fbMarkers = document.getElementsByClassName('marker-facebook mapboxgl-marker')
    
    for(let i = 0; i < fbMarkers.length; i++) { 
      fbMarkers[i].style.visibility =  turnOn ? 'visible' : 'hidden'
    }
    if (this.map.getLayer('facebookLayer')) this.map.setLayoutProperty('facebookLayer', 'visibility', (turnOn ? 'visible' : 'none'))
  }

  turnIncidentsOn = (turnOn, nextProps) => {
    //  if (turnOn) {
    //   console.log('TURN INCIDENTS ON')
    // } else {
    //   console.log('TURN INCIDENTS OFF')
    // }
    const blipMarkers = document.getElementsByClassName('marker-blip mapboxgl-marker')
    for (let i = 0; i < blipMarkers.length; i++) {
      blipMarkers[i].style.visibility = turnOn ? 'visible' : 'hidden'
    }

    const callBoard = document.getElementsByClassName('grossWrapper')
    turnOn ? callBoard[0].classList.add("show") : callBoard[0].classList.remove("show")
    
    const board = document.getElementsByClassName('Board')
    turnOn ? board[0].classList.add("show") : board[0].classList.remove("show")
    
    const timelineArea = document.getElementsByClassName('Timeline')
    turnOn ? callBoard[0].style.visibility = 'visible' : callBoard[0].style.visibility = 'hidden'
    turnOn ? timelineArea[0].style.visibility = 'visible' : timelineArea[0].style.visibility = 'hidden' 

    if (this.map.getLayer('incidentsLayer')) this.map.setLayoutProperty('incidentsLayer', 'visibility', (turnOn ? 'visible' : 'none'))
    if (this.map.getLayer('incidentsOnSceneLayer')) this.map.setLayoutProperty('incidentsOnSceneLayer', 'visibility', (turnOn ? 'visible' : 'none'))
    if (this.map.getLayer('incidentsOnSceneHighlightLayer')) this.map.setLayoutProperty('incidentsOnSceneHighlightLayer', 'visibility', (turnOn ? 'visible': 'none'))
    nextProps.activeData.forEach( d => {
      if (this.map.getLayer(`incidentsRadarLayer-${d.properties.eventNumber}`)) this.map.setLayoutProperty(`incidentsRadarLayer-${d.properties.eventNumber}`, 'visibility', (turnOn ? 'visible': 'none'))
    })
    // if (turnOn) {
    //   console.log('should start pulse animation')
    //   // this.animateRadar()
    // } else {
    //   console.log('cancelling pulse animation')
    //   // window.cancelAnimationFrame(this.pulseAnimationFrame)
    // } 
  }

  turnIncidentHighlightOn = (incident) => {
    this.map.setFeatureState({ source: 'incidents', id: incident.id}, { hover: true })
    if (incident.properties.status === 'onScene') {
      // console.log('incident is onscene')
      this.map.setFilter('incidentsOnSceneHighlightLayer', ['==', 'id', incident.id])
    }
  }

  turnIncidentHighlightOff = (incident) => {
    this.map.setFeatureState({ source: 'incidents', id: incident.id}, { hover: false })
    if (incident.properties.status === 'onScene') {
      this.map.setFilter('incidentsOnSceneHighlightLayer', ['==', 'id', 2000])
    }
  }

  turnOnTooltip = (incident, tooltip) => {
    if (popupMode) {
      tooltip.setLngLat(incident.geometry.coordinates)
        .setDOMContent(this.setPopupDomContent(incident))
        .addTo(this.map)
    }
  }

  turnOffTooltip = (tooltip) => {
    tooltip.remove()
  }

  getTextWidth = (text, font) => {
    // if given, use cached canvas for better performance
    // else, create new canvas
    const canvas = this.getTextWidth.canvas || (this.getTextWidth.canvas = document.createElement("canvas"))
    const context = canvas.getContext("2d")
    context.font = font
    const metrics = context.measureText(text)
    return metrics.width
  }

  setPopupDomContent = (feature) => {
    const mainDiv = document.createElement('div')

    const typeSpan = document.createElement('span')
    if (descriptionLookup[feature.properties.type]) {
      typeSpan.innerText = toTitleCase(descriptionLookup[feature.properties.type])
    } else {
      console.log("undefined popup description: ", feature.properties.type)
      typeSpan.innerText = feature.properties.type
    }
    mainDiv.appendChild(typeSpan)

    const textWidth = this.getTextWidth(typeSpan.innerText, "normal 12px courier")

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(textWidth) - 1
    canvas.height = 30

    const canvasWrapper = document.createElement('div')
    canvasWrapper.classList.add('canvas-wrapper')
    canvasWrapper.appendChild(canvas)
    mainDiv.appendChild(canvasWrapper)

    if (this.props.audioSource) {
      const scope = new Oscilloscope(this.props.audioSource)

      // customize drawing options
      const ctx = canvas.getContext('2d')
      ctx.lineWidth = 1
      ctx.strokeStyle = '#FB3F48'

      // start default animation loop
      scope.animate(ctx)

      if (this.props.audioSource && this.props.audioContext) {
        // console.log('has all the audio api stuff')
        this.props.audioSource.connect(this.props.audioContext.destination)
      }
    }

    return mainDiv
    
  }

  makeGeoJsonFromFeatures = (featuresArray) => {
    let object = {}
    object.type = "FeatureCollection"
    object.features = featuresArray
    return object
  }

  initMap = (callback) => {
    // console.log('init map')
    this.addBoundsLayer()
    this.addIncidentsRadarLayers()
    this.addIncidentsLayer()
    this.addIncidentsOnSceneLayer()
    this.addFacebookLayer()
    this.animateRadar()
  }

  addBoundsLayer = () => {
    this.map.addLayer({
      'id': 'boundsLayer',
      'type': 'fill',
      'source': {
        'type': 'geojson',
        'data': bounds
      },
      'layout': {},
      'paint': {
        'fill-color': '#fff',
        'fill-opacity': 0.1
      }
    })
  }

  addIncidentsRadarLayers = () => {
    // console.log('Adding Incidents Radar Layers')

    this.props.activeData.forEach( d => {
      d.properties.angle = 0
      const features = this.map.querySourceFeatures(`incidentsRadarLayer-${d.properties.eventNumber}`)
      // console.log(features)
      if (features.length === 0) {
        this.map.addLayer({
          'id': `incidentsRadarLayer-${d.properties.eventNumber}`,
          'type': 'circle',
          'source': {
            'type': 'geojson',
            'data': d
          },
          'layout': {},
          'paint': {
            'circle-opacity': ['interpolate',
              ['linear'],
              ['get', 'elapsedTime'],
              0, 0.2,
              3600, 0.5
            ],
            'circle-radius': 20,
            'circle-color': '#FB3F48'
          },
        })
        this.map.setLayoutProperty(`incidentsRadarLayer-${d.properties.eventNumber}`, 'visibility', 'none')
      }
    })
  }

  createNewIncidentsRadarLayer = (d) => {
    d.properties.angle = 0
    const features = this.map.querySourceFeatures(`incidentsRadarLayer-${d.properties.eventNumber}`)
    if (features.length === 0) {
      this.map.addLayer({
        'id': `incidentsRadarLayer-${d.properties.eventNumber}`,
        'type': 'circle',
        'source': {
          'type': 'geojson',
          'data': d
        },
        'layout': {},
        'paint': {
          'circle-opacity': ['interpolate',
            ['linear'],
            ['get', 'elapsedTime'],
            0, 0.2,
            3600, 0.5
          ],
          'circle-radius': 20,
          'circle-color': '#FB3F48'
        },
      },'incidentsLayer')
    }
  }

  animateRadar = () => {
    if (this.props.viewMode === 'incidents') {
      this.props.activeData.forEach( (d,i) => {
        if (this.map.getLayer(`incidentsRadarLayer-${d.properties.eventNumber}`)) {
          let mappedVal = map_range(d.properties.elapsedTime, 0, 3600, 0, 0.1)
          if (mappedVal > 0.15) mappedVal = 0.15
          d.properties.angle += mappedVal
          const idString = `incidentsRadarLayer-${d.properties.eventNumber}`
          const mappedRadius = Math.abs(Math.sin(d.properties.angle) * 20)
          this.map.setPaintProperty(idString, 'circle-radius', mappedRadius)
        }
      })
    }
    this.pulseAnimationFrame = window.requestAnimationFrame(this.animateRadar)
  }

  addIncidentsLayer = () => {
    // console.log('Adding Incidents Layer')

    this.map.addSource('incidents', {
      'type': 'geojson',
      'data': this.props.staticData
    })

    this.map.addLayer({
      'id': 'incidentsLayer',
      'type': 'circle',
      'source': 'incidents',
      'layout': {},
      'paint': {
        'circle-opacity': ['interpolate',
          ['linear'],
          ['get', 'elapsedTime'],
          0, 0.4,
          3600, ['case',
            ['boolean', ['feature-state', 'hover'], false],
            0.5,
            1
          ]
        ],
        'circle-radius': 8,
        'circle-radius-transition': {
            duration: 2000,
            delay: 0
        },
        'circle-color-transition': { duration: 1000 },
        'circle-color': ['case',
          ['boolean', ['feature-state', 'hover'], false],
          '#FFFFFF',
          '#FB3F48'
        ]
      }
    })
   
    // now try and filter to show only active incidents
    this.map.setFilter('incidentsLayer', ['in', 'eventNumber'].concat(
      this.props.activeData.map( feature => {
        return feature.properties.status !== 'onScene' && feature.properties.eventNumber
      })
    ))
    this.map.setLayoutProperty('incidentsLayer', 'visibility', 'none')
  }

  addIncidentsOnSceneLayer = () => {
    // console.log('Adding Incidents On Scene Layer - Police Cars')
    this.map.loadImage('flint-car-blue-red.png', (error, image) => {
      if (error) throw error
      this.map.addImage('police-car', image)
      this.map.addLayer({
        'id': 'incidentsOnSceneLayer',
        'type': 'symbol',
        'source': 'incidents',
        'layout': {
          'icon-image': 'police-car',
          'icon-size': 0.8,
          'icon-allow-overlap': true
        }
      })
      this.map.setFilter('incidentsOnSceneLayer', ['==', 'status', 'onScene'])
      this.map.setLayoutProperty('incidentsOnSceneLayer', 'visibility', 'none')

    })

    // Incidents OnScene Highlight Layer
    this.map.loadImage('flint-police-car-right-highlight.png', (error, image) => {
      if (error) throw error
      this.map.addImage('police-car-highlight', image)
      this.map.addLayer({
        'id': 'incidentsOnSceneHighlightLayer',
        'type': 'symbol',
        'source': 'incidents',
        'layout': {
          'icon-image': 'police-car-highlight',
          'icon-size': 0.8,
          'icon-allow-overlap': true
        },
        'filter': ["==", "id", 2000]
      })
    })
    // this.map.setLayoutProperty('incidentsOnSceneHighlightLayer', 'visibility', 'none')
  }

  addFacebookLayer = () => {
    // console.log('Adding Facebook Layer')

    this.map.addSource('facebook', {
        'type': 'geojson',
        'data': this.props.weekDataPosts
      })

    this.map.addLayer({
      'id': 'facebookLayer',
      'interactive': true,
      'source': 'facebook',
      'type': 'circle',
      'paint': {
        'circle-radius': 15,
        'circle-color': '#FB3F48',
        'circle-opacity': 0,
      }
    })

    // add markers to map
    this.props.weekDataPosts.features.forEach( marker => {
      // check for duplicates
      this.props.weekDataPosts.features.forEach( otherMarker => {
        if (marker.geometry.coordinates[0] === otherMarker.geometry.coordinates[0] && marker.properties.id !== otherMarker.properties.id) {
          return
        }
      })

      let badge = document.createElement('div')
      badge.className = 'marker-facebook badge-wrapper'
      badge.id = `fb-badge-wrapper-${marker.properties.eventNumber}`
      badge.style.width = '30px'
      badge.style.height = '30px'

      // add badge wrapper / fb comment icon to map
      new mapboxgl.Marker(badge, {
        offset: [0, 0]
      })
        .setLngLat(marker.geometry.coordinates)
        .addTo(this.map)

      let commentInfo = document.createElement('div')
      commentInfo.className = 'marker-facebook likesBadge-mapbox'
      commentInfo.id = `fb-badge-${marker.properties.eventNumber}`
      commentInfo.innerText = marker.properties.fbookInfo.numComments

      // add likes badge to map
      new mapboxgl.Marker(commentInfo, {
        offset: [10, -8]
      })
        .setLngLat(marker.geometry.coordinates)
        .addTo(this.map)
    })

    // Turn visibility off
    const fbMarkers = document.getElementsByClassName('marker-facebook mapboxgl-marker')
    for(let i = 0; i < fbMarkers.length; i++) { 
      fbMarkers[i].style.visibility = 'hidden'
    }
    this.map.setLayoutProperty('facebookLayer', 'visibility', 'none')
  }

  addListeners = () => {
    // hover incidents layer and highlight
    this.map.on('mousemove', 'incidentsLayer', (e) => {
      // console.log('mouse    move incidents layer - turn on highlight')
      this.map.getCanvas().style.cursor = 'pointer'
      if (e.features.length > 0) {
        this.props.handleHighlight(e.features[0])
      }
    })

    this.map.on('mouseleave', 'incidentsLayer', () => {
      // console.log('mouseleave incidents layer - turn off highlight')
      this.map.getCanvas().style.cursor = ''
      this.props.handleHighlight(this.props.defaultFeature)
    })

    this.map.on('mousemove', 'incidentsOnSceneLayer', (e) => {
      // console.log('on scene layer mousemove - turn on highlight')
      this.map.getCanvas().style.cursor = 'pointer'
      if (e.features.length > 0) {
        this.props.handleHighlight(e.features[0])
      }
    })

    this.map.on('mouseleave', 'incidentsOnSceneLayer', () => {
      // console.log('on scene layer mouse leave - turn off highlight')
      this.map.getCanvas().style.cursor = ''
      this.props.handleHighlight(this.props.defaultFeature)
    })

    this.map.on('click', (e) => {
      const fbFeatures = this.map.queryRenderedFeatures(e.point, {layers: ['facebookLayer']})
      const incidentFeatures = this.map.queryRenderedFeatures(e.point, {layers: ['incidentsLayer']})
      const incidentOnSceneFeatures = this.map.queryRenderedFeatures(e.point, {layers: ['incidentsOnSceneLayer']})

      
      // clicking just on map
      if (!fbFeatures.length && !incidentFeatures.length && !incidentOnSceneFeatures.length) {
        if (this.props.selectedMapIncident.properties.eventNumber !== '' && this.props.viewMode === 'facebook') {
          // query all fb elements and reset zindex
          document.getElementById(`fb-badge-wrapper-${this.props.selectedMapIncident.properties.eventNumber}`).style.zIndex = 1
          document.getElementById(`fb-badge-${this.props.selectedMapIncident.properties.eventNumber}`).style.zIndex = 1
        }
        this.props.handleMapClick(this.props.defaultFeature)
        this.map.flyTo(defaultMapView)
        return 
      }

      if (fbFeatures.length) {
        this.map.flyTo({
          center: fbFeatures[0].geometry.coordinates, 
          zoom: 15, 
          pitch: 60
        })
        if (this.props.selectedMapIncident.properties.eventNumber !== '' && this.props.viewMode === 'facebook') {
          // query all fb elements and reset zindex
          document.getElementById(`fb-badge-wrapper-${this.props.selectedMapIncident.properties.eventNumber}`).style.zIndex = 1
          document.getElementById(`fb-badge-${this.props.selectedMapIncident.properties.eventNumber}`).style.zIndex = 1
        }
        document.getElementById(`fb-badge-wrapper-${fbFeatures[0].properties.eventNumber}`).style.zIndex = 100
        document.getElementById(`fb-badge-${fbFeatures[0].properties.eventNumber}`).style.zIndex = 101
        this.props.handleFBMarker(fbFeatures[0])
      }

      // clicking on incident layers
      if (incidentFeatures.length || incidentOnSceneFeatures.length) {
        const clickedFeature = incidentFeatures.length ? incidentFeatures[0] : incidentOnSceneFeatures[0]
        this.props.handleIncidentMarker(clickedFeature)
      }
    })
  }

  render() {
    const { children } = this.props
    const { map } = this.state

    return (
      <div className='Map' ref={(el) => { this.mapContainer = el }}>
        { map && children }
      </div>
    )
  }
}

Map.propTypes = {
  staticData: PropTypes.object,
  activeData: PropTypes.array,
  currentTime: PropTypes.number,
  weekDataPosts: PropTypes.object,
  handleHighlight: PropTypes.func,
  hoveredFeature: PropTypes.object,
  selectedMapIncident: PropTypes.object,
  handleFBMarker: PropTypes.func,
  handleIncidentMarker: PropTypes.func,
  handleMapClick: PropTypes.func,
  pauseAudio: PropTypes.func,
  viewMode: PropTypes.string,
  modeChanged: PropTypes.bool,
  handlePlayStateChange: PropTypes.func,
  audioSource: PropTypes.object,
  audioContext: PropTypes.object,
  handleMapLoaded: PropTypes.func,
  startState: PropTypes.bool
}