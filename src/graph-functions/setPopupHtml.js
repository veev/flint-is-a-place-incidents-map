import moment from 'moment'
import { toTitleCase } from '../utils'
import descriptionLookup from '../data/descriptionMap.json'

// set feature data for popup content
export function setPopupHtml(feature){
  const start = moment(+feature.properties.unix_timestamp)
  const end = moment(+feature.properties.unix_end)

  let html = ''
  html += "<div>"
  if (descriptionLookup[feature.properties.type]) {
    html += "<span>" + toTitleCase(descriptionLookup[feature.properties.type]) + "</span>"
  } else {
    html += "<span>" + feature.properties.type + "</span>"
  }
  html += `<p>Priority Level: ${feature.properties.priority}`

  html += `<p>Incident Called Into Dispatch: ${start.format("hh:mm:ss a, MMM D")}`
  if (feature.properties.unix_onscene) {
    html += `<p>Police Arrived On Scene: ${moment(feature.properties.unix_onscene).format("hh:mm:ss a, MMM D")}`
  } else {
    html += `<p>Police Never Arrived On Scene</p>`
  }
  html += `<p>Incident Was Closed: ${end.format("hh:mm:ss a, MMM D")}`

  if (feature.properties.unix_onscene) {
    const onSceneTime = moment(+feature.properties.unix_onscene)
    const totalWaitTimeHours = moment.duration(onSceneTime.diff(start)).hours()
    const totalWaitTimeMinutes = moment.duration(onSceneTime.diff(start)).minutes()
    const totalWaitTimeHrsFormat = totalWaitTimeHours > 0 ? `${totalWaitTimeHours} hours and ` : ``
    const totalWaitTimeMinFormat = totalWaitTimeMinutes === 1 ? `${totalWaitTimeMinutes} minute` : `${totalWaitTimeMinutes} minutes`

    const totalSceneTimeHours = moment.duration(end.diff(onSceneTime)).hours()
    const totalSceneTimeMinutes = moment.duration(end.diff(onSceneTime)).minutes()
    const totalSceneTimeHrsFormat = totalSceneTimeHours > 0 ? `${totalSceneTimeHours} hours and ` : ``
    const totalSceneTimeMinFormat = totalSceneTimeMinutes === 1 ? `${totalSceneTimeMinutes} minute` : `${totalSceneTimeMinutes} minutes`
    html += `<p>${totalWaitTimeHrsFormat}${totalWaitTimeMinFormat} until police came on scene.<br> They stayed ${totalSceneTimeHrsFormat}${totalSceneTimeMinFormat}.</p>`
  }

  html += "</div>"
  return html
}